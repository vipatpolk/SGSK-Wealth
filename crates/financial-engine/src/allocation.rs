use std::collections::HashMap;

use rust_decimal::Decimal;
use sgsk_domain::allocation::{
    CurrencyExposure, HoldingConcentration, PortfolioAllocation, PositionValueInput,
    RebalanceAction, RebalanceRecommendation,
};

const ONE_HUNDRED: Decimal = Decimal::from_parts(100, 0, 0, false, 0);
const BALANCED_THRESHOLD: Decimal = Decimal::from_parts(1, 0, 0, false, 2); // 0.01

pub const DEFAULT_TARGET_ENTRIES: &[(&str, u32)] = &[
    ("us-stock", 40),
    ("thai-stock", 30),
    ("crypto", 15),
    ("mutual-fund", 15),
    ("bond", 0),
    ("provident-fund", 0),
];

pub fn default_targets_map() -> HashMap<String, Decimal> {
    DEFAULT_TARGET_ENTRIES
        .iter()
        .map(|(k, v)| ((*k).to_string(), Decimal::from(*v)))
        .collect()
}

/// Computes asset class allocation, rebalance recommendations, currency exposure, and holding concentration.
pub fn calculate_allocation(
    positions: &[PositionValueInput],
    targets: Option<&HashMap<String, Decimal>>,
    currency: &str,
    exchange_rate: Decimal,
) -> PortfolioAllocation {
    let default_map = default_targets_map();
    let target_map = targets.unwrap_or(&default_map);

    let mut current_values: HashMap<String, Decimal> = default_targets_map()
        .into_keys()
        .map(|k| (k, Decimal::ZERO))
        .collect();

    let mut usd_val = Decimal::ZERO;
    let mut thb_val = Decimal::ZERO;

    for pos in positions {
        *current_values
            .entry(pos.asset_type.clone())
            .or_insert(Decimal::ZERO) += pos.holding_value;

        let orig = pos.original_currency.trim().to_uppercase();
        if orig == "USD" || orig == "USDT" {
            usd_val += pos.holding_value;
        } else if orig == "THB" {
            thb_val += pos.holding_value;
        }
    }

    let total_value: Decimal = current_values.values().copied().sum();

    let mut all_keys: Vec<String> = DEFAULT_TARGET_ENTRIES
        .iter()
        .map(|(k, _)| (*k).to_string())
        .collect();
    for pos in positions {
        if !all_keys.contains(&pos.asset_type) {
            all_keys.push(pos.asset_type.clone());
        }
    }
    for k in target_map.keys() {
        if !all_keys.contains(k) {
            all_keys.push(k.clone());
        }
    }

    let recommendations = all_keys
        .into_iter()
        .map(|k| {
            let val = current_values.get(&k).copied().unwrap_or(Decimal::ZERO);
            let actual_percent = if total_value > Decimal::ZERO {
                (val / total_value) * ONE_HUNDRED
            } else {
                Decimal::ZERO
            };
            let target_percent = target_map.get(&k).copied().unwrap_or(Decimal::ZERO);
            let target_val = (target_percent / ONE_HUNDRED) * total_value;
            let rebalance_amount = target_val - val;
            let deviation_percent = actual_percent - target_percent;

            let action = if rebalance_amount.abs() < BALANCED_THRESHOLD {
                RebalanceAction::Balanced
            } else if rebalance_amount > Decimal::ZERO {
                RebalanceAction::Buy
            } else {
                RebalanceAction::Sell
            };

            RebalanceRecommendation {
                asset_type: k,
                current_value: val,
                actual_percent,
                target_percent,
                rebalance_amount,
                deviation_percent,
                action,
            }
        })
        .collect();

    let total_curr = usd_val + thb_val;
    let currency_exposure = CurrencyExposure {
        usd: usd_val,
        thb: thb_val,
        usd_percent: if total_curr > Decimal::ZERO {
            (usd_val / total_curr) * ONE_HUNDRED
        } else {
            Decimal::ZERO
        },
        thb_percent: if total_curr > Decimal::ZERO {
            (thb_val / total_curr) * ONE_HUNDRED
        } else {
            Decimal::ZERO
        },
    };

    let mut holdings_concentration: Vec<HoldingConcentration> = positions
        .iter()
        .filter(|pos| pos.holding_value > Decimal::ZERO || pos.total_shares > Decimal::ZERO)
        .map(|pos| {
            let class_tot = current_values
                .get(&pos.asset_type)
                .copied()
                .unwrap_or(Decimal::ZERO);
            let portfolio_percent = if total_value > Decimal::ZERO {
                (pos.holding_value / total_value) * ONE_HUNDRED
            } else {
                Decimal::ZERO
            };
            let class_percent = if class_tot > Decimal::ZERO {
                (pos.holding_value / class_tot) * ONE_HUNDRED
            } else {
                Decimal::ZERO
            };
            HoldingConcentration {
                symbol: pos.symbol.clone(),
                display_symbol: pos.display_symbol.clone(),
                name: pos.name.clone(),
                name_th: pos.name_th.clone(),
                asset_type: pos.asset_type.clone(),
                value: pos.holding_value,
                portfolio_percent,
                class_percent,
            }
        })
        .collect();
    holdings_concentration.sort_by_key(|a| std::cmp::Reverse(a.value));

    PortfolioAllocation {
        currency: currency.to_uppercase(),
        exchange_rate,
        total_portfolio_value: total_value,
        recommendations,
        currency_exposure,
        holdings_concentration,
    }
}
