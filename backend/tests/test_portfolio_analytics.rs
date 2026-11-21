use std::collections::HashMap;
use std::sync::Arc;

use approx::assert_relative_eq;
use sgsk_backend::config::settings::Settings;
use sgsk_backend::features::dividends::services::dividend_service::DividendService;
use sgsk_backend::features::market_data::services::nav_service::NavService;
use sgsk_backend::features::market_data::services::price_service::{
    PriceService, StockDividendEvent, StockDividendResult,
};
use sgsk_backend::features::portfolio::models::allocation::TargetAllocationRequest;
use sgsk_backend::features::portfolio::models::portfolio::{
    ClosedPortfolioPosition, PortfolioPosition,
};
use sgsk_backend::features::portfolio::models::transaction::{
    PriceData, ShareLot, SymbolSummary, Transaction,
};
use sgsk_backend::features::portfolio::services::allocation_service::AllocationService;
use sgsk_backend::features::portfolio::services::performance_service::PerformanceService;
use sgsk_backend::features::portfolio::services::share_lot_service::ShareLotService;
use sgsk_backend::features::portfolio::services::valuation_service::ValuationService;
use sgsk_backend::utils::cache::{AsyncSingleflight, TTLCache};
use sgsk_backend::utils::http_client::HttpResources;
use sgsk_backend::utils::yfinance_client::{
    BoxFuture, YahooDividend, YahooFinanceProvider, YahooQuote,
};

struct DummyYahoo;
impl YahooFinanceProvider for DummyYahoo {
    fn get_quote<'a>(&'a self, _: &'a str) -> BoxFuture<'a, Result<YahooQuote, String>> {
        Box::pin(async { Ok(YahooQuote::default()) })
    }
    fn get_exchange_rate<'a>(
        &'a self,
        _: &'a str,
        _: &'a str,
    ) -> BoxFuture<'a, Result<f64, String>> {
        Box::pin(async { Ok(35.0) })
    }
    fn get_dividends<'a>(
        &'a self,
        _: &'a str,
        _: Option<&'a str>,
    ) -> BoxFuture<'a, Result<Vec<YahooDividend>, String>> {
        Box::pin(async { Ok(Vec::new()) })
    }
}

fn build_services() -> (
    ValuationService,
    PerformanceService,
    AllocationService,
    DividendService,
) {
    let settings = Arc::new(Settings::default());
    let http = Arc::new(HttpResources::new(&settings));
    let cache = Arc::new(TTLCache::new(60.0, 200));
    let sf = Arc::new(AsyncSingleflight::new());
    let share_lot = ShareLotService::new(
        Arc::clone(&settings),
        Arc::clone(&http),
        Arc::clone(&cache),
        Arc::clone(&sf),
    );
    let nav = NavService::new(
        Arc::clone(&settings),
        Arc::clone(&http),
        Arc::clone(&cache),
        Arc::clone(&sf),
    );
    let price = PriceService::new(
        settings,
        http,
        Arc::clone(&cache),
        Arc::clone(&sf),
        nav.clone(),
        Arc::new(DummyYahoo),
    );
    let valuation = ValuationService::new(
        share_lot,
        price.clone(),
        nav.clone(),
        Arc::clone(&cache),
        Arc::clone(&sf),
    );
    let perf = PerformanceService::new(valuation.clone(), Arc::clone(&cache), Arc::clone(&sf));
    let alloc = AllocationService::new(valuation.clone());
    let div = DividendService::new(valuation.clone(), price, nav, cache, sf);
    (valuation, perf, alloc, div)
}

#[test]
fn test_valuation_performance_and_allocation_services() {
    let (valuation, perf, alloc, _) = build_services();
    let share_lot = ShareLotService::new(
        Arc::new(Settings::default()),
        Arc::new(HttpResources::new(&Settings::default())),
        Arc::new(TTLCache::new(60.0, 50)),
        Arc::new(AsyncSingleflight::new()),
    );

    let pvd_summary = SymbolSummary {
        symbol: "PVDSP500".to_string(),
        total_shares: 100.0,
        total_cost: 1500.0,
        average_cost: 15.0,
        currency: "THB".to_string(),
        lots: vec![ShareLot {
            symbol: "PVDSP500".to_string(),
            purchase_date: "2026-01-31".to_string(),
            quantity: 100.0,
            cost_basis: 15.0,
            total_cost: 1500.0,
            asset_type: "provident-fund".to_string(),
            note: None,
        }],
        asset_type: "provident-fund".to_string(),
        employee_shares: Some(50.0),
        employer_shares: Some(50.0),
        employee_contribution: Some(1000.0),
        employee_earnings: Some(250.0),
        employer_matching: Some(500.0),
        employer_earnings: Some(150.0),
        pvd_fund_name: Some("Master PVD".to_string()),
    };
    let aapl_summary = SymbolSummary {
        symbol: "AAPL".to_string(),
        total_shares: 10.0,
        total_cost: 1000.0,
        average_cost: 100.0,
        currency: "USD".to_string(),
        lots: vec![ShareLot {
            symbol: "AAPL".to_string(),
            purchase_date: "2026-01-05".to_string(),
            quantity: 10.0,
            cost_basis: 100.0,
            total_cost: 1000.0,
            asset_type: "us-stock".to_string(),
            note: None,
        }],
        asset_type: "us-stock".to_string(),
        employee_shares: None,
        employer_shares: None,
        employee_contribution: None,
        employee_earnings: None,
        employer_matching: None,
        employer_earnings: None,
        pvd_fund_name: None,
    };

    let sheet_res = share_lot.build_result(
        vec![aapl_summary, pvd_summary],
        Vec::new(),
        Vec::new(),
        Vec::new(),
        false,
    );
    let prices = HashMap::from([(
        "AAPL".to_string(),
        PriceData {
            symbol: "AAPL".to_string(),
            name: Some("Apple Inc.".to_string()),
            name_th: None,
            price: 190.0,
            currency: "USD".to_string(),
        },
    )]);

    // Value in THB at 35.0 USD/THB:
    // AAPL: 10 * 190 * 35 = 66500 value vs 35000 cost
    // PVDSP500: emp(1000+250) + empr(500+150) = 1900 value vs 1500 cost
    let valued_thb = valuation.value_sheet_result(&sheet_res, &prices, 35.0, "THB", "all", None);
    assert_eq!(valued_thb.open_positions.len(), 2);
    let aapl_pos = valued_thb
        .open_positions
        .iter()
        .find(|p| p.symbol == "AAPL")
        .unwrap();
    let pvd_pos = valued_thb
        .open_positions
        .iter()
        .find(|p| p.symbol == "PVDSP500")
        .unwrap();
    assert_relative_eq!(aapl_pos.holding_value, 66500.0, epsilon = 1e-4);
    assert_relative_eq!(pvd_pos.holding_value, 1900.0, epsilon = 1e-4);
    assert_eq!(pvd_pos.pvd_fund_name.as_deref(), Some("Master PVD"));

    // Performance ALL vs CUSTOM date range resolution
    let perf_res = perf.calculate_performance(&valued_thb, "ALL", "", "");
    assert_relative_eq!(perf_res.summary.total_value, 68400.0, epsilon = 1e-4);
    assert_eq!(perf_res.top_gainers[0].symbol, "AAPL");
    let (cs, ce) = perf.resolve_date_range("CUSTOM", Some("2026-01-01"), Some("2026-06-30"));
    assert_eq!((cs.as_str(), ce.as_str()), ("2026-01-01", "2026-06-30"));

    // Allocation 50/50 rebalance + USD/THB exposure
    let mut custom_targets = HashMap::new();
    custom_targets.insert("us-stock".to_string(), 50.0);
    custom_targets.insert("provident-fund".to_string(), 50.0);
    let req = TargetAllocationRequest {
        target_allocation: custom_targets,
    };
    let alloc_res = alloc.process_allocation(&valued_thb, &req.target_allocation);
    assert_relative_eq!(
        alloc_res.currency_exposure.usd + alloc_res.currency_exposure.thb,
        68400.0,
        epsilon = 1e-4
    );
    let us_rec = alloc_res
        .recommendations
        .iter()
        .find(|r| r.asset_type == "us-stock")
        .unwrap();
    assert_eq!(us_rec.action, "SELL");
    assert_relative_eq!(us_rec.target_percent, 50.0, epsilon = 1e-6);
}

#[test]
fn test_dividend_analytics_wht_historical_shares_exclusions_and_closed_positions() {
    let (_, _, _, div_svc) = build_services();

    let open_positions = vec![
        PortfolioPosition {
            symbol: "AAPL".to_string(),
            display_symbol: "AAPL".to_string(),
            name: "Apple Inc.".to_string(),
            name_th: String::new(),
            asset_type: "us-stock".to_string(),
            asset_type_label: "U.S. Stock".to_string(),
            total_shares: 10.0,
            total_cost: 1500.0,
            average_cost: 150.0,
            current_price: 200.0,
            holding_value: 2000.0,
            unrealized_pl: 500.0,
            unrealized_pl_percent: 33.33,
            currency: "USD".to_string(),
            original_currency: "USD".to_string(),
            has_price: true,
            lots: Vec::new(),
            employee_shares: None,
            employer_shares: None,
            employee_contribution: None,
            employee_earnings: None,
            employer_matching: None,
            employer_earnings: None,
            pvd_fund_name: None,
            policy_name: None,
            aimc_type: None,
            aimc_description: None,
            risk_level: None,
            objective: None,
        },
        PortfolioPosition {
            symbol: "PTT.BK".to_string(),
            display_symbol: "PTT".to_string(),
            name: "PTT".to_string(),
            name_th: "ปตท.".to_string(),
            asset_type: "thai-stock".to_string(),
            asset_type_label: "Thai Stock".to_string(),
            total_shares: 100.0,
            total_cost: 100.0,
            average_cost: 1.0,
            current_price: 1.1,
            holding_value: 110.0,
            unrealized_pl: 10.0,
            unrealized_pl_percent: 10.0,
            currency: "USD".to_string(),
            original_currency: "THB".to_string(),
            has_price: true,
            lots: Vec::new(),
            employee_shares: None,
            employer_shares: None,
            employee_contribution: None,
            employee_earnings: None,
            employer_matching: None,
            employer_earnings: None,
            pvd_fund_name: None,
            policy_name: None,
            aimc_type: None,
            aimc_description: None,
            risk_level: None,
            objective: None,
        },
        PortfolioPosition {
            symbol: "K-USA-A(D).FUND".to_string(),
            display_symbol: "K-USA-A(D)".to_string(),
            name: "K-USA".to_string(),
            name_th: String::new(),
            asset_type: "mutual-fund".to_string(),
            asset_type_label: "Mutual Fund".to_string(),
            total_shares: 500.0,
            total_cost: 200.0,
            average_cost: 0.4,
            current_price: 0.4,
            holding_value: 200.0,
            unrealized_pl: 0.0,
            unrealized_pl_percent: 0.0,
            currency: "USD".to_string(),
            original_currency: "THB".to_string(),
            has_price: true,
            lots: Vec::new(),
            employee_shares: None,
            employer_shares: None,
            employee_contribution: None,
            employee_earnings: None,
            employer_matching: None,
            employer_earnings: None,
            pvd_fund_name: None,
            policy_name: None,
            aimc_type: None,
            aimc_description: None,
            risk_level: None,
            objective: None,
        },
    ];

    let closed_positions = vec![ClosedPortfolioPosition {
        symbol: "CLOSED_US".to_string(),
        display_symbol: "CLOSED_US".to_string(),
        name: "Closed Co".to_string(),
        name_th: String::new(),
        asset_type: "us-stock".to_string(),
        asset_type_label: "U.S. Stock".to_string(),
        total_shares: 0.0,
        closed_shares: 10.0,
        total_cost: 1000.0,
        total_proceeds: 1200.0,
        realized_pl: 200.0,
        realized_pl_percent: 20.0,
        average_buy_price: 100.0,
        average_sell_price: 120.0,
        currency: "USD".to_string(),
        original_currency: "USD".to_string(),
        lots: Vec::new(),
    }];

    // Transactions:
    // AAPL: buy 10 on 2026-01-01, buy 5 ON ex-date 2026-03-01 (must NOT count because strictly < ex_date)
    // PTT.BK: buy 100 on 2026-01-01
    // K-USA-A(D).FUND: buy 500 on 2026-01-01
    // CLOSED_US: buy 10 on 2025-10-01, sell 10 on 2025-12-01 (dividend after 2025-12-01 gives 0 shares)
    let raw_txs = vec![
        Transaction {
            symbol: "AAPL".to_string(),
            date: "2026-01-01".to_string(),
            quantity: 10.0,
            price: 150.0,
            currency: "USD".to_string(),
            asset_type: "us-stock".to_string(),
            exchange_from: None,
            exchange_to: None,
            tx_type: Some("BUY".to_string()),
            fee: None,
            note: None,
            employee_contribution: None,
            employee_earnings: None,
            employer_matching: None,
            employer_earnings: None,
            pvd_fund_name: None,
        },
        Transaction {
            symbol: "AAPL".to_string(),
            date: "2026-03-01".to_string(),
            quantity: 5.0,
            price: 160.0,
            currency: "USD".to_string(),
            asset_type: "us-stock".to_string(),
            exchange_from: None,
            exchange_to: None,
            tx_type: Some("BUY".to_string()),
            fee: None,
            note: None,
            employee_contribution: None,
            employee_earnings: None,
            employer_matching: None,
            employer_earnings: None,
            pvd_fund_name: None,
        },
        Transaction {
            symbol: "PTT.BK".to_string(),
            date: "2026-01-01".to_string(),
            quantity: 100.0,
            price: 35.0,
            currency: "THB".to_string(),
            asset_type: "thai-stock".to_string(),
            exchange_from: None,
            exchange_to: None,
            tx_type: Some("BUY".to_string()),
            fee: None,
            note: None,
            employee_contribution: None,
            employee_earnings: None,
            employer_matching: None,
            employer_earnings: None,
            pvd_fund_name: None,
        },
        Transaction {
            symbol: "K-USA-A(D).FUND".to_string(),
            date: "2026-01-01".to_string(),
            quantity: 500.0,
            price: 14.0,
            currency: "THB".to_string(),
            asset_type: "mutual-fund".to_string(),
            exchange_from: None,
            exchange_to: None,
            tx_type: Some("BUY".to_string()),
            fee: None,
            note: None,
            employee_contribution: None,
            employee_earnings: None,
            employer_matching: None,
            employer_earnings: None,
            pvd_fund_name: None,
        },
        Transaction {
            symbol: "CLOSED_US".to_string(),
            date: "2025-10-01".to_string(),
            quantity: 10.0,
            price: 100.0,
            currency: "USD".to_string(),
            asset_type: "us-stock".to_string(),
            exchange_from: None,
            exchange_to: None,
            tx_type: Some("BUY".to_string()),
            fee: None,
            note: None,
            employee_contribution: None,
            employee_earnings: None,
            employer_matching: None,
            employer_earnings: None,
            pvd_fund_name: None,
        },
        Transaction {
            symbol: "CLOSED_US".to_string(),
            date: "2025-12-01".to_string(),
            quantity: 10.0, // Positive quantity with SELL tx_type must still subtract
            price: 120.0,
            currency: "USD".to_string(),
            asset_type: "us-stock".to_string(),
            exchange_from: None,
            exchange_to: None,
            tx_type: Some("SELL".to_string()),
            fee: None,
            note: None,
            employee_contribution: None,
            employee_earnings: None,
            employer_matching: None,
            employer_earnings: None,
            pvd_fund_name: None,
        },
        // Bond cash DIVIDEND row should NOT create fake shares
        Transaction {
            symbol: "BOND_TEST".to_string(),
            date: "2026-01-01".to_string(),
            quantity: 100.0,
            price: 1.0,
            currency: "USD".to_string(),
            asset_type: "bond".to_string(),
            exchange_from: None,
            exchange_to: None,
            tx_type: Some("DIVIDEND".to_string()),
            fee: None,
            note: None,
            employee_contribution: None,
            employee_earnings: None,
            employer_matching: None,
            employer_earnings: None,
            pvd_fund_name: None,
        },
    ];

    let ex_aapl = chrono::NaiveDate::from_ymd_opt(2026, 3, 1)
        .unwrap()
        .and_hms_opt(0, 0, 0)
        .unwrap()
        .and_utc()
        .timestamp();
    let ex_ptt = chrono::NaiveDate::from_ymd_opt(2026, 3, 10)
        .unwrap()
        .and_hms_opt(0, 0, 0)
        .unwrap()
        .and_utc()
        .timestamp();
    let ex_closed_pre = chrono::NaiveDate::from_ymd_opt(2025, 11, 1)
        .unwrap()
        .and_hms_opt(0, 0, 0)
        .unwrap()
        .and_utc()
        .timestamp();
    let ex_closed_post = chrono::NaiveDate::from_ymd_opt(2026, 1, 15)
        .unwrap()
        .and_hms_opt(0, 0, 0)
        .unwrap()
        .and_utc()
        .timestamp();

    let stock_divs = HashMap::from([
        (
            "AAPL".to_string(),
            StockDividendResult {
                trailing_12m_dps: 1.0,
                dividends: vec![StockDividendEvent {
                    amount: 0.5,
                    date: ex_aapl,
                }],
            },
        ),
        (
            "PTT.BK".to_string(),
            StockDividendResult {
                trailing_12m_dps: 2.0,
                dividends: vec![StockDividendEvent {
                    amount: 1.0,
                    date: ex_ptt,
                }],
            },
        ),
        (
            "CLOSED_US".to_string(),
            StockDividendResult {
                trailing_12m_dps: 0.0,
                dividends: vec![
                    StockDividendEvent {
                        amount: 1.0,
                        date: ex_closed_pre,
                    },
                    StockDividendEvent {
                        amount: 1.0,
                        date: ex_closed_post,
                    },
                ],
            },
        ),
    ]);

    let mut fund_row = serde_json::Map::new();
    fund_row.insert("proj_id".to_string(), serde_json::json!("M001"));
    fund_row.insert(
        "class_abbr_name".to_string(),
        serde_json::json!("K-USA-A(D)"),
    );
    fund_row.insert(
        "book_close_date".to_string(),
        serde_json::json!("2026-03-15"),
    );
    fund_row.insert("dividend_date".to_string(), serde_json::json!("2026-03-25"));
    fund_row.insert("dividend_value".to_string(), serde_json::json!(0.2));
    let fund_divs = HashMap::from([("K-USA-A(D).FUND".to_string(), vec![fund_row])]);

    let resp = div_svc.calculate_dividend_analytics(
        &open_positions,
        &closed_positions,
        &raw_txs,
        &stock_divs,
        &fund_divs,
        35.0,
        "USD",
        2310.0,
        1800.0,
    );

    let aapl_rec = resp.records.iter().find(|r| r.symbol == "AAPL").unwrap();
    // Strictly < ex_date: 10 shares * 0.5 = 5.0 gross, 15% US DTA WHT = 0.75, net = 4.25
    assert_relative_eq!(aapl_rec.shares, 10.0, epsilon = 1e-6);
    assert_relative_eq!(aapl_rec.withholding_tax_rate, 15.0, epsilon = 1e-6);
    assert_relative_eq!(aapl_rec.net_amount, 4.25, epsilon = 1e-6);

    let ptt_rec = resp.records.iter().find(|r| r.symbol == "PTT.BK").unwrap();
    // 100 * 1.0 THB = 100 gross THB, 10% WHT = 10 THB, net = 90 THB -> converted at /35
    assert_relative_eq!(ptt_rec.withholding_tax_rate, 10.0, epsilon = 1e-6);
    assert_relative_eq!(ptt_rec.net_amount, 90.0, epsilon = 1e-6);
    assert_relative_eq!(ptt_rec.converted_net_amount, 90.0 / 35.0, epsilon = 1e-4);

    let mf_rec = resp
        .records
        .iter()
        .find(|r| r.symbol == "K-USA-A(D).FUND")
        .unwrap();
    assert_eq!(mf_rec.record_date.as_deref(), Some("2026-03-15"));
    assert_eq!(mf_rec.date, "2026-03-25");
    assert_relative_eq!(mf_rec.gross_amount, 100.0, epsilon = 1e-6);

    // Closed position gets pre-exit dividend (2025-11-01) ONLY, NOT post-exit (2026-01-15)
    let closed_recs: Vec<_> = resp
        .records
        .iter()
        .filter(|r| r.symbol == "CLOSED_US")
        .collect();
    assert_eq!(closed_recs.len(), 1);
    assert_eq!(closed_recs[0].date, "2025-11-01");
}
