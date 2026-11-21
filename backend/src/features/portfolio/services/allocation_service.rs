use std::collections::HashMap;

use crate::features::portfolio::models::allocation::{
    CurrencyExposure, HoldingConcentration, PortfolioAllocationResponse, RebalanceRecommendation,
};
use crate::features::portfolio::models::portfolio::PortfolioHoldingsResponse;
use crate::features::portfolio::services::valuation_service::ValuationService;
use crate::utils::format_utils::get_asset_type_label;

pub const DEFAULT_TARGET_ENTRIES: &[(&str, f64)] = &[
    ("us-stock", 40.0),
    ("thai-stock", 30.0),
    ("crypto", 15.0),
    ("mutual-fund", 15.0),
    ("bond", 0.0),
    ("provident-fund", 0.0),
];

pub fn default_targets_map() -> HashMap<String, f64> {
    DEFAULT_TARGET_ENTRIES
        .iter()
        .map(|(k, v)| ((*k).to_string(), *v))
        .collect()
}

#[derive(Clone)]
pub struct AllocationService {
    valuation_service: ValuationService,
}

impl AllocationService {
    pub fn new(valuation_service: ValuationService) -> Self {
        Self { valuation_service }
    }

    pub async fn calculate_allocation(
        &self,
        targets: Option<&HashMap<String, f64>>,
        currency: &str,
    ) -> PortfolioAllocationResponse {
        let target_currency = currency.to_uppercase();
        let default_map = default_targets_map();
        let target_allocation = targets.unwrap_or(&default_map);

        let holdings_res = self
            .valuation_service
            .get_portfolio_holdings("all", &target_currency)
            .await;

        if let Some(err) = holdings_res.error {
            return PortfolioAllocationResponse {
                currency: target_currency,
                exchange_rate: holdings_res.exchange_rate,
                total_portfolio_value: 0.0,
                recommendations: Vec::new(),
                currency_exposure: CurrencyExposure {
                    usd: 0.0,
                    thb: 0.0,
                    usd_percent: 0.0,
                    thb_percent: 0.0,
                },
                holdings_concentration: Vec::new(),
                error: Some(err),
            };
        }

        self.process_allocation(&holdings_res, target_allocation)
    }

    pub fn process_allocation(
        &self,
        holdings_res: &PortfolioHoldingsResponse,
        targets: &HashMap<String, f64>,
    ) -> PortfolioAllocationResponse {
        let mut current_values: HashMap<String, f64> = default_targets_map()
            .into_keys()
            .map(|k| (k, 0.0))
            .collect();

        let mut usd_val = 0.0;
        let mut thb_val = 0.0;

        for pos in &holdings_res.open_positions {
            let val = pos.holding_value;
            *current_values.entry(pos.asset_type.clone()).or_insert(0.0) += val;

            let orig = pos.original_currency.to_uppercase();
            if orig == "USD" || orig == "USDT" {
                usd_val += val;
            } else if orig == "THB" {
                thb_val += val;
            }
        }

        let total_value: f64 = current_values.values().sum();

        let mut all_keys: Vec<String> = DEFAULT_TARGET_ENTRIES
            .iter()
            .map(|(k, _)| (*k).to_string())
            .collect();

        for pos in &holdings_res.open_positions {
            if !all_keys.contains(&pos.asset_type) {
                all_keys.push(pos.asset_type.clone());
            }
        }
        for k in targets.keys() {
            if !all_keys.contains(k) {
                all_keys.push(k.clone());
            }
        }

        let mut recommendations = Vec::with_capacity(all_keys.len());
        for k in &all_keys {
            let val = current_values.get(k).copied().unwrap_or(0.0);
            let actual_pct = if total_value > 0.0 {
                (val / total_value) * 100.0
            } else {
                0.0
            };
            let target_pct = targets.get(k).copied().unwrap_or(0.0);
            let target_val = (target_pct / 100.0) * total_value;
            let rebalance_amount = target_val - val;
            let deviation_pct = actual_pct - target_pct;

            let action = if rebalance_amount.abs() < 0.01 {
                "BALANCED"
            } else if rebalance_amount > 0.0 {
                "BUY"
            } else {
                "SELL"
            };

            recommendations.push(RebalanceRecommendation {
                asset_type: k.clone(),
                label: get_asset_type_label(Some(k), None),
                current_value: val,
                actual_percent: actual_pct,
                target_percent: target_pct,
                rebalance_amount,
                deviation_percent: deviation_pct,
                action: action.to_string(),
            });
        }

        let tot_curr = usd_val + thb_val;
        let currency_exposure = CurrencyExposure {
            usd: usd_val,
            thb: thb_val,
            usd_percent: if tot_curr > 0.0 {
                (usd_val / tot_curr) * 100.0
            } else {
                0.0
            },
            thb_percent: if tot_curr > 0.0 {
                (thb_val / tot_curr) * 100.0
            } else {
                0.0
            },
        };

        let mut holdings_concentration = Vec::new();
        for pos in &holdings_res.open_positions {
            if pos.holding_value > 0.0 || pos.total_shares > 0.0 {
                let class_tot = current_values.get(&pos.asset_type).copied().unwrap_or(0.0);
                let port_pct = if total_value > 0.0 {
                    (pos.holding_value / total_value) * 100.0
                } else {
                    0.0
                };
                let class_pct = if class_tot > 0.0 {
                    (pos.holding_value / class_tot) * 100.0
                } else {
                    0.0
                };
                holdings_concentration.push(HoldingConcentration {
                    symbol: pos.symbol.clone(),
                    display_symbol: pos.display_symbol.clone(),
                    name: pos.name.clone(),
                    name_th: pos.name_th.clone(),
                    asset_type: pos.asset_type.clone(),
                    value: pos.holding_value,
                    portfolio_percent: port_pct,
                    class_percent: class_pct,
                });
            }
        }
        holdings_concentration.sort_by(|a, b| b.value.total_cmp(&a.value));

        PortfolioAllocationResponse {
            currency: holdings_res.currency.clone(),
            exchange_rate: holdings_res.exchange_rate,
            total_portfolio_value: total_value,
            recommendations,
            currency_exposure,
            holdings_concentration,
            error: None,
        }
    }
}
