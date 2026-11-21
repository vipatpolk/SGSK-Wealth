use std::sync::atomic::{AtomicUsize, Ordering};
use std::sync::Arc;
use std::time::Duration;

use approx::assert_relative_eq;
use serde_json::json;
use sgsk_backend::utils::cache::{AsyncSingleflight, TTLCache};
use sgsk_backend::utils::format_utils::{
    display_symbol, get_asset_type, normalize_asset_type, resolve_quote_currency, to_yahoo_symbol,
};
use sgsk_backend::utils::yfinance_client::{
    timestamp_to_utc_midnight_epoch, HttpYahooFinanceClient,
};

#[test]
fn test_ttl_cache_basic_and_expiration() {
    let cache = TTLCache::new(10.0, 100);
    assert_eq!(cache.get::<String>("missing"), None);

    cache.set("k1".to_string(), "v1".to_string(), Some(10.0));
    assert_eq!(cache.get::<String>("k1"), Some("v1".to_string()));
    assert_eq!(cache.len(), 1);

    cache.set("short".to_string(), 42_i32, Some(0.02));
    assert_eq!(cache.get::<i32>("short"), Some(42));
    std::thread::sleep(Duration::from_millis(40));
    assert_eq!(cache.get::<i32>("short"), None);

    cache.delete("k1");
    assert_eq!(cache.get::<String>("k1"), None);
}

#[test]
fn test_ttl_cache_capacity_evicts_earliest_expiry() {
    let cache = TTLCache::new(60.0, 3);
    cache.set("a".to_string(), 1_i32, Some(5.0));
    cache.set("b".to_string(), 2_i32, Some(20.0));
    cache.set("c".to_string(), 3_i32, Some(30.0));
    assert_eq!(cache.len(), 3);

    // Adding a 4th item should evict "a" which has the earliest expiry
    cache.set("d".to_string(), 4_i32, Some(40.0));
    assert_eq!(cache.len(), 3);
    assert_eq!(cache.get::<i32>("a"), None);
    assert_eq!(cache.get::<i32>("b"), Some(2));
    assert_eq!(cache.get::<i32>("c"), Some(3));
    assert_eq!(cache.get::<i32>("d"), Some(4));
}

#[tokio::test]
async fn test_singleflight_deduplicates_concurrent_executions() {
    let sf = Arc::new(AsyncSingleflight::new());
    let counter = Arc::new(AtomicUsize::new(0));

    let mut handles = Vec::new();
    for _ in 0..8 {
        let sf_c = Arc::clone(&sf);
        let cnt_c = Arc::clone(&counter);
        handles.push(tokio::spawn(async move {
            sf_c.execute("shared-key", move || async move {
                cnt_c.fetch_add(1, Ordering::SeqCst);
                tokio::time::sleep(Duration::from_millis(40)).await;
                Ok::<_, String>("resolved-value".to_string())
            })
            .await
        }));
    }

    for h in handles {
        let res = h.await.expect("task joined");
        assert_eq!(res, Ok("resolved-value".to_string()));
    }
    assert_eq!(counter.load(Ordering::SeqCst), 1);
}

#[tokio::test]
async fn test_singleflight_error_propagation_and_retry() {
    let sf = Arc::new(AsyncSingleflight::new());
    let counter = Arc::new(AtomicUsize::new(0));

    let mut err_handles = Vec::new();
    for _ in 0..4 {
        let sf_c = Arc::clone(&sf);
        let cnt_c = Arc::clone(&counter);
        err_handles.push(tokio::spawn(async move {
            sf_c.execute("err-key", move || async move {
                cnt_c.fetch_add(1, Ordering::SeqCst);
                tokio::time::sleep(Duration::from_millis(25)).await;
                Err::<String, String>("upstream failure".to_string())
            })
            .await
        }));
    }

    for h in err_handles {
        let res = h.await.expect("task joined");
        assert_eq!(res, Err("upstream failure".to_string()));
    }
    assert_eq!(counter.load(Ordering::SeqCst), 1);

    // Subsequent call after error must execute again rather than caching error
    let retry_res = sf
        .execute("err-key", || async {
            Ok::<String, String>("recovered".to_string())
        })
        .await;
    assert_eq!(retry_res, Ok("recovered".to_string()));
}

#[test]
fn test_format_utils_asset_types_symbols_and_currencies() {
    assert_eq!(normalize_asset_type("U.S. Stock"), Some("us-stock"));
    assert_eq!(normalize_asset_type("Thai Stock"), Some("thai-stock"));
    assert_eq!(normalize_asset_type("Crypto"), Some("crypto"));
    assert_eq!(normalize_asset_type("Mutual Fund"), Some("mutual-fund"));
    assert_eq!(
        normalize_asset_type("Provident Fund"),
        Some("provident-fund")
    );
    assert_eq!(normalize_asset_type("Bond"), Some("bond"));
    assert_eq!(normalize_asset_type(""), None);

    assert_eq!(get_asset_type(None, Some("PTT.BK")), "thai-stock");
    assert_eq!(get_asset_type(None, Some("K-USA-A(D).FUND")), "mutual-fund");
    assert_eq!(get_asset_type(None, Some("K-GOLD.BKFUND")), "mutual-fund");
    assert_eq!(get_asset_type(None, Some("BTC.CRYPTO")), "crypto");
    assert_eq!(get_asset_type(None, Some("PVD-EQ")), "provident-fund");
    assert_eq!(get_asset_type(None, Some("AAPL")), "us-stock");
    assert_eq!(
        get_asset_type(Some("closed-position"), Some("PTT.BK")),
        "thai-stock"
    );

    assert_eq!(to_yahoo_symbol("BRK.B"), "BRK-B");
    assert_eq!(to_yahoo_symbol("BF/B"), "BF-B");
    assert_eq!(to_yahoo_symbol("PTT.BK"), "PTT.BK");
    assert_eq!(to_yahoo_symbol("SCBSET.FUND"), "SCBSET");
    assert_eq!(to_yahoo_symbol("K-USA.BKFUND"), "K-USA");
    assert_eq!(to_yahoo_symbol("BTC.CRYPTO"), "BTC");

    assert_eq!(display_symbol("PTT.BK"), "PTT");
    assert_eq!(display_symbol("K-USA.FUND"), "K-USA");
    assert_eq!(display_symbol("ETH.CRYPTO"), "ETH");

    assert_eq!(resolve_quote_currency("USDT"), "USD");
    assert_eq!(resolve_quote_currency("USDC"), "USD");
    assert_eq!(resolve_quote_currency("DAI"), "USD");
    assert_eq!(resolve_quote_currency("thb"), "THB");
    assert_eq!(resolve_quote_currency("eur"), "EUR");
}

#[test]
fn test_yfinance_quote_and_dividend_parsing() {
    let fixture: serde_json::Value =
        serde_json::from_str(include_str!("fixtures/sample_yahoo_finance.json"))
            .expect("valid yahoo fixture");
    let quote = HttpYahooFinanceClient::parse_quote_from_chart_json(&fixture);
    assert_relative_eq!(quote.price, 185.50, epsilon = 1e-6);
    assert_eq!(quote.name, "Apple Inc.");
    assert_eq!(quote.currency, "USD");

    // Fallback from missing regularMarketPrice to Close array (skipping null/zero) then previousClose
    let fallback_close = json!({
        "chart": {
            "result": [{
                "meta": {
                    "currency": "THB",
                    "shortName": "PTT",
                    "previousClose": 34.0
                },
                "indicators": {
                    "quote": [{
                        "close": [33.5, 35.25, null]
                    }]
                }
            }]
        }
    });
    let q_close = HttpYahooFinanceClient::parse_quote_from_chart_json(&fallback_close);
    assert_relative_eq!(q_close.price, 35.25, epsilon = 1e-6);

    let fallback_prev = json!({
        "chart": {
            "result": [{
                "meta": {
                    "currency": "THB",
                    "chartPreviousClose": 0.0,
                    "previousClose": 31.75
                }
            }]
        }
    });
    let q_prev = HttpYahooFinanceClient::parse_quote_from_chart_json(&fallback_prev);
    assert_relative_eq!(q_prev.price, 31.75, epsilon = 1e-6);

    // Timezone-safe midnight epoch tests:
    // Asia/Bangkok 2026-03-11 00:00:00+07:00 = 2026-03-10 17:00:00 UTC -> must normalize to 2026-03-11 00:00:00 UTC
    let bkk_ts = chrono::DateTime::parse_from_rfc3339("2026-03-11T00:00:00+07:00")
        .unwrap()
        .timestamp();
    let expected_bkk_midnight = chrono::NaiveDate::from_ymd_opt(2026, 3, 11)
        .unwrap()
        .and_hms_opt(0, 0, 0)
        .unwrap()
        .and_utc()
        .timestamp();
    assert_eq!(
        timestamp_to_utc_midnight_epoch(bkk_ts, Some("Asia/Bangkok"), Some(25200)),
        expected_bkk_midnight
    );

    // America/New_York 2026-02-09 00:00:00-05:00 = 2026-02-09 05:00:00 UTC -> must stay 2026-02-09 00:00:00 UTC
    let ny_ts = chrono::DateTime::parse_from_rfc3339("2026-02-09T00:00:00-05:00")
        .unwrap()
        .timestamp();
    let expected_ny_midnight = chrono::NaiveDate::from_ymd_opt(2026, 2, 9)
        .unwrap()
        .and_hms_opt(0, 0, 0)
        .unwrap()
        .and_utc()
        .timestamp();
    assert_eq!(
        timestamp_to_utc_midnight_epoch(ny_ts, Some("America/New_York"), Some(-18000)),
        expected_ny_midnight
    );

    let div_payload = json!({
        "chart": {
            "result": [{
                "meta": {
                    "exchangeTimezoneName": "Asia/Bangkok",
                    "gmtoffset": 25200
                },
                "events": {
                    "dividends": {
                        "1773162000": { "amount": 1.3, "date": bkk_ts },
                        "1773000000": { "amount": 0.0, "date": 1773000000_i64 },
                        "1772000000": { "amount": null, "date": 1772000000_i64 },
                        "1757437200": { "amount": 0.9, "date": 1757437200_i64 }
                    }
                }
            }]
        }
    });
    let divs = HttpYahooFinanceClient::parse_dividends_from_chart_json(&div_payload);
    assert_eq!(divs.len(), 2);
    assert!(divs[0].date > divs[1].date);
    assert_relative_eq!(divs[0].amount, 1.3, epsilon = 1e-6);
    assert_relative_eq!(divs[1].amount, 0.9, epsilon = 1e-6);
}
