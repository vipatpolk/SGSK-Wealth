use serde::{Deserialize, Serialize};

use crate::features::portfolio::models::transaction::{
    ClosedShareLot, SymbolTransactionSummary, Transaction,
};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct PortfolioHoldingLot {
    pub purchase_date: String,
    pub quantity: f64,
    pub cost_basis: f64,
    pub total_cost: f64,
    pub current_price: f64,
    pub holding_value: f64,
    #[serde(rename = "unrealizedPL")]
    pub unrealized_pl: f64,
    #[serde(rename = "unrealizedPLPercent")]
    pub unrealized_pl_percent: f64,
    pub asset_type: String,
    pub currency: String,
    pub original_cost_basis: f64,
    pub original_currency: String,
    #[serde(default)]
    pub note: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct PortfolioPosition {
    pub symbol: String,
    pub display_symbol: String,
    #[serde(default)]
    pub name: String,
    #[serde(default)]
    pub name_th: String,
    pub asset_type: String,
    pub asset_type_label: String,
    pub total_shares: f64,
    pub total_cost: f64,
    pub average_cost: f64,
    pub current_price: f64,
    pub holding_value: f64,
    #[serde(rename = "unrealizedPL")]
    pub unrealized_pl: f64,
    #[serde(rename = "unrealizedPLPercent")]
    pub unrealized_pl_percent: f64,
    pub currency: String,
    pub original_currency: String,
    pub has_price: bool,
    #[serde(default)]
    pub lots: Vec<PortfolioHoldingLot>,
    #[serde(default)]
    pub employee_shares: Option<f64>,
    #[serde(default)]
    pub employer_shares: Option<f64>,
    #[serde(default)]
    pub employee_contribution: Option<f64>,
    #[serde(default)]
    pub employee_earnings: Option<f64>,
    #[serde(default)]
    pub employer_matching: Option<f64>,
    #[serde(default)]
    pub employer_earnings: Option<f64>,
    #[serde(default)]
    pub pvd_fund_name: Option<String>,
    #[serde(default)]
    pub policy_name: Option<String>,
    #[serde(default)]
    pub aimc_type: Option<String>,
    #[serde(default)]
    pub aimc_description: Option<String>,
    #[serde(default)]
    pub risk_level: Option<String>,
    #[serde(default)]
    pub objective: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct ClosedPortfolioPosition {
    pub symbol: String,
    pub display_symbol: String,
    #[serde(default)]
    pub name: String,
    #[serde(default)]
    pub name_th: String,
    pub asset_type: String,
    pub asset_type_label: String,
    pub total_shares: f64,
    pub closed_shares: f64,
    pub total_cost: f64,
    pub total_proceeds: f64,
    #[serde(rename = "realizedPL")]
    pub realized_pl: f64,
    #[serde(rename = "realizedPLPercent")]
    pub realized_pl_percent: f64,
    pub average_buy_price: f64,
    pub average_sell_price: f64,
    pub currency: String,
    pub original_currency: String,
    #[serde(default)]
    pub lots: Vec<ClosedShareLot>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Default)]
#[serde(rename_all = "camelCase")]
pub struct PortfolioSummary {
    pub total_invested: f64,
    pub total_value: f64,
    pub open_invested: f64,
    pub closed_invested: f64,
    #[serde(rename = "totalUnrealizedPL")]
    pub total_unrealized_pl: f64,
    #[serde(rename = "totalUnrealizedPLPercent")]
    pub total_unrealized_pl_percent: f64,
    #[serde(rename = "totalRealizedPL")]
    pub total_realized_pl: f64,
    #[serde(rename = "totalRealizedPLPercent")]
    pub total_realized_pl_percent: f64,
    pub total_return: f64,
    pub total_return_percent: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct PortfolioHoldingsResponse {
    pub currency: String,
    pub exchange_rate: f64,
    pub tab_id: String,
    pub summary: PortfolioSummary,
    #[serde(default)]
    pub open_positions: Vec<PortfolioPosition>,
    #[serde(default)]
    pub closed_positions: Vec<ClosedPortfolioPosition>,
    #[serde(default)]
    pub transaction_summaries: Option<Vec<SymbolTransactionSummary>>,
    #[serde(default)]
    pub raw_transactions: Option<Vec<Transaction>>,
    #[serde(default)]
    pub error: Option<String>,
}
