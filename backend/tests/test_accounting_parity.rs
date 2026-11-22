use std::sync::Arc;

use approx::assert_relative_eq;
use serde::Deserialize;
use sgsk_backend::config::settings::Settings;
use sgsk_backend::features::portfolio::models::transaction::Transaction;
use sgsk_backend::features::portfolio::services::share_lot_service::ShareLotService;
use sgsk_backend::utils::cache::{AsyncSingleflight, TTLCache};
use sgsk_backend::utils::format_utils::convert_currency;
use sgsk_backend::utils::http_client::HttpResources;

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct ParityFixtureRoot {
    fifo_scenarios: Vec<FifoScenario>,
    csv_scenarios: Vec<CsvScenario>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct FifoScenario {
    id: String,
    exchange_rate_usd_to_thb: f64,
    transactions: Vec<FixtureTx>,
    expected: ExpectedResult,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct FixtureTx {
    symbol: String,
    date: String,
    quantity: f64,
    price: f64,
    #[serde(default)]
    fee: Option<f64>,
    currency: String,
    asset_type: String,
    #[serde(default)]
    tx_type: Option<String>,
    #[serde(default)]
    exchange_from: Option<String>,
    #[serde(default)]
    exchange_to: Option<String>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct ExpectedResult {
    tolerance: f64,
    #[serde(default)]
    total_cost_in_thb: Option<f64>,
    #[serde(default)]
    total_cost_in_usd: Option<f64>,
    by_symbol: Vec<ExpectedSymbol>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct ExpectedSymbol {
    symbol: String,
    buy_count: usize,
    sell_count: usize,
    exchange_count: usize,
    transaction_count: usize,
    net_shares: f64,
    #[serde(rename = "realizedPL")]
    realized_pl: f64,
    open_lots: Vec<ExpectedOpenLot>,
    closed_lots: Vec<ExpectedClosedLot>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct ExpectedOpenLot {
    purchase_date: String,
    quantity: f64,
    cost_basis: f64,
    total_cost: f64,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct ExpectedClosedLot {
    purchase_date: String,
    close_date: String,
    quantity: f64,
    cost_basis: f64,
    sell_price: f64,
    #[serde(rename = "realizedPL")]
    realized_pl: f64,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct CsvScenario {
    id: String,
    default_asset_type: String,
    csv_text: String,
    expected_symbols: Vec<String>,
}

fn make_service() -> ShareLotService {
    let settings = Arc::new(Settings::default());
    let http = Arc::new(HttpResources::new(&settings));
    let cache = Arc::new(TTLCache::new(60.0, 200));
    let singleflight = Arc::new(AsyncSingleflight::new());
    ShareLotService::new(settings, http, cache, singleflight)
}

#[test]
fn test_rust_fifo_and_csv_parity_against_shared_fixtures() {
    let raw = include_str!("../../fixtures/accounting/fifo_scenarios.json");
    let root: ParityFixtureRoot = serde_json::from_str(raw).expect("valid parity fixture json");
    let svc = make_service();

    assert_eq!(root.fifo_scenarios.len(), 11);
    assert_eq!(root.csv_scenarios.len(), 1);

    for scenario in &root.fifo_scenarios {
        let txs: Vec<Transaction> = scenario
            .transactions
            .iter()
            .map(|t| Transaction {
                symbol: t.symbol.clone(),
                date: t.date.clone(),
                quantity: t.quantity,
                price: t.price,
                currency: t.currency.clone(),
                asset_type: t.asset_type.clone(),
                exchange_from: t.exchange_from.clone(),
                exchange_to: t.exchange_to.clone(),
                tx_type: t.tx_type.clone(),
                fee: t.fee,
                note: None,
                employee_contribution: None,
                employee_earnings: None,
                employer_matching: None,
                employer_earnings: None,
                pvd_fund_name: None,
            })
            .collect();

        let (open_summaries, closed_summaries, tx_summaries) = svc.process_transactions(&txs);
        let tol = scenario.expected.tolerance;

        for exp_sym in &scenario.expected.by_symbol {
            let tx_sum = tx_summaries
                .iter()
                .find(|s| s.symbol == exp_sym.symbol)
                .unwrap_or_else(|| {
                    panic!(
                        "[{}] missing tx summary for {}",
                        scenario.id, exp_sym.symbol
                    )
                });
            assert_eq!(
                tx_sum.buy_count, exp_sym.buy_count,
                "[{}] buy_count",
                scenario.id
            );
            assert_eq!(
                tx_sum.sell_count, exp_sym.sell_count,
                "[{}] sell_count",
                scenario.id
            );
            assert_eq!(
                tx_sum.exchange_count, exp_sym.exchange_count,
                "[{}] exchange_count",
                scenario.id
            );
            assert_eq!(
                tx_sum.total_transactions, exp_sym.transaction_count,
                "[{}] total_transactions",
                scenario.id
            );
            assert_relative_eq!(tx_sum.net_shares, exp_sym.net_shares, epsilon = tol);
            assert_relative_eq!(tx_sum.realized_pl, exp_sym.realized_pl, epsilon = tol);

            let actual_open_lots = open_summaries
                .iter()
                .find(|s| s.symbol == exp_sym.symbol)
                .map(|s| s.lots.as_slice())
                .unwrap_or(&[]);
            assert_eq!(
                actual_open_lots.len(),
                exp_sym.open_lots.len(),
                "[{}] open lot count for {}",
                scenario.id,
                exp_sym.symbol
            );
            for (actual, expected) in actual_open_lots.iter().zip(exp_sym.open_lots.iter()) {
                assert_eq!(
                    actual.purchase_date, expected.purchase_date,
                    "[{}] open purchase_date",
                    scenario.id
                );
                assert_relative_eq!(actual.quantity, expected.quantity, epsilon = tol);
                assert_relative_eq!(actual.cost_basis, expected.cost_basis, epsilon = tol);
                assert_relative_eq!(actual.total_cost, expected.total_cost, epsilon = tol);
            }

            let actual_closed_lots = closed_summaries
                .iter()
                .find(|s| s.symbol == exp_sym.symbol)
                .map(|s| s.lots.as_slice())
                .unwrap_or(&[]);
            assert_eq!(
                actual_closed_lots.len(),
                exp_sym.closed_lots.len(),
                "[{}] closed lot count for {}",
                scenario.id,
                exp_sym.symbol
            );
            for (actual, expected) in actual_closed_lots.iter().zip(exp_sym.closed_lots.iter()) {
                assert_eq!(
                    actual.purchase_date, expected.purchase_date,
                    "[{}] closed purchase_date",
                    scenario.id
                );
                assert_eq!(
                    actual.close_date, expected.close_date,
                    "[{}] closed close_date",
                    scenario.id
                );
                assert_relative_eq!(actual.quantity, expected.quantity, epsilon = tol);
                assert_relative_eq!(actual.cost_basis, expected.cost_basis, epsilon = tol);
                assert_relative_eq!(actual.sell_price, expected.sell_price, epsilon = tol);
                assert_relative_eq!(actual.realized_pl, expected.realized_pl, epsilon = tol);
            }
        }

        if let Some(expected_thb) = scenario.expected.total_cost_in_thb {
            let total_thb: f64 = open_summaries
                .iter()
                .map(|s| {
                    convert_currency(
                        s.total_cost,
                        &s.currency,
                        "THB",
                        scenario.exchange_rate_usd_to_thb,
                    )
                })
                .sum();
            assert_relative_eq!(total_thb, expected_thb, epsilon = tol);
        }

        if let Some(expected_usd) = scenario.expected.total_cost_in_usd {
            let total_usd: f64 = open_summaries
                .iter()
                .map(|s| {
                    convert_currency(
                        s.total_cost,
                        &s.currency,
                        "USD",
                        scenario.exchange_rate_usd_to_thb,
                    )
                })
                .sum();
            assert_relative_eq!(total_usd, expected_usd, epsilon = tol);
        }
    }

    for csv_case in &root.csv_scenarios {
        let parsed = svc.parse_csv(&csv_case.csv_text, &csv_case.default_asset_type);
        let actual_symbols: Vec<String> = parsed.into_iter().map(|t| t.symbol).collect();
        assert_eq!(
            actual_symbols, csv_case.expected_symbols,
            "[{}] parsed csv symbols",
            csv_case.id
        );
    }
}
