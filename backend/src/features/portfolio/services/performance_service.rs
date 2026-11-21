use std::collections::HashMap;
use std::sync::Arc;

use chrono::{Datelike, Duration, Local};

use crate::features::portfolio::models::performance::{
    AssetClassPerformance, PortfolioPerformanceResponse, SymbolPerformance,
};
use crate::features::portfolio::models::portfolio::{PortfolioHoldingsResponse, PortfolioSummary};
use crate::features::portfolio::services::valuation_service::ValuationService;
use crate::utils::cache::{AsyncSingleflight, TTLCache};
use crate::utils::format_utils::get_asset_type_label;

#[derive(Clone)]
pub struct PerformanceService {
    valuation_service: ValuationService,
    cache: Arc<TTLCache>,
    singleflight: Arc<AsyncSingleflight>,
}

struct TypePerfAcc {
    asset_type: String,
    invested_cost: f64,
    current_value: f64,
    realized_pl: f64,
    unrealized_pl: f64,
    open_symbol_count: usize,
    closed_symbol_count: usize,
}

struct SymPerfAcc {
    symbol: String,
    display_symbol: String,
    name: String,
    name_th: String,
    asset_type: String,
    asset_type_label: String,
    status: String,
    invested_cost: f64,
    current_value: f64,
    realized_pl: f64,
    unrealized_pl: f64,
    has_price: bool,
}

impl PerformanceService {
    pub fn new(
        valuation_service: ValuationService,
        cache: Arc<TTLCache>,
        singleflight: Arc<AsyncSingleflight>,
    ) -> Self {
        Self {
            valuation_service,
            cache,
            singleflight,
        }
    }

    pub fn resolve_date_range(
        &self,
        timeframe: &str,
        start_date: Option<&str>,
        end_date: Option<&str>,
    ) -> (String, String) {
        let today = Local::now().date_naive();
        let tf = if timeframe.trim().is_empty() {
            "ALL".to_string()
        } else {
            timeframe.trim().to_uppercase()
        };

        let s_clean = start_date.unwrap_or("").trim().to_string();
        let e_clean = end_date.unwrap_or("").trim().to_string();

        if tf == "CUSTOM" || (!s_clean.is_empty() && !e_clean.is_empty() && tf != "ALL") {
            return (s_clean, e_clean);
        }

        let today_iso = today.format("%Y-%m-%d").to_string();
        match tf.as_str() {
            "YTD" => (format!("{}-01-01", today.year()), today_iso),
            "1M" => (
                (today - Duration::days(30)).format("%Y-%m-%d").to_string(),
                today_iso,
            ),
            "3M" => (
                (today - Duration::days(90)).format("%Y-%m-%d").to_string(),
                today_iso,
            ),
            "6M" => (
                (today - Duration::days(180)).format("%Y-%m-%d").to_string(),
                today_iso,
            ),
            "1Y" => (
                (today - Duration::days(365)).format("%Y-%m-%d").to_string(),
                today_iso,
            ),
            _ => (s_clean, e_clean),
        }
    }

    pub async fn get_performance_analytics(
        &self,
        timeframe: &str,
        start_date: Option<&str>,
        end_date: Option<&str>,
        currency: &str,
    ) -> PortfolioPerformanceResponse {
        let (resolved_start, resolved_end) =
            self.resolve_date_range(timeframe, start_date, end_date);
        let target_currency = currency.to_uppercase();
        let cache_key =
            format!("perf_{timeframe}_{resolved_start}_{resolved_end}_{target_currency}");

        if let Some(cached) = self.cache.get::<PortfolioPerformanceResponse>(&cache_key) {
            return cached;
        }

        let this = self.clone();
        let tf_owned = timeframe.to_string();
        let start_owned = resolved_start.clone();
        let end_owned = resolved_end.clone();
        let key_clone = cache_key.clone();

        let res: Result<PortfolioPerformanceResponse, String> = self
            .singleflight
            .execute(&cache_key, move || async move {
                if let Some(c) = this.cache.get::<PortfolioPerformanceResponse>(&key_clone) {
                    return Ok(c);
                }

                let holdings_res = this
                    .valuation_service
                    .get_portfolio_holdings("all", &target_currency)
                    .await;

                if holdings_res.error.is_some() {
                    return Ok(PortfolioPerformanceResponse {
                        timeframe: tf_owned,
                        start_date: start_owned,
                        end_date: end_owned,
                        currency: target_currency,
                        exchange_rate: holdings_res.exchange_rate,
                        summary: holdings_res.summary,
                        asset_type_performance: Vec::new(),
                        top_gainers: Vec::new(),
                        top_losers: Vec::new(),
                        symbol_performance: Vec::new(),
                        error: holdings_res.error,
                    });
                }

                let perf =
                    this.calculate_performance(&holdings_res, &tf_owned, &start_owned, &end_owned);
                if perf.error.is_none() {
                    this.cache.set(key_clone, perf.clone(), Some(60.0));
                }
                Ok(perf)
            })
            .await;

        res.unwrap_or_else(|e| PortfolioPerformanceResponse {
            timeframe: timeframe.to_string(),
            start_date: resolved_start,
            end_date: resolved_end,
            currency: currency.to_uppercase(),
            exchange_rate: 1.0,
            summary: PortfolioSummary::default(),
            asset_type_performance: Vec::new(),
            top_gainers: Vec::new(),
            top_losers: Vec::new(),
            symbol_performance: Vec::new(),
            error: Some(e),
        })
    }

    pub fn calculate_performance(
        &self,
        holdings_res: &PortfolioHoldingsResponse,
        timeframe: &str,
        start_date: &str,
        end_date: &str,
    ) -> PortfolioPerformanceResponse {
        let mut type_order: Vec<String> = Vec::new();
        let mut type_map: HashMap<String, TypePerfAcc> = HashMap::new();
        let mut sym_order: Vec<String> = Vec::new();
        let mut symbol_map: HashMap<String, SymPerfAcc> = HashMap::new();

        let mut open_invested_total = 0.0;
        let mut open_value_total = 0.0;
        let mut closed_invested_total = 0.0;
        let mut closed_realized_total = 0.0;

        for pos in &holdings_res.open_positions {
            let asset_type = &pos.asset_type;
            let sym = &pos.symbol;

            open_invested_total += pos.total_cost;
            open_value_total += pos.holding_value;

            if !type_map.contains_key(asset_type) {
                type_order.push(asset_type.clone());
                type_map.insert(
                    asset_type.clone(),
                    TypePerfAcc {
                        asset_type: asset_type.clone(),
                        invested_cost: 0.0,
                        current_value: 0.0,
                        realized_pl: 0.0,
                        unrealized_pl: 0.0,
                        open_symbol_count: 0,
                        closed_symbol_count: 0,
                    },
                );
            }
            if let Some(t) = type_map.get_mut(asset_type) {
                t.invested_cost += pos.total_cost;
                t.current_value += pos.holding_value;
                t.unrealized_pl += pos.unrealized_pl;
                t.open_symbol_count += 1;
            }

            if !symbol_map.contains_key(sym) {
                sym_order.push(sym.clone());
            }
            symbol_map.insert(
                sym.clone(),
                SymPerfAcc {
                    symbol: sym.clone(),
                    display_symbol: pos.display_symbol.clone(),
                    name: pos.name.clone(),
                    name_th: pos.name_th.clone(),
                    asset_type: asset_type.clone(),
                    asset_type_label: pos.asset_type_label.clone(),
                    status: "OPEN".to_string(),
                    invested_cost: pos.total_cost,
                    current_value: pos.holding_value,
                    realized_pl: 0.0,
                    unrealized_pl: pos.unrealized_pl,
                    has_price: pos.has_price,
                },
            );
        }

        for closed in &holdings_res.closed_positions {
            let asset_type = &closed.asset_type;
            let sym = &closed.symbol;

            if !type_map.contains_key(asset_type) {
                type_order.push(asset_type.clone());
                type_map.insert(
                    asset_type.clone(),
                    TypePerfAcc {
                        asset_type: asset_type.clone(),
                        invested_cost: 0.0,
                        current_value: 0.0,
                        realized_pl: 0.0,
                        unrealized_pl: 0.0,
                        open_symbol_count: 0,
                        closed_symbol_count: 0,
                    },
                );
            }
            if let Some(t) = type_map.get_mut(asset_type) {
                t.closed_symbol_count += 1;
            }

            let mut closed_invested = 0.0;
            let mut closed_proceeds = 0.0;
            let mut realized_pl = 0.0;

            for lot in &closed.lots {
                let in_range = if !start_date.is_empty() && !end_date.is_empty() {
                    lot.close_date.as_str() >= start_date && lot.close_date.as_str() <= end_date
                } else {
                    true
                };

                if in_range {
                    closed_invested += lot.total_cost;
                    let proceeds = if lot.total_proceeds != 0.0 {
                        lot.total_proceeds
                    } else {
                        lot.total_cost + lot.realized_pl
                    };
                    closed_proceeds += proceeds;
                    realized_pl += lot.realized_pl;
                }
            }

            closed_invested_total += closed_invested;
            closed_realized_total += realized_pl;

            if let Some(t) = type_map.get_mut(asset_type) {
                t.invested_cost += closed_invested;
                t.realized_pl += realized_pl;
            }

            if let Some(existing) = symbol_map.get_mut(sym) {
                existing.status = "BOTH".to_string();
                if existing.name_th.is_empty() && !closed.name_th.is_empty() {
                    existing.name_th = closed.name_th.clone();
                }
                existing.invested_cost += closed_invested;
                existing.current_value += closed_proceeds;
                existing.realized_pl += realized_pl;
            } else {
                sym_order.push(sym.clone());
                symbol_map.insert(
                    sym.clone(),
                    SymPerfAcc {
                        symbol: sym.clone(),
                        display_symbol: closed.display_symbol.clone(),
                        name: closed.name.clone(),
                        name_th: closed.name_th.clone(),
                        asset_type: asset_type.clone(),
                        asset_type_label: closed.asset_type_label.clone(),
                        status: "CLOSED".to_string(),
                        invested_cost: closed_invested,
                        current_value: closed_proceeds,
                        realized_pl,
                        unrealized_pl: 0.0,
                        has_price: false,
                    },
                );
            }
        }

        let mut asset_type_performance: Vec<AssetClassPerformance> = type_order
            .into_iter()
            .filter_map(|k| type_map.remove(&k))
            .map(|t| {
                let tot_return = t.realized_pl + t.unrealized_pl;
                let tot_return_pct = if t.invested_cost > 0.0 {
                    (tot_return / t.invested_cost) * 100.0
                } else {
                    0.0
                };
                AssetClassPerformance {
                    label: get_asset_type_label(Some(&t.asset_type), None),
                    asset_type: t.asset_type,
                    invested_cost: t.invested_cost,
                    current_value: t.current_value,
                    unrealized_pl: t.unrealized_pl,
                    realized_pl: t.realized_pl,
                    total_return: tot_return,
                    total_return_percent: tot_return_pct,
                    open_symbol_count: t.open_symbol_count,
                    closed_symbol_count: t.closed_symbol_count,
                }
            })
            .collect();
        asset_type_performance
            .sort_by(|a, b| b.total_return_percent.total_cmp(&a.total_return_percent));

        let mut symbol_performance: Vec<SymbolPerformance> = sym_order
            .into_iter()
            .filter_map(|k| symbol_map.remove(&k))
            .map(|s| {
                let tot_return = s.realized_pl + s.unrealized_pl;
                let tot_return_pct = if s.invested_cost > 0.0 {
                    (tot_return / s.invested_cost) * 100.0
                } else {
                    0.0
                };
                SymbolPerformance {
                    symbol: s.symbol,
                    display_symbol: s.display_symbol,
                    name: s.name,
                    name_th: s.name_th,
                    asset_type: s.asset_type,
                    asset_type_label: s.asset_type_label,
                    status: s.status,
                    invested_cost: s.invested_cost,
                    current_value: s.current_value,
                    unrealized_pl: s.unrealized_pl,
                    realized_pl: s.realized_pl,
                    total_return_amount: tot_return,
                    total_return: tot_return,
                    total_return_percent: tot_return_pct,
                    has_price: s.has_price,
                }
            })
            .collect();
        symbol_performance
            .sort_by(|a, b| b.total_return_percent.total_cmp(&a.total_return_percent));

        let top_gainers: Vec<SymbolPerformance> = symbol_performance
            .iter()
            .filter(|s| s.total_return_percent > 0.0)
            .take(5)
            .cloned()
            .collect();

        let mut losers: Vec<SymbolPerformance> = symbol_performance
            .iter()
            .filter(|s| s.total_return_percent < 0.0)
            .cloned()
            .collect();
        losers.sort_by(|a, b| a.total_return_percent.total_cmp(&b.total_return_percent));
        losers.truncate(5);

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
        let total_return = total_unrealized_pl + closed_realized_total;
        let total_return_pct = if total_invested > 0.0 {
            (total_return / total_invested) * 100.0
        } else {
            0.0
        };

        PortfolioPerformanceResponse {
            timeframe: timeframe.to_string(),
            start_date: start_date.to_string(),
            end_date: end_date.to_string(),
            currency: holdings_res.currency.clone(),
            exchange_rate: holdings_res.exchange_rate,
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
            asset_type_performance,
            top_gainers,
            top_losers: losers,
            symbol_performance,
            error: None,
        }
    }
}
