use std::collections::HashMap;
use std::str::FromStr;

use rust_decimal::Decimal;
use serde::Deserialize;
use sgsk_common::Currency;
use sgsk_domain::allocation::{PositionValueInput, RebalanceAction};
use sgsk_domain::dividend::DividendTaxJurisdiction;
use sgsk_domain::tools::{OrderAction, OrderStep, PositionSnapshot, TargetCostInput};
use sgsk_domain::transaction::Transaction;
use sgsk_financial_engine::allocation::calculate_allocation;
use sgsk_financial_engine::csv_parser::parse_transaction_csv;
use sgsk_financial_engine::currency::convert_currency;
use sgsk_financial_engine::dividend::calculate_dividend_payout;
use sgsk_financial_engine::fifo::process_transactions;
use sgsk_financial_engine::tools::{simulate_orders, solve_target_cost};

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

fn to_dec(val: f64) -> Decimal {
    Decimal::from_str(&val.to_string()).expect("valid decimal")
}

fn assert_dec_near(actual: Decimal, expected: f64, tol: f64, ctx: &str) {
    let diff = (actual - to_dec(expected)).abs();
    assert!(
        diff <= to_dec(tol),
        "{ctx}: actual={actual}, expected={expected}, diff={diff}, tol={tol}"
    );
}

#[test]
fn fifo_and_csv_engines_match_shared_golden_fixtures() {
    let raw = include_str!("../../../fixtures/accounting/fifo_scenarios.json");
    let root: ParityFixtureRoot = serde_json::from_str(raw).expect("valid parity fixture json");

    assert_eq!(root.fifo_scenarios.len(), 11);
    assert_eq!(root.csv_scenarios.len(), 1);

    for scenario in &root.fifo_scenarios {
        let txs: Vec<Transaction> = scenario
            .transactions
            .iter()
            .map(|t| Transaction {
                symbol: t.symbol.clone(),
                date: t.date.clone(),
                quantity: to_dec(t.quantity),
                price: to_dec(t.price),
                fee: t.fee.map(to_dec),
                currency: t.currency.clone(),
                asset_type: t.asset_type.clone(),
                tx_type: t.tx_type.clone(),
                exchange_from: t.exchange_from.clone(),
                exchange_to: t.exchange_to.clone(),
                note: None,
                employee_contribution: None,
                employee_earnings: None,
                employer_matching: None,
                employer_earnings: None,
                pvd_fund_name: None,
            })
            .collect();

        let res = process_transactions(&txs);
        let tol = scenario.expected.tolerance;

        for exp_sym in &scenario.expected.by_symbol {
            let tx_sum = res
                .transaction_summaries
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
            assert_dec_near(
                tx_sum.net_shares,
                exp_sym.net_shares,
                tol,
                &format!("[{}] net_shares", scenario.id),
            );
            assert_dec_near(
                tx_sum.realized_pl,
                exp_sym.realized_pl,
                tol,
                &format!("[{}] realized_pl", scenario.id),
            );

            let actual_open_lots = res
                .open_summaries
                .iter()
                .find(|s| s.symbol == exp_sym.symbol)
                .map(|s| s.lots.as_slice())
                .unwrap_or(&[]);
            assert_eq!(
                actual_open_lots.len(),
                exp_sym.open_lots.len(),
                "[{}] open lot count",
                scenario.id
            );
            for (actual, expected) in actual_open_lots.iter().zip(exp_sym.open_lots.iter()) {
                assert_eq!(actual.purchase_date, expected.purchase_date);
                assert_dec_near(
                    actual.quantity,
                    expected.quantity,
                    tol,
                    &format!("[{}] open qty", scenario.id),
                );
                assert_dec_near(
                    actual.cost_basis,
                    expected.cost_basis,
                    tol,
                    &format!("[{}] open cost_basis", scenario.id),
                );
                assert_dec_near(
                    actual.total_cost,
                    expected.total_cost,
                    tol,
                    &format!("[{}] open total_cost", scenario.id),
                );
            }

            let actual_closed_lots = res
                .closed_summaries
                .iter()
                .find(|s| s.symbol == exp_sym.symbol)
                .map(|s| s.lots.as_slice())
                .unwrap_or(&[]);
            assert_eq!(
                actual_closed_lots.len(),
                exp_sym.closed_lots.len(),
                "[{}] closed lot count",
                scenario.id
            );
            for (actual, expected) in actual_closed_lots.iter().zip(exp_sym.closed_lots.iter()) {
                assert_eq!(actual.purchase_date, expected.purchase_date);
                assert_eq!(actual.close_date, expected.close_date);
                assert_dec_near(
                    actual.quantity,
                    expected.quantity,
                    tol,
                    &format!("[{}] closed qty", scenario.id),
                );
                assert_dec_near(
                    actual.cost_basis,
                    expected.cost_basis,
                    tol,
                    &format!("[{}] closed cost_basis", scenario.id),
                );
                assert_dec_near(
                    actual.sell_price,
                    expected.sell_price,
                    tol,
                    &format!("[{}] closed sell_price", scenario.id),
                );
                assert_dec_near(
                    actual.realized_pl,
                    expected.realized_pl,
                    tol,
                    &format!("[{}] closed realized_pl", scenario.id),
                );
            }
        }

        let fx = to_dec(scenario.exchange_rate_usd_to_thb);
        if let Some(expected_thb) = scenario.expected.total_cost_in_thb {
            let total_thb: Decimal = res
                .open_summaries
                .iter()
                .map(|s| convert_currency(s.total_cost, &s.currency, "THB", fx))
                .sum();
            assert_dec_near(total_thb, expected_thb, tol, "total_cost_in_thb");
        }
        if let Some(expected_usd) = scenario.expected.total_cost_in_usd {
            let total_usd: Decimal = res
                .open_summaries
                .iter()
                .map(|s| convert_currency(s.total_cost, &s.currency, "USD", fx))
                .sum();
            assert_dec_near(total_usd, expected_usd, tol, "total_cost_in_usd");
        }
    }

    for csv_case in &root.csv_scenarios {
        let parsed = parse_transaction_csv(&csv_case.csv_text, &csv_case.default_asset_type);
        let actual_symbols: Vec<String> = parsed.into_iter().map(|t| t.symbol).collect();
        assert_eq!(
            actual_symbols, csv_case.expected_symbols,
            "[{}] csv symbols",
            csv_case.id
        );
    }
}

#[test]
fn dividend_withholding_tax_matches_us_and_thai_rules() {
    let us_dta = calculate_dividend_payout(
        Decimal::from(100),
        Decimal::from_str("0.50").unwrap(),
        DividendTaxJurisdiction::UsDta15,
        Currency::Usd,
    );
    assert_eq!(us_dta.gross_amount, Decimal::from_str("50.00").unwrap());
    assert_eq!(
        us_dta.withholding_tax_amount,
        Decimal::from_str("7.50").unwrap()
    );
    assert_eq!(us_dta.net_amount, Decimal::from_str("42.50").unwrap());

    let us_nra = calculate_dividend_payout(
        Decimal::from(100),
        Decimal::from_str("0.50").unwrap(),
        DividendTaxJurisdiction::UsNra30,
        Currency::Usd,
    );
    assert_eq!(
        us_nra.withholding_tax_amount,
        Decimal::from_str("15.00").unwrap()
    );
    assert_eq!(us_nra.net_amount, Decimal::from_str("35.00").unwrap());

    let thai_std = calculate_dividend_payout(
        Decimal::from(1000),
        Decimal::from_str("1.25").unwrap(),
        DividendTaxJurisdiction::ThaiStandard10,
        Currency::Thb,
    );
    assert_eq!(
        thai_std.withholding_tax_amount,
        Decimal::from_str("125.00").unwrap()
    );
    assert_eq!(thai_std.net_amount, Decimal::from_str("1125.00").unwrap());

    let thai_boi = calculate_dividend_payout(
        Decimal::from(1000),
        Decimal::from_str("1.25").unwrap(),
        DividendTaxJurisdiction::ThaiBoiExempt0,
        Currency::Thb,
    );
    assert_eq!(thai_boi.withholding_tax_amount, Decimal::ZERO);
    assert_eq!(thai_boi.net_amount, Decimal::from_str("1250.00").unwrap());
}

#[test]
fn allocation_and_tools_engines_compute_exact_decimal_outputs() {
    let positions = vec![
        PositionValueInput {
            symbol: "AAPL".into(),
            display_symbol: "AAPL".into(),
            name: "Apple Inc.".into(),
            name_th: None,
            asset_type: "us-stock".into(),
            original_currency: "USD".into(),
            total_shares: Decimal::from(10),
            holding_value: Decimal::from(600),
        },
        PositionValueInput {
            symbol: "PTT.BK".into(),
            display_symbol: "PTT".into(),
            name: "PTT".into(),
            name_th: None,
            asset_type: "thai-stock".into(),
            original_currency: "THB".into(),
            total_shares: Decimal::from(100),
            holding_value: Decimal::from(400),
        },
    ];
    let mut targets = HashMap::new();
    targets.insert("us-stock".into(), Decimal::from(50));
    targets.insert("thai-stock".into(), Decimal::from(50));

    let alloc = calculate_allocation(&positions, Some(&targets), "THB", Decimal::from(35));
    assert_eq!(alloc.total_portfolio_value, Decimal::from(1000));
    assert_eq!(alloc.currency_exposure.usd_percent, Decimal::from(60));
    assert_eq!(alloc.currency_exposure.thb_percent, Decimal::from(40));
    let us_rec = alloc
        .recommendations
        .iter()
        .find(|r| r.asset_type == "us-stock")
        .unwrap();
    assert_eq!(us_rec.action, RebalanceAction::Sell);
    assert_eq!(us_rec.rebalance_amount, Decimal::from(-100));

    let sim = simulate_orders(
        &PositionSnapshot {
            shares: Decimal::from(10),
            avg_cost: Decimal::from(100),
            total_cost: Some(Decimal::from(1000)),
            market_price: Decimal::from(120),
            currency: "USD".into(),
        },
        &[OrderStep {
            action: OrderAction::Buy,
            shares: Decimal::from(10),
            price: Decimal::from(80),
            fee_percent: Decimal::ZERO,
        }],
        Decimal::ZERO,
    );
    assert_eq!(sim.simulated.total_shares, Decimal::from(20));
    assert_eq!(
        sim.simulated.average_cost,
        Decimal::from_str("90.0000").unwrap()
    );

    let target = solve_target_cost(&TargetCostInput {
        initial: PositionSnapshot {
            shares: Decimal::from(10),
            avg_cost: Decimal::from(100),
            total_cost: Some(Decimal::from(1000)),
            market_price: Decimal::from(80),
            currency: "USD".into(),
        },
        target_avg_cost: Decimal::from(90),
        purchase_price: Decimal::from(80),
        fee_percent: Decimal::ZERO,
    });
    assert!(target.is_valid);
    assert_eq!(
        target.required_shares,
        Decimal::from_str("10.000000").unwrap()
    );
}
