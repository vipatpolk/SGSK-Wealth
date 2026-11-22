use std::collections::HashMap;
use std::sync::Arc;

use approx::assert_relative_eq;
use axum::body::Body;
use axum::http::{Request, StatusCode};
use http_body_util::BodyExt;
use serde_json::json;
use sgsk_backend::config::settings::Settings;
use sgsk_backend::create_app;
use sgsk_backend::features::tools::models::tools::{
    CompoundingFrequency, NoSellSubMode, OrderAction, PaymentTiming, PositionSnapshotModel,
    RebalanceCalculateRequest, RebalanceMode, SimulateOrderRequest, SimulatedStepModel,
    SolveTargetCostRequest, TvmCalculateRequest, TvmSolveMode,
};
use sgsk_backend::features::tools::services::tools_service::ToolsService;
use sgsk_backend::state::AppState;
use sgsk_backend::utils::http_client::HttpResources;
use sgsk_backend::utils::yfinance_client::{
    BoxFuture, YahooDividend, YahooFinanceProvider, YahooQuote,
};
use tower::ServiceExt;
use wiremock::matchers::{method, path, query_param};
use wiremock::{Mock, MockServer, ResponseTemplate};

struct MockYahoo;
impl YahooFinanceProvider for MockYahoo {
    fn get_quote<'a>(&'a self, sym: &'a str) -> BoxFuture<'a, Result<YahooQuote, String>> {
        let s = sym.to_string();
        Box::pin(async move {
            let price = match s.as_str() {
                "AAPL" => 200.0,
                "NVDA" => 500.0,
                "PTT.BK" => 40.0,
                _ => 100.0,
            };
            Ok(YahooQuote {
                price,
                name: s,
                currency: if sym.ends_with(".BK") { "THB" } else { "USD" }.to_string(),
            })
        })
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

fn make_tools_service() -> ToolsService {
    let state = AppState::from_settings(Settings::default());
    state.portfolio.tools_service.clone()
}

#[tokio::test]
async fn test_tools_simulate_solve_target_and_tvm() {
    let svc = make_tools_service();

    // 1. Buy averaging down
    let buy_sim = svc
        .simulate_order(&SimulateOrderRequest {
            initial_position: Some(PositionSnapshotModel {
                symbol: "AAPL".to_string(),
                shares: 10.0,
                avg_cost: 200.0,
                market_price: 150.0,
                currency: "USD".to_string(),
                total_cost: None,
            }),
            symbol: None,
            steps: vec![SimulatedStepModel {
                action: OrderAction::Buy,
                shares: 10.0,
                price: 150.0,
                fee_percent: 0.0,
                label: "DCA".to_string(),
            }],
            currency: "USD".to_string(),
            tax_fee_percent: 0.0,
        })
        .await;
    assert_relative_eq!(buy_sim.simulated.total_shares, 20.0, epsilon = 1e-6);
    assert_relative_eq!(buy_sim.simulated.average_cost, 175.0, epsilon = 1e-6);
    assert_relative_eq!(buy_sim.simulated.total_cost, 3500.0, epsilon = 1e-6);

    // 2. Buy with Thai broker 0.157% fee + Sell realized PL
    let fee_sim = svc
        .simulate_order(&SimulateOrderRequest {
            initial_position: Some(PositionSnapshotModel {
                symbol: "PTT".to_string(),
                shares: 1000.0,
                avg_cost: 35.0,
                market_price: 38.0,
                currency: "THB".to_string(),
                total_cost: Some(35000.0),
            }),
            symbol: None,
            steps: vec![
                SimulatedStepModel {
                    action: OrderAction::Buy,
                    shares: 1000.0,
                    price: 36.0,
                    fee_percent: 0.157,
                    label: "Add".to_string(),
                },
                SimulatedStepModel {
                    action: OrderAction::Sell,
                    shares: 500.0,
                    price: 40.0,
                    fee_percent: 0.157,
                    label: "Trim".to_string(),
                },
            ],
            currency: "THB".to_string(),
            tax_fee_percent: 0.0,
        })
        .await;
    assert_relative_eq!(fee_sim.simulated.total_shares, 1500.0, epsilon = 1e-6);
    assert!(fee_sim.total_fees > 80.0);
    assert!(fee_sim.simulated.realized_pl > 0.0);

    // 3. Solve Target Cost: feasible, infeasible, averaging up, and 0 initial shares
    let feasible = svc
        .solve_target_cost(&SolveTargetCostRequest {
            initial_position: Some(PositionSnapshotModel {
                symbol: "NVDA".to_string(),
                shares: 10.0,
                avg_cost: 200.0,
                market_price: 150.0,
                currency: "USD".to_string(),
                total_cost: None,
            }),
            symbol: None,
            target_avg_cost: 175.0,
            purchase_price: 150.0,
            fee_percent: 0.0,
            currency: "USD".to_string(),
        })
        .await;
    assert!(feasible.is_valid);
    assert_relative_eq!(feasible.required_shares, 10.0, epsilon = 1e-6);
    assert_relative_eq!(feasible.achieved_avg_cost, 175.0, epsilon = 1e-6);

    let infeasible = svc
        .solve_target_cost(&SolveTargetCostRequest {
            initial_position: Some(PositionSnapshotModel {
                symbol: "NVDA".to_string(),
                shares: 10.0,
                avg_cost: 200.0,
                market_price: 150.0,
                currency: "USD".to_string(),
                total_cost: None,
            }),
            symbol: None,
            target_avg_cost: 140.0,
            purchase_price: 150.0,
            fee_percent: 0.0,
            currency: "USD".to_string(),
        })
        .await;
    assert!(!infeasible.is_valid);

    let avg_up = svc
        .solve_target_cost(&SolveTargetCostRequest {
            initial_position: Some(PositionSnapshotModel {
                symbol: "NVDA".to_string(),
                shares: 10.0,
                avg_cost: 100.0,
                market_price: 150.0,
                currency: "USD".to_string(),
                total_cost: None,
            }),
            symbol: None,
            target_avg_cost: 120.0,
            purchase_price: 150.0,
            fee_percent: 0.0,
            currency: "USD".to_string(),
        })
        .await;
    assert!(avg_up.is_valid);
    assert_relative_eq!(avg_up.achieved_avg_cost, 120.0, epsilon = 1e-4);

    // 4. TVM solver modes (FV, PMT, PV, N, RATE) & all 8 compounding frequencies
    for freq in [
        CompoundingFrequency::Daily,
        CompoundingFrequency::Weekly,
        CompoundingFrequency::Biweekly,
        CompoundingFrequency::Semimonthly,
        CompoundingFrequency::Monthly,
        CompoundingFrequency::Quarterly,
        CompoundingFrequency::Semiannually,
        CompoundingFrequency::Annually,
    ] {
        let fv = svc
            .calculate_tvm(&TvmCalculateRequest {
                mode: TvmSolveMode::Fv,
                present_value: 10000.0,
                payment: 500.0,
                annual_rate_pct: 8.0,
                years: 10.0,
                compounding: freq,
                timing: PaymentTiming::End,
                target_future_value: None,
                currency: "USD".to_string(),
            })
            .await;
        assert!(fv.is_valid);
        assert!(fv.future_value > fv.total_invested);
    }

    let pmt = svc
        .calculate_tvm(&TvmCalculateRequest {
            mode: TvmSolveMode::Pmt,
            present_value: 10000.0,
            payment: 0.0,
            annual_rate_pct: 8.0,
            years: 10.0,
            compounding: CompoundingFrequency::Monthly,
            timing: PaymentTiming::End,
            target_future_value: Some(150000.0),
            currency: "USD".to_string(),
        })
        .await;
    assert!(pmt.is_valid);
    assert!(pmt.payment > 0.0);

    let pv = svc
        .calculate_tvm(&TvmCalculateRequest {
            mode: TvmSolveMode::Pv,
            present_value: 0.0,
            payment: 500.0,
            annual_rate_pct: 8.0,
            years: 10.0,
            compounding: CompoundingFrequency::Monthly,
            timing: PaymentTiming::End,
            target_future_value: Some(150000.0),
            currency: "USD".to_string(),
        })
        .await;
    assert!(pv.is_valid);
    assert!(pv.present_value > 0.0);

    let n_periods = svc
        .calculate_tvm(&TvmCalculateRequest {
            mode: TvmSolveMode::N,
            present_value: 10000.0,
            payment: 500.0,
            annual_rate_pct: 8.0,
            years: 1.0,
            compounding: CompoundingFrequency::Monthly,
            timing: PaymentTiming::End,
            target_future_value: Some(100000.0),
            currency: "USD".to_string(),
        })
        .await;
    assert!(n_periods.is_valid);
    assert!(n_periods.years > 5.0);

    let rate = svc
        .calculate_tvm(&TvmCalculateRequest {
            mode: TvmSolveMode::Rate,
            present_value: 10000.0,
            payment: 500.0,
            annual_rate_pct: 0.0,
            years: 10.0,
            compounding: CompoundingFrequency::Monthly,
            timing: PaymentTiming::End,
            target_future_value: Some(120000.0),
            currency: "USD".to_string(),
        })
        .await;
    assert!(rate.is_valid);
    assert!(rate.annual_rate_pct > 5.0);
}

#[tokio::test]
async fn test_router_root_tools_and_prefix_normalization() {
    let app = create_app(AppState::from_settings(Settings::default()));

    // Root health endpoint (both direct & /api/backend normalized prefix)
    for uri in ["/", "/api/backend", "/api/backend/"] {
        let req = Request::builder()
            .uri(uri)
            .header("X-API-Key", "dev_secret_key_change_in_prod")
            .body(Body::empty())
            .unwrap();
        let res = app.clone().oneshot(req).await.unwrap();
        assert_eq!(res.status(), StatusCode::OK, "failed uri {uri}");
        let body = res.into_body().collect().await.unwrap().to_bytes();
        let parsed: serde_json::Value = serde_json::from_slice(&body).unwrap();
        assert_eq!(parsed["message"], "Welcome to SGSKBackend!");
    }

    // /portfolio/tools/tvm via /api/backend prefix
    let tvm_body = serde_json::to_string(&json!({
        "mode": "FV",
        "presentValue": 10000,
        "payment": 500,
        "annualRatePct": 8,
        "years": 5,
        "compounding": "monthly",
        "timing": "end",
        "currency": "USD"
    }))
    .unwrap();
    let tvm_req = Request::builder()
        .method("POST")
        .uri("/api/backend/portfolio/tools/tvm")
        .header("X-API-Key", "dev_secret_key_change_in_prod")
        .header("Content-Type", "application/json")
        .body(Body::from(tvm_body))
        .unwrap();
    let tvm_res = app.clone().oneshot(tvm_req).await.unwrap();
    assert_eq!(tvm_res.status(), StatusCode::OK);
    let tvm_json: serde_json::Value =
        serde_json::from_slice(&tvm_res.into_body().collect().await.unwrap().to_bytes()).unwrap();
    assert_eq!(tvm_json["isValid"], true);
    assert!(tvm_json["futureValue"].as_f64().unwrap() > 40000.0);

    // /price/fetch-prices empty array returns valid shape cleanly
    let price_req = Request::builder()
        .method("POST")
        .uri("/price/fetch-prices")
        .header("X-API-Key", "dev_secret_key_change_in_prod")
        .header("Content-Type", "application/json")
        .body(Body::from(r#"{"summaries":[]}"#))
        .unwrap();
    let price_res = app.clone().oneshot(price_req).await.unwrap();
    assert_eq!(price_res.status(), StatusCode::OK);

    // /portfolio/tools/rebalance standard + no-sell (min-inflow & custom-deposit) via mocked sheets
    let mock_server = MockServer::start().await;
    Mock::given(method("GET"))
        .and(path("/sample_spreadsheet_id/export"))
        .and(query_param("gid", "1032243687"))
        .respond_with(
            ResponseTemplate::new(200)
                .set_body_string(include_str!("fixtures/sample_us_stock.csv")),
        )
        .mount(&mock_server)
        .await;
    Mock::given(method("GET"))
        .and(path("/sample_spreadsheet_id/export"))
        .and(query_param("gid", "102823823"))
        .respond_with(
            ResponseTemplate::new(200)
                .set_body_string(include_str!("fixtures/sample_thai_stock.csv")),
        )
        .mount(&mock_server)
        .await;
    Mock::given(method("GET"))
        .and(path("/sample_spreadsheet_id/export"))
        .respond_with(
            ResponseTemplate::new(200).set_body_string("Symbol,Date,Quantity,Price,Currency\n"),
        )
        .mount(&mock_server)
        .await;
    Mock::given(method("GET"))
        .and(path("/sample_pvd_spreadsheet_id/export"))
        .respond_with(
            ResponseTemplate::new(200).set_body_string("Symbol,Date,Quantity,Price,Currency\n"),
        )
        .mount(&mock_server)
        .await;

    let reb_settings = Arc::new(Settings {
        sheets_base_url: mock_server.uri(),
        ..Settings::default()
    });
    let reb_http = Arc::new(HttpResources::new(&reb_settings));
    let reb_state = AppState::with_yahoo_provider(reb_settings, reb_http, Arc::new(MockYahoo));

    let targets = HashMap::from([
        ("AAPL".to_string(), 60.0),
        ("NVDA".to_string(), 40.0),
        ("PTT.BK".to_string(), 100.0),
    ]);
    let std_reb = reb_state
        .portfolio
        .tools_service
        .calculate_rebalance(&RebalanceCalculateRequest {
            mode: RebalanceMode::Standard,
            no_sell_sub_mode: NoSellSubMode::MinInflow,
            custom_cash_deposit: 0.0,
            target_allocations: targets.clone(),
            currency: "USD".to_string(),
        })
        .await;
    assert!(std_reb.is_valid);
    assert!(std_reb.total_current_portfolio_value > 0.0);

    let min_inflow = reb_state
        .portfolio
        .tools_service
        .calculate_rebalance(&RebalanceCalculateRequest {
            mode: RebalanceMode::NoSell,
            no_sell_sub_mode: NoSellSubMode::MinInflow,
            custom_cash_deposit: 0.0,
            target_allocations: targets.clone(),
            currency: "USD".to_string(),
        })
        .await;
    assert!(min_inflow.is_valid);
    assert_relative_eq!(min_inflow.total_sell_amount, 0.0, epsilon = 1e-6);

    let custom_dep = reb_state
        .portfolio
        .tools_service
        .calculate_rebalance(&RebalanceCalculateRequest {
            mode: RebalanceMode::NoSell,
            no_sell_sub_mode: NoSellSubMode::CustomDeposit,
            custom_cash_deposit: 2000.0,
            target_allocations: targets,
            currency: "USD".to_string(),
        })
        .await;
    assert!(custom_dep.is_valid);
    assert_relative_eq!(custom_dep.total_sell_amount, 0.0, epsilon = 1e-6);
    assert_relative_eq!(custom_dep.cash_contribution, 2000.0, epsilon = 1e-4);
}
