use std::collections::HashMap;
use std::io::Cursor;
use std::sync::Arc;

use chrono::{Local, NaiveDate};

use crate::config::settings::Settings;
use crate::config::sheet_config::find_asset_tab;
use crate::features::portfolio::models::transaction::{
    ClosedShareLot, ClosedSymbolSummary, ShareLot, SheetResult, SymbolSummary, SymbolTransaction,
    SymbolTransactionSummary, Transaction,
};
use crate::ports::{GoogleSheetsAdapter, TransactionSheetPort};
use crate::utils::cache::{AsyncSingleflight, TTLCache};
use crate::utils::format_utils::{get_asset_type, normalize_asset_type};
use crate::utils::http_client::HttpResources;

const EPSILON: f64 = 1e-7;

#[derive(Clone)]
pub struct ShareLotService {
    sheet_port: Arc<dyn TransactionSheetPort>,
    cache: Arc<TTLCache>,
    singleflight: Arc<AsyncSingleflight>,
}

impl ShareLotService {
    pub fn new(
        settings: Arc<Settings>,
        http: Arc<HttpResources>,
        cache: Arc<TTLCache>,
        singleflight: Arc<AsyncSingleflight>,
    ) -> Self {
        let sheet_port: Arc<dyn TransactionSheetPort> =
            Arc::new(GoogleSheetsAdapter::new(settings, http, Arc::clone(&cache)));
        Self::with_port(sheet_port, cache, singleflight)
    }

    pub fn with_port(
        sheet_port: Arc<dyn TransactionSheetPort>,
        cache: Arc<TTLCache>,
        singleflight: Arc<AsyncSingleflight>,
    ) -> Self {
        Self {
            sheet_port,
            cache,
            singleflight,
        }
    }

    pub async fn fetch_sheet(&self, tab_id: &str) -> SheetResult {
        let cache_key = format!("sheet_{tab_id}");
        if let Some(cached) = self.cache.get::<SheetResult>(&cache_key) {
            return cached;
        }

        let sf_key = format!("fetch_sheet_{tab_id}");
        let tab_owned = tab_id.to_string();
        let this = self.clone();

        let res: Result<SheetResult, String> =
            self.singleflight
                .execute(&sf_key, move || async move {
                    if let Some(c) = this.cache.get::<SheetResult>(&cache_key) {
                        return Ok(c);
                    }

                    let Some(tab) = find_asset_tab(&tab_owned) else {
                        return Ok(this
                            .create_empty_result(&format!("Invalid tab id: {tab_owned}"), false));
                    };
                    if tab.sheet_gid.is_empty() {
                        return Ok(this
                            .create_empty_result(&format!("Invalid tab id: {tab_owned}"), false));
                    }

                    let is_closed = tab.id == "closed-position";
                    let asset_type = tab.id;
                    let fetch_res = this.sheet_port.fetch_tab_csv(tab).await;

                    match fetch_res {
                        Ok(csv_text) => {
                            let transactions = this.parse_csv(&csv_text, asset_type);
                            let (summaries, closed_summaries, transaction_summaries) =
                                this.process_transactions(&transactions);
                            let result = this.build_result(
                                summaries,
                                closed_summaries,
                                transaction_summaries,
                                transactions,
                                is_closed,
                            );
                            this.cache.set(cache_key, result.clone(), Some(120.0));
                            Ok(result)
                        }
                        Err(e) => Ok(this
                            .create_empty_result(&format!("Failed to fetch data: {e}"), is_closed)),
                    }
                })
                .await;

        res.unwrap_or_else(|e| self.create_empty_result(&e, tab_id == "closed-position"))
    }

    pub async fn fetch_all_sheets(&self) -> SheetResult {
        let cache_key = "sheet_all".to_string();
        if let Some(cached) = self.cache.get::<SheetResult>(&cache_key) {
            return cached;
        }

        let this = self.clone();
        let res: Result<SheetResult, String> = self
            .singleflight
            .execute("fetch_sheet_all", move || async move {
                if let Some(c) = this.cache.get::<SheetResult>(&cache_key) {
                    return Ok(c);
                }

                match this.sheet_port.fetch_all_tabs_csv().await {
                    Ok(tab_csvs) => {
                        let mut all_transactions = Vec::new();
                        for (tab, csv_text) in tab_csvs {
                            all_transactions.extend(this.parse_csv(&csv_text, tab.id));
                        }

                        let (summaries, closed_summaries, transaction_summaries) =
                            this.process_transactions(&all_transactions);
                        let result = this.build_result(
                            summaries,
                            closed_summaries,
                            transaction_summaries,
                            all_transactions,
                            false,
                        );
                        this.cache.set(cache_key, result.clone(), Some(120.0));
                        Ok(result)
                    }
                    Err(e) => {
                        Ok(this.create_empty_result(&format!("Failed to fetch data: {e}"), false))
                    }
                }
            })
            .await;

        res.unwrap_or_else(|e| self.create_empty_result(&e, false))
    }

    pub fn create_empty_result(&self, error: &str, is_closed: bool) -> SheetResult {
        SheetResult {
            summaries: Vec::new(),
            closed_summaries: Vec::new(),
            transaction_summaries: Some(Vec::new()),
            raw_transactions: Some(Vec::new()),
            total_cost_by_currency: HashMap::new(),
            total_proceeds_by_currency: HashMap::new(),
            total_realized_pl_by_currency: HashMap::new(),
            total_symbols: 0,
            total_lots: 0,
            error: Some(error.to_string()),
            is_closed: Some(is_closed),
        }
    }

    pub fn build_result(
        &self,
        summaries: Vec<SymbolSummary>,
        closed_summaries: Vec<ClosedSymbolSummary>,
        transaction_summaries: Vec<SymbolTransactionSummary>,
        raw_transactions: Vec<Transaction>,
        is_closed: bool,
    ) -> SheetResult {
        let mut total_cost_by_currency: HashMap<String, f64> = HashMap::new();
        let mut total_proceeds_by_currency: HashMap<String, f64> = HashMap::new();
        let mut total_realized_pl_by_currency: HashMap<String, f64> = HashMap::new();

        if is_closed {
            for s in &closed_summaries {
                *total_cost_by_currency
                    .entry(s.currency.clone())
                    .or_insert(0.0) += s.total_cost;
                *total_proceeds_by_currency
                    .entry(s.currency.clone())
                    .or_insert(0.0) += s.total_proceeds;
                *total_realized_pl_by_currency
                    .entry(s.currency.clone())
                    .or_insert(0.0) += s.realized_pl;
            }
            let closed_count = closed_summaries.len();
            return SheetResult {
                summaries,
                closed_summaries,
                transaction_summaries: Some(transaction_summaries),
                raw_transactions: Some(raw_transactions),
                total_cost_by_currency,
                total_proceeds_by_currency,
                total_realized_pl_by_currency,
                total_symbols: closed_count,
                total_lots: 0,
                error: None,
                is_closed: Some(true),
            };
        }

        for open_sum in &summaries {
            *total_cost_by_currency
                .entry(open_sum.currency.clone())
                .or_insert(0.0) += open_sum.total_cost;
        }
        for closed_sum in &closed_summaries {
            *total_proceeds_by_currency
                .entry(closed_sum.currency.clone())
                .or_insert(0.0) += closed_sum.total_proceeds;
            *total_realized_pl_by_currency
                .entry(closed_sum.currency.clone())
                .or_insert(0.0) += closed_sum.realized_pl;
        }

        let total_symbols = summaries.len();
        let total_lots = summaries.iter().map(|s| s.lots.len()).sum();

        SheetResult {
            summaries,
            closed_summaries,
            transaction_summaries: Some(transaction_summaries),
            raw_transactions: Some(raw_transactions),
            total_cost_by_currency,
            total_proceeds_by_currency,
            total_realized_pl_by_currency,
            total_symbols,
            total_lots,
            error: None,
            is_closed: Some(false),
        }
    }

    pub fn parse_csv(&self, csv_text: &str, tab_asset_type: &str) -> Vec<Transaction> {
        let rows = read_csv_rows(csv_text);
        if rows.len() < 2 {
            return Vec::new();
        }

        let header: Vec<String> = rows[0]
            .iter()
            .map(|h| h.trim().trim_start_matches('\u{feff}').to_lowercase())
            .collect();

        let has_pvd_employee_cols = header
            .iter()
            .any(|h| h.contains("employee") || h.contains("employer"));
        if tab_asset_type == "provident-fund" || has_pvd_employee_cols {
            let pvd_txs = self.parse_pvd_csv(csv_text);
            if !pvd_txs.is_empty() || has_pvd_employee_cols {
                return pvd_txs;
            }
        }

        let sym_idx = find_header_idx(&header, &["symbol"]).max(0) as usize;
        let date_idx = find_header_idx(&header, &["date"]).max(1) as usize;
        let qty_idx = find_header_idx(&header, &["quantity", "qty"]).max(2) as usize;
        let price_idx = find_header_idx(&header, &["price"]).max(3) as usize;
        let curr_idx = find_header_idx(&header, &["currency", "curr"]).max(4) as usize;
        let fee_idx = find_header_idx(
            &header,
            &[
                "fee",
                "commission",
                "comm",
                "brokerage",
                "stamp duty",
                "stamp_duty",
            ],
        );
        let type_idx = find_header_idx(&header, &["assettype", "asset type", "asset"]);
        let tx_type_idx = find_header_idx(
            &header,
            &[
                "transaction type",
                "tx_type",
                "txtype",
                "action",
                "trade type",
                "trade_type",
                "type",
            ],
        );
        let ex_from_idx = find_header_idx(
            &header,
            &[
                "exchange from",
                "exchnage from",
                "exhange from",
                "exchange_from",
                "exchnage_from",
                "exhange_from",
                "exchange in",
                "exchnage in",
                "exchange_in",
                "exchnage_in",
                "switch from",
                "switch_from",
                "switch in",
                "switch_in",
                "from fund",
                "from_fund",
                "from symbol",
                "from_symbol",
                "source fund",
                "source_fund",
                "from",
            ],
        );
        let ex_to_idx = find_header_idx(
            &header,
            &[
                "exchange to",
                "exchnage to",
                "exhange to",
                "exchange_to",
                "exchnage_to",
                "exhange_to",
                "exchange out",
                "exchnage out",
                "exchange_out",
                "exchnage_out",
                "switch to",
                "switch_to",
                "switch out",
                "switch_out",
                "to fund",
                "to_fund",
                "to symbol",
                "to_symbol",
                "target fund",
                "target_fund",
                "to",
            ],
        );

        let mut transactions = Vec::new();
        for row in &rows[1..] {
            if row.len() < 5 {
                continue;
            }
            let symbol = row.get(sym_idx).map(|s| s.trim()).unwrap_or("").to_string();
            let date = row
                .get(date_idx)
                .map(|s| s.trim())
                .unwrap_or("")
                .to_string();

            let Ok(quantity) = row
                .get(qty_idx)
                .map(|s| s.trim().replace(',', ""))
                .unwrap_or_default()
                .parse::<f64>()
            else {
                continue;
            };
            let Ok(price) = row
                .get(price_idx)
                .map(|s| s.trim().replace(',', ""))
                .unwrap_or_default()
                .parse::<f64>()
            else {
                continue;
            };

            if symbol.is_empty()
                || date.is_empty()
                || !quantity.is_finite()
                || !price.is_finite()
                || quantity == 0.0
            {
                continue;
            }

            let currency = row
                .get(curr_idx)
                .map(|s| s.trim())
                .filter(|s| !s.is_empty())
                .unwrap_or("USD")
                .to_string();

            let fee = if fee_idx >= 0 {
                row.get(fee_idx as usize)
                    .map(|s| s.trim().replace(',', ""))
                    .filter(|s| !s.is_empty())
                    .and_then(|s| s.parse::<f64>().ok())
            } else {
                None
            };

            let raw_type = if type_idx >= 0 {
                row.get(type_idx as usize).map(|s| s.trim()).unwrap_or("")
            } else {
                ""
            };
            let parsed_type = if !raw_type.is_empty() {
                normalize_asset_type(raw_type).map(|s| s.to_string())
            } else {
                None
            };
            let asset_type =
                parsed_type.unwrap_or_else(|| get_asset_type(Some(tab_asset_type), Some(&symbol)));

            let ex_from = if ex_from_idx >= 0 {
                row.get(ex_from_idx as usize)
                    .map(|s| s.trim())
                    .filter(|s| !s.is_empty())
                    .map(str::to_string)
            } else {
                None
            };
            let ex_to = if ex_to_idx >= 0 {
                row.get(ex_to_idx as usize)
                    .map(|s| s.trim())
                    .filter(|s| !s.is_empty())
                    .map(str::to_string)
            } else {
                None
            };

            let mut parsed_tx_type = if tx_type_idx >= 0 {
                row.get(tx_type_idx as usize)
                    .map(|s| s.trim().to_uppercase())
                    .filter(|s| !s.is_empty())
            } else {
                None
            };
            if parsed_tx_type.is_none() && !raw_type.is_empty() {
                parsed_tx_type = Some(raw_type.trim().to_uppercase());
            }

            let row_str = row
                .iter()
                .map(|c| c.trim())
                .collect::<Vec<_>>()
                .join(" ")
                .to_uppercase();

            if [
                "EXCHANGE OUT",
                "EXCHNAGE OUT",
                "SWITCH OUT",
                "EX-OUT",
                "SW-OUT",
                "EXCHANGE_OUT",
            ]
            .iter()
            .any(|kw| row_str.contains(kw))
            {
                parsed_tx_type = Some("EXCHANGE_OUT".to_string());
            } else if [
                "EXCHANGE IN",
                "EXCHNAGE IN",
                "SWITCH IN",
                "EX-IN",
                "SW-IN",
                "EXCHANGE_IN",
            ]
            .iter()
            .any(|kw| row_str.contains(kw))
            {
                parsed_tx_type = Some("EXCHANGE_IN".to_string());
            } else if ["DIVIDEND", "DIV", "INCOME", "DISTRIBUTION"]
                .iter()
                .any(|kw| row_str.contains(kw))
            {
                parsed_tx_type = Some("DIVIDEND".to_string());
            } else if ["EXCHANGE", "EXCHNAGE", "SWITCH", "SWTICH"]
                .iter()
                .any(|kw| row_str.contains(kw))
                && parsed_tx_type.is_none()
            {
                parsed_tx_type = Some("EXCHANGE".to_string());
            }

            transactions.push(Transaction {
                symbol,
                date,
                quantity,
                price,
                currency,
                asset_type,
                exchange_from: ex_from,
                exchange_to: ex_to,
                tx_type: parsed_tx_type,
                fee,
                note: None,
                employee_contribution: None,
                employee_earnings: None,
                employer_matching: None,
                employer_earnings: None,
                pvd_fund_name: None,
            });
        }

        transactions
    }

    pub fn parse_pvd_csv(&self, csv_text: &str) -> Vec<Transaction> {
        let rows = read_csv_rows(csv_text);
        if rows.len() < 2 {
            return Vec::new();
        }

        let header: Vec<String> = rows[0]
            .iter()
            .map(|h| h.trim().trim_start_matches('\u{feff}').to_lowercase())
            .collect();

        let sym_idx = find_header_idx(&header, &["ticker", "symbol"]).max(0) as usize;
        let emp_unit_idx =
            find_header_idx(&header, &["employee's unit", "employee unit", "emp unit"]);
        let empr_unit_idx =
            find_header_idx(&header, &["employer's unit", "employer unit", "co unit"]);
        let emp_contrib_idx = find_header_idx(
            &header,
            &[
                "employee's contribution",
                "employee contribution",
                "emp contrib",
                "emp contribution",
            ],
        );
        let emp_earnings_idx = find_header_idx(
            &header,
            &[
                "employee's earnings",
                "employee earnings",
                "emp earnings",
                "emp gain",
            ],
        );
        let empr_matching_idx = find_header_idx(
            &header,
            &[
                "employer's matching",
                "employer matching",
                "employer's contribution",
                "employer contribution",
                "co matching",
                "co contribution",
            ],
        );
        let empr_earnings_idx = find_header_idx(
            &header,
            &[
                "employer's earnings",
                "employer earnings",
                "co earnings",
                "co gain",
            ],
        );
        let val_idx = find_header_idx(&header, &["total value", "value", "amount"]);
        let curr_idx = find_header_idx(&header, &["currency", "curr"]);
        let fund_idx = find_header_idx(&header, &["fund", "fund name", "pvd fund"]);

        let has_units = emp_unit_idx != -1 && empr_unit_idx != -1;
        let has_values = val_idx != -1 || (emp_contrib_idx != -1 && empr_matching_idx != -1);
        if !has_units || !has_values {
            return Vec::new();
        }

        let today_str = Local::now().format("%Y-%m-%d").to_string();
        let mut transactions = Vec::new();

        for row in &rows[1..] {
            if row.len() <= sym_idx {
                continue;
            }
            let symbol = row[sym_idx].trim().to_string();
            if symbol.is_empty() {
                continue;
            }

            let parse_float_col = |idx: i32| -> f64 {
                if idx < 0 {
                    return 0.0;
                }
                row.get(idx as usize)
                    .map(|s| s.trim().replace(',', ""))
                    .filter(|s| !s.is_empty())
                    .and_then(|s| s.parse::<f64>().ok())
                    .unwrap_or(0.0)
            };

            let emp_units = parse_float_col(emp_unit_idx);
            let empr_units = parse_float_col(empr_unit_idx);
            let emp_contrib = parse_float_col(emp_contrib_idx);
            let emp_earnings = parse_float_col(emp_earnings_idx);
            let empr_matching = parse_float_col(empr_matching_idx);
            let empr_earnings = parse_float_col(empr_earnings_idx);
            let mut total_val = parse_float_col(val_idx);

            if total_val == 0.0 {
                total_val = emp_contrib + emp_earnings + empr_matching + empr_earnings;
            }

            let total_units = emp_units + empr_units;
            let nav_price = if total_units > 0.0 {
                total_val / total_units
            } else {
                0.0
            };

            let currency = if curr_idx >= 0 {
                row.get(curr_idx as usize)
                    .map(|s| s.trim())
                    .filter(|s| !s.is_empty())
                    .unwrap_or("THB")
                    .to_string()
            } else {
                "THB".to_string()
            };

            let pvd_fund_name = if fund_idx >= 0 {
                row.get(fund_idx as usize)
                    .map(|s| s.trim())
                    .filter(|s| !s.is_empty())
                    .map(str::to_string)
            } else {
                None
            };

            let emp_cost_basis = if emp_units > 0.0 && emp_contrib > 0.0 {
                emp_contrib / emp_units
            } else {
                nav_price
            };
            let empr_cost_basis = if empr_units > 0.0 && empr_matching > 0.0 {
                empr_matching / empr_units
            } else {
                nav_price
            };

            if emp_units > 0.0 {
                transactions.push(Transaction {
                    symbol: symbol.clone(),
                    date: today_str.clone(),
                    quantity: emp_units,
                    price: emp_cost_basis,
                    currency: currency.clone(),
                    asset_type: "provident-fund".to_string(),
                    exchange_from: None,
                    exchange_to: None,
                    tx_type: Some("BUY".to_string()),
                    fee: None,
                    note: Some("Employee Contribution".to_string()),
                    employee_contribution: (emp_contrib > 0.0).then_some(emp_contrib),
                    employee_earnings: (emp_earnings != 0.0).then_some(emp_earnings),
                    employer_matching: None,
                    employer_earnings: None,
                    pvd_fund_name: pvd_fund_name.clone(),
                });
            }
            if empr_units > 0.0 {
                transactions.push(Transaction {
                    symbol,
                    date: today_str.clone(),
                    quantity: empr_units,
                    price: empr_cost_basis,
                    currency,
                    asset_type: "provident-fund".to_string(),
                    exchange_from: None,
                    exchange_to: None,
                    tx_type: Some("BUY".to_string()),
                    fee: None,
                    note: Some("Employer Matching".to_string()),
                    employee_contribution: None,
                    employee_earnings: None,
                    employer_matching: (empr_matching > 0.0).then_some(empr_matching),
                    employer_earnings: (empr_earnings != 0.0).then_some(empr_earnings),
                    pvd_fund_name,
                });
            }
        }

        transactions
    }

    pub fn process_transactions(
        &self,
        transactions: &[Transaction],
    ) -> (
        Vec<SymbolSummary>,
        Vec<ClosedSymbolSummary>,
        Vec<SymbolTransactionSummary>,
    ) {
        let mut symbol_order: Vec<String> = Vec::new();
        let mut symbol_map: HashMap<String, Vec<Transaction>> = HashMap::new();
        for tx in transactions {
            if !symbol_map.contains_key(&tx.symbol) {
                symbol_order.push(tx.symbol.clone());
            }
            symbol_map
                .entry(tx.symbol.clone())
                .or_default()
                .push(tx.clone());
        }

        let mut summaries = Vec::new();
        let mut closed_summaries = Vec::new();
        let mut transaction_summaries = Vec::new();

        for symbol in symbol_order {
            let mut txs = symbol_map.remove(&symbol).unwrap_or_default();
            if txs.is_empty() {
                continue;
            }
            txs.sort_by(|a, b| {
                let da = Self::parse_sort_date(&a.date);
                let db = Self::parse_sort_date(&b.date);
                let ia = if Self::is_inflow_tx(a) { 0 } else { 1 };
                let ib = if Self::is_inflow_tx(b) { 0 } else { 1 };
                da.cmp(&db).then_with(|| ia.cmp(&ib))
            });

            let currency = txs[0].currency.clone();
            let asset_type = txs[0].asset_type.clone();

            let mut open_lots: Vec<ShareLot> = Vec::new();
            let mut closed_lots: Vec<ClosedShareLot> = Vec::new();
            let mut processed_tx_list: Vec<SymbolTransaction> = Vec::new();

            let mut running_shares = 0.0;
            let mut running_total_cost = 0.0;
            let mut total_buy_shares = 0.0;
            let mut total_sell_shares = 0.0;
            let mut total_buy_amount = 0.0;
            let mut total_sell_amount = 0.0;
            let mut buy_count = 0usize;
            let mut sell_count = 0usize;
            let mut exchange_count = 0usize;
            let mut total_realized_pl = 0.0;
            let mut total_realized_cost_basis = 0.0;

            for (i, tx) in txs.iter().enumerate() {
                let is_buy = tx.quantity > 0.0;
                let qty = tx.quantity.abs();
                let price = tx.price;
                let tx_id = format!("{}-{}-{}", symbol, tx.date, i + 1);

                let (tx_type, is_exchange) = Self::classify_transaction_type(tx, is_buy);
                if is_exchange {
                    exchange_count += 1;
                }

                if tx_type == "DIVIDEND" {
                    let total_amount = qty * price;
                    let running_avg = if running_shares > 0.0 {
                        running_total_cost / running_shares
                    } else {
                        0.0
                    };
                    processed_tx_list.push(SymbolTransaction {
                        id: tx_id,
                        symbol: tx.symbol.clone(),
                        date: tx.date.clone(),
                        tx_type: "DIVIDEND".to_string(),
                        quantity: qty,
                        raw_quantity: tx.quantity,
                        price,
                        total_amount,
                        currency: tx.currency.clone(),
                        asset_type: tx.asset_type.clone(),
                        running_shares,
                        running_total_cost,
                        running_average_cost: running_avg,
                        realized_pl: None,
                        realized_pl_percent: None,
                        exchange_from: tx.exchange_from.clone(),
                        exchange_to: tx.exchange_to.clone(),
                    });
                    continue;
                }

                let fee = tx.fee.unwrap_or(0.0);

                if tx_type == "BUY" || tx_type == "EXCHANGE_IN" {
                    if !is_exchange {
                        buy_count += 1;
                    }
                    let total_amount = (qty * price) + fee;
                    let lot_cost_basis = if qty > 0.0 { total_amount / qty } else { price };
                    total_buy_shares += qty;
                    total_buy_amount += total_amount;
                    running_shares += qty;
                    running_total_cost += total_amount;
                    let running_avg = if running_shares > 0.0 {
                        running_total_cost / running_shares
                    } else {
                        0.0
                    };

                    open_lots.push(ShareLot {
                        symbol: tx.symbol.clone(),
                        purchase_date: tx.date.clone(),
                        quantity: qty,
                        cost_basis: lot_cost_basis,
                        total_cost: total_amount,
                        asset_type: tx.asset_type.clone(),
                        note: tx.note.clone(),
                    });

                    processed_tx_list.push(SymbolTransaction {
                        id: tx_id,
                        symbol: tx.symbol.clone(),
                        date: tx.date.clone(),
                        tx_type,
                        quantity: qty,
                        raw_quantity: tx.quantity,
                        price,
                        total_amount,
                        currency: tx.currency.clone(),
                        asset_type: tx.asset_type.clone(),
                        running_shares,
                        running_total_cost,
                        running_average_cost: running_avg,
                        realized_pl: None,
                        realized_pl_percent: None,
                        exchange_from: tx.exchange_from.clone(),
                        exchange_to: tx.exchange_to.clone(),
                    });
                } else {
                    if !is_exchange {
                        sell_count += 1;
                    }
                    let gross_proceeds = qty * price;
                    let net_proceeds = (gross_proceeds - fee).max(0.0);
                    let effective_sell_price = if qty > 0.0 { net_proceeds / qty } else { price };
                    let total_amount = net_proceeds;
                    total_sell_shares += qty;
                    total_sell_amount += total_amount;

                    let mut remaining_to_sell = qty;
                    let mut matched_cost = 0.0;
                    let mut matched_proceeds = 0.0;
                    let mut matched_qty_total = 0.0;

                    for lot in &mut open_lots {
                        if remaining_to_sell <= EPSILON {
                            break;
                        }
                        if lot.quantity <= EPSILON {
                            continue;
                        }

                        let matched_qty = lot.quantity.min(remaining_to_sell);
                        let buy_cost = matched_qty * lot.cost_basis;
                        let sell_proceeds = matched_qty * effective_sell_price;
                        let lot_realized_pl = sell_proceeds - buy_cost;
                        let lot_realized_pl_pct = if buy_cost > 0.0 {
                            (lot_realized_pl / buy_cost) * 100.0
                        } else {
                            0.0
                        };

                        closed_lots.push(ClosedShareLot {
                            symbol: tx.symbol.clone(),
                            purchase_date: lot.purchase_date.clone(),
                            close_date: tx.date.clone(),
                            quantity: matched_qty,
                            cost_basis: lot.cost_basis,
                            sell_price: effective_sell_price,
                            total_cost: buy_cost,
                            total_proceeds: sell_proceeds,
                            realized_pl: lot_realized_pl,
                            realized_pl_percent: lot_realized_pl_pct,
                            currency: tx.currency.clone(),
                            asset_type: tx.asset_type.clone(),
                        });

                        lot.quantity -= matched_qty;
                        lot.total_cost = lot.quantity * lot.cost_basis;
                        remaining_to_sell -= matched_qty;
                        matched_cost += buy_cost;
                        matched_proceeds += sell_proceeds;
                        matched_qty_total += matched_qty;
                    }

                    let mut tx_realized_pl = None;
                    let mut tx_realized_pl_pct = None;

                    if matched_qty_total > EPSILON {
                        let pl = matched_proceeds - matched_cost;
                        let pl_pct = if matched_cost > 0.0 {
                            (pl / matched_cost) * 100.0
                        } else {
                            0.0
                        };
                        tx_realized_pl = Some(pl);
                        tx_realized_pl_pct = Some(pl_pct);
                        total_realized_pl += pl;
                        total_realized_cost_basis += matched_cost;
                    }

                    running_shares = (running_shares - qty).max(0.0);
                    running_total_cost = (running_total_cost - matched_cost).max(0.0);
                    if running_shares <= EPSILON {
                        running_shares = 0.0;
                        running_total_cost = 0.0;
                    }
                    let running_avg = if running_shares > 0.0 {
                        running_total_cost / running_shares
                    } else {
                        0.0
                    };

                    processed_tx_list.push(SymbolTransaction {
                        id: tx_id,
                        symbol: tx.symbol.clone(),
                        date: tx.date.clone(),
                        tx_type,
                        quantity: qty,
                        raw_quantity: tx.quantity,
                        price,
                        total_amount,
                        currency: tx.currency.clone(),
                        asset_type: tx.asset_type.clone(),
                        running_shares,
                        running_total_cost,
                        running_average_cost: running_avg,
                        realized_pl: tx_realized_pl,
                        realized_pl_percent: tx_realized_pl_pct,
                        exchange_from: tx.exchange_from.clone(),
                        exchange_to: tx.exchange_to.clone(),
                    });
                }
            }

            let remaining_lots: Vec<ShareLot> = open_lots
                .into_iter()
                .filter(|lot| lot.quantity > EPSILON)
                .collect();

            if !remaining_lots.is_empty() {
                let total_shares: f64 = remaining_lots.iter().map(|l| l.quantity).sum();
                let total_cost: f64 = remaining_lots.iter().map(|l| l.total_cost).sum();
                let avg_cost = if total_shares > 0.0 {
                    total_cost / total_shares
                } else {
                    0.0
                };
                let emp_shares: f64 = remaining_lots
                    .iter()
                    .filter(|l| l.note.as_deref() == Some("Employee Contribution"))
                    .map(|l| l.quantity)
                    .sum();
                let empr_shares: f64 = remaining_lots
                    .iter()
                    .filter(|l| l.note.as_deref() == Some("Employer Matching"))
                    .map(|l| l.quantity)
                    .sum();

                let emp_contrib_vals: Vec<f64> =
                    txs.iter().filter_map(|t| t.employee_contribution).collect();
                let emp_contrib =
                    (!emp_contrib_vals.is_empty()).then(|| emp_contrib_vals.iter().sum());

                let emp_earnings_vals: Vec<f64> =
                    txs.iter().filter_map(|t| t.employee_earnings).collect();
                let emp_earnings =
                    (!emp_earnings_vals.is_empty()).then(|| emp_earnings_vals.iter().sum());

                let empr_matching_vals: Vec<f64> =
                    txs.iter().filter_map(|t| t.employer_matching).collect();
                let empr_matching =
                    (!empr_matching_vals.is_empty()).then(|| empr_matching_vals.iter().sum());

                let empr_earnings_vals: Vec<f64> =
                    txs.iter().filter_map(|t| t.employer_earnings).collect();
                let empr_earnings =
                    (!empr_earnings_vals.is_empty()).then(|| empr_earnings_vals.iter().sum());

                let pvd_fund_name = txs
                    .iter()
                    .find_map(|t| t.pvd_fund_name.as_ref().filter(|s| !s.is_empty()).cloned());

                summaries.push(SymbolSummary {
                    symbol: symbol.clone(),
                    total_shares,
                    total_cost,
                    average_cost: avg_cost,
                    currency: currency.clone(),
                    lots: remaining_lots,
                    asset_type: asset_type.clone(),
                    employee_shares: (emp_shares > 0.0).then_some(emp_shares),
                    employer_shares: (empr_shares > 0.0).then_some(empr_shares),
                    employee_contribution: emp_contrib,
                    employee_earnings: emp_earnings,
                    employer_matching: empr_matching,
                    employer_earnings: empr_earnings,
                    pvd_fund_name,
                });
            }

            if !closed_lots.is_empty() {
                let closed_shares: f64 = closed_lots.iter().map(|l| l.quantity).sum();
                let total_cost: f64 = closed_lots.iter().map(|l| l.total_cost).sum();
                let total_proceeds: f64 = closed_lots.iter().map(|l| l.total_proceeds).sum();
                let realized_pl = total_proceeds - total_cost;
                let realized_pl_percent = if total_cost > 0.0 {
                    (realized_pl / total_cost) * 100.0
                } else {
                    0.0
                };
                let avg_buy = if closed_shares > 0.0 {
                    total_cost / closed_shares
                } else {
                    0.0
                };
                let avg_sell = if closed_shares > 0.0 {
                    total_proceeds / closed_shares
                } else {
                    0.0
                };
                closed_summaries.push(ClosedSymbolSummary {
                    symbol: symbol.clone(),
                    total_shares: 0.0,
                    closed_shares,
                    total_cost,
                    total_proceeds,
                    realized_pl,
                    realized_pl_percent,
                    average_buy_price: avg_buy,
                    average_sell_price: avg_sell,
                    currency: currency.clone(),
                    lots: closed_lots,
                    asset_type: asset_type.clone(),
                });
            }

            let avg_buy = if total_buy_shares > 0.0 {
                total_buy_amount / total_buy_shares
            } else {
                0.0
            };
            let avg_sell = if total_sell_shares > 0.0 {
                total_sell_amount / total_sell_shares
            } else {
                0.0
            };
            let overall_realized_pl_percent = if total_realized_cost_basis > 0.0 {
                (total_realized_pl / total_realized_cost_basis) * 100.0
            } else {
                0.0
            };
            let current_status = if running_shares > EPSILON {
                "OPEN".to_string()
            } else {
                "CLOSED".to_string()
            };

            transaction_summaries.push(SymbolTransactionSummary {
                symbol,
                asset_type,
                currency,
                total_transactions: txs.len(),
                buy_count,
                sell_count,
                exchange_count,
                total_buy_shares,
                total_sell_shares,
                total_buy_amount,
                total_sell_amount,
                average_buy_price: avg_buy,
                average_sell_price: avg_sell,
                net_shares: running_shares,
                net_invested: running_total_cost,
                current_status,
                realized_pl: total_realized_pl,
                realized_pl_percent: overall_realized_pl_percent,
                first_trade_date: txs.first().map(|t| t.date.clone()).unwrap_or_default(),
                last_trade_date: txs.last().map(|t| t.date.clone()).unwrap_or_default(),
                transactions: processed_tx_list,
            });
        }

        summaries.sort_by(|a, b| b.total_cost.total_cmp(&a.total_cost));
        closed_summaries.sort_by(|a, b| b.realized_pl.total_cmp(&a.realized_pl));
        transaction_summaries.sort_by(|a, b| {
            b.total_transactions
                .cmp(&a.total_transactions)
                .then_with(|| a.symbol.cmp(&b.symbol))
        });

        (summaries, closed_summaries, transaction_summaries)
    }

    pub fn classify_transaction_type(tx: &Transaction, is_buy: bool) -> (String, bool) {
        let tx_type_str = tx.tx_type.as_deref().unwrap_or("").trim().to_uppercase();
        if !tx_type_str.is_empty()
            && ["DIVIDEND", "DIV", "INCOME", "DISTRIBUTION"]
                .iter()
                .any(|kw| tx_type_str.contains(kw))
        {
            return ("DIVIDEND".to_string(), false);
        }

        let is_exchange_out = tx.exchange_to.as_ref().is_some_and(|s| !s.is_empty())
            || (!tx_type_str.is_empty()
                && [
                    "EXCHANGE_OUT",
                    "EXCHANGE OUT",
                    "EXCHNAGE OUT",
                    "SWITCH_OUT",
                    "SWITCH OUT",
                    "EX-OUT",
                    "SW-OUT",
                ]
                .iter()
                .any(|kw| tx_type_str.contains(kw)));

        let is_exchange_in = tx.exchange_from.as_ref().is_some_and(|s| !s.is_empty())
            || (!tx_type_str.is_empty()
                && [
                    "EXCHANGE_IN",
                    "EXCHANGE IN",
                    "EXCHNAGE IN",
                    "SWITCH_IN",
                    "SWITCH IN",
                    "EX-IN",
                    "SW-IN",
                ]
                .iter()
                .any(|kw| tx_type_str.contains(kw)));

        let is_generic_exchange = !tx_type_str.is_empty()
            && ["EXCHANGE", "EXCHNAGE", "SWITCH", "SWTICH"]
                .iter()
                .any(|kw| tx_type_str.contains(kw))
            && !is_exchange_out
            && !is_exchange_in;

        let is_exchange = is_exchange_out || is_exchange_in || is_generic_exchange;

        let resolved = if is_exchange_out || (is_generic_exchange && !is_buy) {
            "EXCHANGE_OUT"
        } else if is_exchange_in || (is_generic_exchange && is_buy) {
            "EXCHANGE_IN"
        } else if tx_type_str.to_uppercase().contains("SELL") {
            "SELL"
        } else if tx_type_str.to_uppercase().contains("BUY") || is_buy {
            "BUY"
        } else {
            "SELL"
        };

        (resolved.to_string(), is_exchange)
    }

    pub fn parse_sort_date(date_str: &str) -> String {
        let s = date_str.trim();
        if s.is_empty() {
            return String::new();
        }
        for fmt in ["%Y-%m-%d", "%Y/%m/%d", "%d/%m/%Y", "%d.%m.%Y", "%m/%d/%Y"] {
            if let Ok(d) = NaiveDate::parse_from_str(s, fmt) {
                return d.format("%Y-%m-%d").to_string();
            }
        }
        s.to_string()
    }

    pub fn is_inflow_tx(tx: &Transaction) -> bool {
        let (tx_type, _) = Self::classify_transaction_type(tx, tx.quantity > 0.0);
        tx_type == "BUY" || tx_type == "EXCHANGE_IN"
    }
}

fn read_csv_rows(csv_text: &str) -> Vec<Vec<String>> {
    let mut reader = csv::ReaderBuilder::new()
        .has_headers(false)
        .flexible(true)
        .from_reader(Cursor::new(csv_text.as_bytes()));

    let mut rows = Vec::new();
    for rec in reader.records().flatten() {
        rows.push(rec.iter().map(str::to_string).collect());
    }
    rows
}

fn find_header_idx(header: &[String], names: &[&str]) -> i32 {
    for (i, h) in header.iter().enumerate() {
        if names.contains(&h.as_str()) {
            return i as i32;
        }
    }
    for (i, h) in header.iter().enumerate() {
        if names.iter().any(|n| h.contains(n)) {
            return i as i32;
        }
    }
    -1
}
