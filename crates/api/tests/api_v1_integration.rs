use std::str::FromStr;
use std::sync::Arc;

use axum::body::Body;
use http::{Request, StatusCode};
use http_body_util::BodyExt;
use rust_decimal::Decimal;
use sgsk_api::create_app;
use sgsk_api::state::{ApiConfig, ApiState};
use sgsk_application::ports::{
    FundNavPort, IdentityProfilePort, MarketPricePort, PortFuture, TransactionSheetPort,
};
use sgsk_common::AppError;
use sgsk_domain::AssetTabId;
use tower::ServiceExt;

struct StubSheetPort;
impl TransactionSheetPort for StubSheetPort {
    fn fetch_tab_csv<'a>(&'a self, _tab: AssetTabId) -> PortFuture<'a, Result<String, AppError>> {
        Box::pin(async {
            Ok("Symbol,Date,Quantity,Price,Currency,Asset Type,Transaction Type\nAAPL,2025-01-10,10,100.0,USD,us-stock,BUY\n".to_string())
        })
    }
    fn fetch_all_tabs_csv<'a>(
        &'a self,
    ) -> PortFuture<'a, Result<Vec<(AssetTabId, String)>, AppError>> {
        Box::pin(async {
            Ok(vec![(
                AssetTabId::UsStock,
                "Symbol,Date,Quantity,Price,Currency,Asset Type,Transaction Type\nAAPL,2025-01-10,10,100.0,USD,us-stock,BUY\n".to_string(),
            )])
        })
    }
}

struct StubPricePort;
impl MarketPricePort for StubPricePort {
    fn fetch_fx_rate<'a>(
        &'a self,
        _from: &'a str,
        _to: &'a str,
    ) -> PortFuture<'a, Result<Decimal, AppError>> {
        Box::pin(async { Ok(Decimal::from_str("35.25").unwrap()) })
    }
}

struct StubNavPort;
impl FundNavPort for StubNavPort {
    fn fetch_nav<'a>(&'a self, _sym: &'a str) -> PortFuture<'a, Result<Option<Decimal>, AppError>> {
        Box::pin(async { Ok(None) })
    }
}

struct StubIdentityPort;
impl IdentityProfilePort for StubIdentityPort {
    fn fetch_profile_flags<'a>(
        &'a self,
        user_id: &'a str,
        _token: &'a str,
    ) -> PortFuture<'a, Result<Option<(String, bool)>, AppError>> {
        Box::pin(async move {
            match user_id {
                "owner-1" => Ok(Some(("owner".to_string(), true))),
                "user-1" => Ok(Some(("user".to_string(), false))),
                _ => Ok(None),
            }
        })
    }
}

fn test_state() -> Arc<ApiState> {
    Arc::new(ApiState {
        config: ApiConfig {
            backend_api_key: "test-api-key".to_string(),
            backend_api_key_previous: String::new(),
            is_development: false,
        },
        sheets: Arc::new(StubSheetPort),
        prices: Arc::new(StubPricePort),
        navs: Arc::new(StubNavPort),
        identity: Arc::new(StubIdentityPort),
    })
}

async fn body_json(res: axum::response::Response) -> serde_json::Value {
    let bytes = res.into_body().collect().await.unwrap().to_bytes();
    serde_json::from_slice(&bytes).unwrap()
}

#[tokio::test]
async fn dual_mounts_v1_and_legacy_backend_health_with_security_headers() {
    let app = create_app(test_state());
    for uri in ["/api/v1/health", "/api/backend/health"] {
        let res = app
            .clone()
            .oneshot(Request::builder().uri(uri).body(Body::empty()).unwrap())
            .await
            .unwrap();
        assert_eq!(res.status(), StatusCode::OK);
        assert_eq!(
            res.headers()
                .get("x-content-type-options")
                .unwrap()
                .to_str()
                .unwrap(),
            "nosniff"
        );
        let json = body_json(res).await;
        assert_eq!(json["message"], "Welcome to SGSKBackend!");
    }
}

#[tokio::test]
async fn enforces_api_key_and_owner_rls_isolation_on_cloud_portfolio() {
    let app = create_app(test_state());

    // 1. Missing X-API-Key -> 401 with WWW-Authenticate: ApiKey
    let no_key = app
        .clone()
        .oneshot(
            Request::builder()
                .uri("/api/v1/auth/me")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(no_key.status(), StatusCode::UNAUTHORIZED);
    assert_eq!(no_key.headers().get("www-authenticate").unwrap(), "ApiKey");

    // 2. Guest /auth/me -> portfolioSource: "local"
    let guest_me = app
        .clone()
        .oneshot(
            Request::builder()
                .uri("/api/v1/auth/me")
                .header("X-API-Key", "test-api-key")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(guest_me.status(), StatusCode::OK);
    assert_eq!(body_json(guest_me).await["portfolioSource"], "local");

    // 3. Guest cannot access cloud share-lot -> 401
    let guest_sheet = app
        .clone()
        .oneshot(
            Request::builder()
                .uri("/api/v1/share-lot/sheet/us-stock")
                .header("X-API-Key", "test-api-key")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(guest_sheet.status(), StatusCode::UNAUTHORIZED);

    // 4. Non-owner authenticated user cannot access cloud share-lot -> 403
    let non_owner_sheet = app
        .clone()
        .oneshot(
            Request::builder()
                .uri("/api/v1/share-lot/sheet/us-stock")
                .header("X-API-Key", "test-api-key")
                .header("Authorization", "Bearer tok")
                .header("x-user-id", "user-1")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(non_owner_sheet.status(), StatusCode::FORBIDDEN);

    // 5. Authorized owner gets 200 with Decimal FIFO result
    let owner_sheet = app
        .oneshot(
            Request::builder()
                .uri("/api/v1/share-lot/sheet/us-stock")
                .header("X-API-Key", "test-api-key")
                .header("Authorization", "Bearer tok")
                .header("x-user-id", "owner-1")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(owner_sheet.status(), StatusCode::OK);
    let body = body_json(owner_sheet).await;
    assert_eq!(body["openSummaries"][0]["symbol"], "AAPL");
    assert_eq!(body["openSummaries"][0]["totalShares"], "10");
}

#[tokio::test]
async fn tools_and_fx_endpoints_return_decimal_string_outputs() {
    let app = create_app(test_state());

    let fx_res = app
        .clone()
        .oneshot(
            Request::builder()
                .uri("/api/v1/price/exchange-rate?from_currency=USD&to_currency=THB")
                .header("X-API-Key", "test-api-key")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(fx_res.status(), StatusCode::OK);
    assert_eq!(body_json(fx_res).await["rate"], "35.25");

    let sim_body = serde_json::json!({
        "initialPosition": {
            "shares": "10",
            "avgCost": "100",
            "totalCost": "1000",
            "marketPrice": "120",
            "currency": "USD"
        },
        "steps": [{
            "action": "BUY",
            "shares": "10",
            "price": "80",
            "feePercent": "0"
        }],
        "taxFeePercent": "0"
    });
    let sim_res = app
        .oneshot(
            Request::builder()
                .method("POST")
                .uri("/api/v1/portfolio/tools/simulate")
                .header("X-API-Key", "test-api-key")
                .header("Content-Type", "application/json")
                .body(Body::from(sim_body.to_string()))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(sim_res.status(), StatusCode::OK);
    let sim_json = body_json(sim_res).await;
    assert_eq!(sim_json["simulated"]["totalShares"], "20");
    assert_eq!(sim_json["simulated"]["averageCost"], "90");
}
