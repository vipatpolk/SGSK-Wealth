use std::collections::HashMap;

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct Transaction {
    pub symbol: String,
    pub date: String,
    pub quantity: f64,
    pub price: f64,
    pub currency: String,
    pub asset_type: String,
    #[serde(default)]
    pub exchange_from: Option<String>,
    #[serde(default)]
    pub exchange_to: Option<String>,
    #[serde(default)]
    pub tx_type: Option<String>,
    #[serde(default)]
    pub fee: Option<f64>,
    #[serde(default)]
    pub note: Option<String>,
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
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct ShareLot {
    pub symbol: String,
    pub purchase_date: String,
    pub quantity: f64,
    pub cost_basis: f64,
    pub total_cost: f64,
    pub asset_type: String,
    #[serde(default)]
    pub note: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct ClosedShareLot {
    pub symbol: String,
    pub purchase_date: String,
    pub close_date: String,
    pub quantity: f64,
    pub cost_basis: f64,
    pub sell_price: f64,
    pub total_cost: f64,
    pub total_proceeds: f64,
    #[serde(rename = "realizedPL")]
    pub realized_pl: f64,
    #[serde(rename = "realizedPLPercent")]
    pub realized_pl_percent: f64,
    pub currency: String,
    pub asset_type: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct SymbolSummary {
    pub symbol: String,
    pub total_shares: f64,
    pub total_cost: f64,
    pub average_cost: f64,
    pub currency: String,
    pub lots: Vec<ShareLot>,
    pub asset_type: String,
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
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct ClosedSymbolSummary {
    pub symbol: String,
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
    pub lots: Vec<ClosedShareLot>,
    pub asset_type: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct SymbolTransaction {
    pub id: String,
    pub symbol: String,
    pub date: String,
    #[serde(rename = "type")]
    pub tx_type: String,
    pub quantity: f64,
    pub raw_quantity: f64,
    pub price: f64,
    pub total_amount: f64,
    pub currency: String,
    pub asset_type: String,
    pub running_shares: f64,
    pub running_total_cost: f64,
    pub running_average_cost: f64,
    #[serde(rename = "realizedPL", default)]
    pub realized_pl: Option<f64>,
    #[serde(rename = "realizedPLPercent", default)]
    pub realized_pl_percent: Option<f64>,
    #[serde(default)]
    pub exchange_from: Option<String>,
    #[serde(default)]
    pub exchange_to: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct SymbolTransactionSummary {
    pub symbol: String,
    pub asset_type: String,
    pub currency: String,
    pub total_transactions: usize,
    pub buy_count: usize,
    pub sell_count: usize,
    #[serde(default)]
    pub exchange_count: usize,
    pub total_buy_shares: f64,
    pub total_sell_shares: f64,
    pub total_buy_amount: f64,
    pub total_sell_amount: f64,
    pub average_buy_price: f64,
    pub average_sell_price: f64,
    pub net_shares: f64,
    pub net_invested: f64,
    pub current_status: String,
    #[serde(rename = "realizedPL")]
    pub realized_pl: f64,
    #[serde(rename = "realizedPLPercent")]
    pub realized_pl_percent: f64,
    pub first_trade_date: String,
    pub last_trade_date: String,
    pub transactions: Vec<SymbolTransaction>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct SheetResult {
    pub summaries: Vec<SymbolSummary>,
    pub closed_summaries: Vec<ClosedSymbolSummary>,
    #[serde(default)]
    pub transaction_summaries: Option<Vec<SymbolTransactionSummary>>,
    #[serde(default)]
    pub raw_transactions: Option<Vec<Transaction>>,
    pub total_cost_by_currency: HashMap<String, f64>,
    pub total_proceeds_by_currency: HashMap<String, f64>,
    #[serde(rename = "totalRealizedPLByCurrency")]
    pub total_realized_pl_by_currency: HashMap<String, f64>,
    pub total_symbols: usize,
    pub total_lots: usize,
    #[serde(default)]
    pub error: Option<String>,
    #[serde(default = "default_false_opt")]
    pub is_closed: Option<bool>,
}

fn default_false_opt() -> Option<bool> {
    Some(false)
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct PriceData {
    pub symbol: String,
    #[serde(default = "default_empty_opt")]
    pub name: Option<String>,
    #[serde(default = "default_empty_opt")]
    pub name_th: Option<String>,
    pub price: f64,
    pub currency: String,
}

fn default_empty_opt() -> Option<String> {
    Some(String::new())
}
