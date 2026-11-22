use std::future::Future;
use std::pin::Pin;
use std::sync::Arc;
use std::time::Duration;

use chrono::{DateTime, Datelike, FixedOffset, NaiveDate, TimeZone, Utc};
use serde_json::Value;

use crate::config::settings::{Settings, DEFAULT_YAHOO_BASE_URL};
use crate::utils::http_client::HttpResources;

#[derive(Debug, Clone, PartialEq, Default)]
pub struct YahooQuote {
    pub price: f64,
    pub name: String,
    pub currency: String,
}

#[derive(Debug, Clone, PartialEq)]
pub struct YahooDividend {
    pub amount: f64,
    pub date: i64,
}

pub type BoxFuture<'a, T> = Pin<Box<dyn Future<Output = T> + Send + 'a>>;

pub trait YahooFinanceProvider: Send + Sync {
    fn get_quote<'a>(&'a self, yahoo_symbol: &'a str) -> BoxFuture<'a, Result<YahooQuote, String>>;

    fn get_exchange_rate<'a>(
        &'a self,
        from_currency: &'a str,
        to_currency: &'a str,
    ) -> BoxFuture<'a, Result<f64, String>>;

    fn get_dividends<'a>(
        &'a self,
        yahoo_symbol: &'a str,
        period: Option<&'a str>,
    ) -> BoxFuture<'a, Result<Vec<YahooDividend>, String>>;
}

pub fn to_finite_float(val: Option<&Value>) -> Option<f64> {
    let v = val?;
    if v.is_boolean() || v.is_null() {
        return None;
    }
    if let Some(n) = v.as_f64() {
        return n.is_finite().then_some(n);
    }
    if let Some(s) = v.as_str() {
        let trimmed = s.trim();
        if trimmed.is_empty() {
            return None;
        }
        if let Ok(n) = trimmed.parse::<f64>() {
            return n.is_finite().then_some(n);
        }
    }
    None
}

/// Preserves exchange-local calendar date when converting dividend timestamps to UTC midnight epoch.
pub fn timestamp_to_utc_midnight_epoch(
    ts_secs: i64,
    tz_name: Option<&str>,
    gmt_offset_secs: Option<i32>,
) -> i64 {
    let Some(utc_dt) = DateTime::from_timestamp(ts_secs, 0) else {
        return 0;
    };

    if let Some(name) = tz_name.filter(|s| !s.trim().is_empty()) {
        if let Ok(tz) = name.trim().parse::<chrono_tz::Tz>() {
            let local = utc_dt.with_timezone(&tz);
            if let Some(naive_date) =
                NaiveDate::from_ymd_opt(local.year(), local.month(), local.day())
            {
                if let Some(midnight) = naive_date.and_hms_opt(0, 0, 0) {
                    return Utc.from_utc_datetime(&midnight).timestamp();
                }
            }
        }
    }

    if let Some(offset) = gmt_offset_secs.and_then(FixedOffset::east_opt) {
        let local = utc_dt.with_timezone(&offset);
        if let Some(naive_date) = NaiveDate::from_ymd_opt(local.year(), local.month(), local.day())
        {
            if let Some(midnight) = naive_date.and_hms_opt(0, 0, 0) {
                return Utc.from_utc_datetime(&midnight).timestamp();
            }
        }
    }

    if let Some(naive_date) = NaiveDate::from_ymd_opt(utc_dt.year(), utc_dt.month(), utc_dt.day()) {
        if let Some(midnight) = naive_date.and_hms_opt(0, 0, 0) {
            return Utc.from_utc_datetime(&midnight).timestamp();
        }
    }

    ts_secs
}

pub struct HttpYahooFinanceClient {
    http: Arc<HttpResources>,
    base_url: String,
    fallback_base_url: String,
    timeout_seconds: f64,
    retries: usize,
    dividend_period: String,
}

impl HttpYahooFinanceClient {
    pub fn new(http: Arc<HttpResources>, settings: &Settings) -> Self {
        Self {
            http,
            base_url: settings
                .yahoo_base_url
                .trim()
                .trim_end_matches('/')
                .to_string(),
            fallback_base_url: settings
                .yahoo_fallback_base_url
                .trim()
                .trim_end_matches('/')
                .to_string(),
            timeout_seconds: settings.yfinance_timeout_seconds.max(1.0),
            retries: settings.yfinance_retries.max(0) as usize,
            dividend_period: if settings.yfinance_dividend_period.trim().is_empty() {
                "max".to_string()
            } else {
                settings.yfinance_dividend_period.trim().to_string()
            },
        }
    }

    async fn fetch_chart_json(
        &self,
        yahoo_symbol: &str,
        query: &[(&str, &str)],
    ) -> Result<Value, String> {
        let encoded_sym = urlencoding::encode(yahoo_symbol.trim());
        let primary_url = format!("{}/v8/finance/chart/{encoded_sym}", self.base_url);
        let fallback_url = if self.base_url == DEFAULT_YAHOO_BASE_URL
            && !self.fallback_base_url.is_empty()
            && self.fallback_base_url != self.base_url
        {
            Some(format!(
                "{}/v8/finance/chart/{encoded_sym}",
                self.fallback_base_url
            ))
        } else {
            None
        };

        let _permit = self
            .http
            .yahoo_sem
            .acquire()
            .await
            .map_err(|e| format!("semaphore error: {e}"))?;

        let timeout = Duration::from_secs_f64(self.timeout_seconds);
        let mut last_err = String::new();

        for attempt in 0..=self.retries {
            let target_url = if attempt > 0 {
                fallback_url.as_deref().unwrap_or(primary_url.as_str())
            } else {
                primary_url.as_str()
            };

            match self
                .http
                .client
                .get(target_url)
                .query(query)
                .header(
                    "User-Agent",
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
                )
                .header("Accept", "application/json")
                .timeout(timeout)
                .send()
                .await
            {
                Ok(resp) => {
                    let status = resp.status();
                    if status.as_u16() == 429 {
                        last_err = "Yahoo Finance rate limit (429)".to_string();
                        continue;
                    }
                    if !status.is_success() {
                        last_err = format!("Yahoo Finance HTTP {status}");
                        if status.is_server_error() {
                            continue;
                        }
                        return Err(last_err);
                    }
                    return resp
                        .json::<Value>()
                        .await
                        .map_err(|e| format!("Failed to parse Yahoo JSON: {e}"));
                }
                Err(err) => {
                    last_err = format!("Yahoo Finance request failed: {err}");
                }
            }
        }

        Err(last_err)
    }

    pub fn parse_quote_from_chart_json(payload: &Value) -> YahooQuote {
        let Some(result) = payload
            .get("chart")
            .and_then(|c| c.get("result"))
            .and_then(|r| r.as_array())
            .and_then(|arr| arr.first())
        else {
            return YahooQuote::default();
        };

        let meta = result.get("meta");
        let last_close = result
            .get("indicators")
            .and_then(|ind| ind.get("quote"))
            .and_then(|q| q.as_array())
            .and_then(|arr| arr.first())
            .and_then(|q0| q0.get("close"))
            .and_then(|c| c.as_array())
            .and_then(|closes| {
                closes
                    .iter()
                    .rev()
                    .find_map(|v| to_finite_float(Some(v)).filter(|&n| n > 0.0))
            });

        let candidates = [
            meta.and_then(|m| to_finite_float(m.get("regularMarketPrice"))),
            last_close,
            meta.and_then(|m| to_finite_float(m.get("chartPreviousClose"))),
            meta.and_then(|m| to_finite_float(m.get("previousClose"))),
        ];

        let price = candidates
            .into_iter()
            .flatten()
            .find(|&p| p > 0.0)
            .unwrap_or(0.0);

        let name = meta
            .and_then(|m| {
                m.get("longName")
                    .and_then(|v| v.as_str())
                    .filter(|s| !s.trim().is_empty())
                    .or_else(|| {
                        m.get("shortName")
                            .and_then(|v| v.as_str())
                            .filter(|s| !s.trim().is_empty())
                    })
            })
            .unwrap_or("")
            .trim()
            .to_string();

        let currency = meta
            .and_then(|m| m.get("currency").and_then(|v| v.as_str()))
            .unwrap_or("")
            .trim()
            .to_string();

        YahooQuote {
            price,
            name,
            currency,
        }
    }

    pub fn parse_dividends_from_chart_json(payload: &Value) -> Vec<YahooDividend> {
        let Some(result) = payload
            .get("chart")
            .and_then(|c| c.get("result"))
            .and_then(|r| r.as_array())
            .and_then(|arr| arr.first())
        else {
            return Vec::new();
        };

        let meta = result.get("meta");
        let tz_name = meta.and_then(|m| m.get("exchangeTimezoneName").and_then(|v| v.as_str()));
        let gmt_offset = meta
            .and_then(|m| m.get("gmtoffset").and_then(|v| v.as_i64()))
            .map(|v| v as i32);

        let Some(div_map) = result
            .get("events")
            .and_then(|e| e.get("dividends"))
            .and_then(|d| d.as_object())
        else {
            return Vec::new();
        };

        let mut divs = Vec::new();
        for (ts_key, entry) in div_map {
            let amt = to_finite_float(entry.get("amount"));
            let Some(amount) = amt.filter(|&a| a > 0.0) else {
                continue;
            };
            let raw_ts = entry
                .get("date")
                .and_then(|v| v.as_i64())
                .or_else(|| ts_key.parse::<i64>().ok())
                .unwrap_or(0);
            if raw_ts <= 0 {
                continue;
            }
            let midnight_epoch = timestamp_to_utc_midnight_epoch(raw_ts, tz_name, gmt_offset);
            if midnight_epoch > 0 {
                divs.push(YahooDividend {
                    amount,
                    date: midnight_epoch,
                });
            }
        }

        divs.sort_by_key(|d| std::cmp::Reverse(d.date));
        divs
    }
}

impl YahooFinanceProvider for HttpYahooFinanceClient {
    fn get_quote<'a>(&'a self, yahoo_symbol: &'a str) -> BoxFuture<'a, Result<YahooQuote, String>> {
        Box::pin(async move {
            if yahoo_symbol.trim().is_empty() {
                return Ok(YahooQuote::default());
            }
            let json = self
                .fetch_chart_json(
                    yahoo_symbol,
                    &[
                        ("range", "5d"),
                        ("interval", "1d"),
                        ("includePrePost", "false"),
                    ],
                )
                .await?;
            Ok(Self::parse_quote_from_chart_json(&json))
        })
    }

    fn get_exchange_rate<'a>(
        &'a self,
        from_currency: &'a str,
        to_currency: &'a str,
    ) -> BoxFuture<'a, Result<f64, String>> {
        Box::pin(async move {
            let pair = format!("{from_currency}{to_currency}=X");
            let quote = self.get_quote(&pair).await?;
            Ok(quote.price)
        })
    }

    fn get_dividends<'a>(
        &'a self,
        yahoo_symbol: &'a str,
        period: Option<&'a str>,
    ) -> BoxFuture<'a, Result<Vec<YahooDividend>, String>> {
        Box::pin(async move {
            if yahoo_symbol.trim().is_empty() {
                return Ok(Vec::new());
            }
            let effective_period = period.unwrap_or(&self.dividend_period);
            let json = self
                .fetch_chart_json(
                    yahoo_symbol,
                    &[
                        ("range", effective_period),
                        ("interval", "1d"),
                        ("events", "div"),
                    ],
                )
                .await?;
            Ok(Self::parse_dividends_from_chart_json(&json))
        })
    }
}
