use std::sync::Arc;

use axum::body::Body;
use axum::http::{Request, StatusCode};
use http_body_util::BodyExt;
use serde_json::json;
use sgsk_backend::config::settings::Settings;
use sgsk_backend::create_app;
use sgsk_backend::features::market_data::services::icon_service::IconService;
use sgsk_backend::features::market_data::services::nav_service::NavService;
use sgsk_backend::state::AppState;
use sgsk_backend::utils::cache::{AsyncSingleflight, TTLCache};
use sgsk_backend::utils::http_client::HttpResources;
use sgsk_backend::utils::symbol_icon_utils::{
    build_logo_dev_url, clean_ticker_for_url, derive_amc_code, extract_brand_tokens,
    extract_domain_candidates, generate_amc_svg, generate_symbol_svg, get_symbol_color,
    get_symbol_logo_config, get_symbol_logo_config_with_base, get_symbol_monogram,
};
use tower::ServiceExt;
use wiremock::matchers::{header, method, path, query_param};
use wiremock::{Mock, MockServer, ResponseTemplate};

#[test]
fn test_symbol_icon_helpers_and_colors() {
    assert_eq!(clean_ticker_for_url("AAPL"), "AAPL");
    assert_eq!(clean_ticker_for_url("BRK.B"), "BRK-B");
    assert_eq!(clean_ticker_for_url("PTT.BK"), "PTT");
    assert_eq!(clean_ticker_for_url("K-USA-A(D).FUND"), "K-USA-A(D)");

    assert_eq!(get_symbol_monogram("AAPL"), "AA");
    assert_eq!(get_symbol_monogram("BTC"), "BTC");
    assert_eq!(get_symbol_monogram("PTT"), "PTT");
    assert_eq!(get_symbol_monogram(""), "?");
    assert_eq!(get_symbol_monogram("ES-GTECHSSF"), "ES");

    assert_eq!(get_symbol_color("AAPL"), "#19b3eb");
    assert_eq!(get_symbol_color("aapl"), "#19b3eb");
    assert_eq!(get_symbol_color("BTC"), "#2e6fd6");
    assert_eq!(get_symbol_color("BTC.CRYPTO"), "#2e6fd6");
    assert_eq!(get_symbol_color("PTT"), "#c93822");
    assert_eq!(get_symbol_color("PTT.BK"), "#c93822");
    assert_eq!(get_symbol_color("ES-GTECHSSF"), "#bee133");
    assert_eq!(get_symbol_color("BRK.B"), "#66be27");
    assert_eq!(get_symbol_color(""), "#6366f1");

    let us_cfg = get_symbol_logo_config("AAPL", "us-stock");
    assert!(!us_cfg.is_mutual_fund);
    assert_eq!(
        us_cfg.primary_url.as_deref(),
        Some("https://img.logo.dev/ticker/AAPL?format=png&size=128&fallback=404")
    );
    assert!(us_cfg.secondary_url.is_none());

    let us_with_token = get_symbol_logo_config_with_base(
        "AAPL",
        "us-stock",
        "https://img.logo.dev",
        Some("pk_123"),
    );
    assert_eq!(
        us_with_token.primary_url.as_deref(),
        Some("https://img.logo.dev/ticker/AAPL?format=png&size=128&fallback=404&token=pk_123")
    );

    let th_cfg = get_symbol_logo_config("PTT.BK", "thai-stock");
    assert_eq!(
        th_cfg.primary_url.as_deref(),
        Some("https://img.logo.dev/ticker/PTT.BK?format=png&size=128&fallback=404")
    );
    assert_eq!(
        th_cfg.secondary_url.as_deref(),
        Some("https://img.logo.dev/ticker/PTT?format=png&size=128&fallback=404")
    );

    let crypto_cfg = get_symbol_logo_config("BTC.CRYPTO", "crypto");
    assert_eq!(
        crypto_cfg.primary_url.as_deref(),
        Some("https://img.logo.dev/crypto/btc?format=png&size=128&fallback=404")
    );
    assert!(crypto_cfg.secondary_url.is_none());

    let mf_cfg = get_symbol_logo_config("SCBSET.FUND", "mutual-fund");
    assert!(mf_cfg.is_mutual_fund);
    assert!(mf_cfg.primary_url.is_none());

    assert_eq!(
        build_logo_dev_url("https://img.logo.dev", "kasikornasset.com", Some("pk_test")),
        "https://img.logo.dev/kasikornasset.com?format=png&size=128&fallback=404&token=pk_test"
    );

    assert_eq!(
        extract_domain_candidates(Some("https://www.ktam.co.th/th/home")),
        vec!["www.ktam.co.th", "ktam.co.th"]
    );
    assert_eq!(
        extract_domain_candidates(Some("https://www.bualuang.com/fund")),
        vec!["www.bualuang.com", "bualuang.com"]
    );
    assert!(extract_domain_candidates(Some("")).is_empty());

    assert_eq!(
        extract_brand_tokens(Some("Krungthai Asset Management Public Company Limited")),
        vec!["KRUNGTHAI"]
    );
    assert_eq!(
        derive_amc_code(Some("Kasikorn Asset Management Co., Ltd."), Some("KAsset")),
        "KASSET"
    );

    let sym_svg = String::from_utf8(generate_symbol_svg("NVDA", "us-stock")).unwrap();
    assert!(sym_svg.contains("<svg"));
    assert!(sym_svg.contains("NV"));

    let amc_svg = String::from_utf8(generate_amc_svg("KTAM", "#19b3eb")).unwrap();
    assert!(amc_svg.contains("<svg"));
    assert!(amc_svg.contains("KTAM"));
}

#[tokio::test]
async fn test_icon_service_caching_and_router_endpoints() {
    let mock_server = MockServer::start().await;

    // Mock SEC PVD /factsheet/fund returning an AMC without a resolved website_host -> deterministic AMC SVG
    Mock::given(method("POST"))
        .and(path("/v1/pvd/factsheet/fund"))
        .respond_with(ResponseTemplate::new(200).set_body_json(json!([
            {
                "proj_id": "M9999",
                "proj_name_th": "Mock PVD Fund",
                "unique_id": "AMC001",
                "fund_status": "RG"
            }
        ])))
        .mount(&mock_server)
        .await;

    Mock::given(method("GET"))
        .and(path("/v1/pvd/factsheet/amc"))
        .respond_with(ResponseTemplate::new(200).set_body_json(json!([
            {
                "unique_id": "AMC001",
                "name_en": "Kasikorn Asset Management Co., Ltd.",
                "abbr_name": "KASSET"
            }
        ])))
        .mount(&mock_server)
        .await;

    Mock::given(method("GET"))
        .and(path("/v2/fund/general-info/amcs"))
        .respond_with(ResponseTemplate::new(200).set_body_json(json!({ "items": [] })))
        .mount(&mock_server)
        .await;

    let settings = Settings {
        sec_subscription_key: "test-sec-key".to_string(),
        sec_pvd_base_url: format!("{}/v1/pvd", mock_server.uri()),
        sec_mf_base_url: format!("{}/v2/fund", mock_server.uri()),
        supabase_url: String::new(),
        ..Settings::default()
    };

    // Direct IconService cache verification
    let settings_arc = Arc::new(settings.clone());
    let http = Arc::new(HttpResources::new(&settings_arc));
    let cache = Arc::new(TTLCache::new(3600.0, 200));
    let sf = Arc::new(AsyncSingleflight::new());
    let nav_svc = NavService::new(
        Arc::clone(&settings_arc),
        Arc::clone(&http),
        Arc::clone(&cache),
        Arc::clone(&sf),
    );
    let icon_svc = IconService::new(
        Arc::clone(&settings_arc),
        Arc::clone(&http),
        Arc::clone(&cache),
        Arc::clone(&sf),
        nav_svc,
    );

    cache.set(
        "icon:AAPL:us-stock".to_string(),
        (b"PNG-MOCK-ICON-BYTES".to_vec(), "image/png".to_string()),
        Some(3600.0),
    );
    let (bytes, media_type) = icon_svc.get_symbol_icon("AAPL", "us-stock", "").await;
    assert_eq!(bytes, b"PNG-MOCK-ICON-BYTES");
    assert_eq!(media_type, "image/png");

    // Router integration tests
    let app = create_app(AppState::from_settings(settings));

    // /icon/meta/AAPL
    let meta_req = Request::builder()
        .uri("/icon/meta/AAPL")
        .header("X-API-Key", "dev_secret_key_change_in_prod")
        .body(Body::empty())
        .unwrap();
    let meta_resp = app.clone().oneshot(meta_req).await.unwrap();
    assert_eq!(meta_resp.status(), StatusCode::OK);
    let meta_bytes = meta_resp.into_body().collect().await.unwrap().to_bytes();
    let meta_json: serde_json::Value = serde_json::from_slice(&meta_bytes).unwrap();
    assert_eq!(meta_json["symbol"], "AAPL");
    assert_eq!(meta_json["monogram"], "AA");
    assert_eq!(meta_json["brand_color"], "#19b3eb");

    // /icon?symbol=PVDSP500&asset_type=provident-fund&fund_name=Mock%20PVD%20Fund
    let pvd_icon_req = Request::builder()
        .uri("/icon?symbol=PVDSP500&asset_type=provident-fund&fund_name=Mock%20PVD%20Fund")
        .body(Body::empty())
        .unwrap();
    let pvd_resp = app.clone().oneshot(pvd_icon_req).await.unwrap();
    assert_eq!(pvd_resp.status(), StatusCode::OK);
    let ct = pvd_resp
        .headers()
        .get("content-type")
        .and_then(|v| v.to_str().ok())
        .unwrap_or("");
    assert!(
        ct.contains("image/svg+xml"),
        "unexpected content-type: {ct}"
    );
    let pvd_svg_bytes = pvd_resp.into_body().collect().await.unwrap().to_bytes();
    let pvd_svg = String::from_utf8_lossy(&pvd_svg_bytes);
    assert!(
        pvd_svg.contains("KASSET"),
        "expected AMC code in SVG: {pvd_svg}"
    );

    // /icon/meta for PVD also carries resolved AMC details and query-encoded icon_url
    let pvd_meta_req = Request::builder()
        .uri("/icon/meta/PVDSP500?asset_type=provident-fund&fund_name=Mock%20PVD%20Fund")
        .header("X-API-Key", "dev_secret_key_change_in_prod")
        .body(Body::empty())
        .unwrap();
    let pvd_meta_resp = app.oneshot(pvd_meta_req).await.unwrap();
    assert_eq!(pvd_meta_resp.status(), StatusCode::OK);
    let pvd_meta_body = pvd_meta_resp
        .into_body()
        .collect()
        .await
        .unwrap()
        .to_bytes();
    let pvd_meta: serde_json::Value = serde_json::from_slice(&pvd_meta_body).unwrap();
    assert_eq!(pvd_meta["is_mutual_fund"], true);
    assert!(pvd_meta["icon_url"]
        .as_str()
        .unwrap()
        .contains("fund_name=Mock%20PVD%20Fund"));
}

#[tokio::test]
async fn test_logo_dev_and_supabase_l2_caching_pipeline() {
    let mock_server = MockServer::start().await;
    let fake_png_bytes = vec![0x89u8; 120]; // > 50 bytes

    // 1. Mock Supabase L2 cache MISS on NVDA, followed by Logo.dev Ticker HIT and Supabase Storage + Table write
    Mock::given(method("GET"))
        .and(path("/rest/v1/symbol_logo_cache"))
        .and(query_param("cache_key", "eq.icon:NVDA:us-stock"))
        .respond_with(ResponseTemplate::new(200).set_body_json(json!([])))
        .mount(&mock_server)
        .await;

    Mock::given(method("GET"))
        .and(path("/logo-img/ticker/NVDA"))
        .and(query_param("token", "pk_test_123"))
        .and(query_param("fallback", "404"))
        .respond_with(
            ResponseTemplate::new(200)
                .insert_header("content-type", "image/png")
                .set_body_bytes(fake_png_bytes.clone()),
        )
        .expect(1)
        .mount(&mock_server)
        .await;

    Mock::given(method("POST"))
        .and(path(
            "/storage/v1/object/symbol-logos/tickers/us-stock/NVDA.png",
        ))
        .and(header("x-upsert", "true"))
        .respond_with(
            ResponseTemplate::new(200)
                .set_body_json(json!({"Key": "symbol-logos/tickers/us-stock/NVDA.png"})),
        )
        .expect(1)
        .mount(&mock_server)
        .await;

    Mock::given(method("POST"))
        .and(path("/rest/v1/symbol_logo_cache"))
        .respond_with(ResponseTemplate::new(201))
        .mount(&mock_server)
        .await;

    // 2. Mock Supabase L2 cache HIT on MSFT (simulating cold start where L1 is empty, avoiding Logo.dev call)
    let cached_msft_bytes = vec![0x42u8; 100];
    Mock::given(method("GET"))
        .and(path("/rest/v1/symbol_logo_cache"))
        .and(query_param("cache_key", "eq.icon:MSFT:us-stock"))
        .respond_with(ResponseTemplate::new(200).set_body_json(json!([
            {
                "cache_key": "icon:MSFT:us-stock",
                "symbol": "MSFT",
                "asset_type": "us-stock",
                "fund_name": null,
                "amc_id": null,
                "amc_name": null,
                "amc_domain": null,
                "storage_path": "tickers/us-stock/MSFT.png",
                "content_type": "image/png",
                "status": "resolved",
                "expires_at": "2099-01-01T00:00:00Z"
            }
        ])))
        .expect(1)
        .mount(&mock_server)
        .await;

    Mock::given(method("GET"))
        .and(path(
            "/storage/v1/object/public/symbol-logos/tickers/us-stock/MSFT.png",
        ))
        .respond_with(
            ResponseTemplate::new(200)
                .insert_header("content-type", "image/png")
                .set_body_bytes(cached_msft_bytes.clone()),
        )
        .expect(1)
        .mount(&mock_server)
        .await;

    // 3. Mock Mutual Fund resolving AMC via Logo.dev Search API + Domain API
    Mock::given(method("GET"))
        .and(path("/rest/v1/symbol_logo_cache"))
        .and(query_param("cache_key", "eq.icon:K-USA.FUND:mutual-fund"))
        .respond_with(ResponseTemplate::new(200).set_body_json(json!([])))
        .mount(&mock_server)
        .await;

    Mock::given(method("GET"))
        .and(path("/rest/v1/symbol_logo_cache"))
        .and(query_param("cache_key", "eq.amc_logo:AMC_KASSET"))
        .respond_with(ResponseTemplate::new(200).set_body_json(json!([])))
        .mount(&mock_server)
        .await;

    Mock::given(method("GET"))
        .and(path("/rest/v1/symbol_logo_cache"))
        .and(query_param("amc_id", "eq.AMC_KASSET"))
        .respond_with(ResponseTemplate::new(200).set_body_json(json!([])))
        .mount(&mock_server)
        .await;

    Mock::given(method("GET"))
        .and(path("/v2/fund/general-info/profiles"))
        .respond_with(ResponseTemplate::new(200).set_body_json(json!({
            "items": [
                {
                    "proj_id": "P_KUSA",
                    "proj_abbr_name": "K-USA",
                    "fund_class_name": "K-USA",
                    "unique_id": "AMC_KASSET",
                    "comp_name_en": "Kasikorn Asset Management"
                }
            ]
        })))
        .mount(&mock_server)
        .await;

    Mock::given(method("GET"))
        .and(path("/v2/fund/factsheet/urls"))
        .respond_with(ResponseTemplate::new(200).set_body_json(json!({ "items": [] })))
        .mount(&mock_server)
        .await;

    Mock::given(method("GET"))
        .and(path("/v2/fund/general-info/amcs"))
        .respond_with(ResponseTemplate::new(200).set_body_json(json!({ "items": [] })))
        .mount(&mock_server)
        .await;

    Mock::given(method("GET"))
        .and(path("/logo-api/search"))
        .and(query_param("q", "Kasikorn Asset Management"))
        .and(header("Authorization", "Bearer sk_test_secret"))
        .respond_with(ResponseTemplate::new(200).set_body_json(json!([
            {
                "name": "Kasikorn Asset Management",
                "domain": "kasikornasset.com"
            }
        ])))
        .expect(1)
        .mount(&mock_server)
        .await;

    let kasset_logo_bytes = vec![0x77u8; 96];
    Mock::given(method("GET"))
        .and(path("/logo-img/kasikornasset.com"))
        .and(query_param("token", "pk_test_123"))
        .respond_with(
            ResponseTemplate::new(200)
                .insert_header("content-type", "image/png")
                .set_body_bytes(kasset_logo_bytes.clone()),
        )
        .expect(1)
        .mount(&mock_server)
        .await;

    Mock::given(method("POST"))
        .and(path("/storage/v1/object/symbol-logos/amcs/AMC_KASSET.png"))
        .respond_with(
            ResponseTemplate::new(200)
                .set_body_json(json!({"Key": "symbol-logos/amcs/AMC_KASSET.png"})),
        )
        .expect(1)
        .mount(&mock_server)
        .await;

    let settings = Settings {
        sec_subscription_key: "test-sec-key".to_string(),
        sec_pvd_base_url: format!("{}/v1/pvd", mock_server.uri()),
        sec_mf_base_url: format!("{}/v2/fund", mock_server.uri()),
        supabase_url: mock_server.uri(),
        supabase_publishable_key: "sb_pub_test".to_string(),
        supabase_service_role_key: "sb_service_role_test".to_string(),
        logo_dev_publishable_key: "pk_test_123".to_string(),
        logo_dev_secret_key: "sk_test_secret".to_string(),
        logo_dev_img_base_url: format!("{}/logo-img", mock_server.uri()),
        logo_dev_api_base_url: format!("{}/logo-api", mock_server.uri()),
        ..Settings::default()
    };

    let app = create_app(AppState::from_settings(settings));

    // Test 1: NVDA fetched from Logo.dev and persisted to Supabase
    let nvda_req = Request::builder()
        .uri("/icon/NVDA?asset_type=us-stock")
        .body(Body::empty())
        .unwrap();
    let nvda_resp = app.clone().oneshot(nvda_req).await.unwrap();
    assert_eq!(nvda_resp.status(), StatusCode::OK);
    let nvda_body = nvda_resp.into_body().collect().await.unwrap().to_bytes();
    assert_eq!(nvda_body.as_ref(), fake_png_bytes.as_slice());

    // Test 2: MSFT served directly from Supabase L2 cache without calling Logo.dev
    let msft_req = Request::builder()
        .uri("/icon/MSFT?asset_type=us-stock")
        .body(Body::empty())
        .unwrap();
    let msft_resp = app.clone().oneshot(msft_req).await.unwrap();
    assert_eq!(msft_resp.status(), StatusCode::OK);
    let msft_body = msft_resp.into_body().collect().await.unwrap().to_bytes();
    assert_eq!(msft_body.as_ref(), cached_msft_bytes.as_slice());

    // Test 3: K-USA.FUND resolves AMC via Logo.dev Search + Domain API and uploads to amcs/AMC_KASSET.png
    let kusa_req = Request::builder()
        .uri("/icon/K-USA.FUND?asset_type=mutual-fund")
        .body(Body::empty())
        .unwrap();
    let kusa_resp = app.oneshot(kusa_req).await.unwrap();
    assert_eq!(kusa_resp.status(), StatusCode::OK);
    let kusa_body = kusa_resp.into_body().collect().await.unwrap().to_bytes();
    assert_eq!(kusa_body.as_ref(), kasset_logo_bytes.as_slice());
}
