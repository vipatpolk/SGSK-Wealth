use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};

/// Normalized investment transaction record used by the FIFO engine.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Transaction {
    pub symbol: String,
    pub date: String,
    #[serde(with = "rust_decimal::serde::str")]
    pub quantity: Decimal,
    #[serde(with = "rust_decimal::serde::str")]
    pub price: Decimal,
    #[serde(default, with = "rust_decimal::serde::str_option")]
    pub fee: Option<Decimal>,
    pub currency: String,
    pub asset_type: String,
    #[serde(default)]
    pub tx_type: Option<String>,
    #[serde(default)]
    pub exchange_from: Option<String>,
    #[serde(default)]
    pub exchange_to: Option<String>,
    #[serde(default)]
    pub note: Option<String>,
    #[serde(default, with = "rust_decimal::serde::str_option")]
    pub employee_contribution: Option<Decimal>,
    #[serde(default, with = "rust_decimal::serde::str_option")]
    pub employee_earnings: Option<Decimal>,
    #[serde(default, with = "rust_decimal::serde::str_option")]
    pub employer_matching: Option<Decimal>,
    #[serde(default, with = "rust_decimal::serde::str_option")]
    pub employer_earnings: Option<Decimal>,
    #[serde(default)]
    pub pvd_fund_name: Option<String>,
}

/// Remaining open FIFO share lot.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ShareLot {
    pub symbol: String,
    pub purchase_date: String,
    #[serde(with = "rust_decimal::serde::str")]
    pub quantity: Decimal,
    #[serde(with = "rust_decimal::serde::str")]
    pub cost_basis: Decimal,
    #[serde(with = "rust_decimal::serde::str")]
    pub total_cost: Decimal,
    pub asset_type: String,
    #[serde(default)]
    pub note: Option<String>,
}

/// Matched closed FIFO share lot.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ClosedShareLot {
    pub symbol: String,
    pub purchase_date: String,
    pub close_date: String,
    #[serde(with = "rust_decimal::serde::str")]
    pub quantity: Decimal,
    #[serde(with = "rust_decimal::serde::str")]
    pub cost_basis: Decimal,
    #[serde(with = "rust_decimal::serde::str")]
    pub sell_price: Decimal,
    #[serde(with = "rust_decimal::serde::str")]
    pub total_cost: Decimal,
    #[serde(with = "rust_decimal::serde::str")]
    pub total_proceeds: Decimal,
    #[serde(rename = "realizedPL", with = "rust_decimal::serde::str")]
    pub realized_pl: Decimal,
    #[serde(rename = "realizedPLPercent", with = "rust_decimal::serde::str")]
    pub realized_pl_percent: Decimal,
    pub currency: String,
    pub asset_type: String,
}

/// Open position summary for a single symbol.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SymbolSummary {
    pub symbol: String,
    #[serde(with = "rust_decimal::serde::str")]
    pub total_shares: Decimal,
    #[serde(with = "rust_decimal::serde::str")]
    pub total_cost: Decimal,
    #[serde(with = "rust_decimal::serde::str")]
    pub average_cost: Decimal,
    pub currency: String,
    pub asset_type: String,
    pub lots: Vec<ShareLot>,
    #[serde(default, with = "rust_decimal::serde::str_option")]
    pub employee_shares: Option<Decimal>,
    #[serde(default, with = "rust_decimal::serde::str_option")]
    pub employer_shares: Option<Decimal>,
    #[serde(default, with = "rust_decimal::serde::str_option")]
    pub employee_contribution: Option<Decimal>,
    #[serde(default, with = "rust_decimal::serde::str_option")]
    pub employee_earnings: Option<Decimal>,
    #[serde(default, with = "rust_decimal::serde::str_option")]
    pub employer_matching: Option<Decimal>,
    #[serde(default, with = "rust_decimal::serde::str_option")]
    pub employer_earnings: Option<Decimal>,
    #[serde(default)]
    pub pvd_fund_name: Option<String>,
}

/// Closed position summary for a single symbol.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ClosedSymbolSummary {
    pub symbol: String,
    #[serde(with = "rust_decimal::serde::str")]
    pub closed_shares: Decimal,
    #[serde(with = "rust_decimal::serde::str")]
    pub total_cost: Decimal,
    #[serde(with = "rust_decimal::serde::str")]
    pub total_proceeds: Decimal,
    #[serde(rename = "realizedPL", with = "rust_decimal::serde::str")]
    pub realized_pl: Decimal,
    #[serde(rename = "realizedPLPercent", with = "rust_decimal::serde::str")]
    pub realized_pl_percent: Decimal,
    #[serde(with = "rust_decimal::serde::str")]
    pub average_buy_price: Decimal,
    #[serde(with = "rust_decimal::serde::str")]
    pub average_sell_price: Decimal,
    pub currency: String,
    pub asset_type: String,
    pub lots: Vec<ClosedShareLot>,
}

/// Processed transaction ledger entry with running cost-basis state.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SymbolTransaction {
    pub id: String,
    pub symbol: String,
    pub date: String,
    pub tx_type: String,
    #[serde(with = "rust_decimal::serde::str")]
    pub quantity: Decimal,
    #[serde(with = "rust_decimal::serde::str")]
    pub raw_quantity: Decimal,
    #[serde(with = "rust_decimal::serde::str")]
    pub price: Decimal,
    #[serde(with = "rust_decimal::serde::str")]
    pub total_amount: Decimal,
    pub currency: String,
    pub asset_type: String,
    #[serde(with = "rust_decimal::serde::str")]
    pub running_shares: Decimal,
    #[serde(with = "rust_decimal::serde::str")]
    pub running_total_cost: Decimal,
    #[serde(with = "rust_decimal::serde::str")]
    pub running_average_cost: Decimal,
    #[serde(
        rename = "realizedPL",
        default,
        with = "rust_decimal::serde::str_option"
    )]
    pub realized_pl: Option<Decimal>,
    #[serde(
        rename = "realizedPLPercent",
        default,
        with = "rust_decimal::serde::str_option"
    )]
    pub realized_pl_percent: Option<Decimal>,
    #[serde(default)]
    pub exchange_from: Option<String>,
    #[serde(default)]
    pub exchange_to: Option<String>,
}

/// Aggregated transaction statistics for a single symbol.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SymbolTransactionSummary {
    pub symbol: String,
    pub currency: String,
    pub asset_type: String,
    pub total_transactions: usize,
    pub buy_count: usize,
    pub sell_count: usize,
    pub exchange_count: usize,
    #[serde(with = "rust_decimal::serde::str")]
    pub net_shares: Decimal,
    #[serde(rename = "realizedPL", with = "rust_decimal::serde::str")]
    pub realized_pl: Decimal,
    #[serde(rename = "realizedPLPercent", with = "rust_decimal::serde::str")]
    pub realized_pl_percent: Decimal,
    #[serde(with = "rust_decimal::serde::str")]
    pub average_buy_price: Decimal,
    #[serde(with = "rust_decimal::serde::str")]
    pub average_sell_price: Decimal,
    pub current_status: String,
    pub transactions: Vec<SymbolTransaction>,
}

/// Complete output from the FIFO accounting engine.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FifoResult {
    pub open_summaries: Vec<SymbolSummary>,
    pub closed_summaries: Vec<ClosedSymbolSummary>,
    pub transaction_summaries: Vec<SymbolTransactionSummary>,
}
