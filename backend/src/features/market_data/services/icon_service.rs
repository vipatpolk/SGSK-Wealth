use std::collections::HashSet;
use std::sync::Arc;
use std::time::Duration;

use chrono::{DateTime, Duration as ChronoDuration, Utc};
use serde::{Deserialize, Serialize};
use serde_json::Value;

use crate::config::settings::{
    Settings, DEFAULT_LOGO_DEV_API_BASE_URL, DEFAULT_LOGO_DEV_IMG_BASE_URL,
};
use crate::features::market_data::services::nav_service::{FundAmcDetails, NavService};
use crate::utils::cache::{AsyncSingleflight, TTLCache};
use crate::utils::format_utils::get_asset_type;
use crate::utils::http_client::HttpResources;
use crate::utils::symbol_icon_utils::{
    build_logo_dev_url, clean_ticker_for_url, derive_amc_code, extract_domain_candidates,
    generate_amc_svg, generate_symbol_svg, get_symbol_color, get_symbol_logo_config_with_base,
};

const SUPABASE_LOGO_BUCKET: &str = "symbol-logos";
const RESOLVED_CACHE_DAYS: i64 = 30;
const FALLBACK_CACHE_HOURS: i64 = 24;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct IconMetadata {
    pub symbol: String,
    pub asset_type: String,
    pub clean_ticker: String,
    pub monogram: String,
    pub brand_color: String,
    pub is_mutual_fund: bool,
    pub amc_id: Option<String>,
    pub amc_name: Option<String>,
    pub amc_domain: Option<String>,
    pub icon_url: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct SupabaseLogoCacheRow {
    pub cache_key: String,
    pub symbol: String,
    pub asset_type: String,
    pub fund_name: Option<String>,
    pub amc_id: Option<String>,
    pub amc_name: Option<String>,
    pub amc_domain: Option<String>,
    pub storage_path: Option<String>,
    pub content_type: String,
    pub status: String,
    pub expires_at: String,
}

#[derive(Debug, Clone)]
enum L2CacheLookup {
    Resolved {
        bytes: Vec<u8>,
        content_type: String,
        storage_path: String,
        amc_domain: Option<String>,
    },
    FallbackSvg {
        amc_id: Option<String>,
        amc_name: Option<String>,
    },
}

#[derive(Clone)]
pub struct IconService {
    settings: Arc<Settings>,
    http: Arc<HttpResources>,
    cache: Arc<TTLCache>,
    singleflight: Arc<AsyncSingleflight>,
    nav_service: NavService,
}

impl IconService {
    pub fn new(
        settings: Arc<Settings>,
        http: Arc<HttpResources>,
        cache: Arc<TTLCache>,
        singleflight: Arc<AsyncSingleflight>,
        nav_service: NavService,
    ) -> Self {
        Self {
            settings,
            http,
            cache,
            singleflight,
            nav_service,
        }
    }

    fn has_logo_dev_img_access(&self) -> bool {
        !self.settings.logo_dev_publishable_key.trim().is_empty()
            || self
                .settings
                .logo_dev_img_base_url
                .trim()
                .trim_end_matches('/')
                != DEFAULT_LOGO_DEV_IMG_BASE_URL
    }

    fn has_logo_dev_search_access(&self) -> bool {
        !self.settings.logo_dev_secret_key.trim().is_empty()
            || self
                .settings
                .logo_dev_api_base_url
                .trim()
                .trim_end_matches('/')
                != DEFAULT_LOGO_DEV_API_BASE_URL
    }

    fn supabase_base_url(&self) -> &str {
        self.settings.supabase_url.trim().trim_end_matches('/')
    }

    fn supabase_read_key(&self) -> Option<&str> {
        let srk = self.settings.supabase_service_role_key.trim();
        if !srk.is_empty() {
            return Some(srk);
        }
        let pk = self.settings.supabase_publishable_key.trim();
        if !pk.is_empty() {
            return Some(pk);
        }
        None
    }

    fn supabase_write_key(&self) -> Option<&str> {
        let srk = self.settings.supabase_service_role_key.trim();
        (!srk.is_empty()).then_some(srk)
    }

    fn sanitize_storage_segment(raw: &str) -> String {
        let cleaned: String = raw
            .trim()
            .chars()
            .map(|c| {
                if c.is_ascii_alphanumeric() || matches!(c, '-' | '_' | '.') {
                    c
                } else {
                    '_'
                }
            })
            .collect();
        let trimmed = cleaned.trim_matches('_');
        if trimmed.is_empty() {
            "unknown".to_string()
        } else {
            trimmed.to_string()
        }
    }

    fn extension_for_media_type(media_type: &str) -> &'static str {
        let lower = media_type.to_lowercase();
        if lower.contains("webp") {
            "webp"
        } else if lower.contains("jpeg") || lower.contains("jpg") {
            "jpg"
        } else if lower.contains("svg") {
            "svg"
        } else {
            "png"
        }
    }

    async fn probe_url(&self, url: Option<&str>) -> Option<(Vec<u8>, String)> {
        let u = url?.trim();
        if u.is_empty() {
            return None;
        }
        let resp = self
            .http
            .client
            .get(u)
            .timeout(Duration::from_secs(4))
            .send()
            .await
            .ok()?;

        let status = resp.status().as_u16();
        let content_type = resp
            .headers()
            .get(axum::http::header::CONTENT_TYPE)
            .and_then(|v| v.to_str().ok())
            .unwrap_or("")
            .to_lowercase();
        let bytes = resp.bytes().await.ok()?;

        if status == 200
            && (content_type.contains("image/") || content_type.contains("svg"))
            && bytes.len() > 50
        {
            let media_type = content_type
                .split(';')
                .next()
                .unwrap_or("application/octet-stream")
                .trim()
                .to_string();
            return Some((bytes.to_vec(), media_type));
        }
        None
    }

    async fn fetch_first_valid_logo(&self, urls: &[String]) -> Option<(Vec<u8>, String)> {
        for url in urls {
            if let Some(res) = self.probe_url(Some(url.as_str())).await {
                return Some(res);
            }
        }
        None
    }

    fn is_not_expired(expires_at_str: &str) -> bool {
        DateTime::parse_from_rfc3339(expires_at_str)
            .map(|dt| dt.with_timezone(&Utc) > Utc::now())
            .unwrap_or(false)
    }

    async fn fetch_supabase_storage_object(&self, storage_path: &str) -> Option<(Vec<u8>, String)> {
        let base = self.supabase_base_url();
        if base.is_empty() || storage_path.trim().is_empty() {
            return None;
        }
        let clean_path = storage_path.trim().trim_start_matches('/');
        let url = format!("{base}/storage/v1/object/public/{SUPABASE_LOGO_BUCKET}/{clean_path}");
        self.probe_url(Some(&url)).await
    }

    async fn lookup_supabase_cache_by_key(&self, cache_key: &str) -> Option<L2CacheLookup> {
        let base = self.supabase_base_url();
        let api_key = self.supabase_read_key()?;
        if base.is_empty() {
            return None;
        }

        let url = format!("{base}/rest/v1/symbol_logo_cache");
        let resp = self
            .http
            .client
            .get(&url)
            .query(&[
                (
                    "select",
                    "cache_key,symbol,asset_type,fund_name,amc_id,amc_name,amc_domain,storage_path,content_type,status,expires_at",
                ),
                ("cache_key", &format!("eq.{cache_key}")),
                ("limit", "1"),
            ])
            .header("apikey", api_key)
            .header("Authorization", format!("Bearer {api_key}"))
            .timeout(Duration::from_secs(3))
            .send()
            .await
            .ok()?;

        if !resp.status().is_success() {
            return None;
        }

        let rows: Vec<SupabaseLogoCacheRow> = resp.json().await.ok()?;
        let row = rows.into_iter().next()?;
        if !Self::is_not_expired(&row.expires_at) {
            return None;
        }

        if row.status == "fallback_svg" {
            return Some(L2CacheLookup::FallbackSvg {
                amc_id: row.amc_id,
                amc_name: row.amc_name,
            });
        }

        let storage_path = row.storage_path?;
        let (bytes, fetched_type) = self.fetch_supabase_storage_object(&storage_path).await?;
        let content_type = if row.content_type.is_empty() {
            fetched_type
        } else {
            row.content_type
        };

        Some(L2CacheLookup::Resolved {
            bytes,
            content_type,
            storage_path,
            amc_domain: row.amc_domain,
        })
    }

    async fn lookup_supabase_cache_by_amc_id(&self, amc_id: &str) -> Option<L2CacheLookup> {
        let base = self.supabase_base_url();
        let api_key = self.supabase_read_key()?;
        let clean_amc = amc_id.trim();
        if base.is_empty() || clean_amc.is_empty() {
            return None;
        }

        let url = format!("{base}/rest/v1/symbol_logo_cache");
        let resp = self
            .http
            .client
            .get(&url)
            .query(&[
                (
                    "select",
                    "cache_key,symbol,asset_type,fund_name,amc_id,amc_name,amc_domain,storage_path,content_type,status,expires_at",
                ),
                ("amc_id", &format!("eq.{clean_amc}")),
                ("status", "eq.resolved"),
                ("limit", "1"),
            ])
            .header("apikey", api_key)
            .header("Authorization", format!("Bearer {api_key}"))
            .timeout(Duration::from_secs(3))
            .send()
            .await
            .ok()?;

        if !resp.status().is_success() {
            return None;
        }

        let rows: Vec<SupabaseLogoCacheRow> = resp.json().await.ok()?;
        let row = rows.into_iter().next()?;
        if !Self::is_not_expired(&row.expires_at) {
            return None;
        }

        let storage_path = row.storage_path?;
        let (bytes, fetched_type) = self.fetch_supabase_storage_object(&storage_path).await?;
        let content_type = if row.content_type.is_empty() {
            fetched_type
        } else {
            row.content_type
        };

        Some(L2CacheLookup::Resolved {
            bytes,
            content_type,
            storage_path,
            amc_domain: row.amc_domain,
        })
    }

    async fn upload_supabase_storage_object(
        &self,
        storage_path: &str,
        bytes: &[u8],
        content_type: &str,
    ) -> bool {
        let base = self.supabase_base_url();
        let Some(write_key) = self.supabase_write_key() else {
            return false;
        };
        if base.is_empty() || storage_path.trim().is_empty() || bytes.is_empty() {
            return false;
        }

        let clean_path = storage_path.trim().trim_start_matches('/');
        let url = format!("{base}/storage/v1/object/{SUPABASE_LOGO_BUCKET}/{clean_path}");
        let resp = self
            .http
            .client
            .post(&url)
            .header("apikey", write_key)
            .header("Authorization", format!("Bearer {write_key}"))
            .header("Content-Type", content_type)
            .header("x-upsert", "true")
            .timeout(Duration::from_secs(5))
            .body(bytes.to_vec())
            .send()
            .await;

        matches!(resp, Ok(r) if r.status().is_success())
    }

    async fn upsert_supabase_cache_row(&self, row: &SupabaseLogoCacheRow) {
        let base = self.supabase_base_url();
        let Some(write_key) = self.supabase_write_key() else {
            return;
        };
        if base.is_empty() {
            return;
        }

        let url = format!("{base}/rest/v1/symbol_logo_cache?on_conflict=cache_key");
        let _ = self
            .http
            .client
            .post(&url)
            .header("apikey", write_key)
            .header("Authorization", format!("Bearer {write_key}"))
            .header("Content-Type", "application/json")
            .header("Prefer", "resolution=merge-duplicates,return=minimal")
            .timeout(Duration::from_secs(4))
            .json(row)
            .send()
            .await;
    }

    async fn search_logo_dev_domains(&self, query: &str) -> Vec<String> {
        let clean_q = query.trim();
        if clean_q.is_empty() || !self.has_logo_dev_search_access() {
            return Vec::new();
        }

        let base = self
            .settings
            .logo_dev_api_base_url
            .trim()
            .trim_end_matches('/');
        let url = format!("{base}/search?q={}", urlencoding::encode(clean_q));
        let mut req = self.http.client.get(&url).timeout(Duration::from_secs(4));
        let sk = self.settings.logo_dev_secret_key.trim();
        if !sk.is_empty() {
            req = req.header("Authorization", format!("Bearer {sk}"));
        }

        let Ok(resp) = req.send().await else {
            return Vec::new();
        };
        if !resp.status().is_success() {
            return Vec::new();
        }
        let Ok(payload) = resp.json::<Value>().await else {
            return Vec::new();
        };

        let items = payload
            .as_array()
            .cloned()
            .or_else(|| payload.get("data").and_then(|v| v.as_array()).cloned())
            .unwrap_or_default();

        let mut domains = Vec::new();
        let mut seen = HashSet::new();
        for item in items.into_iter().take(5) {
            if let Some(domain) = item
                .get("domain")
                .and_then(|v| v.as_str())
                .map(str::trim)
                .filter(|s| !s.is_empty())
            {
                for candidate in extract_domain_candidates(Some(domain)) {
                    if seen.insert(candidate.clone()) {
                        domains.push(candidate);
                    }
                }
            }
        }
        domains
    }

    async fn fetch_logo_dev_amc_logo(
        &self,
        details: &FundAmcDetails,
    ) -> Option<((Vec<u8>, String), String)> {
        if !self.has_logo_dev_img_access() {
            return None;
        }

        let token_opt = Some(self.settings.logo_dev_publishable_key.as_str());
        let img_base = &self.settings.logo_dev_img_base_url;

        let mut candidate_domains = extract_domain_candidates(details.website_host.as_deref());
        let mut seen: HashSet<String> = candidate_domains.iter().cloned().collect();

        for domain in &candidate_domains {
            let url = build_logo_dev_url(img_base, domain, token_opt);
            if let Some(fetched) = self.probe_url(Some(&url)).await {
                return Some((fetched, domain.clone()));
            }
        }

        let search_queries: Vec<&str> = [details.amc_name.as_deref(), details.abbr_name.as_deref()]
            .into_iter()
            .flatten()
            .map(str::trim)
            .filter(|s| !s.is_empty())
            .collect();

        for query in search_queries {
            for domain in self.search_logo_dev_domains(query).await {
                if seen.insert(domain.clone()) {
                    let url = build_logo_dev_url(img_base, &domain, token_opt);
                    if let Some(fetched) = self.probe_url(Some(&url)).await {
                        return Some((fetched, domain));
                    }
                    candidate_domains.push(domain);
                }
            }
        }

        None
    }

    fn build_amc_fallback_svg(details: &FundAmcDetails) -> (Vec<u8>, String) {
        let amc_code = derive_amc_code(details.amc_name.as_deref(), details.abbr_name.as_deref());
        let seed = details
            .amc_id
            .as_deref()
            .or(details.amc_name.as_deref())
            .unwrap_or(&amc_code);
        let brand_color = get_symbol_color(seed);
        (
            generate_amc_svg(&amc_code, &brand_color),
            "image/svg+xml".to_string(),
        )
    }

    async fn get_amc_logo(
        &self,
        details: &FundAmcDetails,
        symbol: &str,
        resolved_type: &str,
        fund_name: Option<&str>,
        symbol_cache_key: &str,
    ) -> (Vec<u8>, String) {
        let cache_id = details
            .amc_id
            .as_deref()
            .or(details.website_host.as_deref())
            .or(details.amc_name.as_deref())
            .unwrap_or("unknown");
        let amc_cache_key = format!("amc_logo:{cache_id}");

        if let Some(cached) = self.cache.get::<(Vec<u8>, String)>(&amc_cache_key) {
            return cached;
        }

        let this = self.clone();
        let details_owned = details.clone();
        let sf_key = amc_cache_key.clone();
        let sym_owned = symbol.to_string();
        let type_owned = resolved_type.to_string();
        let fund_owned = fund_name.map(str::to_string);
        let sym_cache_key_owned = symbol_cache_key.to_string();
        let cache_id_owned = cache_id.to_string();

        let res: Result<(Vec<u8>, String), String> = self
            .singleflight
            .execute(&sf_key, move || async move {
                if let Some(inner) = this.cache.get::<(Vec<u8>, String)>(&amc_cache_key) {
                    return Ok(inner);
                }

                // Check L2 Supabase cache by AMC cache key or amc_id
                let l2_amc =
                    if let Some(hit) = this.lookup_supabase_cache_by_key(&amc_cache_key).await {
                        Some(hit)
                    } else if let Some(ref aid) = details_owned.amc_id {
                        this.lookup_supabase_cache_by_amc_id(aid).await
                    } else {
                        None
                    };

                if let Some(hit) = l2_amc {
                    match hit {
                        L2CacheLookup::Resolved {
                            bytes,
                            content_type,
                            storage_path,
                            amc_domain,
                        } => {
                            let resolved = (bytes, content_type.clone());
                            this.cache
                                .set(amc_cache_key.clone(), resolved.clone(), Some(86400.0));
                            let expires_at = (Utc::now()
                                + ChronoDuration::days(RESOLVED_CACHE_DAYS))
                            .to_rfc3339();
                            this.upsert_supabase_cache_row(&SupabaseLogoCacheRow {
                                cache_key: sym_cache_key_owned,
                                symbol: sym_owned,
                                asset_type: type_owned,
                                fund_name: fund_owned,
                                amc_id: details_owned.amc_id.clone(),
                                amc_name: details_owned.amc_name.clone(),
                                amc_domain: amc_domain.or(details_owned.website_host.clone()),
                                storage_path: Some(storage_path),
                                content_type,
                                status: "resolved".to_string(),
                                expires_at,
                            })
                            .await;
                            return Ok(resolved);
                        }
                        L2CacheLookup::FallbackSvg { .. } => {
                            let fallback_res = Self::build_amc_fallback_svg(&details_owned);
                            this.cache
                                .set(amc_cache_key, fallback_res.clone(), Some(3600.0));
                            return Ok(fallback_res);
                        }
                    }
                }

                // L3 Logo.dev Domain / Search lookup
                if let Some(((bytes, content_type), matched_domain)) =
                    this.fetch_logo_dev_amc_logo(&details_owned).await
                {
                    let ext = Self::extension_for_media_type(&content_type);
                    let storage_path = format!(
                        "amcs/{}.{ext}",
                        Self::sanitize_storage_segment(&cache_id_owned)
                    );
                    this.upload_supabase_storage_object(&storage_path, &bytes, &content_type)
                        .await;
                    let expires_at =
                        (Utc::now() + ChronoDuration::days(RESOLVED_CACHE_DAYS)).to_rfc3339();

                    let amc_row = SupabaseLogoCacheRow {
                        cache_key: amc_cache_key.clone(),
                        symbol: cache_id_owned,
                        asset_type: "amc".to_string(),
                        fund_name: None,
                        amc_id: details_owned.amc_id.clone(),
                        amc_name: details_owned.amc_name.clone(),
                        amc_domain: Some(matched_domain.clone()),
                        storage_path: Some(storage_path.clone()),
                        content_type: content_type.clone(),
                        status: "resolved".to_string(),
                        expires_at: expires_at.clone(),
                    };
                    this.upsert_supabase_cache_row(&amc_row).await;

                    let sym_row = SupabaseLogoCacheRow {
                        cache_key: sym_cache_key_owned,
                        symbol: sym_owned,
                        asset_type: type_owned,
                        fund_name: fund_owned,
                        amc_id: details_owned.amc_id.clone(),
                        amc_name: details_owned.amc_name.clone(),
                        amc_domain: Some(matched_domain),
                        storage_path: Some(storage_path),
                        content_type: content_type.clone(),
                        status: "resolved".to_string(),
                        expires_at,
                    };
                    this.upsert_supabase_cache_row(&sym_row).await;

                    let fetched = (bytes, content_type);
                    this.cache
                        .set(amc_cache_key, fetched.clone(), Some(86400.0));
                    return Ok(fetched);
                }

                let fallback_res = Self::build_amc_fallback_svg(&details_owned);
                let expires_at =
                    (Utc::now() + ChronoDuration::hours(FALLBACK_CACHE_HOURS)).to_rfc3339();
                this.upsert_supabase_cache_row(&SupabaseLogoCacheRow {
                    cache_key: amc_cache_key.clone(),
                    symbol: cache_id_owned,
                    asset_type: "amc".to_string(),
                    fund_name: None,
                    amc_id: details_owned.amc_id.clone(),
                    amc_name: details_owned.amc_name.clone(),
                    amc_domain: details_owned.website_host.clone(),
                    storage_path: None,
                    content_type: "image/svg+xml".to_string(),
                    status: "fallback_svg".to_string(),
                    expires_at: expires_at.clone(),
                })
                .await;
                this.upsert_supabase_cache_row(&SupabaseLogoCacheRow {
                    cache_key: sym_cache_key_owned,
                    symbol: sym_owned,
                    asset_type: type_owned,
                    fund_name: fund_owned,
                    amc_id: details_owned.amc_id.clone(),
                    amc_name: details_owned.amc_name.clone(),
                    amc_domain: details_owned.website_host.clone(),
                    storage_path: None,
                    content_type: "image/svg+xml".to_string(),
                    status: "fallback_svg".to_string(),
                    expires_at,
                })
                .await;

                this.cache
                    .set(amc_cache_key, fallback_res.clone(), Some(3600.0));
                Ok(fallback_res)
            })
            .await;

        res.unwrap_or_else(|_| {
            (
                generate_amc_svg("AMC", "#6366f1"),
                "image/svg+xml".to_string(),
            )
        })
    }

    pub async fn get_symbol_icon(
        &self,
        symbol: &str,
        asset_type: &str,
        fund_name: &str,
    ) -> (Vec<u8>, String) {
        let sym_clean = symbol.trim().to_string();
        let fund_clean = fund_name.trim().to_string();
        let resolved_type = get_asset_type(
            if asset_type.is_empty() {
                None
            } else {
                Some(asset_type)
            },
            Some(&sym_clean),
        );
        let cache_key = if resolved_type == "provident-fund" && !fund_clean.is_empty() {
            format!(
                "icon:{}:{}:{}",
                sym_clean.to_uppercase(),
                resolved_type,
                fund_clean
            )
        } else {
            format!("icon:{}:{}", sym_clean.to_uppercase(), resolved_type)
        };

        if let Some(cached) = self.cache.get::<(Vec<u8>, String)>(&cache_key) {
            return cached;
        }

        let this = self.clone();
        let sf_key = cache_key.clone();
        let res: Result<(Vec<u8>, String), String> = self
            .singleflight
            .execute(&sf_key, move || async move {
                if let Some(c) = this.cache.get::<(Vec<u8>, String)>(&cache_key) {
                    return Ok(c);
                }
                if sym_clean.is_empty() {
                    let svg = generate_symbol_svg("", &resolved_type);
                    let result = (svg, "image/svg+xml".to_string());
                    this.cache.set(cache_key, result.clone(), Some(86400.0));
                    return Ok(result);
                }

                // Check L2 Supabase cache for this symbol first
                if let Some(l2_hit) = this.lookup_supabase_cache_by_key(&cache_key).await {
                    match l2_hit {
                        L2CacheLookup::Resolved {
                            bytes,
                            content_type,
                            ..
                        } => {
                            let resolved = (bytes, content_type);
                            this.cache.set(cache_key, resolved.clone(), Some(86400.0));
                            return Ok(resolved);
                        }
                        L2CacheLookup::FallbackSvg { amc_id, amc_name } => {
                            let fallback_res = if resolved_type == "mutual-fund"
                                || resolved_type == "provident-fund"
                            {
                                if amc_id.is_some() || amc_name.is_some() {
                                    Self::build_amc_fallback_svg(&FundAmcDetails {
                                        amc_id,
                                        amc_name,
                                        ..FundAmcDetails::default()
                                    })
                                } else {
                                    (
                                        generate_symbol_svg(&sym_clean, &resolved_type),
                                        "image/svg+xml".to_string(),
                                    )
                                }
                            } else {
                                (
                                    generate_symbol_svg(&sym_clean, &resolved_type),
                                    "image/svg+xml".to_string(),
                                )
                            };
                            this.cache
                                .set(cache_key, fallback_res.clone(), Some(3600.0));
                            return Ok(fallback_res);
                        }
                    }
                }

                let token_opt = (!this.settings.logo_dev_publishable_key.trim().is_empty())
                    .then_some(this.settings.logo_dev_publishable_key.as_str());
                let config = get_symbol_logo_config_with_base(
                    &sym_clean,
                    &resolved_type,
                    &this.settings.logo_dev_img_base_url,
                    token_opt,
                );

                if config.is_mutual_fund {
                    let fn_opt = (!fund_clean.is_empty()).then_some(fund_clean.as_str());
                    let details = this
                        .nav_service
                        .resolve_fund_amc_details(&sym_clean, &resolved_type, fn_opt)
                        .await;
                    if details.amc_id.is_some()
                        || details.website_host.is_some()
                        || details.amc_name.is_some()
                    {
                        let amc_res = this
                            .get_amc_logo(&details, &sym_clean, &resolved_type, fn_opt, &cache_key)
                            .await;
                        let ttl = if amc_res.1 != "image/svg+xml" {
                            86400.0
                        } else {
                            3600.0
                        };
                        this.cache.set(cache_key, amc_res.clone(), Some(ttl));
                        return Ok(amc_res);
                    }

                    let svg = generate_symbol_svg(&sym_clean, &resolved_type);
                    let result = (svg, "image/svg+xml".to_string());
                    this.cache.set(cache_key, result.clone(), Some(3600.0));
                    return Ok(result);
                }

                if this.has_logo_dev_img_access() {
                    let mut probe_urls = Vec::new();
                    if let Some(p) = config.primary_url {
                        probe_urls.push(p);
                    }
                    if let Some(s) = config.secondary_url {
                        probe_urls.push(s);
                    }

                    if let Some((bytes, content_type)) =
                        this.fetch_first_valid_logo(&probe_urls).await
                    {
                        let ext = Self::extension_for_media_type(&content_type);
                        let clean_sym = Self::sanitize_storage_segment(
                            &clean_ticker_for_url(&sym_clean).to_uppercase(),
                        );
                        let storage_path = format!("tickers/{resolved_type}/{clean_sym}.{ext}");
                        this.upload_supabase_storage_object(&storage_path, &bytes, &content_type)
                            .await;
                        let expires_at =
                            (Utc::now() + ChronoDuration::days(RESOLVED_CACHE_DAYS)).to_rfc3339();
                        this.upsert_supabase_cache_row(&SupabaseLogoCacheRow {
                            cache_key: cache_key.clone(),
                            symbol: sym_clean.clone(),
                            asset_type: resolved_type.clone(),
                            fund_name: None,
                            amc_id: None,
                            amc_name: None,
                            amc_domain: None,
                            storage_path: Some(storage_path),
                            content_type: content_type.clone(),
                            status: "resolved".to_string(),
                            expires_at,
                        })
                        .await;

                        let fetched = (bytes, content_type);
                        this.cache.set(cache_key, fetched.clone(), Some(86400.0));
                        return Ok(fetched);
                    }
                }

                let fallback_svg = generate_symbol_svg(&sym_clean, &resolved_type);
                let fallback_res = (fallback_svg, "image/svg+xml".to_string());
                let expires_at =
                    (Utc::now() + ChronoDuration::hours(FALLBACK_CACHE_HOURS)).to_rfc3339();
                this.upsert_supabase_cache_row(&SupabaseLogoCacheRow {
                    cache_key: cache_key.clone(),
                    symbol: sym_clean,
                    asset_type: resolved_type,
                    fund_name: None,
                    amc_id: None,
                    amc_name: None,
                    amc_domain: None,
                    storage_path: None,
                    content_type: "image/svg+xml".to_string(),
                    status: "fallback_svg".to_string(),
                    expires_at,
                })
                .await;

                this.cache
                    .set(cache_key, fallback_res.clone(), Some(3600.0));
                Ok(fallback_res)
            })
            .await;

        res.unwrap_or_else(|_| {
            (
                generate_symbol_svg(symbol, asset_type),
                "image/svg+xml".to_string(),
            )
        })
    }

    pub async fn get_symbol_metadata(
        &self,
        symbol: &str,
        asset_type: &str,
        fund_name: &str,
    ) -> IconMetadata {
        let sym_clean = symbol.trim().to_string();
        let fund_clean = fund_name.trim().to_string();
        let resolved_type = get_asset_type(
            if asset_type.is_empty() {
                None
            } else {
                Some(asset_type)
            },
            Some(&sym_clean),
        );
        let token_opt = (!self.settings.logo_dev_publishable_key.trim().is_empty())
            .then_some(self.settings.logo_dev_publishable_key.as_str());
        let config = get_symbol_logo_config_with_base(
            &sym_clean,
            &resolved_type,
            &self.settings.logo_dev_img_base_url,
            token_opt,
        );

        let mut icon_url = format!("/api/backend/icon/{sym_clean}?asset_type={resolved_type}");
        if resolved_type == "provident-fund" && !fund_clean.is_empty() {
            icon_url = format!("{icon_url}&fund_name={}", urlencoding::encode(&fund_clean));
        }

        let mut amc_id = None;
        let mut amc_name = None;
        let mut amc_domain = None;

        if config.is_mutual_fund && !sym_clean.is_empty() {
            let fn_opt = (!fund_clean.is_empty()).then_some(fund_clean.as_str());
            let details = self
                .nav_service
                .resolve_fund_amc_details(&sym_clean, &resolved_type, fn_opt)
                .await;
            amc_id = details.amc_id;
            amc_name = details.amc_name;
            amc_domain = details.website_host;
        }

        IconMetadata {
            symbol: sym_clean.clone(),
            asset_type: resolved_type,
            clean_ticker: clean_ticker_for_url(&sym_clean),
            monogram: config.monogram,
            brand_color: config.brand_color,
            is_mutual_fund: config.is_mutual_fund,
            amc_id,
            amc_name,
            amc_domain,
            icon_url,
        }
    }
}
