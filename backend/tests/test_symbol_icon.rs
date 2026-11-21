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
    clean_ticker_for_url, derive_amc_code, extract_brand_tokens, extract_domain_candidates,
    generate_amc_svg, generate_symbol_svg, get_symbol_color, get_symbol_logo_config,
    get_symbol_monogram,
};
use tower::ServiceExt;
use wiremock::matchers::{method, path};
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
        Some("https://assets.parqet.com/logos/symbol/AAPL?format=png")
    );
    assert_eq!(
        us_cfg.secondary_url.as_deref(),
        Some("https://financialmodelingprep.com/image-stock/AAPL.png")
    );

    let th_cfg = get_symbol_logo_config("PTT.BK", "thai-stock");
    assert_eq!(
        th_cfg.primary_url.as_deref(),
        Some("https://www.set.or.th/dat/vender/quote/company_logo/PTT.png")
    );
    assert_eq!(
        th_cfg.secondary_url.as_deref(),
        Some("https://assets.parqet.com/logos/symbol/PTT.BK?format=png")
    );

    let crypto_cfg = get_symbol_logo_config("BTC.CRYPTO", "crypto");
    assert_eq!(
        crypto_cfg.primary_url.as_deref(),
        Some("https://assets.coincap.io/assets/icons/btc@2x.png")
    );

    let mf_cfg = get_symbol_logo_config("SCBSET.FUND", "mutual-fund");
    assert!(mf_cfg.is_mutual_fund);
    assert!(mf_cfg.primary_url.is_none());

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
