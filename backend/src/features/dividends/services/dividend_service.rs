use std::collections::{HashMap, HashSet};
use std::sync::Arc;

use chrono::{DateTime, Duration, NaiveDate, Utc};
use serde_json::{Map, Value};

use crate::features::dividends::models::dividend::{
    AnnualDividendSummary, AssetTypeDividendSummary, DividendRecord, FundDividendDistribution,
    MonthlyDividendSummary, PortfolioDividendResponse, SymbolDividendSummary,
};
use crate::features::market_data::services::nav_service::{clean_str, parse_float, NavService};
use crate::features::market_data::services::price_service::{PriceService, StockDividendResult};
use crate::features::portfolio::models::portfolio::{ClosedPortfolioPosition, PortfolioPosition};
use crate::features::portfolio::models::transaction::Transaction;
use crate::features::portfolio::services::valuation_service::ValuationService;
use crate::utils::cache::{AsyncSingleflight, TTLCache};
use crate::utils::format_utils::{
    convert_currency, display_symbol, get_asset_type_label, round_digits,
};

pub const YAHOO_DIVIDEND_ASSET_TYPES: &[&str] = &["us-stock", "thai-stock", "bond"];
pub const DIVIDEND_ASSET_TYPES: &[&str] = &["us-stock", "thai-stock", "mutual-fund", "bond"];

pub fn wht_rate_for(asset_type: &str) -> f64 {
    match asset_type {
        "thai-stock" | "mutual-fund" => 0.10,
        "us-stock" | "bond" => 0.15,
        _ => 0.10,
    }
}

pub fn get_tx_share_change(tx: &Transaction) -> f64 {
    if let Some(tt_raw) = tx.tx_type.as_deref() {
        let tt = tt_raw.to_uppercase();
        if ["DIVIDEND", "DIV", "INCOME", "DISTRIBUTION"]
            .iter()
            .any(|kw| tt.contains(kw))
        {
            return 0.0;
        }
    }

    let mut is_outflow = false;
    if tx.exchange_to.as_ref().is_some_and(|s| !s.is_empty()) {
        is_outflow = true;
    } else if let Some(tt_raw) = tx.tx_type.as_deref() {
        let tt = tt_raw.to_uppercase();
        if [
            "SELL",
            "EXCHANGE_OUT",
            "EXCHANGE OUT",
            "EXCHNAGE OUT",
            "SWITCH_OUT",
            "SWITCH OUT",
            "EX-OUT",
            "SW-OUT",
        ]
        .iter()
        .any(|kw| tt.contains(kw))
        {
            is_outflow = true;
        }
    }

    let mut is_inflow = false;
    if tx.exchange_from.as_ref().is_some_and(|s| !s.is_empty()) {
        is_inflow = true;
    } else if let Some(tt_raw) = tx.tx_type.as_deref() {
        let tt = tt_raw.to_uppercase();
        if [
            "BUY",
            "EXCHANGE_IN",
            "EXCHANGE IN",
            "EXCHNAGE IN",
            "SWITCH_IN",
            "SWITCH IN",
            "EX-IN",
            "SW-IN",
        ]
        .iter()
        .any(|kw| tt.contains(kw))
        {
            is_inflow = true;
        }
    }

    let qty = tx.quantity.abs();
    if is_outflow {
        return -qty;
    }
    if is_inflow {
        return qty;
    }
    tx.quantity
}

pub fn calculate_shares_on_date(txs: &[Transaction], snapshot_date: &str) -> f64 {
    let total: f64 = txs
        .iter()
        .filter(|tx| tx.date.as_str() < snapshot_date)
        .map(get_tx_share_change)
        .sum();
    round_digits(total, 6)
}

#[derive(Clone)]
pub struct DividendPositionRef<'a> {
    pub symbol: &'a str,
    pub display_symbol: &'a str,
    pub name: &'a str,
    pub name_th: &'a str,
    pub asset_type: &'a str,
    pub asset_type_label: &'a str,
    pub original_currency: &'a str,
    pub fallback_shares: f64,
}

impl<'a> From<&'a PortfolioPosition> for DividendPositionRef<'a> {
    fn from(p: &'a PortfolioPosition) -> Self {
        Self {
            symbol: &p.symbol,
            display_symbol: &p.display_symbol,
            name: &p.name,
            name_th: &p.name_th,
            asset_type: &p.asset_type,
            asset_type_label: &p.asset_type_label,
            original_currency: &p.original_currency,
            fallback_shares: p.total_shares,
        }
    }
}

impl<'a> From<&'a ClosedPortfolioPosition> for DividendPositionRef<'a> {
    fn from(c: &'a ClosedPortfolioPosition) -> Self {
        Self {
            symbol: &c.symbol,
            display_symbol: &c.display_symbol,
            name: &c.name,
            name_th: &c.name_th,
            asset_type: &c.asset_type,
            asset_type_label: &c.asset_type_label,
            original_currency: &c.original_currency,
            fallback_shares: c.closed_shares,
        }
    }
}

struct MonthlyAcc {
    year_month: String,
    year: i32,
    month: u32,
    gross: f64,
    net: f64,
    wht: f64,
    by_asset_type: HashMap<String, f64>,
    record_count: usize,
}

struct AnnualAcc {
    gross: f64,
    net: f64,
    wht: f64,
    by_asset_type: HashMap<String, f64>,
    record_count: usize,
}

#[derive(Default)]
struct AssetTypeAcc {
    gross: f64,
    net: f64,
    wht: f64,
    symbols: HashSet<String>,
    records: usize,
    cost_basis: f64,
    current_value: f64,
    projected_dividends: f64,
}

#[derive(Clone)]
pub struct DividendService {
    valuation_service: ValuationService,
    price_service: PriceService,
    nav_service: NavService,
    cache: Arc<TTLCache>,
    singleflight: Arc<AsyncSingleflight>,
}

impl DividendService {
    pub fn new(
        valuation_service: ValuationService,
        price_service: PriceService,
        nav_service: NavService,
        cache: Arc<TTLCache>,
        singleflight: Arc<AsyncSingleflight>,
    ) -> Self {
        Self {
            valuation_service,
            price_service,
            nav_service,
            cache,
            singleflight,
        }
    }

    pub async fn get_dividend_analytics(
        &self,
        currency: &str,
        tab_id: &str,
    ) -> PortfolioDividendResponse {
        let target_currency = currency.to_uppercase();
        let cache_key = format!("dividend_{tab_id}_{target_currency}");
        if let Some(cached) = self.cache.get::<PortfolioDividendResponse>(&cache_key) {
            return cached;
        }

        let this = self.clone();
        let tab_owned = tab_id.to_string();
        let sf_key = format!("calc_dividend_{tab_id}_{target_currency}");
        let key_clone = cache_key.clone();

        let res: Result<PortfolioDividendResponse, String> = self
            .singleflight
            .execute(&sf_key, move || async move {
                if let Some(c) = this.cache.get::<PortfolioDividendResponse>(&key_clone) {
                    return Ok(c);
                }

                let holdings_res = this
                    .valuation_service
                    .get_portfolio_holdings(&tab_owned, &target_currency)
                    .await;
                let exchange_rate = if holdings_res.exchange_rate > 0.0 {
                    holdings_res.exchange_rate
                } else {
                    1.0
                };

                if holdings_res.error.is_some() {
                    return Ok(PortfolioDividendResponse {
                        currency: target_currency,
                        exchange_rate,
                        total_gross_dividends: 0.0,
                        total_net_dividends: 0.0,
                        total_withholding_tax: 0.0,
                        effective_tax_rate: 0.0,
                        projected_annual_dividends: 0.0,
                        portfolio_dividend_yield: 0.0,
                        portfolio_yield_on_cost: 0.0,
                        annual_dividends: Vec::new(),
                        monthly_dividends: Vec::new(),
                        asset_type_summaries: Vec::new(),
                        symbol_summaries: Vec::new(),
                        records: Vec::new(),
                        error: holdings_res.error,
                    });
                }

                let open_positions: Vec<PortfolioPosition> = holdings_res
                    .open_positions
                    .into_iter()
                    .filter(|pos| DIVIDEND_ASSET_TYPES.contains(&pos.asset_type.as_str()))
                    .collect();
                let closed_positions: Vec<ClosedPortfolioPosition> = holdings_res
                    .closed_positions
                    .into_iter()
                    .filter(|pos| DIVIDEND_ASSET_TYPES.contains(&pos.asset_type.as_str()))
                    .collect();

                let mut stock_set = HashSet::new();
                let mut fund_set = HashSet::new();
                for pos in &open_positions {
                    if YAHOO_DIVIDEND_ASSET_TYPES.contains(&pos.asset_type.as_str()) {
                        stock_set.insert(pos.symbol.clone());
                    } else if pos.asset_type == "mutual-fund" {
                        fund_set.insert(pos.symbol.clone());
                    }
                }
                for pos in &closed_positions {
                    if YAHOO_DIVIDEND_ASSET_TYPES.contains(&pos.asset_type.as_str()) {
                        stock_set.insert(pos.symbol.clone());
                    } else if pos.asset_type == "mutual-fund" {
                        fund_set.insert(pos.symbol.clone());
                    }
                }

                let stock_symbols: Vec<String> = stock_set.into_iter().collect();
                let fund_symbols: Vec<String> = fund_set.into_iter().collect();

                let (stock_div_data, fund_div_data) = tokio::join!(
                    this.price_service.fetch_stock_dividends(&stock_symbols),
                    this.nav_service.fetch_all_fund_dividends(&fund_symbols),
                );

                let div_open_invested: f64 = open_positions.iter().map(|p| p.total_cost).sum();
                let div_portfolio_value: f64 = open_positions.iter().map(|p| p.holding_value).sum();
                let raw_txs = holdings_res.raw_transactions.unwrap_or_default();

                let analytics = this.calculate_dividend_analytics(
                    &open_positions,
                    &closed_positions,
                    &raw_txs,
                    &stock_div_data,
                    &fund_div_data,
                    exchange_rate,
                    &target_currency,
                    div_portfolio_value,
                    div_open_invested,
                );

                if analytics.error.is_none() {
                    this.cache.set(key_clone, analytics.clone(), Some(120.0));
                }
                Ok(analytics)
            })
            .await;

        res.unwrap_or_else(|e| PortfolioDividendResponse {
            currency: currency.to_uppercase(),
            exchange_rate: 1.0,
            total_gross_dividends: 0.0,
            total_net_dividends: 0.0,
            total_withholding_tax: 0.0,
            effective_tax_rate: 0.0,
            projected_annual_dividends: 0.0,
            portfolio_dividend_yield: 0.0,
            portfolio_yield_on_cost: 0.0,
            annual_dividends: Vec::new(),
            monthly_dividends: Vec::new(),
            asset_type_summaries: Vec::new(),
            symbol_summaries: Vec::new(),
            records: Vec::new(),
            error: Some(e),
        })
    }

    #[allow(clippy::too_many_arguments)]
    pub fn calculate_dividend_analytics(
        &self,
        open_positions: &[PortfolioPosition],
        closed_positions: &[ClosedPortfolioPosition],
        raw_transactions: &[Transaction],
        stock_div_data: &HashMap<String, StockDividendResult>,
        fund_div_data: &HashMap<String, Vec<Map<String, Value>>>,
        exchange_rate: f64,
        target_currency: &str,
        total_portfolio_value: f64,
        total_open_invested: f64,
    ) -> PortfolioDividendResponse {
        let mut txs_by_sym: HashMap<String, Vec<Transaction>> = HashMap::new();
        for tx in raw_transactions {
            if !DIVIDEND_ASSET_TYPES.contains(&tx.asset_type.as_str()) {
                continue;
            }
            txs_by_sym
                .entry(tx.symbol.clone())
                .or_default()
                .push(tx.clone());
        }
        for list in txs_by_sym.values_mut() {
            list.sort_by(|a, b| a.date.cmp(&b.date));
        }

        let mut records: Vec<DividendRecord> = Vec::new();
        let mut symbol_summary_map: HashMap<String, SymbolDividendSummary> = HashMap::new();
        let mut monthly_map: HashMap<String, MonthlyAcc> = HashMap::new();
        let mut annual_map: HashMap<i32, AnnualAcc> = HashMap::new();
        let mut asset_type_map: HashMap<String, AssetTypeAcc> = DIVIDEND_ASSET_TYPES
            .iter()
            .map(|at| ((*at).to_string(), AssetTypeAcc::default()))
            .collect();

        let mut seen_syms = HashSet::new();
        let mut unique_positions: Vec<DividendPositionRef<'_>> = Vec::new();
        for pos in open_positions {
            if seen_syms.insert(pos.symbol.clone()) {
                unique_positions.push(DividendPositionRef::from(pos));
            }
        }
        for pos in closed_positions {
            if seen_syms.insert(pos.symbol.clone()) {
                unique_positions.push(DividendPositionRef::from(pos));
            }
        }

        for pos in unique_positions {
            let sym = pos.symbol;
            let asset_type = pos.asset_type;
            if !DIVIDEND_ASSET_TYPES.contains(&asset_type) {
                continue;
            }
            let curr = pos.original_currency;

            let mut events: Vec<(String, String, f64)> = Vec::new();
            let mut seen_event_keys: HashSet<String> = HashSet::new();

            if YAHOO_DIVIDEND_ASSET_TYPES.contains(&asset_type) {
                if let Some(stock_res) = stock_div_data.get(sym) {
                    for evt in &stock_res.dividends {
                        if evt.amount > 0.0 && evt.date > 0 {
                            if let Some(dt) = DateTime::from_timestamp(evt.date, 0) {
                                let dt_str = dt.format("%Y-%m-%d").to_string();
                                let key = format!("{dt_str}|{dt_str}|{:.12}", evt.amount);
                                if seen_event_keys.insert(key) {
                                    events.push((dt_str.clone(), dt_str, evt.amount));
                                }
                            }
                        }
                    }
                }
            } else if asset_type == "mutual-fund" {
                if let Some(raw_dists) = fund_div_data.get(sym) {
                    for d_item in raw_dists {
                        let d_val = parse_float(d_item.get("dividend_value")).unwrap_or(0.0);
                        let b_date = clean_str(d_item.get("book_close_date"))
                            .unwrap_or_default()
                            .split(' ')
                            .next()
                            .unwrap_or("")
                            .trim()
                            .to_string();
                        let d_date = clean_str(d_item.get("dividend_date"))
                            .unwrap_or_default()
                            .split(' ')
                            .next()
                            .unwrap_or("")
                            .trim()
                            .to_string();
                        let payout_date = if !d_date.is_empty() {
                            d_date.clone()
                        } else {
                            b_date.clone()
                        };
                        let snapshot_date = if !b_date.is_empty() { b_date } else { d_date };
                        if !payout_date.is_empty() && d_val > 0.0 {
                            let key = format!("{payout_date}|{snapshot_date}|{d_val:.12}");
                            if seen_event_keys.insert(key) {
                                events.push((payout_date, snapshot_date, d_val));
                            }
                        }
                    }
                }
            }

            let wht_rate = wht_rate_for(asset_type);

            for (idx, (payout_date, snapshot_date, m_dps)) in events.into_iter().enumerate() {
                let shares_on_date = if let Some(txs) = txs_by_sym.get(sym) {
                    calculate_shares_on_date(txs, &snapshot_date)
                } else {
                    pos.fallback_shares
                };

                if shares_on_date.abs() < 1e-6 || shares_on_date <= 0.0 {
                    continue;
                }

                let shares_on_date = round_digits(shares_on_date, 6);
                let m_gross = shares_on_date * m_dps;
                let m_wht = m_gross * wht_rate;
                let m_net = m_gross - m_wht;
                let m_conv_gross = convert_currency(m_gross, curr, target_currency, exchange_rate);
                let m_conv_net = convert_currency(m_net, curr, target_currency, exchange_rate);
                let m_conv_wht = convert_currency(m_wht, curr, target_currency, exchange_rate);

                let record_date = (snapshot_date != payout_date).then_some(snapshot_date);

                records.push(DividendRecord {
                    id: format!("api-{sym}-{payout_date}-{}", idx + 1),
                    symbol: sym.to_string(),
                    display_symbol: display_symbol(sym),
                    date: payout_date.clone(),
                    record_date,
                    asset_type: asset_type.to_string(),
                    asset_type_label: get_asset_type_label(Some(asset_type), None),
                    shares: shares_on_date,
                    dividend_per_share: m_dps,
                    gross_amount: m_gross,
                    withholding_tax: m_wht,
                    withholding_tax_rate: wht_rate * 100.0,
                    net_amount: m_net,
                    currency: curr.to_string(),
                    converted_net_amount: m_conv_net,
                    converted_gross_amount: m_conv_gross,
                    converted_withholding_tax: m_conv_wht,
                });

                let ym = if payout_date.len() >= 7 {
                    payout_date[..7].to_string()
                } else {
                    "Unknown".to_string()
                };
                let year = if payout_date.len() >= 4 {
                    payout_date[..4].parse::<i32>().unwrap_or(0)
                } else {
                    0
                };
                let month = if payout_date.len() >= 7 {
                    payout_date[5..7].parse::<u32>().unwrap_or(0)
                } else {
                    0
                };

                let m_acc = monthly_map.entry(ym.clone()).or_insert_with(|| MonthlyAcc {
                    year_month: ym,
                    year,
                    month,
                    gross: 0.0,
                    net: 0.0,
                    wht: 0.0,
                    by_asset_type: HashMap::new(),
                    record_count: 0,
                });
                m_acc.gross += m_conv_gross;
                m_acc.net += m_conv_net;
                m_acc.wht += m_conv_wht;
                m_acc.record_count += 1;
                *m_acc
                    .by_asset_type
                    .entry(asset_type.to_string())
                    .or_insert(0.0) += m_conv_net;

                let a_acc = annual_map.entry(year).or_insert_with(|| AnnualAcc {
                    gross: 0.0,
                    net: 0.0,
                    wht: 0.0,
                    by_asset_type: HashMap::new(),
                    record_count: 0,
                });
                a_acc.gross += m_conv_gross;
                a_acc.net += m_conv_net;
                a_acc.wht += m_conv_wht;
                a_acc.record_count += 1;
                *a_acc
                    .by_asset_type
                    .entry(asset_type.to_string())
                    .or_insert(0.0) += m_conv_net;

                if let Some(at_acc) = asset_type_map.get_mut(asset_type) {
                    at_acc.gross += m_conv_gross;
                    at_acc.net += m_conv_net;
                    at_acc.wht += m_conv_wht;
                    at_acc.symbols.insert(sym.to_string());
                    at_acc.records += 1;
                }

                let sym_s = symbol_summary_map
                    .entry(sym.to_string())
                    .or_insert_with(|| SymbolDividendSummary {
                        symbol: sym.to_string(),
                        display_symbol: pos.display_symbol.to_string(),
                        name: pos.name.to_string(),
                        name_th: pos.name_th.to_string(),
                        asset_type: asset_type.to_string(),
                        asset_type_label: pos.asset_type_label.to_string(),
                        currency: curr.to_string(),
                        total_gross_dividends: 0.0,
                        total_net_dividends: 0.0,
                        total_withholding_tax: 0.0,
                        converted_net_dividends: 0.0,
                        converted_gross_dividends: 0.0,
                        converted_withholding_tax: 0.0,
                        dividend_count: 0,
                        first_dividend_date: payout_date.clone(),
                        last_dividend_date: payout_date.clone(),
                        current_shares: 0.0,
                        current_cost_basis: 0.0,
                        current_value: 0.0,
                        trailing_annual_dps: 0.0,
                        current_yield_percent: 0.0,
                        yield_on_cost_percent: 0.0,
                        projected_annual_income: 0.0,
                        recent_distributions: Vec::new(),
                    });

                sym_s.total_gross_dividends += m_gross;
                sym_s.total_net_dividends += m_net;
                sym_s.total_withholding_tax += m_wht;
                sym_s.converted_gross_dividends += m_conv_gross;
                sym_s.converted_net_dividends += m_conv_net;
                sym_s.converted_withholding_tax += m_conv_wht;
                sym_s.dividend_count += 1;
                if sym_s.first_dividend_date.is_empty() || payout_date < sym_s.first_dividend_date {
                    sym_s.first_dividend_date = payout_date.clone();
                }
                if sym_s.last_dividend_date.is_empty() || payout_date > sym_s.last_dividend_date {
                    sym_s.last_dividend_date = payout_date;
                }
            }
        }

        let mut projected_annual_total = 0.0;
        let now_dt = Utc::now();
        let one_year_ago_str = (now_dt - Duration::days(365))
            .format("%Y-%m-%d")
            .to_string();

        for pos in open_positions {
            let sym = &pos.symbol;
            let asset_type = &pos.asset_type;
            if !DIVIDEND_ASSET_TYPES.contains(&asset_type.as_str()) {
                continue;
            }
            let curr = &pos.original_currency;
            let shares = pos.total_shares;
            let cost_basis = pos.total_cost;
            let val = pos.holding_value;

            let mut trailing_dps = 0.0;
            let mut recent_dists: Vec<FundDividendDistribution> = Vec::new();

            if asset_type == "mutual-fund" {
                let raw_dists = fund_div_data.get(sym).map(Vec::as_slice).unwrap_or(&[]);
                let mut seen_dist_keys = HashSet::new();
                struct ParsedDist {
                    proj_id: String,
                    class_abbr_name: String,
                    book_close_date: String,
                    dividend_date: String,
                    dividend_value: f64,
                    last_upd_date: String,
                }
                let mut parsed_dists: Vec<ParsedDist> = Vec::new();

                for d in raw_dists {
                    let d_val = parse_float(d.get("dividend_value")).unwrap_or(0.0);
                    let d_date = clean_str(d.get("dividend_date"))
                        .unwrap_or_default()
                        .split(' ')
                        .next()
                        .unwrap_or("")
                        .trim()
                        .to_string();
                    let b_date = clean_str(d.get("book_close_date"))
                        .unwrap_or_default()
                        .split(' ')
                        .next()
                        .unwrap_or("")
                        .trim()
                        .to_string();
                    let p_id = clean_str(d.get("proj_id")).unwrap_or_default();
                    let dist_key = format!("{p_id}|{b_date}|{d_date}|{d_val:.12}");
                    if !seen_dist_keys.insert(dist_key) {
                        continue;
                    }
                    let class_abbr = clean_str(d.get("class_abbr_name"))
                        .or_else(|| clean_str(d.get("fund_class_name")))
                        .unwrap_or_else(|| sym.clone());
                    let last_upd = clean_str(d.get("last_upd_date")).unwrap_or_default();
                    parsed_dists.push(ParsedDist {
                        proj_id: p_id,
                        class_abbr_name: class_abbr,
                        book_close_date: b_date,
                        dividend_date: d_date,
                        dividend_value: d_val,
                        last_upd_date: last_upd,
                    });
                }

                let newest_date = parsed_dists
                    .iter()
                    .filter_map(|p| {
                        let ref_d = if !p.dividend_date.is_empty() {
                            &p.dividend_date
                        } else {
                            &p.book_close_date
                        };
                        (!ref_d.is_empty()).then_some(ref_d.as_str())
                    })
                    .max()
                    .map(str::to_string);

                let cutoff_str = if let Some(newest) = newest_date {
                    let newest_one_yr = NaiveDate::parse_from_str(&newest, "%Y-%m-%d")
                        .map(|dt| (dt - Duration::days(365)).format("%Y-%m-%d").to_string())
                        .unwrap_or_else(|_| one_year_ago_str.clone());
                    if newest < one_year_ago_str {
                        one_year_ago_str.clone().min(newest_one_yr)
                    } else {
                        one_year_ago_str.clone()
                    }
                } else {
                    one_year_ago_str.clone()
                };

                for p in parsed_dists {
                    let ref_d = if !p.dividend_date.is_empty() {
                        &p.dividend_date
                    } else {
                        &p.book_close_date
                    };
                    if !ref_d.is_empty()
                        && ref_d.as_str() >= cutoff_str.as_str()
                        && p.dividend_value > 0.0
                    {
                        trailing_dps += p.dividend_value;
                    }
                    recent_dists.push(FundDividendDistribution {
                        proj_id: p.proj_id,
                        class_abbr_name: p.class_abbr_name,
                        book_close_date: p.book_close_date,
                        dividend_date: p.dividend_date,
                        dividend_value: p.dividend_value,
                        last_upd_date: p.last_upd_date,
                    });
                }

                recent_dists.sort_by(|a, b| {
                    let ka = if !a.dividend_date.is_empty() {
                        &a.dividend_date
                    } else {
                        &a.book_close_date
                    };
                    let kb = if !b.dividend_date.is_empty() {
                        &b.dividend_date
                    } else {
                        &b.book_close_date
                    };
                    kb.cmp(ka)
                });
            } else if YAHOO_DIVIDEND_ASSET_TYPES.contains(&asset_type.as_str()) {
                trailing_dps = stock_div_data
                    .get(sym)
                    .map(|s| s.trailing_12m_dps)
                    .unwrap_or(0.0);
            }

            let proj_orig_income = shares * trailing_dps;
            let conv_proj_income =
                convert_currency(proj_orig_income, curr, target_currency, exchange_rate);
            projected_annual_total += conv_proj_income;

            let current_price = pos.current_price;
            let avg_cost = pos.average_cost;
            let conv_trailing_dps =
                convert_currency(trailing_dps, curr, target_currency, exchange_rate);
            let curr_yield_pct = if val > 0.0 {
                (conv_proj_income / val) * 100.0
            } else if current_price > 0.0 {
                (conv_trailing_dps / current_price) * 100.0
            } else {
                0.0
            };
            let yoc_pct = if cost_basis > 0.0 {
                (conv_proj_income / cost_basis) * 100.0
            } else if avg_cost > 0.0 {
                (conv_trailing_dps / avg_cost) * 100.0
            } else {
                0.0
            };

            let entry =
                symbol_summary_map
                    .entry(sym.clone())
                    .or_insert_with(|| SymbolDividendSummary {
                        symbol: sym.clone(),
                        display_symbol: pos.display_symbol.clone(),
                        name: pos.name.clone(),
                        name_th: pos.name_th.clone(),
                        asset_type: asset_type.clone(),
                        asset_type_label: pos.asset_type_label.clone(),
                        currency: curr.clone(),
                        total_gross_dividends: 0.0,
                        total_net_dividends: 0.0,
                        total_withholding_tax: 0.0,
                        converted_net_dividends: 0.0,
                        converted_gross_dividends: 0.0,
                        converted_withholding_tax: 0.0,
                        dividend_count: 0,
                        first_dividend_date: String::new(),
                        last_dividend_date: String::new(),
                        current_shares: 0.0,
                        current_cost_basis: 0.0,
                        current_value: 0.0,
                        trailing_annual_dps: 0.0,
                        current_yield_percent: 0.0,
                        yield_on_cost_percent: 0.0,
                        projected_annual_income: 0.0,
                        recent_distributions: Vec::new(),
                    });

            entry.name = pos.name.clone();
            entry.name_th = pos.name_th.clone();
            entry.current_shares = shares;
            entry.current_cost_basis = cost_basis;
            entry.current_value = val;
            entry.trailing_annual_dps = trailing_dps;
            entry.current_yield_percent = curr_yield_pct;
            entry.yield_on_cost_percent = yoc_pct;
            entry.projected_annual_income = conv_proj_income;
            entry.recent_distributions = recent_dists;

            if let Some(at_acc) = asset_type_map.get_mut(asset_type) {
                at_acc.cost_basis += cost_basis;
                at_acc.current_value += val;
                at_acc.projected_dividends += conv_proj_income;
                at_acc.symbols.insert(sym.clone());
            }
        }

        records.sort_by(|a, b| b.date.cmp(&a.date));

        let total_net_dividends: f64 = records.iter().map(|r| r.converted_net_amount).sum();
        let total_gross_dividends: f64 = records.iter().map(|r| r.converted_gross_amount).sum();
        let total_wht: f64 = records.iter().map(|r| r.converted_withholding_tax).sum();

        let mut asset_type_summaries = Vec::with_capacity(DIVIDEND_ASSET_TYPES.len());
        for at_key in DIVIDEND_ASSET_TYPES {
            let at_data = asset_type_map.get(*at_key).expect("initialized key");
            let pct = if total_net_dividends > 0.0 {
                (at_data.net / total_net_dividends) * 100.0
            } else {
                0.0
            };
            let cost_b = at_data.cost_basis;
            let curr_v = at_data.current_value;
            let proj_d = at_data.projected_dividends;
            let at_yoc = if cost_b > 0.0 {
                (proj_d / cost_b) * 100.0
            } else {
                0.0
            };
            let at_yield = if curr_v > 0.0 {
                (proj_d / curr_v) * 100.0
            } else {
                0.0
            };
            asset_type_summaries.push(AssetTypeDividendSummary {
                asset_type: (*at_key).to_string(),
                asset_type_label: get_asset_type_label(Some(at_key), None),
                total_gross_dividends: at_data.gross,
                total_net_dividends: at_data.net,
                total_withholding_tax: at_data.wht,
                percentage_of_total: pct,
                symbol_count: at_data.symbols.len(),
                record_count: at_data.records,
                total_cost_basis: cost_b,
                current_value: curr_v,
                projected_annual_dividends: proj_d,
                yield_on_cost_percent: at_yoc,
                current_yield_percent: at_yield,
            });
        }

        let mut monthly_summaries: Vec<MonthlyDividendSummary> = monthly_map
            .into_values()
            .map(|v| MonthlyDividendSummary {
                year_month: v.year_month,
                year: v.year,
                month: v.month,
                gross_amount: v.gross,
                net_amount: v.net,
                withholding_tax: v.wht,
                by_asset_type: v.by_asset_type,
                record_count: v.record_count,
            })
            .collect();
        monthly_summaries.sort_by(|a, b| b.year_month.cmp(&a.year_month));

        let mut annual_summaries: Vec<AnnualDividendSummary> = annual_map
            .into_iter()
            .map(|(y, v)| {
                let year_months: Vec<MonthlyDividendSummary> = monthly_summaries
                    .iter()
                    .filter(|m| m.year == y)
                    .cloned()
                    .collect();
                AnnualDividendSummary {
                    year: y,
                    gross_amount: v.gross,
                    net_amount: v.net,
                    withholding_tax: v.wht,
                    by_asset_type: v.by_asset_type,
                    record_count: v.record_count,
                    monthly_breakdown: year_months,
                }
            })
            .collect();
        annual_summaries.sort_by_key(|a| std::cmp::Reverse(a.year));

        let calc_cost_basis: f64 = asset_type_map.values().map(|a| a.cost_basis).sum();
        let calc_current_val: f64 = asset_type_map.values().map(|a| a.current_value).sum();
        let eff_open_invested = if total_open_invested > 0.0 {
            total_open_invested
        } else {
            calc_cost_basis
        };
        let eff_portfolio_val = if total_portfolio_value > 0.0 {
            total_portfolio_value
        } else {
            calc_current_val
        };

        let effective_tax_rate = if total_gross_dividends > 0.0 {
            (total_wht / total_gross_dividends) * 100.0
        } else {
            0.0
        };
        let portfolio_yoc = if eff_open_invested > 0.0 {
            (projected_annual_total / eff_open_invested) * 100.0
        } else {
            0.0
        };
        let portfolio_yield = if eff_portfolio_val > 0.0 {
            (projected_annual_total / eff_portfolio_val) * 100.0
        } else {
            0.0
        };

        let mut sorted_symbols: Vec<SymbolDividendSummary> =
            symbol_summary_map.into_values().collect();
        sorted_symbols.sort_by(|a, b| {
            b.converted_net_dividends
                .total_cmp(&a.converted_net_dividends)
                .then_with(|| {
                    b.projected_annual_income
                        .total_cmp(&a.projected_annual_income)
                })
        });

        PortfolioDividendResponse {
            currency: target_currency.to_string(),
            exchange_rate,
            total_gross_dividends,
            total_net_dividends,
            total_withholding_tax: total_wht,
            effective_tax_rate,
            projected_annual_dividends: projected_annual_total,
            portfolio_dividend_yield: portfolio_yield,
            portfolio_yield_on_cost: portfolio_yoc,
            annual_dividends: annual_summaries,
            monthly_dividends: monthly_summaries,
            asset_type_summaries,
            symbol_summaries: sorted_symbols,
            records,
            error: None,
        }
    }
}
