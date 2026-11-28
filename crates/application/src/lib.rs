pub mod ports;

use std::collections::HashMap;

use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use sgsk_domain::allocation::{PortfolioAllocation, PositionValueInput};
use sgsk_domain::tools::{
    OrderSimulationResult, OrderStep, PositionSnapshot, TargetCostInput, TargetCostResult,
};
use sgsk_domain::transaction::FifoResult;
use sgsk_domain::AssetTabId;
use sgsk_financial_engine::allocation::calculate_allocation;
use sgsk_financial_engine::csv_parser::parse_transaction_csv;
use sgsk_financial_engine::fifo::process_transactions;
use sgsk_financial_engine::tools::{simulate_orders, solve_target_cost};

fn tab_id_slug(tab: AssetTabId) -> &'static str {
    match tab {
        AssetTabId::All => "all",
        AssetTabId::UsStock => "us-stock",
        AssetTabId::ThaiStock => "thai-stock",
        AssetTabId::Crypto => "crypto",
        AssetTabId::MutualFund => "mutual-fund",
        AssetTabId::Bond => "bond",
        AssetTabId::ProvidentFund => "provident-fund",
        AssetTabId::ClosedPosition => "closed-position",
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct HealthStatus {
    pub message: String,
}

/// Returns the service health status response.
pub fn get_health_status() -> HealthStatus {
    HealthStatus {
        message: "Welcome to SGSKBackend!".to_string(),
    }
}

/// Parses a transaction CSV and executes FIFO share-lot accounting.
pub fn compute_fifo_from_csv(csv_text: &str, default_asset_type: &str) -> FifoResult {
    let transactions = parse_transaction_csv(csv_text, default_asset_type);
    process_transactions(&transactions)
}

/// Parses multiple asset-tab CSVs and aggregates them through the FIFO accounting engine.
pub fn compute_fifo_from_tabs(tabs: &[(AssetTabId, String)]) -> FifoResult {
    let mut all_txs = Vec::new();
    for (tab, csv) in tabs {
        all_txs.extend(parse_transaction_csv(csv, tab_id_slug(*tab)));
    }
    process_transactions(&all_txs)
}

/// Computes asset allocation and rebalance recommendations from valued positions.
pub fn compute_allocation(
    positions: &[PositionValueInput],
    targets: Option<&HashMap<String, Decimal>>,
    currency: &str,
    exchange_rate: Decimal,
) -> PortfolioAllocation {
    calculate_allocation(positions, targets, currency, exchange_rate)
}

/// Runs the order impact simulator use case.
pub fn run_order_simulation(
    initial: &PositionSnapshot,
    steps: &[OrderStep],
    default_fee_percent: Decimal,
) -> OrderSimulationResult {
    simulate_orders(initial, steps, default_fee_percent)
}

/// Runs the target average cost solver use case.
pub fn run_target_cost_solver(input: &TargetCostInput) -> TargetCostResult {
    solve_target_cost(input)
}

#[cfg(test)]
mod tests {
    use super::{compute_fifo_from_csv, get_health_status};
    use rust_decimal::Decimal;

    #[test]
    fn health_status_matches_legacy_message() {
        assert_eq!(get_health_status().message, "Welcome to SGSKBackend!");
    }

    #[test]
    fn compute_fifo_from_csv_processes_valid_rows() {
        let csv = "Symbol,Date,Quantity,Price,Currency,Asset Type,Transaction Type\nAAPL,2025-01-10,10,100,USD,us-stock,BUY\n";
        let res = compute_fifo_from_csv(csv, "us-stock");
        assert_eq!(res.open_summaries.len(), 1);
        assert_eq!(res.open_summaries[0].total_shares, Decimal::from(10));
    }
}
