use std::collections::HashMap;

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct RebalanceRecommendation {
    pub asset_type: String,
    pub label: String,
    pub current_value: f64,
    pub actual_percent: f64,
    pub target_percent: f64,
    pub rebalance_amount: f64,
    pub deviation_percent: f64,
    pub action: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct CurrencyExposure {
    pub usd: f64,
    pub thb: f64,
    pub usd_percent: f64,
    pub thb_percent: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct HoldingConcentration {
    pub symbol: String,
    pub display_symbol: String,
    #[serde(default)]
    pub name: String,
    #[serde(default)]
    pub name_th: String,
    pub asset_type: String,
    pub value: f64,
    pub portfolio_percent: f64,
    pub class_percent: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct TargetAllocationRequest {
    #[serde(default = "default_target_allocation")]
    pub target_allocation: HashMap<String, f64>,
}

impl Default for TargetAllocationRequest {
    fn default() -> Self {
        Self {
            target_allocation: default_target_allocation(),
        }
    }
}

pub fn default_target_allocation() -> HashMap<String, f64> {
    HashMap::from([
        ("us-stock".to_string(), 40.0),
        ("thai-stock".to_string(), 30.0),
        ("crypto".to_string(), 15.0),
        ("mutual-fund".to_string(), 15.0),
        ("bond".to_string(), 0.0),
    ])
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct PortfolioAllocationResponse {
    pub currency: String,
    pub exchange_rate: f64,
    pub total_portfolio_value: f64,
    #[serde(default)]
    pub recommendations: Vec<RebalanceRecommendation>,
    pub currency_exposure: CurrencyExposure,
    #[serde(default)]
    pub holdings_concentration: Vec<HoldingConcentration>,
    #[serde(default)]
    pub error: Option<String>,
}
