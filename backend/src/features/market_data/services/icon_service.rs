use std::collections::HashSet;
use std::sync::{Arc, OnceLock};
use std::time::Duration;

use regex::Regex;
use serde::{Deserialize, Serialize};
use url::Url;

use crate::features::market_data::services::nav_service::{FundAmcDetails, NavService};
use crate::utils::cache::{AsyncSingleflight, TTLCache};
use crate::utils::format_utils::get_asset_type;
use crate::utils::http_client::HttpResources;
use crate::utils::symbol_icon_utils::{
    clean_ticker_for_url, derive_amc_code, extract_domain_candidates, generate_amc_svg,
    generate_symbol_svg, get_symbol_color, get_symbol_logo_config,
};

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

#[derive(Clone)]
pub struct IconService {
    http: Arc<HttpResources>,
    cache: Arc<TTLCache>,
    singleflight: Arc<AsyncSingleflight>,
    nav_service: NavService,
}

impl IconService {
    pub fn new(
        http: Arc<HttpResources>,
        cache: Arc<TTLCache>,
        singleflight: Arc<AsyncSingleflight>,
        nav_service: NavService,
    ) -> Self {
        Self {
            http,
            cache,
            singleflight,
            nav_service,
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

    pub fn extract_html_icon_urls(html_text: &str, base_url: &str) -> Vec<String> {
        static LINK_TAG_RE: OnceLock<Regex> = OnceLock::new();
        static REL_ATTR_RE: OnceLock<Regex> = OnceLock::new();
        static HREF_ATTR_RE: OnceLock<Regex> = OnceLock::new();

        let link_re =
            LINK_TAG_RE.get_or_init(|| Regex::new(r"(?i)<link\b[^>]*>").expect("valid regex"));
        let rel_re = REL_ATTR_RE.get_or_init(|| {
            Regex::new(r#"(?i)\brel\s*=\s*["']([^"']*)["']"#).expect("valid regex")
        });
        let href_re = HREF_ATTR_RE.get_or_init(|| {
            Regex::new(r#"(?i)\bhref\s*=\s*["']([^"']+)["']"#).expect("valid regex")
        });

        let base = Url::parse(base_url).ok();
        let mut preferred = Vec::new();
        let mut standard = Vec::new();
        let mut seen = HashSet::new();

        for tag_match in link_re.find_iter(html_text) {
            let tag = tag_match.as_str();
            let Some(rel_cap) = rel_re.captures(tag) else {
                continue;
            };
            let Some(href_cap) = href_re.captures(tag) else {
                continue;
            };
            let rel_val = rel_cap[1].to_lowercase();
            if !rel_val.contains("icon") {
                continue;
            }
            let raw_href = href_cap[1].trim();
            let abs_url = if let Some(ref b) = base {
                b.join(raw_href).map(|u| u.to_string()).unwrap_or_default()
            } else {
                raw_href.to_string()
            };
            if (!abs_url.starts_with("http://") && !abs_url.starts_with("https://"))
                || !seen.insert(abs_url.clone())
            {
                continue;
            }
            if rel_val.contains("apple-touch-icon")
                || abs_url.to_lowercase().ends_with(".svg")
                || tag.contains("192")
                || tag.contains("180")
            {
                preferred.push(abs_url);
            } else {
                standard.push(abs_url);
            }
        }

        preferred.extend(standard);
        preferred
    }

    async fn scrape_homepage_icons(&self, domains: &[String]) -> Option<(Vec<u8>, String)> {
        let mut candidate_urls = Vec::new();
        let mut seen = HashSet::new();

        if let Some(first_domain) = domains.first() {
            let homepage = format!("https://{first_domain}/");
            if let Ok(resp) = self
                .http
                .client
                .get(&homepage)
                .header("User-Agent", "Mozilla/5.0")
                .timeout(Duration::from_secs(4))
                .send()
                .await
            {
                let status = resp.status().as_u16();
                let final_url = resp.url().to_string();
                if status == 200 {
                    if let Ok(text) = resp.text().await {
                        if !text.is_empty() {
                            for icon_url in Self::extract_html_icon_urls(&text, &final_url) {
                                if seen.insert(icon_url.clone()) {
                                    candidate_urls.push(icon_url);
                                }
                            }
                        }
                    }
                }
            }
        }

        for domain in domains {
            let favicon_url = format!("https://{domain}/favicon.ico");
            if seen.insert(favicon_url.clone()) {
                candidate_urls.push(favicon_url);
            }
        }

        self.fetch_first_valid_logo(&candidate_urls).await
    }

    async fn fetch_dynamic_amc_logo(&self, website_host: &str) -> Option<(Vec<u8>, String)> {
        let domains = extract_domain_candidates(Some(website_host));
        if domains.is_empty() {
            return None;
        }

        let gstatic_urls: Vec<String> = domains
            .iter()
            .map(|domain| {
                format!(
                    "https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://{domain}&size=128"
                )
            })
            .collect();
        if let Some(fetched) = self.fetch_first_valid_logo(&gstatic_urls).await {
            return Some(fetched);
        }

        if let Some(scraped) = self.scrape_homepage_icons(&domains).await {
            return Some(scraped);
        }

        let ddg_urls: Vec<String> = domains
            .iter()
            .map(|domain| format!("https://icons.duckduckgo.com/ip3/{domain}.ico"))
            .collect();
        self.fetch_first_valid_logo(&ddg_urls).await
    }

    async fn get_amc_logo(&self, details: &FundAmcDetails) -> (Vec<u8>, String) {
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

        let res: Result<(Vec<u8>, String), String> = self
            .singleflight
            .execute(&sf_key, move || async move {
                if let Some(inner) = this.cache.get::<(Vec<u8>, String)>(&amc_cache_key) {
                    return Ok(inner);
                }
                if let Some(host) = details_owned.website_host.as_deref() {
                    if let Some(fetched) = this.fetch_dynamic_amc_logo(host).await {
                        this.cache
                            .set(amc_cache_key, fetched.clone(), Some(86400.0));
                        return Ok(fetched);
                    }
                }
                let amc_code = derive_amc_code(
                    details_owned.amc_name.as_deref(),
                    details_owned.abbr_name.as_deref(),
                );
                let seed = details_owned
                    .amc_id
                    .as_deref()
                    .or(details_owned.amc_name.as_deref())
                    .unwrap_or(&amc_code);
                let brand_color = get_symbol_color(seed);
                let fallback_svg = generate_amc_svg(&amc_code, &brand_color);
                let fallback_res = (fallback_svg, "image/svg+xml".to_string());
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

                let config = get_symbol_logo_config(&sym_clean, &resolved_type);
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
                        let amc_res = this.get_amc_logo(&details).await;
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

                let mut probe_urls = Vec::new();
                if let Some(p) = config.primary_url {
                    probe_urls.push(p);
                }
                if let Some(s) = config.secondary_url {
                    probe_urls.push(s);
                }

                if let Some(fetched) = this.fetch_first_valid_logo(&probe_urls).await {
                    this.cache.set(cache_key, fetched.clone(), Some(86400.0));
                    return Ok(fetched);
                }

                let fallback_svg = generate_symbol_svg(&sym_clean, &resolved_type);
                let fallback_res = (fallback_svg, "image/svg+xml".to_string());
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
        let config = get_symbol_logo_config(&sym_clean, &resolved_type);

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
