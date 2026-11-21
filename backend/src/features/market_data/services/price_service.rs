use std::collections::{HashMap, HashSet};
use std::sync::{Arc, OnceLock};

use chrono::Utc;
use encoding_rs::WINDOWS_874;
use regex::Regex;
use serde::{Deserialize, Serialize};
use serde_json::Value;

use crate::config::settings::Settings;
use crate::features::market_data::services::nav_service::NavService;
use crate::features::portfolio::models::transaction::PriceData;
use crate::utils::cache::{AsyncSingleflight, TTLCache};
use crate::utils::format_utils::{resolve_quote_currency, to_yahoo_symbol};
use crate::utils::http_client::HttpResources;
use crate::utils::yfinance_client::{YahooDividend, YahooFinanceProvider};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct StockDividendResult {
    pub trailing_12m_dps: f64,
    pub dividends: Vec<StockDividendEvent>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct StockDividendEvent {
    pub amount: f64,
    pub date: i64,
}

impl From<YahooDividend> for StockDividendEvent {
    fn from(value: YahooDividend) -> Self {
        Self {
            amount: value.amount,
            date: value.date,
        }
    }
}

#[derive(Debug, Clone, Serialize)]
pub struct PricesAndRateResponse {
    pub prices: HashMap<String, PriceData>,
    pub rate: f64,
}

pub fn common_crypto_name(base: &str) -> Option<&'static str> {
    match base {
        "BTC" => Some("Bitcoin"),
        "ETH" => Some("Ethereum"),
        "SOL" => Some("Solana"),
        "USDT" => Some("Tether USDt"),
        "BNB" => Some("BNB"),
        "XRP" => Some("XRP"),
        "ADA" => Some("Cardano"),
        "DOGE" => Some("Dogecoin"),
        "DOT" => Some("Polkadot"),
        "AVAX" => Some("Avalanche"),
        _ => None,
    }
}

pub fn parse_set_listed_companies_html(raw_bytes: &[u8]) -> HashMap<String, String> {
    static TR_RE: OnceLock<Regex> = OnceLock::new();
    static TD_RE: OnceLock<Regex> = OnceLock::new();
    static TAG_RE: OnceLock<Regex> = OnceLock::new();
    static WS_RE: OnceLock<Regex> = OnceLock::new();

    let tr_re = TR_RE.get_or_init(|| Regex::new(r"(?is)<tr[^>]*>(.*?)</tr>").expect("valid regex"));
    let td_re = TD_RE.get_or_init(|| Regex::new(r"(?is)<td[^>]*>(.*?)</td>").expect("valid regex"));
    let tag_re = TAG_RE.get_or_init(|| Regex::new(r"<[^>]+>").expect("valid regex"));
    let ws_re = WS_RE.get_or_init(|| Regex::new(r"\s+").expect("valid regex"));

    let (decoded, _, _) = WINDOWS_874.decode(raw_bytes);
    let mut parsed = HashMap::new();

    for row_cap in tr_re.captures_iter(&decoded) {
        let Some(row_html) = row_cap.get(1).map(|m| m.as_str()) else {
            continue;
        };
        let cells: Vec<&str> = td_re
            .captures_iter(row_html)
            .filter_map(|c| c.get(1).map(|m| m.as_str()))
            .collect();
        if cells.len() < 2 {
            continue;
        }
        let sym_stripped = tag_re.replace_all(cells[0], "");
        let sym_raw = html_escape::decode_html_entities(&sym_stripped)
            .trim()
            .to_uppercase();

        let name_stripped = tag_re.replace_all(cells[1], "");
        let name_unescaped = html_escape::decode_html_entities(&name_stripped);
        let name_raw = ws_re.replace_all(&name_unescaped, " ").trim().to_string();

        if sym_raw.is_empty()
            || name_raw.is_empty()
            || sym_raw.contains(' ')
            || matches!(sym_raw.as_str(), "SYMBOL" | "หลักทรัพย์" | "SECURITIES")
        {
            continue;
        }
        parsed.insert(sym_raw, name_raw);
    }

    parsed
}

#[derive(Clone)]
pub struct PriceService {
    settings: Arc<Settings>,
    http: Arc<HttpResources>,
    cache: Arc<TTLCache>,
    singleflight: Arc<AsyncSingleflight>,
    nav_service: NavService,
    yf_client: Arc<dyn YahooFinanceProvider>,
}

impl PriceService {
    pub fn new(
        settings: Arc<Settings>,
        http: Arc<HttpResources>,
        cache: Arc<TTLCache>,
        singleflight: Arc<AsyncSingleflight>,
        nav_service: NavService,
        yf_client: Arc<dyn YahooFinanceProvider>,
    ) -> Self {
        Self {
            settings,
            http,
            cache,
            singleflight,
            nav_service,
            yf_client,
        }
    }

    pub async fn fetch_prices_and_rate(
        &self,
        summaries: &[HashMap<String, String>],
    ) -> PricesAndRateResponse {
        let (prices, rate) = tokio::join!(
            self.fetch_prices(summaries),
            self.fetch_exchange_rate("USD", "THB"),
        );
        PricesAndRateResponse { prices, rate }
    }

    pub async fn fetch_exchange_rate(&self, from_currency: &str, to_currency: &str) -> f64 {
        if from_currency == to_currency {
            return 1.0;
        }

        let cache_key = format!("rate_{from_currency}_{to_currency}");
        if let Some(cached) = self.cache.get::<f64>(&cache_key) {
            return cached;
        }

        let this = self.clone();
        let from_owned = from_currency.to_string();
        let to_owned = to_currency.to_string();
        let sf_key = format!("fetch_rate_{from_currency}_{to_currency}");

        let res: Result<f64, String> = self
            .singleflight
            .execute(&sf_key, move || async move {
                if let Some(c) = this.cache.get::<f64>(&cache_key) {
                    return Ok(c);
                }
                match this
                    .yf_client
                    .get_exchange_rate(&from_owned, &to_owned)
                    .await
                {
                    Ok(rate) => {
                        if rate > 0.0 {
                            this.cache.set(cache_key, rate, Some(300.0));
                        }
                        Ok(rate)
                    }
                    Err(err) => {
                        tracing::warn!(
                            provider = "yfinance",
                            operation = "exchange_rate",
                            error = %err,
                            "market_data_provider_request_failed"
                        );
                        Ok(0.0)
                    }
                }
            })
            .await;

        res.unwrap_or(0.0)
    }

    pub fn is_crypto(s: &HashMap<String, String>) -> bool {
        s.get("assetType").map(String::as_str) == Some("crypto")
            || s.get("symbol")
                .map(|sym| sym.to_uppercase().ends_with(".CRYPTO"))
                .unwrap_or(false)
    }

    pub fn is_fund(s: &HashMap<String, String>) -> bool {
        let sym = s
            .get("symbol")
            .map(|sym| sym.to_uppercase())
            .unwrap_or_default();
        s.get("assetType").map(String::as_str) == Some("mutual-fund")
            || sym.ends_with(".FUND")
            || sym.ends_with(".BKFUND")
    }

    pub fn is_pvd(s: &HashMap<String, String>) -> bool {
        s.get("assetType").map(String::as_str) == Some("provident-fund")
            || s.get("symbol")
                .map(|sym| sym.to_uppercase().starts_with("PVD"))
                .unwrap_or(false)
    }

    pub async fn fetch_prices(
        &self,
        summaries: &[HashMap<String, String>],
    ) -> HashMap<String, PriceData> {
        if summaries.is_empty() {
            return HashMap::new();
        }

        let stock_symbols: Vec<String> = summaries
            .iter()
            .filter(|s| !Self::is_fund(s) && !Self::is_crypto(s) && !Self::is_pvd(s))
            .filter_map(|s| s.get("symbol").cloned())
            .collect::<HashSet<_>>()
            .into_iter()
            .collect();

        let thai_stock_symbols: HashSet<String> = summaries
            .iter()
            .filter(|s| {
                (s.get("assetType").map(String::as_str) == Some("thai-stock")
                    || s.get("symbol")
                        .map(|sym| sym.to_uppercase().ends_with(".BK"))
                        .unwrap_or(false))
                    && !Self::is_fund(s)
                    && !Self::is_crypto(s)
                    && !Self::is_pvd(s)
            })
            .filter_map(|s| s.get("symbol").cloned())
            .collect();

        let crypto_symbols: Vec<String> = summaries
            .iter()
            .filter(|s| Self::is_crypto(s))
            .filter_map(|s| s.get("symbol").cloned())
            .collect::<HashSet<_>>()
            .into_iter()
            .collect();

        let fund_symbols: Vec<String> = summaries
            .iter()
            .filter(|s| Self::is_fund(s))
            .filter_map(|s| s.get("symbol").cloned())
            .collect::<HashSet<_>>()
            .into_iter()
            .collect();

        let stock_fut = async {
            if stock_symbols.is_empty() {
                HashMap::new()
            } else {
                self.fetch_stock_prices(&stock_symbols, Some(&thai_stock_symbols))
                    .await
            }
        };
        let crypto_fut = async {
            if crypto_symbols.is_empty() {
                HashMap::new()
            } else {
                self.fetch_crypto_prices(&crypto_symbols).await
            }
        };
        let fund_fut = async {
            if fund_symbols.is_empty() {
                HashMap::new()
            } else {
                self.nav_service.fetch_fund_navs(&fund_symbols).await
            }
        };

        let (stocks, cryptos, funds) = tokio::join!(stock_fut, crypto_fut, fund_fut);
        let mut merged = HashMap::new();
        merged.extend(stocks);
        merged.extend(cryptos);
        merged.extend(funds);
        merged
    }

    pub async fn fetch_single_stock(&self, symbol: &str) -> (String, PriceData) {
        let cache_key = format!("stock_price_{symbol}");
        if let Some(cached) = self.cache.get::<PriceData>(&cache_key) {
            return (symbol.to_string(), cached);
        }

        let this = self.clone();
        let sym_owned = symbol.to_string();
        let sf_key = cache_key.clone();

        let res: Result<(String, PriceData), String> = self
            .singleflight
            .execute(&sf_key, move || async move {
                if let Some(c) = this.cache.get::<PriceData>(&cache_key) {
                    return Ok((sym_owned.clone(), c));
                }
                let yahoo_symbol = to_yahoo_symbol(&sym_owned);
                match this.yf_client.get_quote(&yahoo_symbol).await {
                    Ok(quote) => {
                        let data = PriceData {
                            symbol: sym_owned.clone(),
                            name: Some(quote.name.clone()),
                            name_th: Some(String::new()),
                            price: quote.price,
                            currency: quote.currency,
                        };
                        if quote.price > 0.0 || !quote.name.is_empty() {
                            this.cache.set(cache_key, data.clone(), Some(60.0));
                        }
                        Ok((sym_owned, data))
                    }
                    Err(err) => {
                        tracing::warn!(
                            provider = "yfinance",
                            operation = "stock_price",
                            error = %err,
                            "market_data_provider_request_failed"
                        );
                        Ok((
                            sym_owned.clone(),
                            PriceData {
                                symbol: sym_owned,
                                name: Some(String::new()),
                                name_th: Some(String::new()),
                                price: 0.0,
                                currency: String::new(),
                            },
                        ))
                    }
                }
            })
            .await;

        res.unwrap_or_else(|_| {
            (
                symbol.to_string(),
                PriceData {
                    symbol: symbol.to_string(),
                    name: Some(String::new()),
                    name_th: Some(String::new()),
                    price: 0.0,
                    currency: String::new(),
                },
            )
        })
    }

    async fn fetch_set_html_map(&self, url: &str) -> HashMap<String, String> {
        let Ok(resp) = self.http.client.get(url).send().await else {
            return HashMap::new();
        };
        let Ok(resp) = resp.error_for_status() else {
            return HashMap::new();
        };
        let Ok(bytes) = resp.bytes().await else {
            return HashMap::new();
        };
        parse_set_listed_companies_html(&bytes)
    }

    pub async fn fetch_set_listed_company_names(&self) -> HashMap<String, (String, String)> {
        let cache_key = "set_listed_company_names".to_string();
        if let Some(cached) = self
            .cache
            .get::<HashMap<String, (String, String)>>(&cache_key)
        {
            return cached;
        }

        let this = self.clone();
        let ck = cache_key.clone();
        let res: Result<HashMap<String, (String, String)>, String> = self
            .singleflight
            .execute(&cache_key, move || async move {
                if let Some(c) = this.cache.get::<HashMap<String, (String, String)>>(&ck) {
                    return Ok(c);
                }
                let (th_map, en_map) = tokio::join!(
                    this.fetch_set_html_map(&this.settings.set_th_url),
                    this.fetch_set_html_map(&this.settings.set_en_url),
                );
                let mut combined = HashMap::new();
                let all_syms: HashSet<String> =
                    th_map.keys().chain(en_map.keys()).cloned().collect();
                for sym in all_syms {
                    let th = th_map.get(&sym).cloned().unwrap_or_default();
                    let en = en_map.get(&sym).cloned().unwrap_or_default();
                    combined.insert(sym, (th, en));
                }
                if !combined.is_empty() {
                    this.cache.set(ck, combined.clone(), Some(86400.0));
                }
                Ok(combined)
            })
            .await;

        res.unwrap_or_default()
    }

    pub async fn fetch_stock_prices(
        &self,
        symbols: &[String],
        thai_symbols: Option<&HashSet<String>>,
    ) -> HashMap<String, PriceData> {
        static BK_SUFFIX_RE: OnceLock<Regex> = OnceLock::new();
        let bk_re = BK_SUFFIX_RE.get_or_init(|| Regex::new(r"(?i)\.BK$").expect("valid regex"));

        let resolved_thai: HashSet<String> = symbols
            .iter()
            .filter(|sym| {
                sym.to_uppercase().ends_with(".BK")
                    || thai_symbols.is_some_and(|set| set.contains(*sym))
            })
            .cloned()
            .collect();

        let stocks_fut = async {
            let mut handles = Vec::with_capacity(symbols.len());
            for sym in symbols {
                let svc = self.clone();
                let sym_owned = sym.clone();
                handles.push(tokio::spawn(async move {
                    svc.fetch_single_stock(&sym_owned).await
                }));
            }
            let mut out = Vec::with_capacity(symbols.len());
            for h in handles {
                if let Ok(item) = h.await {
                    out.push(item);
                }
            }
            out
        };

        let (results, set_names) = if !resolved_thai.is_empty() {
            tokio::join!(stocks_fut, self.fetch_set_listed_company_names())
        } else {
            (stocks_fut.await, HashMap::new())
        };

        let mut price_map = HashMap::new();
        for (sym, mut data) in results {
            if resolved_thai.contains(&sym) && !set_names.is_empty() {
                let base_sym = bk_re.replace(sym.trim(), "").trim().to_uppercase();
                if let Some((th_name, en_name)) = set_names.get(&base_sym) {
                    if !th_name.is_empty() || !en_name.is_empty() {
                        let current_name = data.name.as_deref().unwrap_or("");
                        let final_en = if !current_name.is_empty() {
                            current_name.to_string()
                        } else if !en_name.is_empty() {
                            en_name.clone()
                        } else {
                            th_name.clone()
                        };
                        let final_curr = if !data.currency.is_empty() {
                            data.currency.clone()
                        } else if data.price > 0.0 || !th_name.is_empty() || !en_name.is_empty() {
                            "THB".to_string()
                        } else {
                            String::new()
                        };
                        data.name = Some(final_en);
                        data.name_th = Some(th_name.clone());
                        data.currency = final_curr;
                    }
                }
            }
            let has_name = data.name.as_deref().is_some_and(|n| !n.is_empty());
            if data.price > 0.0 || has_name {
                price_map.insert(sym, data);
            }
        }
        price_map
    }

    async fn fetch_binance_tickers(&self) -> Vec<Value> {
        let cache_key = "binance_tickers".to_string();
        if let Some(cached) = self.cache.get::<Vec<Value>>(&cache_key) {
            return cached;
        }

        let this = self.clone();
        let res: Result<Vec<Value>, String> = self
            .singleflight
            .execute("fetch_binance_tickers", move || async move {
                if let Some(c) = this.cache.get::<Vec<Value>>(&cache_key) {
                    return Ok(c);
                }
                let url = format!(
                    "{}/api/v1/ticker/price",
                    this.settings.binance_base_url.trim_end_matches('/')
                );
                let fetched = async {
                    let _permit = this
                        .http
                        .binance_sem
                        .acquire()
                        .await
                        .map_err(|e| e.to_string())?;
                    let resp = this
                        .http
                        .client
                        .get(&url)
                        .send()
                        .await
                        .map_err(|e| e.to_string())?;
                    let resp = resp.error_for_status().map_err(|e| e.to_string())?;
                    resp.json::<Value>().await.map_err(|e| e.to_string())
                }
                .await;

                match fetched {
                    Ok(Value::Array(arr)) => {
                        this.cache.set(cache_key, arr.clone(), Some(30.0));
                        Ok(arr)
                    }
                    Ok(other @ Value::Object(_)) => {
                        let arr = vec![other];
                        this.cache.set(cache_key, arr.clone(), Some(30.0));
                        Ok(arr)
                    }
                    Ok(_) => Ok(Vec::new()),
                    Err(err) => {
                        tracing::warn!(
                            provider = "binance_thailand",
                            operation = "crypto_tickers",
                            error = %err,
                            "market_data_provider_request_failed"
                        );
                        Ok(Vec::new())
                    }
                }
            })
            .await;

        res.unwrap_or_default()
    }

    pub async fn fetch_yahoo_crypto_name(&self, symbol: &str) -> (String, String) {
        static CRYPTO_RE: OnceLock<Regex> = OnceLock::new();
        let re = CRYPTO_RE.get_or_init(|| Regex::new(r"(?i)\.CRYPTO$").expect("valid regex"));
        let base = re.replace(symbol.trim(), "").trim().to_uppercase();
        if let Some(common) = common_crypto_name(&base) {
            return (symbol.to_string(), common.to_string());
        }

        let cache_key = format!("crypto_name_{symbol}");
        if let Some(cached) = self.cache.get::<String>(&cache_key) {
            return (symbol.to_string(), cached);
        }

        let this = self.clone();
        let sym_owned = symbol.to_string();
        let sf_key = cache_key.clone();
        let res: Result<(String, String), String> = self
            .singleflight
            .execute(&sf_key, move || async move {
                if let Some(c) = this.cache.get::<String>(&cache_key) {
                    return Ok((sym_owned.clone(), c));
                }
                let yahoo_symbol = format!("{base}-USD");
                match this.yf_client.get_quote(&yahoo_symbol).await {
                    Ok(quote) => {
                        if !quote.name.is_empty() {
                            this.cache.set(cache_key, quote.name.clone(), Some(86400.0));
                        }
                        Ok((sym_owned, quote.name))
                    }
                    Err(err) => {
                        tracing::warn!(
                            provider = "yfinance",
                            operation = "crypto_name",
                            error = %err,
                            "market_data_provider_request_failed"
                        );
                        Ok((sym_owned, String::new()))
                    }
                }
            })
            .await;

        res.unwrap_or_else(|_| (symbol.to_string(), String::new()))
    }

    pub fn resolve_crypto_price(&self, raw_symbol: &str, tickers: &[Value]) -> (f64, String) {
        static CRYPTO_RE: OnceLock<Regex> = OnceLock::new();
        let re = CRYPTO_RE.get_or_init(|| Regex::new(r"(?i)\.CRYPTO$").expect("valid regex"));
        let base = re.replace(raw_symbol.trim(), "").trim().to_uppercase();
        if base.is_empty() || tickers.is_empty() {
            return (0.0, String::new());
        }

        let mut matches: Vec<(String, f64)> = Vec::new();
        for t in tickers {
            let sym = t
                .get("symbol")
                .and_then(|v| v.as_str())
                .unwrap_or("")
                .to_uppercase();
            let price = t
                .get("price")
                .and_then(|v| {
                    v.as_f64()
                        .or_else(|| v.as_str().and_then(|s| s.parse::<f64>().ok()))
                })
                .unwrap_or(0.0);
            if price <= 0.0 {
                continue;
            }
            if sym == base {
                let quote = if sym.ends_with("THB") {
                    "THB"
                } else if sym.contains("USD") {
                    "USD"
                } else {
                    ""
                };
                let resolved = if quote.is_empty() {
                    String::new()
                } else {
                    resolve_quote_currency(quote)
                };
                matches.push((resolved, price));
            } else if sym.starts_with(&base) {
                let quote = &sym[base.len()..];
                matches.push((resolve_quote_currency(quote), price));
            }
        }

        if matches.is_empty() {
            return (0.0, String::new());
        }

        let best = matches
            .iter()
            .find(|(curr, _)| curr == "THB")
            .or_else(|| matches.iter().find(|(curr, _)| curr == "USD"))
            .unwrap_or(&matches[0]);

        let final_curr = if best.0.is_empty() {
            "USD".to_string()
        } else {
            best.0.clone()
        };
        (best.1, final_curr)
    }

    pub async fn fetch_crypto_prices(&self, symbols: &[String]) -> HashMap<String, PriceData> {
        let names_fut = async {
            let mut handles = Vec::with_capacity(symbols.len());
            for sym in symbols {
                let svc = self.clone();
                let sym_owned = sym.clone();
                handles.push(tokio::spawn(async move {
                    svc.fetch_yahoo_crypto_name(&sym_owned).await
                }));
            }
            let mut map = HashMap::new();
            for h in handles {
                if let Ok((s, n)) = h.await {
                    map.insert(s, n);
                }
            }
            map
        };

        let (tickers, name_map) = tokio::join!(self.fetch_binance_tickers(), names_fut);

        let mut price_map = HashMap::new();
        for symbol in symbols {
            let (price, currency) = self.resolve_crypto_price(symbol, &tickers);
            let dynamic_name = name_map.get(symbol).cloned().unwrap_or_default();
            price_map.insert(
                symbol.clone(),
                PriceData {
                    symbol: symbol.clone(),
                    name: Some(dynamic_name),
                    name_th: Some(String::new()),
                    price,
                    currency,
                },
            );
        }
        price_map
    }

    async fn fetch_single_stock_dividends(&self, symbol: &str) -> (String, StockDividendResult) {
        let cache_key = format!("stock_div_{symbol}");
        if let Some(cached) = self.cache.get::<StockDividendResult>(&cache_key) {
            return (symbol.to_string(), cached);
        }

        let this = self.clone();
        let sym_owned = symbol.to_string();
        let sf_key = cache_key.clone();

        let res: Result<(String, StockDividendResult), String> = self
            .singleflight
            .execute(&sf_key, move || async move {
                if let Some(c) = this.cache.get::<StockDividendResult>(&cache_key) {
                    return Ok((sym_owned.clone(), c));
                }
                let yahoo_symbol = to_yahoo_symbol(&sym_owned);
                match this.yf_client.get_dividends(&yahoo_symbol, None).await {
                    Ok(div_list) => {
                        let one_year_ago_ts = Utc::now().timestamp() - (365 * 24 * 3600);
                        let trailing_12m: f64 = div_list
                            .iter()
                            .filter(|d| d.date >= one_year_ago_ts)
                            .map(|d| d.amount)
                            .sum();
                        let events: Vec<StockDividendEvent> =
                            div_list.into_iter().map(Into::into).collect();
                        let res_data = StockDividendResult {
                            trailing_12m_dps: trailing_12m,
                            dividends: events,
                        };
                        this.cache.set(cache_key, res_data.clone(), Some(3600.0));
                        Ok((sym_owned, res_data))
                    }
                    Err(err) => {
                        tracing::warn!(
                            provider = "yfinance",
                            operation = "stock_dividends",
                            error = %err,
                            "market_data_provider_request_failed"
                        );
                        Ok((
                            sym_owned,
                            StockDividendResult {
                                trailing_12m_dps: 0.0,
                                dividends: Vec::new(),
                            },
                        ))
                    }
                }
            })
            .await;

        res.unwrap_or_else(|_| {
            (
                symbol.to_string(),
                StockDividendResult {
                    trailing_12m_dps: 0.0,
                    dividends: Vec::new(),
                },
            )
        })
    }

    pub async fn fetch_stock_dividends(
        &self,
        symbols: &[String],
    ) -> HashMap<String, StockDividendResult> {
        let unique: Vec<String> = symbols
            .iter()
            .filter(|s| {
                let mut m = HashMap::new();
                m.insert("symbol".to_string(), (*s).clone());
                !Self::is_crypto(&m) && !Self::is_fund(&m)
            })
            .cloned()
            .collect::<HashSet<_>>()
            .into_iter()
            .collect();
        if unique.is_empty() {
            return HashMap::new();
        }

        let mut handles = Vec::with_capacity(unique.len());
        for sym in unique {
            let svc = self.clone();
            handles.push(tokio::spawn(async move {
                svc.fetch_single_stock_dividends(&sym).await
            }));
        }

        let mut out = HashMap::new();
        for h in handles {
            if let Ok((sym, res)) = h.await {
                out.insert(sym, res);
            }
        }
        out
    }
}
