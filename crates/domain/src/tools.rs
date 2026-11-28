use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "UPPERCASE")]
pub enum OrderAction {
    Buy,
    Sell,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OrderStep {
    pub action: OrderAction,
    #[serde(with = "rust_decimal::serde::str")]
    pub shares: Decimal,
    #[serde(with = "rust_decimal::serde::str")]
    pub price: Decimal,
    #[serde(default, with = "rust_decimal::serde::str")]
    pub fee_percent: Decimal,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PositionSnapshot {
    #[serde(with = "rust_decimal::serde::str")]
    pub shares: Decimal,
    #[serde(with = "rust_decimal::serde::str")]
    pub avg_cost: Decimal,
    #[serde(default, with = "rust_decimal::serde::str_option")]
    pub total_cost: Option<Decimal>,
    #[serde(with = "rust_decimal::serde::str")]
    pub market_price: Decimal,
    pub currency: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SimulationStateMetrics {
    #[serde(with = "rust_decimal::serde::str")]
    pub total_shares: Decimal,
    #[serde(with = "rust_decimal::serde::str")]
    pub average_cost: Decimal,
    #[serde(with = "rust_decimal::serde::str")]
    pub total_cost: Decimal,
    #[serde(with = "rust_decimal::serde::str")]
    pub market_price: Decimal,
    #[serde(with = "rust_decimal::serde::str")]
    pub holding_value: Decimal,
    #[serde(rename = "unrealizedPL", with = "rust_decimal::serde::str")]
    pub unrealized_pl: Decimal,
    #[serde(rename = "unrealizedPLPercent", with = "rust_decimal::serde::str")]
    pub unrealized_pl_percent: Decimal,
    #[serde(rename = "realizedPL", with = "rust_decimal::serde::str")]
    pub realized_pl: Decimal,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SimulationDeltaMetrics {
    #[serde(with = "rust_decimal::serde::str")]
    pub shares: Decimal,
    #[serde(with = "rust_decimal::serde::str")]
    pub shares_percent: Decimal,
    #[serde(with = "rust_decimal::serde::str")]
    pub average_cost: Decimal,
    #[serde(with = "rust_decimal::serde::str")]
    pub average_cost_percent: Decimal,
    #[serde(with = "rust_decimal::serde::str")]
    pub total_cost: Decimal,
    #[serde(with = "rust_decimal::serde::str")]
    pub total_cost_percent: Decimal,
    #[serde(with = "rust_decimal::serde::str")]
    pub holding_value: Decimal,
    #[serde(with = "rust_decimal::serde::str")]
    pub holding_value_percent: Decimal,
    #[serde(rename = "unrealizedPL", with = "rust_decimal::serde::str")]
    pub unrealized_pl: Decimal,
    #[serde(rename = "unrealizedPLPercent", with = "rust_decimal::serde::str")]
    pub unrealized_pl_percent: Decimal,
    #[serde(with = "rust_decimal::serde::str")]
    pub breakeven_distance_initial: Decimal,
    #[serde(with = "rust_decimal::serde::str")]
    pub breakeven_distance_simulated: Decimal,
    #[serde(rename = "realizedPL", with = "rust_decimal::serde::str")]
    pub realized_pl: Decimal,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OrderSimulationResult {
    pub initial: SimulationStateMetrics,
    pub simulated: SimulationStateMetrics,
    pub delta: SimulationDeltaMetrics,
    #[serde(with = "rust_decimal::serde::str")]
    pub total_capital_outlay: Decimal,
    #[serde(with = "rust_decimal::serde::str")]
    pub total_proceeds: Decimal,
    #[serde(with = "rust_decimal::serde::str")]
    pub total_fees: Decimal,
    pub currency: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TargetCostInput {
    pub initial: PositionSnapshot,
    #[serde(with = "rust_decimal::serde::str")]
    pub target_avg_cost: Decimal,
    #[serde(with = "rust_decimal::serde::str")]
    pub purchase_price: Decimal,
    #[serde(with = "rust_decimal::serde::str")]
    pub fee_percent: Decimal,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TargetCostResult {
    pub is_valid: bool,
    pub error_message: String,
    #[serde(with = "rust_decimal::serde::str")]
    pub required_shares: Decimal,
    #[serde(with = "rust_decimal::serde::str")]
    pub required_capital: Decimal,
    #[serde(with = "rust_decimal::serde::str")]
    pub fee_amount: Decimal,
    #[serde(with = "rust_decimal::serde::str")]
    pub total_outlay: Decimal,
    #[serde(with = "rust_decimal::serde::str")]
    pub achieved_avg_cost: Decimal,
    #[serde(with = "rust_decimal::serde::str")]
    pub new_total_shares: Decimal,
    #[serde(with = "rust_decimal::serde::str")]
    pub new_total_cost: Decimal,
    pub currency: String,
}
