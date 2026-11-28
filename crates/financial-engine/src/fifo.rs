use std::collections::HashMap;

use chrono::NaiveDate;
use rust_decimal::Decimal;
use sgsk_domain::transaction::{
    ClosedShareLot, ClosedSymbolSummary, FifoResult, ShareLot, SymbolSummary, SymbolTransaction,
    SymbolTransactionSummary, Transaction,
};

const ONE_HUNDRED: Decimal = Decimal::from_parts(100, 0, 0, false, 0);
/// 1e-7 residual threshold matching `fixtures/accounting/fifo_scenarios.json`.
const EPSILON: Decimal = Decimal::from_parts(1, 0, 0, false, 7);

fn parse_sort_date(date_str: &str) -> NaiveDate {
    let trimmed = date_str.trim();
    if let Ok(d) = NaiveDate::parse_from_str(trimmed, "%Y-%m-%d") {
        return d;
    }
    if let Ok(d) = NaiveDate::parse_from_str(trimmed, "%d/%m/%Y") {
        return d;
    }
    if let Ok(d) = NaiveDate::parse_from_str(trimmed, "%Y/%m/%d") {
        return d;
    }
    NaiveDate::from_ymd_opt(1970, 1, 1).unwrap_or_default()
}

fn is_inflow_tx(tx: &Transaction) -> bool {
    let raw = tx.tx_type.as_deref().unwrap_or("").trim().to_uppercase();
    if matches!(
        raw.as_str(),
        "BUY" | "EX-IN" | "EXCHANGE_IN" | "EXCHANGE IN" | "SWITCH_IN" | "SWITCH IN"
    ) {
        return true;
    }
    if matches!(
        raw.as_str(),
        "SELL" | "EX-OUT" | "EXCHANGE_OUT" | "EXCHANGE OUT" | "SWITCH_OUT" | "SWITCH OUT"
    ) {
        return false;
    }
    tx.quantity >= Decimal::ZERO
}

fn classify_transaction_type(tx: &Transaction, is_buy: bool) -> (String, bool) {
    let raw = tx.tx_type.as_deref().unwrap_or("").trim().to_uppercase();
    match raw.as_str() {
        "DIVIDEND" | "DIV" => ("DIVIDEND".to_string(), false),
        "EX-IN" | "EXCHANGE_IN" | "EXCHANGE IN" | "SWITCH_IN" | "SWITCH IN" => {
            ("EXCHANGE_IN".to_string(), true)
        }
        "EX-OUT" | "EXCHANGE_OUT" | "EXCHANGE OUT" | "SWITCH_OUT" | "SWITCH OUT" => {
            ("EXCHANGE_OUT".to_string(), true)
        }
        "EXCHANGE" | "SWITCH" => {
            if is_buy {
                ("EXCHANGE_IN".to_string(), true)
            } else {
                ("EXCHANGE_OUT".to_string(), true)
            }
        }
        "BUY" => ("BUY".to_string(), false),
        "SELL" => ("SELL".to_string(), false),
        _ => {
            if is_buy {
                ("BUY".to_string(), false)
            } else {
                ("SELL".to_string(), false)
            }
        }
    }
}

fn sum_optional_decimals<I>(iter: I) -> Option<Decimal>
where
    I: Iterator<Item = Option<Decimal>>,
{
    let vals: Vec<Decimal> = iter.flatten().collect();
    (!vals.is_empty()).then(|| vals.into_iter().sum())
}

/// Processes normalized transactions through the FIFO share-lot engine using exact `Decimal` math.
pub fn process_transactions(transactions: &[Transaction]) -> FifoResult {
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

    let mut open_summaries = Vec::new();
    let mut closed_summaries = Vec::new();
    let mut transaction_summaries = Vec::new();

    for symbol in symbol_order {
        let mut txs = symbol_map.remove(&symbol).unwrap_or_default();
        if txs.is_empty() {
            continue;
        }
        txs.sort_by(|a, b| {
            let da = parse_sort_date(&a.date);
            let db = parse_sort_date(&b.date);
            let ia = usize::from(!is_inflow_tx(a));
            let ib = usize::from(!is_inflow_tx(b));
            da.cmp(&db).then_with(|| ia.cmp(&ib))
        });

        let currency = txs[0].currency.clone();
        let asset_type = txs[0].asset_type.clone();

        let mut open_lots: Vec<ShareLot> = Vec::new();
        let mut closed_lots: Vec<ClosedShareLot> = Vec::new();
        let mut processed_tx_list: Vec<SymbolTransaction> = Vec::new();

        let mut running_shares = Decimal::ZERO;
        let mut running_total_cost = Decimal::ZERO;
        let mut total_buy_shares = Decimal::ZERO;
        let mut total_sell_shares = Decimal::ZERO;
        let mut total_buy_amount = Decimal::ZERO;
        let mut total_sell_amount = Decimal::ZERO;
        let mut buy_count = 0usize;
        let mut sell_count = 0usize;
        let mut exchange_count = 0usize;
        let mut total_realized_pl = Decimal::ZERO;
        let mut total_realized_cost_basis = Decimal::ZERO;

        for (i, tx) in txs.iter().enumerate() {
            let is_buy = tx.quantity > Decimal::ZERO;
            let qty = tx.quantity.abs();
            let price = tx.price;
            let tx_id = format!("{}-{}-{}", symbol, tx.date, i + 1);

            let (tx_type, is_exchange) = classify_transaction_type(tx, is_buy);
            if is_exchange {
                exchange_count += 1;
            }

            if tx_type == "DIVIDEND" {
                let total_amount = qty * price;
                let running_avg = if running_shares > Decimal::ZERO {
                    running_total_cost / running_shares
                } else {
                    Decimal::ZERO
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
                    realized_pl: None,
                    realized_pl_percent: None,
                    exchange_from: tx.exchange_from.clone(),
                    exchange_to: tx.exchange_to.clone(),
                });
                continue;
            }

            let fee = tx.fee.unwrap_or(Decimal::ZERO);

            if tx_type == "BUY" || tx_type == "EXCHANGE_IN" {
                if !is_exchange {
                    buy_count += 1;
                }
                let total_amount = (qty * price) + fee;
                let lot_cost_basis = if qty > Decimal::ZERO {
                    total_amount / qty
                } else {
                    price
                };
                total_buy_shares += qty;
                total_buy_amount += total_amount;
                running_shares += qty;
                running_total_cost += total_amount;
                let running_avg = if running_shares > Decimal::ZERO {
                    running_total_cost / running_shares
                } else {
                    Decimal::ZERO
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
                let net_proceeds = (gross_proceeds - fee).max(Decimal::ZERO);
                let effective_sell_price = if qty > Decimal::ZERO {
                    net_proceeds / qty
                } else {
                    price
                };
                total_sell_shares += qty;
                total_sell_amount += net_proceeds;

                let mut remaining_to_sell = qty;
                let mut matched_cost = Decimal::ZERO;
                let mut matched_proceeds = Decimal::ZERO;
                let mut matched_qty_total = Decimal::ZERO;

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
                    let lot_realized_pl_pct = if buy_cost > Decimal::ZERO {
                        (lot_realized_pl / buy_cost) * ONE_HUNDRED
                    } else {
                        Decimal::ZERO
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
                    let pl_pct = if matched_cost > Decimal::ZERO {
                        (pl / matched_cost) * ONE_HUNDRED
                    } else {
                        Decimal::ZERO
                    };
                    tx_realized_pl = Some(pl);
                    tx_realized_pl_pct = Some(pl_pct);
                    total_realized_pl += pl;
                    total_realized_cost_basis += matched_cost;
                }

                running_shares = (running_shares - qty).max(Decimal::ZERO);
                running_total_cost = (running_total_cost - matched_cost).max(Decimal::ZERO);
                if running_shares <= EPSILON {
                    running_shares = Decimal::ZERO;
                    running_total_cost = Decimal::ZERO;
                }
                let running_avg = if running_shares > Decimal::ZERO {
                    running_total_cost / running_shares
                } else {
                    Decimal::ZERO
                };

                processed_tx_list.push(SymbolTransaction {
                    id: tx_id,
                    symbol: tx.symbol.clone(),
                    date: tx.date.clone(),
                    tx_type,
                    quantity: qty,
                    raw_quantity: tx.quantity,
                    price,
                    total_amount: net_proceeds,
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
            let total_shares: Decimal = remaining_lots.iter().map(|l| l.quantity).sum();
            let total_cost: Decimal = remaining_lots.iter().map(|l| l.total_cost).sum();
            let average_cost = if total_shares > Decimal::ZERO {
                total_cost / total_shares
            } else {
                Decimal::ZERO
            };
            let emp_shares: Decimal = remaining_lots
                .iter()
                .filter(|l| l.note.as_deref() == Some("Employee Contribution"))
                .map(|l| l.quantity)
                .sum();
            let empr_shares: Decimal = remaining_lots
                .iter()
                .filter(|l| l.note.as_deref() == Some("Employer Matching"))
                .map(|l| l.quantity)
                .sum();

            let pvd_fund_name = txs
                .iter()
                .find_map(|t| t.pvd_fund_name.as_ref().filter(|s| !s.is_empty()).cloned());

            open_summaries.push(SymbolSummary {
                symbol: symbol.clone(),
                total_shares,
                total_cost,
                average_cost,
                currency: currency.clone(),
                asset_type: asset_type.clone(),
                lots: remaining_lots,
                employee_shares: (emp_shares > Decimal::ZERO).then_some(emp_shares),
                employer_shares: (empr_shares > Decimal::ZERO).then_some(empr_shares),
                employee_contribution: sum_optional_decimals(
                    txs.iter().map(|t| t.employee_contribution),
                ),
                employee_earnings: sum_optional_decimals(txs.iter().map(|t| t.employee_earnings)),
                employer_matching: sum_optional_decimals(txs.iter().map(|t| t.employer_matching)),
                employer_earnings: sum_optional_decimals(txs.iter().map(|t| t.employer_earnings)),
                pvd_fund_name,
            });
        }

        if !closed_lots.is_empty() {
            let closed_shares: Decimal = closed_lots.iter().map(|l| l.quantity).sum();
            let total_cost: Decimal = closed_lots.iter().map(|l| l.total_cost).sum();
            let total_proceeds: Decimal = closed_lots.iter().map(|l| l.total_proceeds).sum();
            let realized_pl = total_proceeds - total_cost;
            let realized_pl_percent = if total_cost > Decimal::ZERO {
                (realized_pl / total_cost) * ONE_HUNDRED
            } else {
                Decimal::ZERO
            };
            let average_buy_price = if closed_shares > Decimal::ZERO {
                total_cost / closed_shares
            } else {
                Decimal::ZERO
            };
            let average_sell_price = if closed_shares > Decimal::ZERO {
                total_proceeds / closed_shares
            } else {
                Decimal::ZERO
            };

            closed_summaries.push(ClosedSymbolSummary {
                symbol: symbol.clone(),
                closed_shares,
                total_cost,
                total_proceeds,
                realized_pl,
                realized_pl_percent,
                average_buy_price,
                average_sell_price,
                currency: currency.clone(),
                asset_type: asset_type.clone(),
                lots: closed_lots,
            });
        }

        let average_buy_price = if total_buy_shares > Decimal::ZERO {
            total_buy_amount / total_buy_shares
        } else {
            Decimal::ZERO
        };
        let average_sell_price = if total_sell_shares > Decimal::ZERO {
            total_sell_amount / total_sell_shares
        } else {
            Decimal::ZERO
        };
        let overall_realized_pl_percent = if total_realized_cost_basis > Decimal::ZERO {
            (total_realized_pl / total_realized_cost_basis) * ONE_HUNDRED
        } else {
            Decimal::ZERO
        };
        let current_status = if running_shares > EPSILON {
            "OPEN".to_string()
        } else {
            "CLOSED".to_string()
        };

        transaction_summaries.push(SymbolTransactionSummary {
            symbol,
            currency,
            asset_type,
            total_transactions: processed_tx_list.len(),
            buy_count,
            sell_count,
            exchange_count,
            net_shares: running_shares,
            realized_pl: total_realized_pl,
            realized_pl_percent: overall_realized_pl_percent,
            average_buy_price,
            average_sell_price,
            current_status,
            transactions: processed_tx_list,
        });
    }

    FifoResult {
        open_summaries,
        closed_summaries,
        transaction_summaries,
    }
}
