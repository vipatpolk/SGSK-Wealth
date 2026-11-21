use std::collections::{HashMap, HashSet};
use std::sync::Arc;

use approx::assert_relative_eq;
use async_trait_or_box::*;
use base64::engine::general_purpose::STANDARD as BASE64_STANDARD;
use base64::Engine;
use serde_json::json;
use sgsk_backend::config::settings::Settings;
use sgsk_backend::features::market_data::services::nav_service::NavService;
use sgsk_backend::features::market_data::services::price_service::{
    common_crypto_name, parse_set_listed_companies_html, PriceService,
};
use sgsk_backend::utils::cache::{AsyncSingleflight, TTLCache};
use sgsk_backend::utils::http_client::HttpResources;
use sgsk_backend::utils::yfinance_client::{
    BoxFuture, YahooDividend, YahooFinanceProvider, YahooQuote,
};
use wiremock::matchers::{method, path, query_param};
use wiremock::{Mock, MockServer, ResponseTemplate};

mod async_trait_or_box {
    use super::*;

    pub struct MockYahooProvider {
        pub quotes: HashMap<String, Result<YahooQuote, String>>,
        pub fx_rate: Result<f64, String>,
        pub dividends: HashMap<String, Vec<YahooDividend>>,
    }

    impl YahooFinanceProvider for MockYahooProvider {
        fn get_quote<'a>(
            &'a self,
            yahoo_symbol: &'a str,
        ) -> BoxFuture<'a, Result<YahooQuote, String>> {
            Box::pin(async move {
                self.quotes
                    .get(yahoo_symbol)
                    .cloned()
                    .unwrap_or_else(|| Err(format!("missing quote {yahoo_symbol}")))
            })
        }

        fn get_exchange_rate<'a>(
            &'a self,
            _from_currency: &'a str,
            _to_currency: &'a str,
        ) -> BoxFuture<'a, Result<f64, String>> {
            Box::pin(async move { self.fx_rate.clone() })
        }

        fn get_dividends<'a>(
            &'a self,
            yahoo_symbol: &'a str,
            _period: Option<&'a str>,
        ) -> BoxFuture<'a, Result<Vec<YahooDividend>, String>> {
            Box::pin(async move {
                Ok(self
                    .dividends
                    .get(yahoo_symbol)
                    .cloned()
                    .unwrap_or_default())
            })
        }
    }
}

#[tokio::test]
async fn test_price_service_crypto_set_html_fx_stocks_and_dividends() {
    let mock_server = MockServer::start().await;
    let binance_sample = include_str!("fixtures/sample_binance_ticker.json");
    let btc_usd_sample = r#"{"symbol":"BTCUSD","price":"65000.00"}"#;

    // Encode CP874/Windows-874 SET listed company HTML table
    let html_utf8 = "<html><body><table>\
        <tr><th>Symbol</th><th>Company</th></tr>\
        <tr><td>PTT</td><td>บริษัท ปตท. จำกัด (มหาชน)</td></tr>\
        <tr><td>BDMS</td><td>BDMS &amp; Co</td></tr>\
        </table></body></html>";
    let (encoded_th, _, _) = encoding_rs::WINDOWS_874.encode(html_utf8);
    let html_en = "<html><body><table>\
        <tr><th>Symbol</th><th>Company</th></tr>\
        <tr><td>PTT</td><td>PTT Public Company Limited</td></tr>\
        <tr><td>BDMS</td><td>BDMS &amp; Co</td></tr>\
        </table></body></html>";

    let parsed_th = parse_set_listed_companies_html(&encoded_th);
    assert_eq!(
        parsed_th.get("PTT").map(String::as_str),
        Some("บริษัท ปตท. จำกัด (มหาชน)")
    );
    assert_eq!(parsed_th.get("BDMS").map(String::as_str), Some("BDMS & Co"));

    Mock::given(method("GET"))
        .and(path("/api/v1/ticker/price"))
        .respond_with(ResponseTemplate::new(200).set_body_raw(
            format!("[{binance_sample},{btc_usd_sample}]"),
            "application/json",
        ))
        .mount(&mock_server)
        .await;

    Mock::given(method("GET"))
        .and(path("/set_th.xls"))
        .respond_with(ResponseTemplate::new(200).set_body_raw(encoded_th.to_vec(), "text/html"))
        .mount(&mock_server)
        .await;

    Mock::given(method("GET"))
        .and(path("/set_en.xls"))
        .respond_with(ResponseTemplate::new(200).set_body_string(html_en))
        .mount(&mock_server)
        .await;

    let settings = Arc::new(Settings {
        binance_base_url: mock_server.uri(),
        set_th_url: format!("{}/set_th.xls", mock_server.uri()),
        set_en_url: format!("{}/set_en.xls", mock_server.uri()),
        ..Settings::default()
    });
    let http = Arc::new(HttpResources::new(&settings));
    let cache = Arc::new(TTLCache::new(60.0, 200));
    let singleflight = Arc::new(AsyncSingleflight::new());
    let nav_svc = NavService::new(
        Arc::clone(&settings),
        Arc::clone(&http),
        Arc::clone(&cache),
        Arc::clone(&singleflight),
    );

    let now_ts = chrono::Utc::now().timestamp();
    let yf_provider = Arc::new(MockYahooProvider {
        quotes: HashMap::from([
            (
                "AAPL".to_string(),
                Ok(YahooQuote {
                    price: 190.5,
                    name: "Apple Inc.".to_string(),
                    currency: "USD".to_string(),
                }),
            ),
            (
                "PTT.BK".to_string(),
                Ok(YahooQuote {
                    price: 35.75,
                    name: "PTT PCL".to_string(),
                    currency: "THB".to_string(),
                }),
            ),
            (
                "SOL-USD".to_string(),
                Ok(YahooQuote {
                    price: 150.0,
                    name: "Solana USD".to_string(),
                    currency: "USD".to_string(),
                }),
            ),
            (
                "CUSTOMCOIN-USD".to_string(),
                Ok(YahooQuote {
                    price: 12.0,
                    name: "Custom Coin".to_string(),
                    currency: "USD".to_string(),
                }),
            ),
        ]),
        fx_rate: Ok(34.5),
        dividends: HashMap::from([(
            "AAPL".to_string(),
            vec![
                YahooDividend {
                    amount: 0.25,
                    date: now_ts - 86400 * 30,
                },
                YahooDividend {
                    amount: 0.25,
                    date: now_ts - 86400 * 120,
                },
                YahooDividend {
                    amount: 0.24,
                    date: now_ts - 86400 * 500, // older than 365 days -> excluded from trailing_12m_dps
                },
            ],
        )]),
    });

    let svc = PriceService::new(
        Arc::clone(&settings),
        Arc::clone(&http),
        Arc::clone(&cache),
        Arc::clone(&singleflight),
        nav_svc,
        yf_provider.clone(),
    );

    // Exchange rate cached cleanly
    assert_relative_eq!(
        svc.fetch_exchange_rate("USD", "THB").await,
        34.5,
        epsilon = 1e-6
    );

    // Crypto price resolution prefers THB over USD
    let tickers: Vec<serde_json::Value> =
        serde_json::from_str(&format!("[{binance_sample},{btc_usd_sample}]")).unwrap();
    let (btc_price, btc_curr) = svc.resolve_crypto_price("BTC", &tickers);
    assert_relative_eq!(btc_price, 2150000.0, epsilon = 1e-6);
    assert_eq!(btc_curr, "THB");

    assert_eq!(common_crypto_name("BTC"), Some("Bitcoin"));
    assert_eq!(common_crypto_name("UNKNOWN"), None);

    // Stock + Thai stock SET nameTh enrichment
    let stocks = svc
        .fetch_stock_prices(
            &["AAPL".to_string(), "PTT.BK".to_string()],
            Some(&HashSet::from(["PTT.BK".to_string()])),
        )
        .await;
    assert_relative_eq!(stocks["AAPL"].price, 190.5, epsilon = 1e-6);
    assert!(stocks["AAPL"].name_th.as_deref().unwrap_or("").is_empty());
    assert_relative_eq!(stocks["PTT.BK"].price, 35.75, epsilon = 1e-6);
    assert_eq!(
        stocks["PTT.BK"].name_th.as_deref(),
        Some("บริษัท ปตท. จำกัด (มหาชน)")
    );

    // Crypto batch fetch: BTC price+name from Binance/common dict, CUSTOMCOIN name fallback via Yahoo Finance {BASE}-USD
    let crypto = svc
        .fetch_crypto_prices(&["BTC".to_string(), "CUSTOMCOIN".to_string()])
        .await;
    assert_relative_eq!(crypto["BTC"].price, 2150000.0, epsilon = 1e-6);
    assert_eq!(crypto["BTC"].name.as_deref(), Some("Bitcoin"));
    assert_eq!(crypto["CUSTOMCOIN"].name.as_deref(), Some("Custom Coin"));
    assert_relative_eq!(crypto["CUSTOMCOIN"].price, 0.0, epsilon = 1e-6);

    // Stock trailing 12m dividend calculation
    let div_map = svc.fetch_stock_dividends(&["AAPL".to_string()]).await;
    assert_relative_eq!(div_map["AAPL"].trailing_12m_dps, 0.50, epsilon = 1e-6);
    assert_eq!(div_map["AAPL"].dividends.len(), 3);

    // Error fallback for exchange rate and missing ticker
    let err_yf = Arc::new(MockYahooProvider {
        quotes: HashMap::new(),
        fx_rate: Err("network error".to_string()),
        dividends: HashMap::new(),
    });
    let err_svc = PriceService::new(
        Arc::clone(&settings),
        Arc::clone(&http),
        Arc::new(TTLCache::new(60.0, 50)),
        Arc::new(AsyncSingleflight::new()),
        NavService::new(
            Arc::clone(&settings),
            Arc::clone(&http),
            Arc::new(TTLCache::new(60.0, 50)),
            Arc::new(AsyncSingleflight::new()),
        ),
        err_yf,
    );
    assert_relative_eq!(
        err_svc.fetch_exchange_rate("USD", "THB").await,
        0.0,
        epsilon = 1e-9
    );
    let err_stocks = err_svc
        .fetch_stock_prices(&["FAIL".to_string()], None)
        .await;
    assert!(err_stocks.is_empty());
}

#[tokio::test]
async fn test_nav_service_sec_mf_pvd_factsheets_and_amc_resolution() {
    let mock_server = MockServer::start().await;

    let policy_b64 = BASE64_STANDARD.encode("ลงทุนในหุ้นเติบโตสูงทั่วโลก".as_bytes());

    // Mutual fund profile lookup & factsheet mocks
    Mock::given(method("GET"))
        .and(path("/v2/fund/general-info/profiles"))
        .and(query_param("fund_class_name", "K-USA-A(D)"))
        .respond_with(ResponseTemplate::new(200).set_body_json(json!({
            "items": [{
                "proj_id": "M001",
                "proj_abbr_name": "K-USA",
                "fund_class_name": "K-USA-A(D)",
                "proj_name_en": "K US Equity Fund-A(D)",
                "proj_name_th": "กองทุนเปิดเค ยูเอสเอ หุ้นทุน-A(D)",
                "unique_id": "AMC_K",
                "comp_name_en": "Kasikorn Asset Management",
                "comp_name_th": "บลจ. กสิกรไทย",
                "management_style": "AN",
                "investment_policy_desc": policy_b64,
                "aimc_type": "US Equity",
                "risk_spectrum": "6"
            }]
        })))
        .mount(&mock_server)
        .await;

    // Mutual fund NAV fetch (using SEC daily-info/nav endpoint with sample_sec_nav price shape)
    Mock::given(method("GET"))
        .and(path("/v2/fund/daily-info/nav"))
        .and(query_param("proj_id", "M001"))
        .respond_with(ResponseTemplate::new(200).set_body_json(json!({
            "items": [{
                "proj_id": "M001",
                "fund_class_name": "K-USA-A(D)",
                "nav_date": "2026-08-10",
                "last_val": 15.4321
            }]
        })))
        .mount(&mock_server)
        .await;

    // Mutual fund company website URL
    Mock::given(method("GET"))
        .and(path("/v2/fund/factsheet/urls"))
        .and(query_param("proj_id", "M001"))
        .respond_with(ResponseTemplate::new(200).set_body_json(json!({
            "items": [{
                "fund_class_name": "K-USA-A(D)",
                "pdf_factsheet": "https://www.kasikornasset.com/factsheet.pdf",
                "amc_url_factsheet": "https://www.kasikornasset.com/fund"
            }]
        })))
        .mount(&mock_server)
        .await;

    Mock::given(method("GET"))
        .and(path("/v2/fund/factsheet/risk-spectrum"))
        .respond_with(ResponseTemplate::new(200).set_body_json(json!({
            "items": [{"risk_spectrum": "6", "risk_desc": "High Risk"}]
        })))
        .mount(&mock_server)
        .await;

    Mock::given(method("GET"))
        .and(path("/v2/fund/factsheet/benchmarks"))
        .respond_with(ResponseTemplate::new(200).set_body_json(json!({
            "items": [{"group_seq": 1, "benchmark": "S&P 500 TR"}]
        })))
        .mount(&mock_server)
        .await;

    Mock::given(method("GET"))
        .and(path("/v2/fund/factsheet/dividend-policy"))
        .respond_with(ResponseTemplate::new(200).set_body_json(json!({
            "items": [{"fund_class_name": "K-USA-A(D)", "dividend_policy": "Yes"}]
        })))
        .mount(&mock_server)
        .await;

    Mock::given(method("GET"))
        .and(path("/v2/fund/factsheet/fees"))
        .respond_with(ResponseTemplate::new(200).set_body_json(json!({
            "items": [{"fund_class_name": "K-USA-A(D)", "fee_type_desc": "Management Fee", "rate": "1.5000", "actual_value": "1.0700"}]
        })))
        .mount(&mock_server)
        .await;

    Mock::given(method("GET"))
        .and(path("/v2/fund/factsheet/performance"))
        .respond_with(ResponseTemplate::new(200).set_body_json(json!({
            "items": [{"fund_class_name": "K-USA-A(D)", "performance_type_desc": "Fund Return", "reference_period": "1Y", "performance_value": 18.25}]
        })))
        .mount(&mock_server)
        .await;

    Mock::given(method("GET"))
        .and(path("/v2/fund/factsheet/statistics"))
        .respond_with(ResponseTemplate::new(200).set_body_json(json!({
            "items": [{"fund_class_name": "K-USA-A(D)", "maximum_drawdown": -12.5, "sharpe_ratio": 1.35}]
        })))
        .mount(&mock_server)
        .await;

    // Asset allocation with multiple periods -> select latest period only
    Mock::given(method("GET"))
        .and(path("/v2/fund/factsheet/asset-allocation"))
        .respond_with(ResponseTemplate::new(200).set_body_json(json!({
            "items": [
                {"period": "202512", "asset_seq": 1, "asset_name": "Old Equity", "asset_ratio": 90.0},
                {"period": "202606", "asset_seq": 1, "asset_name": "US Equities", "asset_ratio": 97.5}
            ]
        })))
        .mount(&mock_server)
        .await;

    Mock::given(method("GET"))
        .and(path("/v2/fund/factsheet/top5-holdings"))
        .respond_with(ResponseTemplate::new(200).set_body_json(json!({
            "items": [
                {"period": "202606", "asset_seq": 1, "asset_name": "Apple Inc", "asset_ratio": 7.2}
            ]
        })))
        .mount(&mock_server)
        .await;

    Mock::given(method("GET"))
        .and(path("/v2/fund/factsheet/subscription-redemption-minimums"))
        .respond_with(ResponseTemplate::new(200).set_body_json(json!({
            "items": [{"fund_class_name": "K-USA-A(D)", "minimum_sub_ipo": "500"}]
        })))
        .mount(&mock_server)
        .await;

    Mock::given(method("GET"))
        .and(path("/v2/fund/factsheet/subscription-redemption-periods"))
        .respond_with(ResponseTemplate::new(200).set_body_json(json!({
            "items": [{"fund_class_name": "K-USA-A(D)", "type": "redemption", "settlement_period": "T+4"}]
        })))
        .mount(&mock_server)
        .await;

    // PVD mocks (including active vs closed policy ranking & 204 handling)
    Mock::given(method("POST"))
        .and(path("/v1/pvd/factsheet/fund"))
        .respond_with(ResponseTemplate::new(200).set_body_json(json!([
            {"proj_id": "PVD_OLD", "fund_status": "CL", "proj_name_th": "Master PVD"},
            {"proj_id": "PVD_ACT", "fund_status": "RG", "proj_name_th": "Master PVD", "unique_id": "AMC_PVD"}
        ])))
        .mount(&mock_server)
        .await;

    Mock::given(method("GET"))
        .and(path("/v1/pvd/factsheet/PVD_ACT/policy"))
        .respond_with(ResponseTemplate::new(200).set_body_json(json!([
            {"policy_abbr_name": "PVDSP500", "unique_id": "POL_OLD", "sub_policy_end_date": "2023-12-31"},
            {"policy_abbr_name": "PVDSP500", "unique_id": "POL_ACT", "policy_desc": "S&P 500 Policy", "sub_policy_inception_date": "2020-01-01", "last_upd_date": "2026-07-01"},
            {"policy_abbr_name": "PVDOTHER", "unique_id": "POL_SIBLING", "sub_policy_inception_date": "2021-01-01"}
        ])))
        .mount(&mock_server)
        .await;

    // Sister-entity PVD AMC resolved via MF AMC directory
    Mock::given(method("GET"))
        .and(path("/v1/pvd/factsheet/amc"))
        .respond_with(ResponseTemplate::new(200).set_body_json(json!([
            {"unique_id": "AMC_PVD", "name_en": "BBL Asset Management", "abbr_name": "BBLAM"}
        ])))
        .mount(&mock_server)
        .await;

    Mock::given(method("GET"))
        .and(path("/v2/fund/general-info/profiles"))
        .and(query_param("company_info", "AMC_PVD"))
        .respond_with(ResponseTemplate::new(200).set_body_json(json!({ "items": [] })))
        .mount(&mock_server)
        .await;

    Mock::given(method("GET"))
        .and(path("/v2/fund/general-info/amcs"))
        .respond_with(ResponseTemplate::new(200).set_body_json(json!({
            "items": [{"unique_id": "MF_BBL", "comp_name_en": "BBL Asset Management Co., Ltd."}]
        })))
        .mount(&mock_server)
        .await;

    Mock::given(method("GET"))
        .and(path("/v2/fund/general-info/profiles"))
        .and(query_param("company_info", "MF_BBL"))
        .respond_with(ResponseTemplate::new(200).set_body_json(json!({
            "items": [{"proj_id": "M_BBL_1"}]
        })))
        .mount(&mock_server)
        .await;

    Mock::given(method("GET"))
        .and(path("/v2/fund/factsheet/urls"))
        .and(query_param("proj_id", "M_BBL_1"))
        .respond_with(ResponseTemplate::new(200).set_body_json(json!({
            "items": [{"amc_url_factsheet": "https://www.bblam.co.th/factsheet.pdf"}]
        })))
        .mount(&mock_server)
        .await;

    Mock::given(method("GET"))
        .and(path("/v1/pvd/factsheet/PVD_ACT/return"))
        .respond_with(ResponseTemplate::new(200).set_body_json(json!([
            {"unique_id": "POL_ACT", "period": "2026", "cal_return_1yr": 14.5},
            {"unique_id": "POL_SIBLING", "period": "2026", "cal_return_1yr": 2.0}
        ])))
        .mount(&mock_server)
        .await;

    for sub in [
        "trailreturn",
        "fee",
        "statistics",
        "top5/assettype",
        "top5/securities",
    ] {
        Mock::given(method("GET"))
            .and(path(format!("/v1/pvd/factsheet/PVD_ACT/{sub}")))
            .respond_with(ResponseTemplate::new(204))
            .mount(&mock_server)
            .await;
    }

    let settings = Arc::new(Settings {
        sec_subscription_key: "sec-sub-key".to_string(),
        sec_mf_base_url: format!("{}/v2/fund", mock_server.uri()),
        sec_pvd_base_url: format!("{}/v1/pvd", mock_server.uri()),
        ..Settings::default()
    });
    let http = Arc::new(HttpResources::new(&settings));
    let cache = Arc::new(TTLCache::new(60.0, 200));
    let singleflight = Arc::new(AsyncSingleflight::new());
    let nav = NavService::new(settings, http, cache, singleflight);

    // 1. NAV fetch
    let nav_map = nav.fetch_fund_navs(&["K-USA-A(D).FUND".to_string()]).await;
    assert_relative_eq!(nav_map["K-USA-A(D).FUND"].price, 15.4321, epsilon = 1e-4);
    assert_eq!(
        nav_map["K-USA-A(D).FUND"].name_th.as_deref(),
        Some("กองทุนเปิดเค ยูเอสเอ หุ้นทุน-A(D)")
    );

    // 2. Mutual fund 11-endpoint factsheet
    let mf_sheet = nav
        .fetch_fund_factsheet("K-USA-A(D).FUND", "mutual-fund", None)
        .await;
    assert_eq!(mf_sheet.proj_id.as_deref(), Some("M001"));
    assert_eq!(
        mf_sheet.management_style.as_deref(),
        Some("AN - Feeder Fund (Active Master)")
    );
    assert_eq!(
        mf_sheet.investment_policy_desc.as_deref(),
        Some("ลงทุนในหุ้นเติบโตสูงทั่วโลก")
    );
    assert_eq!(mf_sheet.fees.len(), 1);
    assert_eq!(mf_sheet.asset_allocation.len(), 1);
    assert_eq!(mf_sheet.asset_allocation[0].name, "US Equities");
    assert_eq!(mf_sheet.top_holdings[0].name, "Apple Inc");
    assert_eq!(
        mf_sheet
            .trade_conditions
            .as_ref()
            .unwrap()
            .settlement_period
            .as_deref(),
        Some("T+4")
    );

    // 3. PVD active policy selection, sibling leak prevention, and sister AMC website resolution
    let proj_id = nav.fetch_pvd_proj_id("Master PVD").await;
    assert_eq!(proj_id.as_deref(), Some("PVD_ACT"));

    let pvd_sheet = nav
        .fetch_fund_factsheet("PVDSP500", "provident-fund", Some("Master PVD"))
        .await;
    assert_eq!(pvd_sheet.proj_id.as_deref(), Some("PVD_ACT"));
    // Sibling POL_SIBLING (2.0%) must NOT leak into POL_ACT performance
    assert!(pvd_sheet.performance.iter().all(|p| p.value != Some(2.0)));

    let amc_details = nav
        .resolve_fund_amc_details("PVDSP500", "provident-fund", Some("Master PVD"))
        .await;
    assert_eq!(amc_details.website_host.as_deref(), Some("www.bblam.co.th"));
}
