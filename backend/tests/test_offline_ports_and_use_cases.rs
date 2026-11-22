use std::collections::HashMap;
use std::sync::atomic::{AtomicUsize, Ordering};
use std::sync::Arc;

use approx::assert_relative_eq;
use axum::body::Body;
use axum::http::{Request, StatusCode};
use chrono::Utc;
use http_body_util::BodyExt;
use jsonwebtoken::{encode, Algorithm, EncodingKey, Header};
use serde_json::{json, Map, Value};
use sgsk_backend::config::settings::Settings;
use sgsk_backend::config::sheet_config::{AssetTab, ASSET_TABS};
use sgsk_backend::create_app;
use sgsk_backend::features::dividends::services::dividend_service::DividendService;
use sgsk_backend::features::market_data::models::factsheet::FundFactsheetResponse;
use sgsk_backend::features::market_data::services::price_service::{
    StockDividendEvent, StockDividendResult,
};
use sgsk_backend::features::portfolio::models::transaction::PriceData;
use sgsk_backend::features::portfolio::services::allocation_service::AllocationService;
use sgsk_backend::features::portfolio::services::performance_service::PerformanceService;
use sgsk_backend::features::portfolio::services::share_lot_service::ShareLotService;
use sgsk_backend::features::portfolio::services::valuation_service::ValuationService;
use sgsk_backend::features::tools::models::tools::SimulateOrderRequest;
use sgsk_backend::features::tools::services::tools_service::ToolsService;
use sgsk_backend::ports::{
    FundNavPort, IdentityProfilePort, MarketPricePort, PortFuture, TransactionSheetPort,
};
use sgsk_backend::state::AppState;
use sgsk_backend::utils::cache::{AsyncSingleflight, TTLCache};
use sgsk_backend::utils::http_client::HttpResources;
use sgsk_backend::utils::supabase_auth::SupabaseTokenVerifier;
use tower::ServiceExt;

#[derive(Clone)]
struct MockSheetPort {
    tabs: HashMap<String, Result<String, String>>,
    all_error: Option<String>,
}

impl TransactionSheetPort for MockSheetPort {
    fn fetch_tab_csv<'a>(&'a self, tab: &'a AssetTab) -> PortFuture<'a, Result<String, String>> {
        Box::pin(async move {
            match self.tabs.get(tab.id) {
                Some(res) => res.clone(),
                None => Ok(String::new()),
            }
        })
    }

    fn fetch_all_tabs_csv<'a>(
        &'a self,
    ) -> PortFuture<'a, Result<Vec<(&'static AssetTab, String)>, String>> {
        Box::pin(async move {
            if let Some(err) = &self.all_error {
                return Err(err.clone());
            }

            let mut results = Vec::new();
            let mut first_error: Option<String> = None;
            for tab in ASSET_TABS.iter().filter(|t| !t.sheet_gid.is_empty()) {
                if let Some(entry) = self.tabs.get(tab.id) {
                    match entry {
                        Ok(csv) => results.push((tab, csv.clone())),
                        Err(err) => {
                            if first_error.is_none() {
                                first_error = Some(err.clone());
                            }
                        }
                    }
                }
            }

            if results.is_empty() {
                if let Some(err) = first_error {
                    return Err(err);
                }
            }
            Ok(results)
        })
    }
}

#[derive(Clone, Default)]
struct MockPricePort {
    quotes: HashMap<String, PriceData>,
    fx_rate: f64,
    stock_dividends: HashMap<String, StockDividendResult>,
}

impl MarketPricePort for MockPricePort {
    fn fetch_quotes<'a>(
        &'a self,
        _summaries: &'a [HashMap<String, String>],
    ) -> PortFuture<'a, HashMap<String, PriceData>> {
        Box::pin(async move { self.quotes.clone() })
    }

    fn fetch_fx_rate<'a>(
        &'a self,
        _from_currency: &'a str,
        _to_currency: &'a str,
    ) -> PortFuture<'a, f64> {
        Box::pin(async move { self.fx_rate })
    }

    fn fetch_stock_dividends<'a>(
        &'a self,
        _symbols: &'a [String],
    ) -> PortFuture<'a, HashMap<String, StockDividendResult>> {
        Box::pin(async move { self.stock_dividends.clone() })
    }
}

#[derive(Clone, Default)]
struct MockNavPort {
    navs: HashMap<String, PriceData>,
    fund_dividends: HashMap<String, Vec<Map<String, Value>>>,
    pvd_policies: HashMap<String, Map<String, Value>>,
}

impl FundNavPort for MockNavPort {
    fn fetch_navs<'a>(
        &'a self,
        _symbols: &'a [String],
    ) -> PortFuture<'a, HashMap<String, PriceData>> {
        Box::pin(async move { self.navs.clone() })
    }

    fn fetch_factsheet<'a>(
        &'a self,
        symbol: &'a str,
        asset_type: &'a str,
        _fund_name: Option<&'a str>,
    ) -> PortFuture<'a, FundFactsheetResponse> {
        Box::pin(async move { FundFactsheetResponse::empty(symbol, symbol, asset_type) })
    }

    fn fetch_fund_dividends<'a>(
        &'a self,
        _symbols: &'a [String],
    ) -> PortFuture<'a, HashMap<String, Vec<Map<String, Value>>>> {
        Box::pin(async move { self.fund_dividends.clone() })
    }

    fn fetch_pvd_policies<'a>(
        &'a self,
        _proj_id: Option<&'a str>,
        _fund_name: Option<&'a str>,
    ) -> PortFuture<'a, HashMap<String, Map<String, Value>>> {
        Box::pin(async move { self.pvd_policies.clone() })
    }
}

struct MockProfilePort {
    result: Option<(String, bool)>,
    calls: AtomicUsize,
}

impl MockProfilePort {
    fn new(result: Option<(String, bool)>) -> Self {
        Self {
            result,
            calls: AtomicUsize::new(0),
        }
    }
}

impl IdentityProfilePort for MockProfilePort {
    fn fetch_profile_flags<'a>(
        &'a self,
        _user_id: &'a str,
        _token: &'a str,
        _settings: &'a Settings,
    ) -> PortFuture<'a, Option<(String, bool)>> {
        Box::pin(async move {
            self.calls.fetch_add(1, Ordering::SeqCst);
            self.result.clone()
        })
    }
}

fn sample_sheet_tabs() -> HashMap<String, Result<String, String>> {
    HashMap::from([
        (
            "us-stock".to_string(),
            Ok("Symbol,Date,Quantity,Price,Currency\nAAPL,2026-01-10,10,100,USD\n".to_string()),
        ),
        (
            "thai-stock".to_string(),
            Ok("Symbol,Date,Quantity,Price,Currency\nPTT.BK,2026-01-15,100,30,THB\n".to_string()),
        ),
        (
            "mutual-fund".to_string(),
            Ok(
                "Symbol,Date,Type,Quantity,Price,Currency,ExchangeFrom,ExchangeTo\nK-USA-A(D),2026-02-01,Buy,500,10,THB,,\n"
                    .to_string(),
            ),
        ),
    ])
}

fn sample_price_port() -> MockPricePort {
    MockPricePort {
        quotes: HashMap::from([
            (
                "AAPL".to_string(),
                PriceData {
                    symbol: "AAPL".to_string(),
                    name: Some("Apple Inc.".to_string()),
                    name_th: Some("Apple Inc.".to_string()),
                    price: 150.0,
                    currency: "USD".to_string(),
                },
            ),
            (
                "PTT.BK".to_string(),
                PriceData {
                    symbol: "PTT.BK".to_string(),
                    name: Some("PTT PCL".to_string()),
                    name_th: Some("ปตท.".to_string()),
                    price: 35.0,
                    currency: "THB".to_string(),
                },
            ),
            (
                "K-USA-A(D)".to_string(),
                PriceData {
                    symbol: "K-USA-A(D)".to_string(),
                    name: Some("K-USA-A(D)".to_string()),
                    name_th: Some("เค ยูเอสเอ".to_string()),
                    price: 12.0,
                    currency: "THB".to_string(),
                },
            ),
        ]),
        fx_rate: 34.0,
        stock_dividends: HashMap::from([(
            "AAPL".to_string(),
            StockDividendResult {
                trailing_12m_dps: 0.5,
                dividends: vec![StockDividendEvent {
                    amount: 0.5,
                    date: chrono::NaiveDate::from_ymd_opt(2026, 6, 10)
                        .unwrap()
                        .and_hms_opt(0, 0, 0)
                        .unwrap()
                        .and_utc()
                        .timestamp(),
                }],
            },
        )]),
    }
}

fn sample_nav_port() -> MockNavPort {
    let mut fund_row = Map::new();
    fund_row.insert("proj_id".to_string(), json!("M0001_2560"));
    fund_row.insert("class_abbr_name".to_string(), json!("K-USA-A(D)"));
    fund_row.insert("book_close_date".to_string(), json!("2026-06-15"));
    fund_row.insert("dividend_date".to_string(), json!("2026-06-25"));
    fund_row.insert("dividend_value".to_string(), json!(0.2));

    MockNavPort {
        navs: HashMap::from([(
            "K-USA-A(D)".to_string(),
            PriceData {
                symbol: "K-USA-A(D)".to_string(),
                name: Some("K-USA-A(D)".to_string()),
                name_th: Some("เค ยูเอสเอ".to_string()),
                price: 12.0,
                currency: "THB".to_string(),
            },
        )]),
        fund_dividends: HashMap::from([("K-USA-A(D)".to_string(), vec![fund_row])]),
        pvd_policies: HashMap::new(),
    }
}

#[tokio::test]
async fn test_offline_use_cases_valuation_performance_allocation_and_dividends() {
    let cache = Arc::new(TTLCache::new(60.0, 1000));
    let singleflight = Arc::new(AsyncSingleflight::new());

    let sheet_port: Arc<dyn TransactionSheetPort> = Arc::new(MockSheetPort {
        tabs: sample_sheet_tabs(),
        all_error: None,
    });
    let price_port: Arc<dyn MarketPricePort> = Arc::new(sample_price_port());
    let nav_port: Arc<dyn FundNavPort> = Arc::new(sample_nav_port());

    let share_lot_svc =
        ShareLotService::with_port(sheet_port, Arc::clone(&cache), Arc::clone(&singleflight));
    let valuation_svc = ValuationService::with_ports(
        share_lot_svc,
        Arc::clone(&price_port),
        Arc::clone(&nav_port),
        Arc::clone(&cache),
        Arc::clone(&singleflight),
    );
    let performance_svc = PerformanceService::new(
        valuation_svc.clone(),
        Arc::clone(&cache),
        Arc::clone(&singleflight),
    );
    let allocation_svc = AllocationService::new(valuation_svc.clone());
    let dividend_svc = DividendService::with_ports(
        valuation_svc.clone(),
        price_port,
        nav_port,
        cache,
        singleflight,
    );

    // 1. Valuation: (10*100*34) + (100*30) + (500*10) = 42,000 THB invested; value = 60,500 THB
    let holdings = valuation_svc.get_portfolio_holdings("all", "THB").await;
    assert_eq!(holdings.error, None);
    assert_eq!(holdings.open_positions.len(), 3);
    assert_relative_eq!(holdings.exchange_rate, 34.0, epsilon = 1e-6);
    assert_relative_eq!(holdings.summary.total_invested, 42_000.0, epsilon = 1e-4);
    assert_relative_eq!(holdings.summary.total_value, 60_500.0, epsilon = 1e-4);
    assert_relative_eq!(
        holdings.summary.total_unrealized_pl,
        18_500.0,
        epsilon = 1e-4
    );

    // 2. Performance
    let perf = performance_svc
        .get_performance_analytics("ALL", None, None, "THB")
        .await;
    assert_eq!(perf.error, None);
    assert_relative_eq!(perf.summary.total_value, 60_500.0, epsilon = 1e-4);
    assert_eq!(perf.symbol_performance.len(), 3);

    // 3. Allocation
    let alloc = allocation_svc.calculate_allocation(None, "THB").await;
    assert_eq!(alloc.error, None);
    assert_relative_eq!(alloc.total_portfolio_value, 60_500.0, epsilon = 1e-4);
    assert!(!alloc.recommendations.is_empty());
    assert_eq!(alloc.holdings_concentration.len(), 3);

    // 4. Dividends: AAPL 10 * 0.5 * (1 - 0.15) * 34 = 144.5 THB; K-USA-A(D) 500 * 0.2 * (1 - 0.10) = 90.0 THB
    let div = dividend_svc.get_dividend_analytics("THB", "all").await;
    assert_eq!(div.error, None);
    assert_eq!(div.records.len(), 2);
    assert_relative_eq!(div.total_net_dividends, 234.5, epsilon = 1e-4);
}

#[tokio::test]
async fn test_identity_profile_port_injection_and_caching() {
    let settings = Settings {
        supabase_url: "https://offline.supabase.local".to_string(),
        supabase_jwt_secret: "offline_hs256_secret_key_for_unit_tests_32chars".to_string(),
        authorized_portfolio_emails: vec!["offline@example.com".to_string()],
        ..Settings::default()
    };
    let http = Arc::new(HttpResources::new(&settings));
    let cache = Arc::new(TTLCache::new(60.0, 1000));
    let singleflight = Arc::new(AsyncSingleflight::new());
    let profile_port = Arc::new(MockProfilePort::new(Some(("owner".to_string(), true))));

    let verifier = SupabaseTokenVerifier::with_profile_port(
        Arc::clone(&http),
        cache,
        Arc::clone(&singleflight),
        Arc::clone(&profile_port) as Arc<dyn IdentityProfilePort>,
    );

    let exp = (Utc::now().timestamp() + 3600) as u64;
    let token = encode(
        &Header::new(Algorithm::HS256),
        &json!({
            "sub": "usr-offline-1",
            "email": "offline@example.com",
            "aud": "authenticated",
            "iss": settings.resolved_supabase_issuer(),
            "exp": exp,
            "email_confirmed_at": "2026-01-01T00:00:00Z"
        }),
        &EncodingKey::from_secret(settings.supabase_jwt_secret.as_bytes()),
    )
    .unwrap();

    let first = verifier.verify_token(&token, &settings).await.unwrap();
    assert_eq!(first.role, "owner");
    assert!(first.can_view_cloud_portfolio);

    let second = verifier.verify_token(&token, &settings).await.unwrap();
    assert!(second.can_view_cloud_portfolio);
    assert_eq!(profile_port.calls.load(Ordering::SeqCst), 1);

    // Verify IdentityProfilePort false flag overrides allowlisted email
    let denied_port = Arc::new(MockProfilePort::new(Some(("viewer".to_string(), false))));
    let denied_verifier = SupabaseTokenVerifier::with_profile_port(
        http,
        Arc::new(TTLCache::new(60.0, 1000)),
        singleflight,
        denied_port,
    );
    let denied = denied_verifier
        .verify_token(&token, &settings)
        .await
        .unwrap();
    assert_eq!(denied.role, "viewer");
    assert!(!denied.can_view_cloud_portfolio);
}

fn build_offline_router_and_token(
    tabs: HashMap<String, Result<String, String>>,
    all_error: Option<String>,
) -> (axum::Router, String) {
    let settings = Settings {
        supabase_url: "https://offline.supabase.local".to_string(),
        supabase_jwt_secret: "offline_hs256_secret_key_for_unit_tests_32chars".to_string(),
        authorized_portfolio_emails: vec!["router-owner@example.com".to_string()],
        ..Settings::default()
    };
    let exp = (Utc::now().timestamp() + 3600) as u64;
    let token = encode(
        &Header::new(Algorithm::HS256),
        &json!({
            "sub": "usr-router-owner",
            "email": "router-owner@example.com",
            "aud": "authenticated",
            "iss": settings.resolved_supabase_issuer(),
            "exp": exp,
            "email_confirmed_at": "2026-01-01T00:00:00Z"
        }),
        &EncodingKey::from_secret(settings.supabase_jwt_secret.as_bytes()),
    )
    .unwrap();

    let sheet_port: Arc<dyn TransactionSheetPort> = Arc::new(MockSheetPort { tabs, all_error });
    let price_port: Arc<dyn MarketPricePort> = Arc::new(sample_price_port());
    let nav_port: Arc<dyn FundNavPort> = Arc::new(sample_nav_port());
    let profile_port: Arc<dyn IdentityProfilePort> =
        Arc::new(MockProfilePort::new(Some(("owner".to_string(), true))));

    let state = AppState::with_ports(settings, sheet_port, price_port, nav_port, profile_port);
    (create_app(state), token)
}

#[tokio::test]
async fn test_router_adr_d2_upstream_status_mapping_and_invalid_tab_preservation() {
    // 1. Happy path -> 200 OK across sheet + portfolio + invalid tab preservation
    let (ok_app, ok_token) = build_offline_router_and_token(sample_sheet_tabs(), None);

    let req_ok_sheet = Request::builder()
        .uri("/share-lot/sheet/us-stock")
        .header("X-API-Key", "dev_secret_key_change_in_prod")
        .header("Authorization", format!("Bearer {ok_token}"))
        .body(Body::empty())
        .unwrap();
    let res_ok_sheet = ok_app.clone().oneshot(req_ok_sheet).await.unwrap();
    assert_eq!(res_ok_sheet.status(), StatusCode::OK);

    // Invalid tab id preserves HTTP 200 + "Invalid tab id: non-existent-tab" (TC-API-SL-03)
    let req_invalid = Request::builder()
        .uri("/share-lot/sheet/non-existent-tab")
        .header("X-API-Key", "dev_secret_key_change_in_prod")
        .header("Authorization", format!("Bearer {ok_token}"))
        .body(Body::empty())
        .unwrap();
    let res_invalid = ok_app.clone().oneshot(req_invalid).await.unwrap();
    assert_eq!(res_invalid.status(), StatusCode::OK);
    let invalid_body: Value =
        serde_json::from_slice(&res_invalid.into_body().collect().await.unwrap().to_bytes())
            .unwrap();
    assert_eq!(invalid_body["error"], "Invalid tab id: non-existent-tab");

    for (method, uri, body_opt) in [
        ("GET", "/share-lot/sheets", None),
        ("GET", "/portfolio/holdings", None),
        ("GET", "/portfolio/performance", None),
        ("POST", "/portfolio/allocation", Some("{}")),
        ("GET", "/portfolio/dividend", None),
    ] {
        let req = Request::builder()
            .method(method)
            .uri(uri)
            .header("X-API-Key", "dev_secret_key_change_in_prod")
            .header("Authorization", format!("Bearer {ok_token}"))
            .header("Content-Type", "application/json")
            .body(
                body_opt
                    .map(|b| Body::from(b.to_string()))
                    .unwrap_or_else(Body::empty),
            )
            .unwrap();
        let res = ok_app.clone().oneshot(req).await.unwrap();
        assert_eq!(
            res.status(),
            StatusCode::OK,
            "expected 200 on {method} {uri}"
        );
    }

    // 2. Generic upstream gateway error -> 502 Bad Gateway with error message in JSON body
    let mut err_tabs = HashMap::new();
    err_tabs.insert(
        "us-stock".to_string(),
        Err("upstream HTTP 500 Internal Server Error".to_string()),
    );
    let (bad_gw_app, bad_gw_token) =
        build_offline_router_and_token(err_tabs, Some("upstream HTTP 500".to_string()));

    for (method, uri, body_opt) in [
        ("GET", "/share-lot/sheet/us-stock", None),
        ("GET", "/share-lot/sheets", None),
        ("GET", "/portfolio/holdings", None),
        ("GET", "/portfolio/performance", None),
        ("POST", "/portfolio/allocation", Some("{}")),
        ("GET", "/portfolio/dividend", None),
    ] {
        let req = Request::builder()
            .method(method)
            .uri(uri)
            .header("X-API-Key", "dev_secret_key_change_in_prod")
            .header("Authorization", format!("Bearer {bad_gw_token}"))
            .header("Content-Type", "application/json")
            .body(
                body_opt
                    .map(|b| Body::from(b.to_string()))
                    .unwrap_or_else(Body::empty),
            )
            .unwrap();
        let res = bad_gw_app.clone().oneshot(req).await.unwrap();
        assert_eq!(
            res.status(),
            StatusCode::BAD_GATEWAY,
            "expected 502 Bad Gateway on {method} {uri}"
        );
        let parsed: Value =
            serde_json::from_slice(&res.into_body().collect().await.unwrap().to_bytes()).unwrap();
        assert!(parsed["error"]
            .as_str()
            .unwrap_or("")
            .contains("Failed to fetch data"));
    }

    // 3. Timeout/unavailable upstream error -> 503 Service Unavailable with error message in JSON body
    let mut timeout_tabs = HashMap::new();
    timeout_tabs.insert(
        "us-stock".to_string(),
        Err("request timeout connecting to Google Sheets".to_string()),
    );
    let (unavail_app, unavail_token) = build_offline_router_and_token(
        timeout_tabs,
        Some("upstream service unavailable (timeout)".to_string()),
    );

    for (method, uri, body_opt) in [
        ("GET", "/share-lot/sheet/us-stock", None),
        ("GET", "/share-lot/sheets", None),
        ("GET", "/portfolio/holdings", None),
        ("GET", "/portfolio/performance", None),
        ("POST", "/portfolio/allocation", Some("{}")),
        ("GET", "/portfolio/dividend", None),
    ] {
        let req = Request::builder()
            .method(method)
            .uri(uri)
            .header("X-API-Key", "dev_secret_key_change_in_prod")
            .header("Authorization", format!("Bearer {unavail_token}"))
            .header("Content-Type", "application/json")
            .body(
                body_opt
                    .map(|b| Body::from(b.to_string()))
                    .unwrap_or_else(Body::empty),
            )
            .unwrap();
        let res = unavail_app.clone().oneshot(req).await.unwrap();
        assert_eq!(
            res.status(),
            StatusCode::SERVICE_UNAVAILABLE,
            "expected 503 Service Unavailable on {method} {uri}"
        );
        let parsed: Value =
            serde_json::from_slice(&res.into_body().collect().await.unwrap().to_bytes()).unwrap();
        assert!(parsed["error"]
            .as_str()
            .unwrap_or("")
            .contains("Failed to fetch data"));
    }
}

#[tokio::test]
async fn test_tools_simulate_skips_provident_fund_positions() {
    let cache = Arc::new(TTLCache::new(60.0, 1000));
    let singleflight = Arc::new(AsyncSingleflight::new());

    let mut tabs = sample_sheet_tabs();
    tabs.insert(
        "provident-fund".to_string(),
        Ok(
            "Fund,Symbol,Employee Contribution,Employer Matching,Employee Earnings,Employer Earnings,Employee Unit,Employer Unit,Currency\nTisco Master,Global Equity,\"1,000\",500,100,50,10,5,THB\n"
                .to_string(),
        ),
    );

    let sheet_port: Arc<dyn TransactionSheetPort> = Arc::new(MockSheetPort {
        tabs,
        all_error: None,
    });
    let price_port: Arc<dyn MarketPricePort> = Arc::new(sample_price_port());
    let nav_port: Arc<dyn FundNavPort> = Arc::new(sample_nav_port());

    let share_lot_svc =
        ShareLotService::with_port(sheet_port, Arc::clone(&cache), Arc::clone(&singleflight));
    let valuation_svc =
        ValuationService::with_ports(share_lot_svc, price_port, nav_port, cache, singleflight);

    let holdings = valuation_svc.get_portfolio_holdings("all", "THB").await;
    assert!(holdings
        .open_positions
        .iter()
        .any(|p| p.symbol == "Global Equity" && p.asset_type == "provident-fund"));

    let tools_svc = ToolsService::new(valuation_svc);

    let aapl_res = tools_svc
        .simulate_order(&SimulateOrderRequest {
            initial_position: None,
            symbol: Some("AAPL".to_string()),
            steps: vec![],
            currency: "THB".to_string(),
            tax_fee_percent: 0.0,
        })
        .await;
    assert_relative_eq!(aapl_res.initial.total_shares, 10.0, epsilon = 1e-6);

    let pvd_res = tools_svc
        .simulate_order(&SimulateOrderRequest {
            initial_position: None,
            symbol: Some("Global Equity".to_string()),
            steps: vec![],
            currency: "THB".to_string(),
            tax_fee_percent: 0.0,
        })
        .await;
    assert_relative_eq!(pvd_res.initial.total_shares, 0.0, epsilon = 1e-6);
    assert_relative_eq!(pvd_res.initial.average_cost, 0.0, epsilon = 1e-6);
}
