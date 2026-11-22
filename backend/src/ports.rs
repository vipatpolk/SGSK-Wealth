use std::collections::HashMap;
use std::future::Future;
use std::pin::Pin;
use std::sync::Arc;

use serde_json::{Map, Value};

use crate::config::settings::Settings;
use crate::config::sheet_config::{get_sheet_export_url, AssetTab, ASSET_TABS};
use crate::features::market_data::models::factsheet::FundFactsheetResponse;
use crate::features::market_data::services::nav_service::NavService;
use crate::features::market_data::services::price_service::{PriceService, StockDividendResult};
use crate::features::portfolio::models::transaction::PriceData;
use crate::utils::cache::TTLCache;
use crate::utils::google_auth::get_google_auth_headers;
use crate::utils::http_client::HttpResources;

pub type PortFuture<'a, T> = Pin<Box<dyn Future<Output = T> + Send + 'a>>;

pub trait TransactionSheetPort: Send + Sync {
    fn fetch_tab_csv<'a>(&'a self, tab: &'a AssetTab) -> PortFuture<'a, Result<String, String>>;

    fn fetch_all_tabs_csv<'a>(
        &'a self,
    ) -> PortFuture<'a, Result<Vec<(&'static AssetTab, String)>, String>>;
}

pub trait MarketPricePort: Send + Sync {
    fn fetch_quotes<'a>(
        &'a self,
        summaries: &'a [HashMap<String, String>],
    ) -> PortFuture<'a, HashMap<String, PriceData>>;

    fn fetch_fx_rate<'a>(
        &'a self,
        from_currency: &'a str,
        to_currency: &'a str,
    ) -> PortFuture<'a, f64>;

    fn fetch_stock_dividends<'a>(
        &'a self,
        symbols: &'a [String],
    ) -> PortFuture<'a, HashMap<String, StockDividendResult>>;
}

pub trait FundNavPort: Send + Sync {
    fn fetch_navs<'a>(
        &'a self,
        symbols: &'a [String],
    ) -> PortFuture<'a, HashMap<String, PriceData>>;

    fn fetch_factsheet<'a>(
        &'a self,
        symbol: &'a str,
        asset_type: &'a str,
        fund_name: Option<&'a str>,
    ) -> PortFuture<'a, FundFactsheetResponse>;

    fn fetch_fund_dividends<'a>(
        &'a self,
        symbols: &'a [String],
    ) -> PortFuture<'a, HashMap<String, Vec<Map<String, Value>>>>;

    fn fetch_pvd_policies<'a>(
        &'a self,
        proj_id: Option<&'a str>,
        fund_name: Option<&'a str>,
    ) -> PortFuture<'a, HashMap<String, Map<String, Value>>>;
}

pub trait IdentityProfilePort: Send + Sync {
    fn fetch_profile_flags<'a>(
        &'a self,
        user_id: &'a str,
        token: &'a str,
        settings: &'a Settings,
    ) -> PortFuture<'a, Option<(String, bool)>>;
}

#[derive(Clone)]
pub struct GoogleSheetsAdapter {
    settings: Arc<Settings>,
    http: Arc<HttpResources>,
    cache: Arc<TTLCache>,
}

impl GoogleSheetsAdapter {
    pub fn new(settings: Arc<Settings>, http: Arc<HttpResources>, cache: Arc<TTLCache>) -> Self {
        Self {
            settings,
            http,
            cache,
        }
    }

    async fn fetch_tab_csv_internal(&self, tab: &AssetTab) -> Result<String, String> {
        let url = get_sheet_export_url(&self.settings, tab.sheet_gid, Some(tab.id), None);
        let headers = get_google_auth_headers(&self.settings, &self.http, &self.cache).await;

        let _permit = self
            .http
            .sheets_sem
            .acquire()
            .await
            .map_err(|e| e.to_string())?;

        let mut req = self.http.client.get(&url);
        for (k, v) in &headers {
            req = req.header(k.as_str(), v.as_str());
        }
        let resp = req.send().await.map_err(|e| e.to_string())?;
        let resp = resp.error_for_status().map_err(|e| e.to_string())?;
        resp.text().await.map_err(|e| e.to_string())
    }
}

impl TransactionSheetPort for GoogleSheetsAdapter {
    fn fetch_tab_csv<'a>(&'a self, tab: &'a AssetTab) -> PortFuture<'a, Result<String, String>> {
        Box::pin(async move { self.fetch_tab_csv_internal(tab).await })
    }

    fn fetch_all_tabs_csv<'a>(
        &'a self,
    ) -> PortFuture<'a, Result<Vec<(&'static AssetTab, String)>, String>> {
        Box::pin(async move {
            let sheet_tabs: Vec<&'static AssetTab> = ASSET_TABS
                .iter()
                .filter(|t| !t.sheet_gid.is_empty())
                .collect();

            if sheet_tabs.is_empty() {
                return Ok(Vec::new());
            }

            let mut handles = Vec::with_capacity(sheet_tabs.len());
            for tab in sheet_tabs {
                let adapter = self.clone();
                handles.push(tokio::spawn(async move {
                    let csv_res = adapter.fetch_tab_csv_internal(tab).await;
                    (tab, csv_res)
                }));
            }

            let mut results = Vec::new();
            let mut first_error: Option<String> = None;
            for handle in handles {
                match handle.await {
                    Ok((tab, Ok(csv))) => results.push((tab, csv)),
                    Ok((_tab, Err(err))) => {
                        if first_error.is_none() {
                            first_error = Some(err);
                        }
                    }
                    Err(join_err) => {
                        if first_error.is_none() {
                            first_error = Some(join_err.to_string());
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

#[derive(Clone)]
pub struct PriceServicePortAdapter {
    service: PriceService,
}

impl PriceServicePortAdapter {
    pub fn new(service: PriceService) -> Self {
        Self { service }
    }
}

impl MarketPricePort for PriceServicePortAdapter {
    fn fetch_quotes<'a>(
        &'a self,
        summaries: &'a [HashMap<String, String>],
    ) -> PortFuture<'a, HashMap<String, PriceData>> {
        Box::pin(async move { self.service.fetch_prices(summaries).await })
    }

    fn fetch_fx_rate<'a>(
        &'a self,
        from_currency: &'a str,
        to_currency: &'a str,
    ) -> PortFuture<'a, f64> {
        Box::pin(async move {
            self.service
                .fetch_exchange_rate(from_currency, to_currency)
                .await
        })
    }

    fn fetch_stock_dividends<'a>(
        &'a self,
        symbols: &'a [String],
    ) -> PortFuture<'a, HashMap<String, StockDividendResult>> {
        Box::pin(async move { self.service.fetch_stock_dividends(symbols).await })
    }
}

#[derive(Clone)]
pub struct NavServicePortAdapter {
    service: NavService,
}

impl NavServicePortAdapter {
    pub fn new(service: NavService) -> Self {
        Self { service }
    }
}

impl FundNavPort for NavServicePortAdapter {
    fn fetch_navs<'a>(
        &'a self,
        symbols: &'a [String],
    ) -> PortFuture<'a, HashMap<String, PriceData>> {
        Box::pin(async move { self.service.fetch_fund_navs(symbols).await })
    }

    fn fetch_factsheet<'a>(
        &'a self,
        symbol: &'a str,
        asset_type: &'a str,
        fund_name: Option<&'a str>,
    ) -> PortFuture<'a, FundFactsheetResponse> {
        Box::pin(async move {
            self.service
                .fetch_fund_factsheet(symbol, asset_type, fund_name)
                .await
        })
    }

    fn fetch_fund_dividends<'a>(
        &'a self,
        symbols: &'a [String],
    ) -> PortFuture<'a, HashMap<String, Vec<Map<String, Value>>>> {
        Box::pin(async move { self.service.fetch_all_fund_dividends(symbols).await })
    }

    fn fetch_pvd_policies<'a>(
        &'a self,
        proj_id: Option<&'a str>,
        fund_name: Option<&'a str>,
    ) -> PortFuture<'a, HashMap<String, Map<String, Value>>> {
        Box::pin(async move { self.service.fetch_pvd_policies(proj_id, fund_name).await })
    }
}

#[derive(Clone)]
pub struct SupabaseProfileAdapter {
    http: Arc<HttpResources>,
}

impl SupabaseProfileAdapter {
    pub fn new(http: Arc<HttpResources>) -> Self {
        Self { http }
    }
}

impl IdentityProfilePort for SupabaseProfileAdapter {
    fn fetch_profile_flags<'a>(
        &'a self,
        user_id: &'a str,
        token: &'a str,
        settings: &'a Settings,
    ) -> PortFuture<'a, Option<(String, bool)>> {
        Box::pin(async move {
            let base_url = settings.supabase_url.trim().trim_end_matches('/');
            let pub_key = settings.supabase_publishable_key.trim();
            if base_url.is_empty() || pub_key.is_empty() || user_id.is_empty() {
                return None;
            }

            let url = format!("{base_url}/rest/v1/user_profiles");
            let res = self
                .http
                .client
                .get(&url)
                .query(&[
                    ("select", "role,can_view_cloud_portfolio"),
                    ("id", &format!("eq.{user_id}")),
                ])
                .header("Authorization", format!("Bearer {token}"))
                .header("apikey", pub_key)
                .timeout(std::time::Duration::from_secs(5))
                .send()
                .await
                .ok()?;

            if res.status().as_u16() == 200 {
                let rows = res.json::<Value>().await.ok()?;
                if let Some(first) = rows.as_array().and_then(|arr| arr.first()) {
                    let role = first
                        .get("role")
                        .and_then(|v| v.as_str())
                        .filter(|s| !s.is_empty())
                        .unwrap_or("user")
                        .to_string();
                    let can_view = first
                        .get("can_view_cloud_portfolio")
                        .and_then(|v| v.as_bool())
                        .unwrap_or(false);
                    return Some((role, can_view));
                }
            }
            None
        })
    }
}
