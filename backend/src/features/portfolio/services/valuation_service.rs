use std::collections::{HashMap, HashSet};
use std::sync::Arc;

use serde_json::{Map, Value};

use crate::features::market_data::services::nav_service::{clean_str, NavService};
use crate::features::market_data::services::price_service::PriceService;
use crate::features::portfolio::models::portfolio::{
    ClosedPortfolioPosition, PortfolioHoldingLot, PortfolioHoldingsResponse, PortfolioPosition,
    PortfolioSummary,
};
use crate::features::portfolio::models::transaction::{ClosedShareLot, PriceData, SheetResult};
use crate::features::portfolio::services::share_lot_service::ShareLotService;
use crate::utils::cache::{AsyncSingleflight, TTLCache};
use crate::utils::format_utils::{
    convert_currency, display_symbol, get_asset_type, get_asset_type_label,
};
use crate::utils::pvd_constants::{default_pvd_metadata, default_pvd_name};

#[derive(Clone)]
struct ValuationBaseData {
    sheet_result: SheetResult,
    price_data_map: HashMap<String, PriceData>,
    exchange_rate: f64,
    pvd_policy_map: HashMap<String, Map<String, Value>>,
}

#[derive(Clone)]
pub struct ValuationService {
    pub share_lot_service: ShareLotService,
    pub price_service: PriceService,
    pub nav_service: NavService,
    cache: Arc<TTLCache>,
    singleflight: Arc<AsyncSingleflight>,
}

impl ValuationService {
    pub fn new(
        share_lot_service: ShareLotService,
        price_service: PriceService,
        nav_service: NavService,
        cache: Arc<TTLCache>,
        singleflight: Arc<AsyncSingleflight>,
    ) -> Self {
        Self {
            share_lot_service,
            price_service,
            nav_service,
            cache,
            singleflight,
        }
    }

    pub async fn get_portfolio_holdings(
        &self,
        tab_id: &str,
        currency: &str,
    ) -> PortfolioHoldingsResponse {
        let target_currency = currency.to_uppercase();
        let cache_key = format!("valuation_{tab_id}_{target_currency}");
        if let Some(cached) = self.cache.get::<PortfolioHoldingsResponse>(&cache_key) {
            return cached;
        }

        let base_cache_key = format!("valuation_base_{tab_id}");
        let base_data = if let Some(base_cached) =
            self.cache.get::<ValuationBaseData>(&base_cache_key)
        {
            base_cached
        } else {
            let this = self.clone();
            let tab_owned = tab_id.to_string();
            let base_key_owned = base_cache_key.clone();
            let sf_key = format!("resolve_base_{tab_id}");

            let res: Result<ValuationBaseData, String> = self
                .singleflight
                .execute(&sf_key, move || async move {
                    if let Some(c) = this.cache.get::<ValuationBaseData>(&base_key_owned) {
                        return Ok(c);
                    }

                    let s_res = if tab_owned == "all" {
                        this.share_lot_service.fetch_all_sheets().await
                    } else {
                        this.share_lot_service.fetch_sheet(&tab_owned).await
                    };

                    if s_res.error.is_some() {
                        return Ok(ValuationBaseData {
                            sheet_result: s_res,
                            price_data_map: HashMap::new(),
                            exchange_rate: 1.0,
                            pvd_policy_map: HashMap::new(),
                        });
                    }

                    let mut candidates: Vec<HashMap<String, String>> = Vec::new();
                    let mut seen = HashSet::new();

                    for o_item in &s_res.summaries {
                        if !o_item.symbol.is_empty() && seen.insert(o_item.symbol.clone()) {
                            candidates.push(HashMap::from([
                                ("symbol".to_string(), o_item.symbol.clone()),
                                ("assetType".to_string(), o_item.asset_type.clone()),
                            ]));
                        }
                    }
                    for c_item in &s_res.closed_summaries {
                        if !c_item.symbol.is_empty() && seen.insert(c_item.symbol.clone()) {
                            candidates.push(HashMap::from([
                                ("symbol".to_string(), c_item.symbol.clone()),
                                ("assetType".to_string(), c_item.asset_type.clone()),
                            ]));
                        }
                    }
                    if let Some(tx_sums) = &s_res.transaction_summaries {
                        for t_item in tx_sums {
                            if !t_item.symbol.is_empty() && seen.insert(t_item.symbol.clone()) {
                                candidates.push(HashMap::from([
                                    ("symbol".to_string(), t_item.symbol.clone()),
                                    ("assetType".to_string(), t_item.asset_type.clone()),
                                ]));
                            }
                        }
                    }

                    let (mut p_map, ex_rate) = if !candidates.is_empty() {
                        let market_res =
                            this.price_service.fetch_prices_and_rate(&candidates).await;
                        let rate = if market_res.rate > 0.0 {
                            market_res.rate
                        } else {
                            1.0
                        };
                        (market_res.prices, rate)
                    } else {
                        let rate = this.price_service.fetch_exchange_rate("USD", "THB").await;
                        (HashMap::new(), if rate > 0.0 { rate } else { 1.0 })
                    };

                    let has_pvd = candidates.iter().any(|c| {
                        c.get("assetType").map(String::as_str) == Some("provident-fund")
                            || c.get("symbol")
                                .map(|s| s.to_uppercase().starts_with("PVD"))
                                .unwrap_or(false)
                    });

                    let mut pvd_policies: HashMap<String, Map<String, Value>> = HashMap::new();
                    if has_pvd {
                        let mut pvd_fund_names = Vec::new();
                        let mut seen_funds = HashSet::new();
                        for o_item in &s_res.summaries {
                            if let Some(fn_raw) = o_item.pvd_fund_name.as_deref() {
                                let fn_clean = fn_raw.trim();
                                if !fn_clean.is_empty() && seen_funds.insert(fn_clean.to_string()) {
                                    pvd_fund_names.push(fn_clean.to_string());
                                }
                            }
                        }
                        if pvd_fund_names.is_empty() {
                            if let Some(raw_txs) = &s_res.raw_transactions {
                                for raw_tx in raw_txs {
                                    if let Some(fn_raw) = raw_tx.pvd_fund_name.as_deref() {
                                        let fn_clean = fn_raw.trim();
                                        if !fn_clean.is_empty()
                                            && seen_funds.insert(fn_clean.to_string())
                                        {
                                            pvd_fund_names.push(fn_clean.to_string());
                                        }
                                    }
                                }
                            }
                        }

                        for fn_name in &pvd_fund_names {
                            let pol = this
                                .nav_service
                                .fetch_pvd_policies(None, Some(fn_name))
                                .await;
                            pvd_policies.extend(pol);
                        }

                        for (sym_key, policy_info) in &pvd_policies {
                            let sec_name = clean_str(policy_info.get("name"))
                                .or_else(|| default_pvd_name(sym_key).map(str::to_string))
                                .unwrap_or_default();
                            match p_map.get_mut(sym_key) {
                                None => {
                                    p_map.insert(
                                        sym_key.clone(),
                                        PriceData {
                                            symbol: sym_key.clone(),
                                            name: Some(sec_name),
                                            name_th: Some(String::new()),
                                            price: 0.0,
                                            currency: "THB".to_string(),
                                        },
                                    );
                                }
                                Some(existing) => {
                                    if existing.name.as_deref().unwrap_or("").is_empty() {
                                        existing.name = Some(sec_name);
                                    }
                                }
                            }
                        }
                    }

                    let val = ValuationBaseData {
                        sheet_result: s_res,
                        price_data_map: p_map,
                        exchange_rate: ex_rate,
                        pvd_policy_map: pvd_policies,
                    };
                    this.cache.set(base_key_owned, val.clone(), Some(60.0));
                    Ok(val)
                })
                .await;

            match res {
                Ok(b) => b,
                Err(e) => return self.create_empty_response(tab_id, &target_currency, &e),
            }
        };

        if let Some(err) = &base_data.sheet_result.error {
            return self.create_empty_response(tab_id, &target_currency, err);
        }

        let res = self.value_sheet_result(
            &base_data.sheet_result,
            &base_data.price_data_map,
            base_data.exchange_rate,
            &target_currency,
            tab_id,
            Some(&base_data.pvd_policy_map),
        );
        if res.error.is_none() {
            self.cache.set(cache_key, res.clone(), Some(60.0));
        }
        res
    }

    pub fn value_sheet_result(
        &self,
        sheet_result: &SheetResult,
        price_data_map: &HashMap<String, PriceData>,
        exchange_rate: f64,
        target_currency: &str,
        tab_id: &str,
        pvd_policy_map: Option<&HashMap<String, Map<String, Value>>>,
    ) -> PortfolioHoldingsResponse {
        let mut open_positions = Vec::new();
        let mut closed_positions = Vec::new();

        let mut open_invested_total = 0.0;
        let mut open_value_total = 0.0;
        let mut closed_invested_total = 0.0;
        let mut closed_realized_total = 0.0;

        // 1. Open Positions
        for open_summary in &sheet_result.summaries {
            let sym = &open_summary.symbol;
            let orig_curr = &open_summary.currency;
            let pd = price_data_map.get(sym);
            let is_pvd = open_summary.asset_type == "provident-fund"
                || sym.to_uppercase().starts_with("PVD");

            let mut has_price = pd.is_some_and(|p| p.price > 0.0);
            let mut pvd_total_val = 0.0;
            let (raw_price, price_curr) = if is_pvd {
                has_price = true;
                let emp_val = open_summary.employee_contribution.unwrap_or(0.0)
                    + open_summary.employee_earnings.unwrap_or(0.0);
                let empr_val = open_summary.employer_matching.unwrap_or(0.0)
                    + open_summary.employer_earnings.unwrap_or(0.0);
                pvd_total_val = emp_val + empr_val;
                if pvd_total_val <= 0.0 {
                    pvd_total_val = open_summary.total_cost;
                }
                let price = if open_summary.total_shares > 0.0 {
                    pvd_total_val / open_summary.total_shares
                } else {
                    open_summary.average_cost
                };
                (price, orig_curr.clone())
            } else if let Some(price_data) = pd.filter(|p| p.price > 0.0) {
                let p_curr = if !price_data.currency.is_empty() {
                    price_data.currency.clone()
                } else {
                    orig_curr.clone()
                };
                (price_data.price, p_curr)
            } else {
                (open_summary.average_cost, orig_curr.clone())
            };

            let current_price_converted =
                convert_currency(raw_price, &price_curr, target_currency, exchange_rate);
            let total_cost_converted = convert_currency(
                open_summary.total_cost,
                orig_curr,
                target_currency,
                exchange_rate,
            );
            let average_cost_converted = if open_summary.total_shares > 0.0 {
                total_cost_converted / open_summary.total_shares
            } else {
                0.0
            };

            let holding_value_converted = if is_pvd {
                convert_currency(pvd_total_val, orig_curr, target_currency, exchange_rate)
            } else {
                open_summary.total_shares * current_price_converted
            };
            let unrealized_pl = holding_value_converted - total_cost_converted;
            let unrealized_pl_pct = if total_cost_converted > 0.0 {
                (unrealized_pl / total_cost_converted) * 100.0
            } else {
                0.0
            };

            open_invested_total += total_cost_converted;
            open_value_total += holding_value_converted;

            let mut valued_lots = Vec::with_capacity(open_summary.lots.len());
            for lot in &open_summary.lots {
                let lot_cost_converted =
                    convert_currency(lot.total_cost, orig_curr, target_currency, exchange_rate);
                let lot_cost_basis_converted = if lot.quantity > 0.0 {
                    lot_cost_converted / lot.quantity
                } else {
                    0.0
                };
                let lot_holding_value = lot.quantity * current_price_converted;
                let lot_unrealized_pl = lot_holding_value - lot_cost_converted;
                let lot_unrealized_pl_pct = if lot_cost_converted > 0.0 {
                    (lot_unrealized_pl / lot_cost_converted) * 100.0
                } else {
                    0.0
                };

                valued_lots.push(PortfolioHoldingLot {
                    purchase_date: lot.purchase_date.clone(),
                    quantity: lot.quantity,
                    cost_basis: lot_cost_basis_converted,
                    total_cost: lot_cost_converted,
                    current_price: current_price_converted,
                    holding_value: lot_holding_value,
                    unrealized_pl: lot_unrealized_pl,
                    unrealized_pl_percent: lot_unrealized_pl_pct,
                    asset_type: lot.asset_type.clone(),
                    currency: target_currency.to_string(),
                    original_cost_basis: lot.cost_basis,
                    original_currency: orig_curr.clone(),
                    note: lot.note.clone(),
                });
            }

            let sym_upper = sym.to_uppercase();
            let mut name = pd.and_then(|p| p.name.as_deref()).unwrap_or("").to_string();
            let name_th = pd
                .and_then(|p| p.name_th.as_deref())
                .unwrap_or("")
                .to_string();

            if name.is_empty() && is_pvd {
                name = pvd_policy_map
                    .and_then(|m| m.get(&sym_upper))
                    .and_then(|entry| clean_str(entry.get("name")))
                    .or_else(|| default_pvd_name(&sym_upper).map(str::to_string))
                    .unwrap_or_default();
            }

            let (pvd_fund_name, policy_name, aimc_type, aimc_desc, risk_level, objective) =
                if is_pvd {
                    let policy_info = pvd_policy_map.and_then(|m| m.get(&sym_upper));
                    let default_meta = default_pvd_metadata(&sym_upper);

                    let fn_res = open_summary
                        .pvd_fund_name
                        .as_deref()
                        .map(str::trim)
                        .filter(|s| !s.is_empty())
                        .map(str::to_string)
                        .or_else(|| policy_info.and_then(|p| clean_str(p.get("fundName"))));

                    let pol_name = policy_info
                        .and_then(|p| clean_str(p.get("policyName")))
                        .or_else(|| default_meta.map(|m| m.policy_name.to_string()));
                    let a_type = policy_info
                        .and_then(|p| clean_str(p.get("aimcType")))
                        .or_else(|| default_meta.map(|m| m.aimc_type.to_string()));
                    let a_desc = policy_info
                        .and_then(|p| clean_str(p.get("aimcDescription")))
                        .or_else(|| default_meta.map(|m| m.aimc_description.to_string()));
                    let r_level = policy_info
                        .and_then(|p| clean_str(p.get("riskLevel")))
                        .or_else(|| default_meta.map(|m| m.risk_level.to_string()));
                    let obj = policy_info
                        .and_then(|p| clean_str(p.get("objective")))
                        .or_else(|| default_meta.map(|m| m.objective.to_string()));

                    (fn_res, pol_name, a_type, a_desc, r_level, obj)
                } else {
                    (None, None, None, None, None, None)
                };

            let emp_contrib_c = open_summary
                .employee_contribution
                .map(|v| convert_currency(v, orig_curr, target_currency, exchange_rate));
            let emp_earnings_c = open_summary
                .employee_earnings
                .map(|v| convert_currency(v, orig_curr, target_currency, exchange_rate));
            let empr_matching_c = open_summary
                .employer_matching
                .map(|v| convert_currency(v, orig_curr, target_currency, exchange_rate));
            let empr_earnings_c = open_summary
                .employer_earnings
                .map(|v| convert_currency(v, orig_curr, target_currency, exchange_rate));

            open_positions.push(PortfolioPosition {
                symbol: sym.clone(),
                display_symbol: display_symbol(sym),
                name,
                name_th,
                asset_type: get_asset_type(Some(&open_summary.asset_type), Some(sym)),
                asset_type_label: get_asset_type_label(Some(&open_summary.asset_type), Some(sym)),
                total_shares: open_summary.total_shares,
                total_cost: total_cost_converted,
                average_cost: average_cost_converted,
                current_price: current_price_converted,
                holding_value: holding_value_converted,
                unrealized_pl,
                unrealized_pl_percent: unrealized_pl_pct,
                currency: target_currency.to_string(),
                original_currency: orig_curr.clone(),
                has_price,
                lots: valued_lots,
                employee_shares: open_summary.employee_shares,
                employer_shares: open_summary.employer_shares,
                employee_contribution: emp_contrib_c,
                employee_earnings: emp_earnings_c,
                employer_matching: empr_matching_c,
                employer_earnings: empr_earnings_c,
                pvd_fund_name,
                policy_name,
                aimc_type,
                aimc_description: aimc_desc,
                risk_level,
                objective,
            });
        }

        // 2. Closed Positions
        for closed_summary in &sheet_result.closed_summaries {
            let sym = &closed_summary.symbol;
            let orig_curr = &closed_summary.currency;
            let pd = price_data_map.get(sym);

            let cost_converted = convert_currency(
                closed_summary.total_cost,
                orig_curr,
                target_currency,
                exchange_rate,
            );
            let proceeds_converted = convert_currency(
                closed_summary.total_proceeds,
                orig_curr,
                target_currency,
                exchange_rate,
            );
            let realized_pl_converted = convert_currency(
                closed_summary.realized_pl,
                orig_curr,
                target_currency,
                exchange_rate,
            );
            let realized_pl_pct = if cost_converted > 0.0 {
                (realized_pl_converted / cost_converted) * 100.0
            } else {
                0.0
            };

            let avg_buy_converted = if closed_summary.closed_shares > 0.0 {
                cost_converted / closed_summary.closed_shares
            } else {
                0.0
            };
            let avg_sell_converted = if closed_summary.closed_shares > 0.0 {
                proceeds_converted / closed_summary.closed_shares
            } else {
                0.0
            };

            closed_invested_total += cost_converted;
            closed_realized_total += realized_pl_converted;

            let mut valued_closed_lots = Vec::with_capacity(closed_summary.lots.len());
            for c_lot in &closed_summary.lots {
                let lot_curr = if !c_lot.currency.is_empty() {
                    &c_lot.currency
                } else {
                    orig_curr
                };
                let lot_cost =
                    convert_currency(c_lot.total_cost, lot_curr, target_currency, exchange_rate);
                let lot_proceeds = convert_currency(
                    c_lot.total_proceeds,
                    lot_curr,
                    target_currency,
                    exchange_rate,
                );
                let lot_pl =
                    convert_currency(c_lot.realized_pl, lot_curr, target_currency, exchange_rate);
                let lot_pl_pct = if lot_cost > 0.0 {
                    (lot_pl / lot_cost) * 100.0
                } else {
                    0.0
                };
                let lot_basis = if c_lot.quantity > 0.0 {
                    lot_cost / c_lot.quantity
                } else {
                    0.0
                };
                let lot_sell = if c_lot.quantity > 0.0 {
                    lot_proceeds / c_lot.quantity
                } else {
                    0.0
                };

                valued_closed_lots.push(ClosedShareLot {
                    symbol: c_lot.symbol.clone(),
                    purchase_date: c_lot.purchase_date.clone(),
                    close_date: c_lot.close_date.clone(),
                    quantity: c_lot.quantity,
                    cost_basis: lot_basis,
                    sell_price: lot_sell,
                    total_cost: lot_cost,
                    total_proceeds: lot_proceeds,
                    realized_pl: lot_pl,
                    realized_pl_percent: lot_pl_pct,
                    currency: target_currency.to_string(),
                    asset_type: c_lot.asset_type.clone(),
                });
            }

            let name = pd.and_then(|p| p.name.as_deref()).unwrap_or("").to_string();
            let name_th = pd
                .and_then(|p| p.name_th.as_deref())
                .unwrap_or("")
                .to_string();

            closed_positions.push(ClosedPortfolioPosition {
                symbol: sym.clone(),
                display_symbol: display_symbol(sym),
                name,
                name_th,
                asset_type: get_asset_type(Some(&closed_summary.asset_type), Some(sym)),
                asset_type_label: get_asset_type_label(Some(&closed_summary.asset_type), Some(sym)),
                total_shares: 0.0,
                closed_shares: closed_summary.closed_shares,
                total_cost: cost_converted,
                total_proceeds: proceeds_converted,
                realized_pl: realized_pl_converted,
                realized_pl_percent: realized_pl_pct,
                average_buy_price: avg_buy_converted,
                average_sell_price: avg_sell_converted,
                currency: target_currency.to_string(),
                original_currency: orig_curr.clone(),
                lots: valued_closed_lots,
            });
        }

        // 3. Summary KPIs
        let total_unrealized_pl = open_value_total - open_invested_total;
        let total_unrealized_pl_pct = if open_invested_total > 0.0 {
            (total_unrealized_pl / open_invested_total) * 100.0
        } else {
            0.0
        };
        let total_realized_pl_pct = if closed_invested_total > 0.0 {
            (closed_realized_total / closed_invested_total) * 100.0
        } else {
            0.0
        };
        let total_invested = open_invested_total + closed_invested_total;
        let total_return = closed_realized_total + total_unrealized_pl;
        let total_return_pct = if total_invested > 0.0 {
            (total_return / total_invested) * 100.0
        } else {
            0.0
        };

        PortfolioHoldingsResponse {
            currency: target_currency.to_string(),
            exchange_rate,
            tab_id: tab_id.to_string(),
            summary: PortfolioSummary {
                total_invested,
                total_value: open_value_total,
                open_invested: open_invested_total,
                closed_invested: closed_invested_total,
                total_unrealized_pl,
                total_unrealized_pl_percent: total_unrealized_pl_pct,
                total_realized_pl: closed_realized_total,
                total_realized_pl_percent: total_realized_pl_pct,
                total_return,
                total_return_percent: total_return_pct,
            },
            open_positions,
            closed_positions,
            transaction_summaries: sheet_result.transaction_summaries.clone(),
            raw_transactions: sheet_result.raw_transactions.clone(),
            error: None,
        }
    }

    pub fn create_empty_response(
        &self,
        tab_id: &str,
        currency: &str,
        error: &str,
    ) -> PortfolioHoldingsResponse {
        PortfolioHoldingsResponse {
            currency: currency.to_string(),
            exchange_rate: 1.0,
            tab_id: tab_id.to_string(),
            summary: PortfolioSummary::default(),
            open_positions: Vec::new(),
            closed_positions: Vec::new(),
            transaction_summaries: Some(Vec::new()),
            raw_transactions: Some(Vec::new()),
            error: Some(error.to_string()),
        }
    }
}
