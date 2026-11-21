use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct FactsheetFeeItem {
    pub description: String,
    #[serde(default)]
    pub ceiling_rate: Option<String>,
    #[serde(default)]
    pub actual_rate: Option<String>,
    #[serde(default)]
    pub note: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct FactsheetPerformanceItem {
    pub category: String,
    pub period: String,
    #[serde(default)]
    pub value: Option<f64>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct FactsheetAllocationItem {
    pub seq: i32,
    pub name: String,
    pub ratio: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct FactsheetHoldingItem {
    pub seq: i32,
    pub name: String,
    pub ratio: f64,
    #[serde(default)]
    pub credit_rating: Option<String>,
    #[serde(default)]
    pub isin: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Default)]
#[serde(rename_all = "camelCase")]
pub struct FactsheetStatistics {
    #[serde(default)]
    pub max_drawdown: Option<f64>,
    #[serde(default)]
    pub sharpe_ratio: Option<f64>,
    #[serde(default)]
    pub tracking_error: Option<f64>,
    #[serde(default)]
    pub fx_hedging: Option<String>,
    #[serde(default)]
    pub turnover_ratio: Option<f64>,
    #[serde(default)]
    pub beta: Option<f64>,
    #[serde(default)]
    pub alpha: Option<f64>,
    #[serde(default)]
    pub yield_to_maturity: Option<f64>,
    #[serde(default)]
    pub portfolio_duration: Option<String>,
    #[serde(default)]
    pub recovering_period: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Default)]
#[serde(rename_all = "camelCase")]
pub struct FactsheetTradeConditions {
    #[serde(default)]
    pub minimum_initial_sub: Option<f64>,
    #[serde(default)]
    pub minimum_next_sub: Option<f64>,
    #[serde(default)]
    pub minimum_redempt: Option<f64>,
    #[serde(default)]
    pub currency: Option<String>,
    #[serde(default)]
    pub subscription_period: Option<String>,
    #[serde(default)]
    pub redemption_period: Option<String>,
    #[serde(default)]
    pub settlement_period: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct FundFactsheetResponse {
    pub symbol: String,
    pub display_symbol: String,
    pub asset_type: String,
    #[serde(default)]
    pub proj_id: Option<String>,
    #[serde(default)]
    pub fund_name: Option<String>,
    #[serde(default)]
    pub fund_name_th: Option<String>,
    #[serde(default)]
    pub amc_name: Option<String>,
    #[serde(default)]
    pub amc_name_th: Option<String>,
    #[serde(default)]
    pub fund_class_name: Option<String>,
    #[serde(default)]
    pub policy_desc: Option<String>,
    #[serde(default)]
    pub investment_policy_desc: Option<String>,
    #[serde(default)]
    pub management_style: Option<String>,
    #[serde(default)]
    pub objective: Option<String>,
    #[serde(default)]
    pub aimc_type: Option<String>,
    #[serde(default)]
    pub aimc_description: Option<String>,
    #[serde(default)]
    pub risk_level: Option<String>,
    #[serde(default)]
    pub risk_description: Option<String>,
    #[serde(default)]
    pub benchmark: Option<String>,
    #[serde(default)]
    pub benchmark_remark: Option<String>,
    #[serde(default)]
    pub dividend_policy: Option<String>,
    #[serde(default)]
    pub inception_date: Option<String>,
    #[serde(default)]
    pub pdf_url: Option<String>,
    #[serde(default)]
    pub amc_url: Option<String>,
    #[serde(default)]
    pub as_of_date: Option<String>,
    #[serde(default)]
    pub feeder_master_fund: Option<String>,
    #[serde(default)]
    pub feeder_country: Option<String>,
    #[serde(default)]
    pub fx_hedging_policy: Option<String>,
    #[serde(default)]
    pub tax_incentive_type: Option<String>,
    #[serde(default)]
    pub isin_code: Option<String>,
    #[serde(default)]
    pub fees: Vec<FactsheetFeeItem>,
    #[serde(default)]
    pub performance: Vec<FactsheetPerformanceItem>,
    #[serde(default)]
    pub statistics: Option<FactsheetStatistics>,
    #[serde(default)]
    pub asset_allocation: Vec<FactsheetAllocationItem>,
    #[serde(default)]
    pub top_holdings: Vec<FactsheetHoldingItem>,
    #[serde(default)]
    pub trade_conditions: Option<FactsheetTradeConditions>,
}

impl FundFactsheetResponse {
    pub fn empty(symbol: &str, display_symbol: &str, asset_type: &str) -> Self {
        Self {
            symbol: symbol.to_string(),
            display_symbol: display_symbol.to_string(),
            asset_type: asset_type.to_string(),
            proj_id: None,
            fund_name: None,
            fund_name_th: None,
            amc_name: None,
            amc_name_th: None,
            fund_class_name: None,
            policy_desc: None,
            investment_policy_desc: None,
            management_style: None,
            objective: None,
            aimc_type: None,
            aimc_description: None,
            risk_level: None,
            risk_description: None,
            benchmark: None,
            benchmark_remark: None,
            dividend_policy: None,
            inception_date: None,
            pdf_url: None,
            amc_url: None,
            as_of_date: None,
            feeder_master_fund: None,
            feeder_country: None,
            fx_hedging_policy: None,
            tax_incentive_type: None,
            isin_code: None,
            fees: Vec::new(),
            performance: Vec::new(),
            statistics: None,
            asset_allocation: Vec::new(),
            top_holdings: Vec::new(),
            trade_conditions: None,
        }
    }
}
