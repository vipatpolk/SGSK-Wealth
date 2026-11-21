use serde::{Deserialize, Serialize};

use crate::features::portfolio::models::portfolio::PortfolioSummary;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct AssetClassPerformance {
    pub asset_type: String,
    pub label: String,
    pub invested_cost: f64,
    pub current_value: f64,
    #[serde(rename = "unrealizedPL")]
    pub unrealized_pl: f64,
    #[serde(rename = "realizedPL")]
    pub realized_pl: f64,
    pub total_return: f64,
    pub total_return_percent: f64,
    pub open_symbol_count: usize,
    pub closed_symbol_count: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct SymbolPerformance {
    pub symbol: String,
    pub display_symbol: String,
    #[serde(default)]
    pub name: String,
    #[serde(default)]
    pub name_th: String,
    pub asset_type: String,
    pub asset_type_label: String,
    pub status: String,
    pub invested_cost: f64,
    pub current_value: f64,
    #[serde(rename = "unrealizedPL")]
    pub unrealized_pl: f64,
    #[serde(rename = "realizedPL")]
    pub realized_pl: f64,
    pub total_return_amount: f64,
    pub total_return: f64,
    pub total_return_percent: f64,
    pub has_price: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct PortfolioPerformanceResponse {
    pub timeframe: String,
    #[serde(default)]
    pub start_date: String,
    #[serde(default)]
    pub end_date: String,
    pub currency: String,
    pub exchange_rate: f64,
    pub summary: PortfolioSummary,
    #[serde(default)]
    pub asset_type_performance: Vec<AssetClassPerformance>,
    #[serde(default)]
    pub top_gainers: Vec<SymbolPerformance>,
    #[serde(default)]
    pub top_losers: Vec<SymbolPerformance>,
    #[serde(default)]
    pub symbol_performance: Vec<SymbolPerformance>,
    #[serde(default)]
    pub error: Option<String>,
}
