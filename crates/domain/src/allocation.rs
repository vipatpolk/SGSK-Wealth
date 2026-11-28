use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};

/// Input valuation snapshot for a single open position.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PositionValueInput {
    pub symbol: String,
    pub display_symbol: String,
    pub name: String,
    #[serde(default)]
    pub name_th: Option<String>,
    pub asset_type: String,
    pub original_currency: String,
    #[serde(with = "rust_decimal::serde::str")]
    pub total_shares: Decimal,
    #[serde(with = "rust_decimal::serde::str")]
    pub holding_value: Decimal,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "UPPERCASE")]
pub enum RebalanceAction {
    Buy,
    Sell,
    Balanced,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RebalanceRecommendation {
    pub asset_type: String,
    #[serde(with = "rust_decimal::serde::str")]
    pub current_value: Decimal,
    #[serde(with = "rust_decimal::serde::str")]
    pub actual_percent: Decimal,
    #[serde(with = "rust_decimal::serde::str")]
    pub target_percent: Decimal,
    #[serde(with = "rust_decimal::serde::str")]
    pub rebalance_amount: Decimal,
    #[serde(with = "rust_decimal::serde::str")]
    pub deviation_percent: Decimal,
    pub action: RebalanceAction,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CurrencyExposure {
    #[serde(with = "rust_decimal::serde::str")]
    pub usd: Decimal,
    #[serde(with = "rust_decimal::serde::str")]
    pub thb: Decimal,
    #[serde(with = "rust_decimal::serde::str")]
    pub usd_percent: Decimal,
    #[serde(with = "rust_decimal::serde::str")]
    pub thb_percent: Decimal,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HoldingConcentration {
    pub symbol: String,
    pub display_symbol: String,
    pub name: String,
    #[serde(default)]
    pub name_th: Option<String>,
    pub asset_type: String,
    #[serde(with = "rust_decimal::serde::str")]
    pub value: Decimal,
    #[serde(with = "rust_decimal::serde::str")]
    pub portfolio_percent: Decimal,
    #[serde(with = "rust_decimal::serde::str")]
    pub class_percent: Decimal,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PortfolioAllocation {
    pub currency: String,
    #[serde(with = "rust_decimal::serde::str")]
    pub exchange_rate: Decimal,
    #[serde(with = "rust_decimal::serde::str")]
    pub total_portfolio_value: Decimal,
    pub recommendations: Vec<RebalanceRecommendation>,
    pub currency_exposure: CurrencyExposure,
    pub holdings_concentration: Vec<HoldingConcentration>,
}
