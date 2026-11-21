use std::collections::HashMap;

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct FundDividendDistribution {
    pub proj_id: String,
    pub class_abbr_name: String,
    pub book_close_date: String,
    pub dividend_date: String,
    pub dividend_value: f64,
    #[serde(default)]
    pub last_upd_date: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct DividendRecord {
    pub id: String,
    pub symbol: String,
    pub display_symbol: String,
    pub date: String,
    #[serde(default)]
    pub record_date: Option<String>,
    pub asset_type: String,
    pub asset_type_label: String,
    pub shares: f64,
    pub dividend_per_share: f64,
    pub gross_amount: f64,
    pub withholding_tax: f64,
    pub withholding_tax_rate: f64,
    pub net_amount: f64,
    pub currency: String,
    pub converted_net_amount: f64,
    pub converted_gross_amount: f64,
    pub converted_withholding_tax: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct MonthlyDividendSummary {
    pub year_month: String,
    pub year: i32,
    pub month: u32,
    pub gross_amount: f64,
    pub net_amount: f64,
    pub withholding_tax: f64,
    pub by_asset_type: HashMap<String, f64>,
    pub record_count: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct AnnualDividendSummary {
    pub year: i32,
    pub gross_amount: f64,
    pub net_amount: f64,
    pub withholding_tax: f64,
    pub by_asset_type: HashMap<String, f64>,
    pub record_count: usize,
    #[serde(default)]
    pub monthly_breakdown: Vec<MonthlyDividendSummary>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct AssetTypeDividendSummary {
    pub asset_type: String,
    pub asset_type_label: String,
    pub total_gross_dividends: f64,
    pub total_net_dividends: f64,
    pub total_withholding_tax: f64,
    pub percentage_of_total: f64,
    pub symbol_count: usize,
    pub record_count: usize,
    #[serde(default)]
    pub total_cost_basis: f64,
    #[serde(default)]
    pub current_value: f64,
    #[serde(default)]
    pub projected_annual_dividends: f64,
    #[serde(default)]
    pub yield_on_cost_percent: f64,
    #[serde(default)]
    pub current_yield_percent: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct SymbolDividendSummary {
    pub symbol: String,
    pub display_symbol: String,
    #[serde(default)]
    pub name: String,
    #[serde(default)]
    pub name_th: String,
    pub asset_type: String,
    pub asset_type_label: String,
    pub currency: String,
    pub total_gross_dividends: f64,
    pub total_net_dividends: f64,
    pub total_withholding_tax: f64,
    pub converted_net_dividends: f64,
    pub converted_gross_dividends: f64,
    pub converted_withholding_tax: f64,
    pub dividend_count: usize,
    #[serde(default)]
    pub first_dividend_date: String,
    #[serde(default)]
    pub last_dividend_date: String,
    #[serde(default)]
    pub current_shares: f64,
    #[serde(default)]
    pub current_cost_basis: f64,
    #[serde(default)]
    pub current_value: f64,
    #[serde(rename = "trailingAnnualDPS", default)]
    pub trailing_annual_dps: f64,
    #[serde(default)]
    pub current_yield_percent: f64,
    #[serde(default)]
    pub yield_on_cost_percent: f64,
    #[serde(default)]
    pub projected_annual_income: f64,
    #[serde(default)]
    pub recent_distributions: Vec<FundDividendDistribution>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct PortfolioDividendResponse {
    pub currency: String,
    pub exchange_rate: f64,
    pub total_gross_dividends: f64,
    pub total_net_dividends: f64,
    pub total_withholding_tax: f64,
    pub effective_tax_rate: f64,
    pub projected_annual_dividends: f64,
    pub portfolio_dividend_yield: f64,
    pub portfolio_yield_on_cost: f64,
    #[serde(default)]
    pub annual_dividends: Vec<AnnualDividendSummary>,
    #[serde(default)]
    pub monthly_dividends: Vec<MonthlyDividendSummary>,
    #[serde(default)]
    pub asset_type_summaries: Vec<AssetTypeDividendSummary>,
    #[serde(default)]
    pub symbol_summaries: Vec<SymbolDividendSummary>,
    #[serde(default)]
    pub records: Vec<DividendRecord>,
    #[serde(default)]
    pub error: Option<String>,
}
