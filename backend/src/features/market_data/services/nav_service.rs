use std::collections::{HashMap, HashSet};
use std::sync::{Arc, OnceLock};

use base64::engine::general_purpose::STANDARD as BASE64_STANDARD;
use base64::Engine;
use chrono::{Duration, Utc};
use regex::Regex;
use serde_json::{Map, Value};

use crate::config::settings::Settings;
use crate::features::market_data::models::factsheet::{
    FactsheetAllocationItem, FactsheetFeeItem, FactsheetHoldingItem, FactsheetPerformanceItem,
    FactsheetStatistics, FactsheetTradeConditions, FundFactsheetResponse,
};
use crate::features::portfolio::models::transaction::PriceData;
use crate::utils::cache::{AsyncSingleflight, TTLCache};
use crate::utils::http_client::HttpResources;
use crate::utils::pvd_constants::{default_pvd_metadata, default_pvd_name};
use crate::utils::symbol_icon_utils::{extract_brand_tokens, extract_domain_candidates};

fn management_style_desc(code: &str) -> Option<&'static str> {
    match code {
        "AM" => Some("AM - Active Management"),
        "AN" => Some("AN - Feeder Fund (Active Master)"),
        "PM" => Some("PM - Passive / Index Tracking"),
        "PN" => Some("PN - Feeder Fund (Passive Master)"),
        "IM" => Some("IM - Inverse"),
        "IN" => Some("IN - Feeder Fund (Inverse Master)"),
        "LM" => Some("LM - Leveraged"),
        "LN" => Some("LN - Feeder Fund (Leveraged Master)"),
        "BH" => Some("BH - Buy-and-Hold"),
        "SM" => Some("SM - Index Tracking (Occasional Alpha)"),
        "OT" => Some("OT - Others"),
        _ => None,
    }
}

fn pvd_foreign_risk_desc(code: &str) -> Option<&'static str> {
    match code {
        "01" => Some("Foreign Investment Only"),
        "02" => Some("Domestic & Foreign Investment"),
        "03" => Some("Domestic Investment Only"),
        _ => None,
    }
}

pub fn clean_str(value: Option<&Value>) -> Option<String> {
    let val = value?;
    if val.is_null() {
        return None;
    }
    let text = if let Some(s) = val.as_str() {
        s.trim().to_string()
    } else {
        val.to_string().trim().to_string()
    };
    (!text.is_empty()).then_some(text)
}

pub fn parse_float(value: Option<&Value>) -> Option<f64> {
    let val = value?;
    if val.is_null() || val.is_boolean() {
        return None;
    }
    if let Some(num) = val.as_f64() {
        return num.is_finite().then_some(num);
    }
    let text = val
        .as_str()
        .map(str::to_string)
        .unwrap_or_else(|| val.to_string());
    let cleaned = text.trim().replace(',', "");
    let cleaned = cleaned.trim_end_matches('%');
    if cleaned.is_empty() || cleaned == "-" {
        return None;
    }
    cleaned.parse::<f64>().ok().filter(|num| num.is_finite())
}

pub fn parse_int(value: Option<&Value>, default: i32) -> i32 {
    parse_float(value).map(|n| n as i32).unwrap_or(default)
}

pub fn format_fee_rate(value: Option<&Value>) -> Option<String> {
    let text = clean_str(value)?;
    if let Some(num) = parse_float(value) {
        let formatted = format!("{num:.4}");
        let trimmed = formatted.trim_end_matches('0').trim_end_matches('.');
        return Some(format!("{trimmed}%"));
    }
    Some(text)
}

pub fn decode_policy_text(raw: Option<&Value>) -> Option<String> {
    static HTML_BREAK_RE: OnceLock<Regex> = OnceLock::new();
    static HTML_TAG_RE: OnceLock<Regex> = OnceLock::new();
    static BASE64_RE: OnceLock<Regex> = OnceLock::new();
    static MULTI_SPACE_RE: OnceLock<Regex> = OnceLock::new();

    let mut text = clean_str(raw)?;
    let b64_re = BASE64_RE.get_or_init(|| Regex::new(r"^[A-Za-z0-9+/=]+$").expect("valid regex"));

    if text.len() >= 12 && text.len().is_multiple_of(4) && b64_re.is_match(&text) {
        if let Ok(decoded_bytes) = BASE64_STANDARD.decode(&text) {
            if let Ok(decoded) = String::from_utf8(decoded_bytes) {
                let trimmed = decoded.trim();
                if !trimmed.is_empty()
                    && trimmed
                        .chars()
                        .all(|ch| (ch as u32) >= 32 || matches!(ch, '\r' | '\n' | '\t'))
                {
                    text = trimmed.to_string();
                }
            }
        }
    }

    let br_re = HTML_BREAK_RE
        .get_or_init(|| Regex::new(r"(?i)<(?:br\s*/?|/p|/div|/li|/tr)>").expect("valid regex"));
    let tag_re = HTML_TAG_RE.get_or_init(|| Regex::new(r"<[^>]+>").expect("valid regex"));
    let space_re = MULTI_SPACE_RE.get_or_init(|| Regex::new(r"[ \t]+").expect("valid regex"));

    let with_breaks = br_re.replace_all(&text, "\n");
    let stripped = tag_re.replace_all(&with_breaks, "");
    let unescaped = html_escape::decode_html_entities(&stripped).to_string();

    let lines: Vec<String> = unescaped
        .lines()
        .map(|line| space_re.replace_all(line, " ").trim().to_string())
        .filter(|line| !line.is_empty())
        .collect();

    let cleaned = lines.join("\n");
    (!cleaned.is_empty()).then_some(cleaned)
}

fn normalize_label(text: &str) -> String {
    static WS_RE: OnceLock<Regex> = OnceLock::new();
    let re = WS_RE.get_or_init(|| Regex::new(r"\s+").expect("valid regex"));
    re.replace_all(text, " ").trim().to_lowercase()
}

fn normalize_period_key(raw: Option<&Value>) -> String {
    let Some(text) = clean_str(raw) else {
        return String::new();
    };
    if text == "-" {
        return String::new();
    }
    let digits: String = text.chars().filter(|ch| ch.is_ascii_digit()).collect();
    if digits.len() == 6 {
        return format!("{digits}00");
    }
    if digits.len() >= 8 {
        return digits[..8].to_string();
    }
    text
}

fn select_latest_period_rows(rows: &[Map<String, Value>]) -> Vec<Map<String, Value>> {
    if rows.is_empty() {
        return Vec::new();
    }
    for key in ["period", "as_of_date", "end_date", "start_date"] {
        let keyed: Vec<(String, &Map<String, Value>)> = rows
            .iter()
            .map(|r| (normalize_period_key(r.get(key)), r))
            .collect();
        if let Some(latest_key) = keyed
            .iter()
            .filter(|(k, _)| !k.is_empty())
            .map(|(k, _)| k.clone())
            .max()
        {
            return keyed
                .into_iter()
                .filter(|(k, _)| k == &latest_key)
                .map(|(_, r)| r.clone())
                .collect();
        }
    }
    rows.to_vec()
}

fn pvd_policy_rank(item: &Map<String, Value>) -> (u8, u8, String) {
    let end_date = clean_str(item.get("sub_policy_end_date"));
    let is_active = match end_date.as_deref() {
        None | Some("-") => 1,
        _ => 0,
    };
    let start_or_incept = clean_str(item.get("sub_policy_inception_date"))
        .or_else(|| clean_str(item.get("sub_policy_start_date")));
    let has_dates = match start_or_incept.as_deref() {
        Some(s) if s != "-" => 1,
        _ => 0,
    };
    let upd_date = clean_str(item.get("last_upd_date"))
        .or_else(|| clean_str(item.get("last_updated")))
        .unwrap_or_default();
    (is_active, has_dates, upd_date)
}

fn build_allocation_items(
    rows: &[Map<String, Value>],
    seq_key: &str,
    name_keys: &[&str],
    ratio_key: &str,
) -> Vec<FactsheetAllocationItem> {
    let mut sorted = rows.to_vec();
    sorted.sort_by_key(|x| parse_int(x.get(seq_key), 99));

    let mut result = Vec::new();
    let mut seen_names = HashSet::new();

    for (idx, row) in sorted.iter().enumerate() {
        let mut name = None;
        for key in name_keys {
            name = clean_str(row.get(*key));
            if name.is_some() {
                break;
            }
        }
        let ratio = parse_float(row.get(ratio_key));
        let (Some(name), Some(ratio)) = (name, ratio) else {
            continue;
        };
        let norm_name = normalize_label(&name);
        if !seen_names.insert(norm_name) {
            continue;
        }
        result.push(FactsheetAllocationItem {
            seq: parse_int(row.get(seq_key), (idx + 1) as i32),
            name,
            ratio,
        });
    }
    result
}

fn build_holding_items(
    rows: &[Map<String, Value>],
    seq_key: &str,
    name_key: &str,
    ratio_key: &str,
    credit_key: Option<&str>,
    isin_key: Option<&str>,
) -> Vec<FactsheetHoldingItem> {
    let mut sorted = rows.to_vec();
    sorted.sort_by_key(|x| parse_int(x.get(seq_key), 99));

    let mut result = Vec::new();
    let mut seen_keys = HashSet::new();

    for (idx, row) in sorted.iter().enumerate() {
        let Some(name) = clean_str(row.get(name_key)) else {
            continue;
        };
        let Some(ratio) = parse_float(row.get(ratio_key)) else {
            continue;
        };
        let isin_val = isin_key.and_then(|k| clean_str(row.get(k)));
        let dedupe_key = (
            normalize_label(&name),
            isin_val.as_deref().unwrap_or("").to_uppercase(),
        );
        if !seen_keys.insert(dedupe_key) {
            continue;
        }
        result.push(FactsheetHoldingItem {
            seq: parse_int(row.get(seq_key), (idx + 1) as i32),
            name,
            ratio,
            credit_rating: credit_key.and_then(|k| clean_str(row.get(k))),
            isin: isin_val,
        });
    }
    result
}

#[derive(Debug, Clone, Default)]
pub struct FundAmcDetails {
    pub amc_id: Option<String>,
    pub amc_name: Option<String>,
    pub abbr_name: Option<String>,
    pub website_host: Option<String>,
    pub proj_id: Option<String>,
}

#[derive(Debug, Clone)]
pub struct SingleFundNavResult {
    pub original_symbol: String,
    pub data: PriceData,
}

#[derive(Clone)]
pub struct NavService {
    settings: Arc<Settings>,
    http: Arc<HttpResources>,
    cache: Arc<TTLCache>,
    singleflight: Arc<AsyncSingleflight>,
}

impl NavService {
    pub fn new(
        settings: Arc<Settings>,
        http: Arc<HttpResources>,
        cache: Arc<TTLCache>,
        singleflight: Arc<AsyncSingleflight>,
    ) -> Self {
        Self {
            settings,
            http,
            cache,
            singleflight,
        }
    }

    fn sec_mf_base(&self) -> &str {
        self.settings.sec_mf_base_url.trim_end_matches('/')
    }

    fn sec_pvd_base(&self) -> &str {
        self.settings.sec_pvd_base_url.trim_end_matches('/')
    }

    fn has_sec_access(&self) -> bool {
        !self.settings.sec_subscription_key.trim().is_empty()
            || self.sec_mf_base() != "https://api.sec.or.th/v2/fund"
            || self.sec_pvd_base() != "https://api.sec.or.th/v1/pvd"
    }

    async fn sec_get(&self, url: &str) -> Result<(u16, String), String> {
        let _permit = self
            .http
            .sec_sem
            .acquire()
            .await
            .map_err(|e| e.to_string())?;
        let resp = self
            .http
            .client
            .get(url)
            .header(
                "Ocp-Apim-Subscription-Key",
                self.settings.sec_subscription_key.as_str(),
            )
            .header("Accept", "application/json")
            .send()
            .await
            .map_err(|e| e.to_string())?;
        let status = resp.status().as_u16();
        let text = resp.text().await.unwrap_or_default();
        Ok((status, text))
    }

    async fn sec_post_json(&self, url: &str, body: &Value) -> Result<(u16, String), String> {
        let _permit = self
            .http
            .sec_sem
            .acquire()
            .await
            .map_err(|e| e.to_string())?;
        let resp = self
            .http
            .client
            .post(url)
            .header(
                "Ocp-Apim-Subscription-Key",
                self.settings.sec_subscription_key.as_str(),
            )
            .header("Accept", "application/json")
            .json(body)
            .send()
            .await
            .map_err(|e| e.to_string())?;
        let status = resp.status().as_u16();
        let text = resp.text().await.unwrap_or_default();
        Ok((status, text))
    }

    async fn fetch_sec_json(&self, url: &str, params: &[(&str, &str)]) -> Option<Value> {
        let target_url = if params.is_empty() {
            url.to_string()
        } else {
            let qs: Vec<String> = params
                .iter()
                .map(|(k, v)| format!("{}={}", urlencoding::encode(k), urlencoding::encode(v)))
                .collect();
            format!("{url}?{}", qs.join("&"))
        };

        let (status, text) = self.sec_get(&target_url).await.ok()?;
        if status == 204 || text.trim().is_empty() || !(200..300).contains(&status) {
            return None;
        }
        serde_json::from_str::<Value>(&text).ok()
    }

    pub fn extract_items(payload: Option<&Value>) -> Vec<Map<String, Value>> {
        let Some(p) = payload else {
            return Vec::new();
        };
        if let Some(arr) = p.get("items").and_then(|v| v.as_array()) {
            return arr.iter().filter_map(|x| x.as_object().cloned()).collect();
        }
        if let Some(arr) = p.as_array() {
            return arr.iter().filter_map(|x| x.as_object().cloned()).collect();
        }
        Vec::new()
    }

    fn filter_by_class(
        items: Vec<Map<String, Value>>,
        target_class: Option<&str>,
        sym_upper: &str,
    ) -> Vec<Map<String, Value>> {
        if items.is_empty() {
            return Vec::new();
        }
        let mut candidates = Vec::new();
        if let Some(tc) = target_class.map(str::trim).filter(|s| !s.is_empty()) {
            candidates.push(tc.to_uppercase());
        }
        let sym_up = sym_upper.to_string();
        if !candidates.contains(&sym_up) {
            candidates.push(sym_up);
        }

        for cand in &candidates {
            let exact: Vec<Map<String, Value>> = items
                .iter()
                .filter(|x| {
                    clean_str(x.get("fund_class_name"))
                        .unwrap_or_default()
                        .to_uppercase()
                        == *cand
                })
                .cloned()
                .collect();
            if !exact.is_empty() {
                return exact;
            }
        }

        let main_rows: Vec<Map<String, Value>> = items
            .iter()
            .filter(|x| {
                let fc = clean_str(x.get("fund_class_name"))
                    .unwrap_or_default()
                    .to_uppercase();
                matches!(fc.as_str(), "MAIN" | "-" | "")
            })
            .cloned()
            .collect();
        if main_rows.is_empty() {
            items
        } else {
            main_rows
        }
    }

    fn filter_pvd_rows(
        items: Vec<Map<String, Value>>,
        policy_info: Option<&Map<String, Value>>,
        sym_upper: &str,
    ) -> Vec<Map<String, Value>> {
        if items.is_empty() {
            return Vec::new();
        }
        let unique_id = policy_info
            .and_then(|p| clean_str(p.get("uniqueSubPolicyId")))
            .unwrap_or_default();
        let policy_id = policy_info
            .and_then(|p| clean_str(p.get("policyId")))
            .unwrap_or_default();
        let sub_policy_name = policy_info
            .and_then(|p| clean_str(p.get("name")))
            .unwrap_or_default();

        let has_uid_field = items
            .iter()
            .any(|x| clean_str(x.get("unique_sub_policy_id")).is_some());
        let has_sub_id_field = items
            .iter()
            .any(|x| clean_str(x.get("sub_policy_id")).is_some());

        if !unique_id.is_empty() && has_uid_field {
            let by_unique: Vec<_> = items
                .iter()
                .filter(|x| {
                    clean_str(x.get("unique_sub_policy_id")).as_deref() == Some(unique_id.as_str())
                })
                .cloned()
                .collect();
            if !by_unique.is_empty() {
                return by_unique;
            }
            if !sym_upper.is_empty() && has_sub_id_field {
                return items
                    .into_iter()
                    .filter(|x| {
                        clean_str(x.get("sub_policy_id"))
                            .unwrap_or_default()
                            .to_uppercase()
                            == sym_upper
                    })
                    .collect();
            }
            return Vec::new();
        }

        if !sym_upper.is_empty() && has_sub_id_field {
            return items
                .into_iter()
                .filter(|x| {
                    clean_str(x.get("sub_policy_id"))
                        .unwrap_or_default()
                        .to_uppercase()
                        == sym_upper
                })
                .collect();
        }

        if !sub_policy_name.is_empty() {
            let by_sub_name: Vec<_> = items
                .iter()
                .filter(|x| {
                    clean_str(x.get("sub_policy_name")).as_deref() == Some(sub_policy_name.as_str())
                })
                .cloned()
                .collect();
            if !by_sub_name.is_empty() {
                return by_sub_name;
            }
        }

        if !policy_id.is_empty() && !has_uid_field && !has_sub_id_field {
            return items
                .into_iter()
                .filter(|x| clean_str(x.get("policy_id")).as_deref() == Some(policy_id.as_str()))
                .collect();
        }

        Vec::new()
    }

    pub async fn fetch_fund_navs(&self, symbols: &[String]) -> HashMap<String, PriceData> {
        let unique: Vec<String> = symbols
            .iter()
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
                svc.fetch_single_fund_nav(&sym).await
            }));
        }

        let mut price_map = HashMap::new();
        for handle in handles {
            if let Ok(r) = handle.await {
                let has_name_diff =
                    r.data.name.as_deref().is_some_and(|n| {
                        !n.is_empty() && n != r.original_symbol && n != r.data.symbol
                    });
                if r.data.price > 0.0 || has_name_diff {
                    price_map.insert(r.original_symbol, r.data);
                }
            }
        }
        price_map
    }

    pub async fn fetch_pvd_proj_id(&self, fund_name: &str) -> Option<String> {
        let clean_name = fund_name.trim().to_string();
        if clean_name.is_empty() {
            return None;
        }
        let cache_key = format!("sec_pvd_proj_id_{clean_name}");
        if let Some(cached) = self.cache.get::<String>(&cache_key) {
            return Some(cached);
        }

        let this = self.clone();
        let sf_key = format!("fetch_pvd_proj_id_{clean_name}");
        let res: Result<Option<String>, String> = self
            .singleflight
            .execute(&sf_key, move || async move {
                if let Some(c) = this.cache.get::<String>(&cache_key) {
                    return Ok(Some(c));
                }
                let url = format!("{}/factsheet/fund", this.sec_pvd_base());
                let body = serde_json::json!({ "FundName": clean_name });
                let Ok((status, text)) = this.sec_post_json(&url, &body).await else {
                    return Ok(None);
                };
                if status == 204 || !(200..300).contains(&status) {
                    return Ok(None);
                }
                let Ok(Value::Array(raw_list)) = serde_json::from_str::<Value>(&text) else {
                    return Ok(None);
                };

                let candidates: Vec<&Map<String, Value>> = raw_list
                    .iter()
                    .filter_map(|v| v.as_object())
                    .filter(|obj| clean_str(obj.get("proj_id")).is_some())
                    .collect();
                if candidates.is_empty() {
                    return Ok(None);
                }

                let is_active = |r: &&Map<String, Value>| -> bool {
                    matches!(
                        clean_str(r.get("fund_status")).as_deref(),
                        Some("RG") | Some("SE")
                    )
                };
                let matches_name = |r: &&Map<String, Value>| -> bool {
                    clean_str(r.get("proj_name_th")).as_deref() == Some(clean_name.as_str())
                };

                let matched = candidates
                    .iter()
                    .find(|r| is_active(r) && matches_name(r))
                    .or_else(|| candidates.iter().find(|r| is_active(r)))
                    .or_else(|| candidates.iter().find(|r| matches_name(r)))
                    .unwrap_or(&candidates[0]);

                let Some(resolved_proj_id) = clean_str(matched.get("proj_id")) else {
                    return Ok(None);
                };

                if let Some(resolved_fund_name) = clean_str(matched.get("proj_name_th")) {
                    this.cache.set(
                        format!("sec_pvd_fund_name_{resolved_proj_id}"),
                        resolved_fund_name.clone(),
                        Some(86400.0),
                    );
                    if let Some(amc_id) = clean_str(matched.get("unique_id")) {
                        this.cache.set(
                            format!("sec_pvd_amc_id_name_{resolved_fund_name}"),
                            amc_id,
                            Some(86400.0),
                        );
                    }
                }
                if let Some(amc_id) = clean_str(matched.get("unique_id")) {
                    this.cache.set(
                        format!("sec_pvd_amc_id_proj_{resolved_proj_id}"),
                        amc_id.clone(),
                        Some(86400.0),
                    );
                    this.cache.set(
                        format!("sec_pvd_amc_id_name_{clean_name}"),
                        amc_id,
                        Some(86400.0),
                    );
                }

                this.cache
                    .set(cache_key, resolved_proj_id.clone(), Some(86400.0));
                Ok(Some(resolved_proj_id))
            })
            .await;

        res.ok().flatten()
    }

    pub async fn fetch_pvd_policies(
        &self,
        proj_id: Option<&str>,
        fund_name: Option<&str>,
    ) -> HashMap<String, Map<String, Value>> {
        let mut target_proj_id = proj_id
            .map(str::trim)
            .filter(|s| !s.is_empty())
            .map(str::to_string);
        if target_proj_id.is_none() {
            if let Some(fn_name) = fund_name.filter(|s| !s.trim().is_empty()) {
                target_proj_id = self.fetch_pvd_proj_id(fn_name).await;
            }
        }
        let Some(target_pid) = target_proj_id else {
            return HashMap::new();
        };

        let resolved_fund_name = self
            .cache
            .get::<String>(&format!("sec_pvd_fund_name_{target_pid}"))
            .or_else(|| fund_name.map(str::to_string))
            .unwrap_or_default()
            .trim()
            .to_string();
        let resolved_amc_id = self
            .cache
            .get::<String>(&format!("sec_pvd_amc_id_proj_{target_pid}"))
            .unwrap_or_default()
            .trim()
            .to_string();

        let enrich_map =
            |map: HashMap<String, Map<String, Value>>| -> HashMap<String, Map<String, Value>> {
                if !resolved_amc_id.is_empty() {
                    for sym_key in map.keys() {
                        self.cache.set(
                            format!("sec_pvd_symbol_amc_{sym_key}"),
                            resolved_amc_id.clone(),
                            Some(86400.0),
                        );
                    }
                }
                if resolved_fund_name.is_empty() && resolved_amc_id.is_empty() {
                    return map;
                }
                map.into_iter()
                    .map(|(k, mut v)| {
                        if !resolved_fund_name.is_empty() && clean_str(v.get("fundName")).is_none()
                        {
                            v.insert(
                                "fundName".to_string(),
                                Value::String(resolved_fund_name.clone()),
                            );
                        }
                        if !resolved_amc_id.is_empty() && clean_str(v.get("amcId")).is_none() {
                            v.insert("amcId".to_string(), Value::String(resolved_amc_id.clone()));
                        }
                        (k, v)
                    })
                    .collect()
            };

        let cache_key = format!("sec_pvd_policies_{target_pid}");
        if let Some(cached) = self
            .cache
            .get::<HashMap<String, Map<String, Value>>>(&cache_key)
        {
            return enrich_map(cached);
        }

        let this = self.clone();
        let sf_key = format!("fetch_pvd_policies_{target_pid}");
        let pid_clone = target_pid.clone();
        let fund_clone = resolved_fund_name.clone();
        let amc_clone = resolved_amc_id.clone();

        let fetched: Result<HashMap<String, Map<String, Value>>, String> = self
            .singleflight
            .execute(&sf_key, move || async move {
                if let Some(c) = this
                    .cache
                    .get::<HashMap<String, Map<String, Value>>>(&cache_key)
                {
                    return Ok(c);
                }
                let url = format!("{}/factsheet/{}/policy", this.sec_pvd_base(), pid_clone);
                let Ok((status, text)) = this.sec_get(&url).await else {
                    return Ok(HashMap::new());
                };
                if status == 204 || !(200..300).contains(&status) {
                    return Ok(HashMap::new());
                }
                let Ok(Value::Array(raw_list)) = serde_json::from_str::<Value>(&text) else {
                    return Ok(HashMap::new());
                };

                let mut policy_map: HashMap<String, Map<String, Value>> = HashMap::new();
                let mut best_ranks: HashMap<String, (u8, u8, String)> = HashMap::new();

                for item_val in raw_list {
                    let Some(item) = item_val.as_object() else {
                        continue;
                    };
                    let Some(sub_id) = clean_str(item.get("sub_policy_id")) else {
                        continue;
                    };
                    let key = sub_id.to_uppercase();
                    let rank = pvd_policy_rank(item);
                    if let Some(existing_rank) = best_ranks.get(&key) {
                        if &rank < existing_rank {
                            continue;
                        }
                    }
                    best_ranks.insert(key.clone(), rank);

                    let mut entry = Map::new();
                    entry.insert("subPolicyId".to_string(), Value::String(sub_id));
                    entry.insert(
                        "policyId".to_string(),
                        Value::String(clean_str(item.get("policy_id")).unwrap_or_default()),
                    );
                    entry.insert(
                        "uniqueSubPolicyId".to_string(),
                        Value::String(
                            clean_str(item.get("unique_sub_policy_id")).unwrap_or_default(),
                        ),
                    );
                    entry.insert(
                        "name".to_string(),
                        Value::String(clean_str(item.get("sub_policy_name")).unwrap_or_default()),
                    );
                    entry.insert("fundName".to_string(), Value::String(fund_clone.clone()));
                    entry.insert("amcId".to_string(), Value::String(amc_clone.clone()));
                    entry.insert(
                        "policyName".to_string(),
                        Value::String(clean_str(item.get("policy_name")).unwrap_or_default()),
                    );
                    entry.insert(
                        "aimcType".to_string(),
                        Value::String(clean_str(item.get("aimc_type")).unwrap_or_default()),
                    );
                    entry.insert(
                        "aimcDescription".to_string(),
                        Value::String(clean_str(item.get("aimc_description")).unwrap_or_default()),
                    );
                    entry.insert(
                        "riskLevel".to_string(),
                        Value::String(clean_str(item.get("risk_level")).unwrap_or_default()),
                    );
                    entry.insert(
                        "objective".to_string(),
                        Value::String(clean_str(item.get("objective")).unwrap_or_default()),
                    );
                    entry.insert(
                        "inceptionDate".to_string(),
                        Value::String(
                            clean_str(item.get("sub_policy_inception_date")).unwrap_or_default(),
                        ),
                    );
                    entry.insert(
                        "foreignRiskLevel".to_string(),
                        Value::String(
                            clean_str(item.get("foreign_risk_level")).unwrap_or_default(),
                        ),
                    );

                    if !amc_clone.is_empty() {
                        this.cache.set(
                            format!("sec_pvd_symbol_amc_{key}"),
                            amc_clone.clone(),
                            Some(86400.0),
                        );
                    }
                    policy_map.insert(key, entry);
                }

                this.cache.set(cache_key, policy_map.clone(), Some(86400.0));
                Ok(policy_map)
            })
            .await;

        enrich_map(fetched.unwrap_or_default())
    }

    pub async fn fetch_single_fund_nav(&self, symbol: &str) -> SingleFundNavResult {
        let cache_key = format!("sec_nav_single_{symbol}");
        if let Some(cached) = self.cache.get::<SingleFundNavResult>(&cache_key) {
            return cached;
        }

        let this = self.clone();
        let sym_owned = symbol.to_string();
        let sf_key = cache_key.clone();

        let res: Result<SingleFundNavResult, String> = self
            .singleflight
            .execute(&sf_key, move || async move {
                if let Some(c) = this.cache.get::<SingleFundNavResult>(&cache_key) {
                    return Ok(c);
                }

                let clean_symbol = strip_fund_suffix(&sym_owned);
                let sym_upper = clean_symbol.to_uppercase();

                let Some(profile) = this.fetch_fund_profile(&clean_symbol, &sym_upper).await else {
                    return Ok(SingleFundNavResult {
                        original_symbol: sym_owned.clone(),
                        data: PriceData {
                            symbol: sym_owned,
                            name: Some(clean_symbol),
                            name_th: Some(String::new()),
                            price: 0.0,
                            currency: "THB".to_string(),
                        },
                    });
                };

                let Some(proj_id) = clean_str(profile.get("proj_id")) else {
                    return Ok(SingleFundNavResult {
                        original_symbol: sym_owned.clone(),
                        data: PriceData {
                            symbol: sym_owned,
                            name: Some(clean_symbol),
                            name_th: Some(String::new()),
                            price: 0.0,
                            currency: "THB".to_string(),
                        },
                    });
                };

                let name_en = clean_str(profile.get("proj_name_en")).unwrap_or_default();
                let name_th = clean_str(profile.get("proj_name_th")).unwrap_or_default();
                let target_class = clean_str(profile.get("fund_class_name"));
                let fund_name = if !name_en.is_empty() {
                    name_en
                } else if !name_th.is_empty() {
                    name_th.clone()
                } else {
                    clean_symbol.clone()
                };

                let nav_res = this
                    .fetch_fund_nav_data(
                        &sym_owned,
                        &clean_symbol,
                        &sym_upper,
                        &proj_id,
                        &fund_name,
                        &name_th,
                        target_class.as_deref(),
                    )
                    .await;

                if nav_res.data.price > 0.0 {
                    this.cache.set(cache_key, nav_res.clone(), Some(1800.0));
                }
                Ok(nav_res)
            })
            .await;

        res.unwrap_or_else(|_| SingleFundNavResult {
            original_symbol: symbol.to_string(),
            data: PriceData {
                symbol: symbol.to_string(),
                name: Some(strip_fund_suffix(symbol)),
                name_th: Some(String::new()),
                price: 0.0,
                currency: "THB".to_string(),
            },
        })
    }

    pub async fn fetch_fund_profile(
        &self,
        clean_symbol: &str,
        sym_upper: &str,
    ) -> Option<Map<String, Value>> {
        let cache_key = format!("sec_profile_{}", clean_symbol.to_uppercase());
        if let Some(cached) = self.cache.get::<Map<String, Value>>(&cache_key) {
            return Some(cached);
        }

        let this = self.clone();
        let clean_owned = clean_symbol.to_string();
        let upper_owned = sym_upper.to_string();
        let sf_key = cache_key.clone();

        let res: Result<Option<Map<String, Value>>, String> = self
            .singleflight
            .execute(&sf_key, move || async move {
                if let Some(c) = this.cache.get::<Map<String, Value>>(&cache_key) {
                    return Ok(Some(c));
                }

                let encoded = urlencoding::encode(&clean_owned);
                let url1 = format!(
                    "{}/general-info/profiles?fund_class_name={}",
                    this.sec_mf_base(),
                    encoded
                );
                let Ok((status1, text1)) = this.sec_get(&url1).await else {
                    return Ok(None);
                };
                if !(200..300).contains(&status1) && status1 != 204 {
                    return Ok(None);
                }

                let class_items = if status1 != 204 && !text1.trim().is_empty() {
                    let parsed = serde_json::from_str::<Value>(&text1).ok();
                    Self::extract_items(parsed.as_ref())
                } else {
                    Vec::new()
                };

                for item in class_items {
                    let fcn = clean_str(item.get("fund_class_name"))
                        .unwrap_or_default()
                        .to_uppercase();
                    let pan = clean_str(item.get("proj_abbr_name"))
                        .unwrap_or_default()
                        .to_uppercase();
                    if fcn == upper_owned || pan == upper_owned {
                        this.cache.set(cache_key, item.clone(), Some(86400.0));
                        return Ok(Some(item));
                    }
                }

                let url2 = format!(
                    "{}/general-info/profiles?project_info={}",
                    this.sec_mf_base(),
                    encoded
                );
                let Ok((status2, text2)) = this.sec_get(&url2).await else {
                    return Ok(None);
                };
                if !(200..300).contains(&status2) && status2 != 204 {
                    return Ok(None);
                }
                let proj_items = if status2 != 204 && !text2.trim().is_empty() {
                    let parsed = serde_json::from_str::<Value>(&text2).ok();
                    Self::extract_items(parsed.as_ref())
                } else {
                    Vec::new()
                };

                if proj_items.is_empty() {
                    return Ok(None);
                }

                let matched = proj_items
                    .iter()
                    .find(|i| {
                        clean_str(i.get("proj_abbr_name"))
                            .unwrap_or_default()
                            .to_uppercase()
                            == upper_owned
                            && clean_str(i.get("fund_class_name")).as_deref() == Some("main")
                    })
                    .or_else(|| {
                        proj_items.iter().find(|i| {
                            clean_str(i.get("fund_class_name"))
                                .unwrap_or_default()
                                .to_uppercase()
                                == upper_owned
                        })
                    })
                    .or_else(|| {
                        proj_items.iter().find(|i| {
                            clean_str(i.get("proj_abbr_name"))
                                .unwrap_or_default()
                                .to_uppercase()
                                == upper_owned
                        })
                    })
                    .unwrap_or(&proj_items[0])
                    .clone();

                this.cache.set(cache_key, matched.clone(), Some(86400.0));
                Ok(Some(matched))
            })
            .await;

        res.ok().flatten()
    }

    pub async fn fetch_mf_amcs(&self) -> Vec<Map<String, Value>> {
        let cache_key = "sec_mf_amcs_directory".to_string();
        if let Some(cached) = self.cache.get::<Vec<Map<String, Value>>>(&cache_key) {
            return cached;
        }

        let this = self.clone();
        let ck = cache_key.clone();
        let res: Result<Vec<Map<String, Value>>, String> = self
            .singleflight
            .execute(&cache_key, move || async move {
                if let Some(c) = this.cache.get::<Vec<Map<String, Value>>>(&ck) {
                    return Ok(c);
                }
                let mut items = Vec::new();
                let mut cursor: Option<String> = None;
                let base_url = format!("{}/general-info/amcs", this.sec_mf_base());

                loop {
                    let payload = if let Some(c) = cursor.as_deref() {
                        this.fetch_sec_json(&base_url, &[("cursor", c)]).await
                    } else {
                        this.fetch_sec_json(&base_url, &[]).await
                    };
                    let batch = Self::extract_items(payload.as_ref());
                    if batch.is_empty() {
                        break;
                    }
                    items.extend(batch);
                    let next_cursor = payload
                        .as_ref()
                        .and_then(|p| clean_str(p.get("next_cursor")));
                    match next_cursor {
                        Some(nc) if cursor.as_deref() != Some(nc.as_str()) => cursor = Some(nc),
                        _ => break,
                    }
                }

                if !items.is_empty() {
                    this.cache.set(ck, items.clone(), Some(86400.0));
                }
                Ok(items)
            })
            .await;

        res.unwrap_or_default()
    }

    pub async fn fetch_pvd_amcs(&self) -> Vec<Map<String, Value>> {
        let cache_key = "sec_pvd_amcs_directory".to_string();
        if let Some(cached) = self.cache.get::<Vec<Map<String, Value>>>(&cache_key) {
            return cached;
        }

        let this = self.clone();
        let ck = cache_key.clone();
        let res: Result<Vec<Map<String, Value>>, String> = self
            .singleflight
            .execute(&cache_key, move || async move {
                if let Some(c) = this.cache.get::<Vec<Map<String, Value>>>(&ck) {
                    return Ok(c);
                }
                let url = format!("{}/factsheet/amc", this.sec_pvd_base());
                let payload = this.fetch_sec_json(&url, &[]).await;
                let items = Self::extract_items(payload.as_ref());
                if !items.is_empty() {
                    this.cache.set(ck, items.clone(), Some(86400.0));
                }
                Ok(items)
            })
            .await;

        res.unwrap_or_default()
    }

    async fn fetch_host_from_proj_id(&self, proj_id: &str) -> Option<String> {
        let url = format!("{}/factsheet/urls", self.sec_mf_base());
        let payload = self.fetch_sec_json(&url, &[("proj_id", proj_id)]).await;
        for item in Self::extract_items(payload.as_ref()) {
            let raw_url =
                clean_str(item.get("amc_url_factsheet")).or_else(|| clean_str(item.get("amc_url")));
            let candidates = extract_domain_candidates(raw_url.as_deref());
            if let Some(first) = candidates.into_iter().next() {
                return Some(first);
            }
        }
        None
    }

    async fn fetch_host_from_company_info(&self, amc_id: &str) -> Option<String> {
        let url = format!("{}/general-info/profiles", self.sec_mf_base());
        let payload = self
            .fetch_sec_json(
                &url,
                &[
                    ("company_info", amc_id),
                    ("fund_status", "Registered"),
                    ("page_size", "5"),
                ],
            )
            .await;
        for proj in Self::extract_items(payload.as_ref()).into_iter().take(5) {
            let Some(pid) = clean_str(proj.get("proj_id")) else {
                continue;
            };
            if let Some(host) = self.fetch_host_from_proj_id(&pid).await {
                return Some(host);
            }
        }
        None
    }

    pub async fn resolve_amc_website_host(
        &self,
        amc_id: &str,
        proj_id: Option<&str>,
        amc_name: Option<&str>,
        abbr_name: Option<&str>,
    ) -> Option<String> {
        let clean_id = amc_id.trim();
        if clean_id.is_empty() {
            return None;
        }
        let cache_key = format!("sec_amc_host_{clean_id}");
        if let Some(cached) = self.cache.get::<String>(&cache_key) {
            return (!cached.is_empty()).then_some(cached);
        }

        let this = self.clone();
        let ck = cache_key.clone();
        let clean_id_owned = clean_id.to_string();
        let proj_id_owned = proj_id.map(str::to_string);
        let amc_name_owned = amc_name.map(str::to_string);
        let abbr_name_owned = abbr_name.map(str::to_string);

        let res: Result<Option<String>, String> = self
            .singleflight
            .execute(&cache_key, move || async move {
                if let Some(c) = this.cache.get::<String>(&ck) {
                    return Ok((!c.is_empty()).then_some(c));
                }

                let mut host: Option<String> = None;
                if let Some(pid) = proj_id_owned.as_deref() {
                    host = this.fetch_host_from_proj_id(pid).await;
                }
                if host.is_none() {
                    host = this.fetch_host_from_company_info(&clean_id_owned).await;
                }
                if host.is_none() && (amc_name_owned.is_some() || abbr_name_owned.is_some()) {
                    let hint = amc_name_owned.as_deref().or(abbr_name_owned.as_deref());
                    let brand_tokens = extract_brand_tokens(hint);
                    let abbr_upper: String = abbr_name_owned
                        .as_deref()
                        .unwrap_or("")
                        .to_uppercase()
                        .chars()
                        .filter(|c| c.is_ascii_alphanumeric())
                        .collect();

                    if !brand_tokens.is_empty() {
                        let mf_amcs = this.fetch_mf_amcs().await;
                        for row in mf_amcs {
                            let Some(sister_id) = clean_str(row.get("unique_id")) else {
                                continue;
                            };
                            if sister_id == clean_id_owned {
                                continue;
                            }
                            let row_name = clean_str(row.get("comp_name_en")).unwrap_or_default();
                            let sister_tokens = extract_brand_tokens(Some(&row_name));
                            if sister_tokens.is_empty() {
                                continue;
                            }
                            if sister_tokens[0] == brand_tokens[0]
                                || (!abbr_upper.is_empty() && abbr_upper == sister_tokens[0])
                            {
                                host = this.fetch_host_from_company_info(&sister_id).await;
                                if host.is_some() {
                                    break;
                                }
                            }
                        }
                    }
                }

                if let Some(h) = host {
                    this.cache.set(ck, h.clone(), Some(604800.0));
                    return Ok(Some(h));
                }

                this.cache.set(ck, String::new(), Some(3600.0));
                Ok(None)
            })
            .await;

        res.ok().flatten()
    }

    pub async fn resolve_fund_amc_details(
        &self,
        symbol: &str,
        asset_type: &str,
        fund_name: Option<&str>,
    ) -> FundAmcDetails {
        let sym_clean = strip_fund_or_bk_suffix(symbol);
        let sym_upper = sym_clean.to_uppercase();
        let normalized_type = asset_type.trim().to_lowercase();
        let has_sec_access = self.has_sec_access();

        let mut amc_id: Option<String> = None;
        let mut amc_name: Option<String> = None;
        let mut abbr_name: Option<String> = None;
        let mut proj_id: Option<String> = None;

        if normalized_type == "provident-fund" {
            let clean_fund = fund_name.unwrap_or("").trim();
            if !clean_fund.is_empty() {
                if let Some(cached_by_name) = self
                    .cache
                    .get::<String>(&format!("sec_pvd_amc_id_name_{clean_fund}"))
                    .filter(|s| !s.is_empty())
                {
                    amc_id = Some(cached_by_name);
                }
                if let Some(cached_proj) = self
                    .cache
                    .get::<String>(&format!("sec_pvd_proj_id_{clean_fund}"))
                    .filter(|s| !s.is_empty())
                {
                    proj_id = Some(cached_proj);
                }
                if amc_id.is_none() && has_sec_access {
                    proj_id = self.fetch_pvd_proj_id(clean_fund).await;
                    if let Some(pid) = proj_id.as_deref() {
                        if let Some(cached_proj_amc) = self
                            .cache
                            .get::<String>(&format!("sec_pvd_amc_id_proj_{pid}"))
                            .filter(|s| !s.is_empty())
                        {
                            amc_id = Some(cached_proj_amc);
                        }
                    }
                }
                amc_name = Some(clean_fund.to_string());
            } else if !sym_upper.is_empty() {
                if let Some(cached_by_sym) = self
                    .cache
                    .get::<String>(&format!("sec_pvd_symbol_amc_{sym_upper}"))
                    .filter(|s| !s.is_empty())
                {
                    amc_id = Some(cached_by_sym);
                }
            }

            if let Some(aid) = amc_id.as_deref() {
                if has_sec_access {
                    let pvd_amcs = self.fetch_pvd_amcs().await;
                    for row in pvd_amcs {
                        if clean_str(row.get("unique_id")).as_deref() == Some(aid) {
                            abbr_name = clean_str(row.get("abbr_name"));
                            amc_name = clean_str(row.get("name_en"))
                                .or_else(|| clean_str(row.get("name_th")))
                                .or(amc_name);
                            break;
                        }
                    }
                }
            }
        } else {
            if sym_upper.is_empty() {
                return FundAmcDetails::default();
            }
            let mut profile = self
                .cache
                .get::<Map<String, Value>>(&format!("sec_profile_{sym_upper}"));
            if profile.is_none() && has_sec_access {
                profile = self.fetch_fund_profile(&sym_clean, &sym_upper).await;
            }
            if let Some(prof) = profile {
                amc_id = clean_str(prof.get("unique_id"));
                amc_name = clean_str(prof.get("comp_name_en"))
                    .or_else(|| clean_str(prof.get("comp_name_th")));
                proj_id = clean_str(prof.get("proj_id"));
            }
        }

        let Some(aid) = amc_id else {
            return FundAmcDetails::default();
        };

        let mut website_host: Option<String> = None;
        if let Some(cached_host) = self.cache.get::<String>(&format!("sec_amc_host_{aid}")) {
            website_host = (!cached_host.is_empty()).then_some(cached_host);
        } else if has_sec_access {
            let mf_proj_id = if normalized_type != "provident-fund" {
                proj_id.as_deref()
            } else {
                None
            };
            website_host = self
                .resolve_amc_website_host(
                    &aid,
                    mf_proj_id,
                    amc_name.as_deref(),
                    abbr_name.as_deref(),
                )
                .await;
        }

        FundAmcDetails {
            amc_id: Some(aid),
            amc_name,
            abbr_name,
            website_host,
            proj_id,
        }
    }

    pub async fn resolve_fund_amc(
        &self,
        symbol: &str,
        asset_type: &str,
        fund_name: Option<&str>,
    ) -> (Option<String>, Option<String>) {
        let details = self
            .resolve_fund_amc_details(symbol, asset_type, fund_name)
            .await;
        (details.amc_id, details.amc_name)
    }

    #[allow(clippy::too_many_arguments)]
    pub async fn fetch_fund_nav_data(
        &self,
        symbol: &str,
        clean_symbol: &str,
        sym_upper: &str,
        proj_id: &str,
        fund_name: &str,
        name_th: &str,
        target_class: Option<&str>,
    ) -> SingleFundNavResult {
        let end = Utc::now().date_naive();
        let start = end - Duration::days(30);
        let url = format!(
            "{}/daily-info/nav?proj_id={}&start_nav_date={}&end_nav_date={}",
            self.sec_mf_base(),
            urlencoding::encode(proj_id),
            start.format("%Y-%m-%d"),
            end.format("%Y-%m-%d")
        );

        let fallback = || SingleFundNavResult {
            original_symbol: symbol.to_string(),
            data: PriceData {
                symbol: symbol.to_string(),
                name: Some(fund_name.to_string()),
                name_th: Some(name_th.to_string()),
                price: 0.0,
                currency: "THB".to_string(),
            },
        };

        let Ok((status, text)) = self.sec_get(&url).await else {
            return fallback();
        };
        if !(200..300).contains(&status) || text.trim().is_empty() {
            return fallback();
        }
        let Ok(raw_val) = serde_json::from_str::<Value>(&text) else {
            return fallback();
        };
        let data = Self::extract_items(Some(&raw_val));
        if data.is_empty() {
            return fallback();
        }

        let target_upper = target_class.unwrap_or(clean_symbol).to_uppercase();
        let mut filtered: Vec<Map<String, Value>> = data
            .iter()
            .filter(|d| {
                clean_str(d.get("fund_class_name"))
                    .unwrap_or_default()
                    .to_uppercase()
                    == target_upper
            })
            .cloned()
            .collect();

        if filtered.is_empty() && target_class != Some("main") {
            filtered = data
                .iter()
                .filter(|d| {
                    clean_str(d.get("fund_class_name"))
                        .unwrap_or_default()
                        .to_uppercase()
                        == sym_upper
                })
                .cloned()
                .collect();
        }
        if filtered.is_empty() {
            filtered = data
                .iter()
                .filter(|d| clean_str(d.get("fund_class_name")).as_deref() == Some("main"))
                .cloned()
                .collect();
        }
        if filtered.is_empty() {
            filtered = data;
        }

        filtered.sort_by(|a, b| {
            let da = clean_str(a.get("nav_date")).unwrap_or_default();
            let db = clean_str(b.get("nav_date")).unwrap_or_default();
            db.cmp(&da)
        });

        let nav = filtered
            .first()
            .and_then(|latest| parse_float(latest.get("last_val")))
            .unwrap_or(0.0);

        SingleFundNavResult {
            original_symbol: symbol.to_string(),
            data: PriceData {
                symbol: symbol.to_string(),
                name: Some(fund_name.to_string()),
                name_th: Some(name_th.to_string()),
                price: nav,
                currency: "THB".to_string(),
            },
        }
    }

    pub async fn fetch_fund_dividend_history(&self, symbol: &str) -> Vec<Map<String, Value>> {
        let cache_key = format!("sec_div_{symbol}");
        if let Some(cached) = self.cache.get::<Vec<Map<String, Value>>>(&cache_key) {
            return cached;
        }

        let this = self.clone();
        let sym_owned = symbol.to_string();
        let sf_key = cache_key.clone();

        let res: Result<Vec<Map<String, Value>>, String> = self
            .singleflight
            .execute(&sf_key, move || async move {
                if let Some(c) = this.cache.get::<Vec<Map<String, Value>>>(&cache_key) {
                    return Ok(c);
                }

                let clean_symbol = strip_fund_suffix(&sym_owned);
                let sym_upper = clean_symbol.to_uppercase();

                let url1 = format!(
                    "{}/daily-info/dividend-history?class_abbr_name={}",
                    this.sec_mf_base(),
                    urlencoding::encode(&clean_symbol)
                );
                if let Ok((200, text1)) = this.sec_get(&url1).await {
                    if let Ok(val1) = serde_json::from_str::<Value>(&text1) {
                        let items = Self::extract_items(Some(&val1));
                        if !items.is_empty() {
                            this.cache.set(cache_key, items.clone(), Some(3600.0));
                            return Ok(items);
                        }
                    }
                }

                if let Some(profile) = this.fetch_fund_profile(&clean_symbol, &sym_upper).await {
                    if let Some(proj_id) = clean_str(profile.get("proj_id")) {
                        let url2 = format!(
                            "{}/daily-info/dividend-history?proj_id={}",
                            this.sec_mf_base(),
                            urlencoding::encode(&proj_id)
                        );
                        if let Ok((200, text2)) = this.sec_get(&url2).await {
                            if let Ok(val2) = serde_json::from_str::<Value>(&text2) {
                                let items2 = Self::extract_items(Some(&val2));
                                let filtered: Vec<Map<String, Value>> = items2
                                    .iter()
                                    .filter(|i| {
                                        clean_str(i.get("class_abbr_name"))
                                            .or_else(|| clean_str(i.get("fund_class_name")))
                                            .unwrap_or_default()
                                            .to_uppercase()
                                            == sym_upper
                                    })
                                    .cloned()
                                    .collect();
                                let final_res = if filtered.is_empty() {
                                    items2
                                } else {
                                    filtered
                                };
                                this.cache.set(cache_key, final_res.clone(), Some(3600.0));
                                return Ok(final_res);
                            }
                        }
                    }
                }

                Ok(Vec::new())
            })
            .await;

        res.unwrap_or_default()
    }

    pub async fn fetch_all_fund_dividends(
        &self,
        symbols: &[String],
    ) -> HashMap<String, Vec<Map<String, Value>>> {
        let unique: Vec<String> = symbols
            .iter()
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
                let hist = svc.fetch_fund_dividend_history(&sym).await;
                (sym, hist)
            }));
        }

        let mut out = HashMap::new();
        for handle in handles {
            if let Ok((sym, hist)) = handle.await {
                out.insert(sym, hist);
            }
        }
        out
    }

    pub async fn fetch_fund_factsheet(
        &self,
        symbol: &str,
        asset_type: &str,
        fund_name: Option<&str>,
    ) -> FundFactsheetResponse {
        let sym_clean = symbol.trim().to_string();
        let normalized_type = if asset_type.trim().is_empty() {
            "mutual-fund".to_string()
        } else {
            asset_type.trim().to_lowercase()
        };
        let fund_key = fund_name.unwrap_or("").trim().to_string();
        let cache_key = format!(
            "factsheet_v1_{}_{}_{}",
            normalized_type,
            sym_clean.to_uppercase(),
            fund_key
        );

        if let Some(cached) = self.cache.get::<FundFactsheetResponse>(&cache_key) {
            return cached;
        }

        let this = self.clone();
        let sf_sym = sym_clean.clone();
        let sf_norm = normalized_type.clone();
        let sf_key = format!(
            "factsheet_{}_{}_{}",
            normalized_type,
            sym_clean.to_uppercase(),
            fund_key
        );

        let res: Result<FundFactsheetResponse, String> = self
            .singleflight
            .execute(&sf_key, move || async move {
                if let Some(c) = this.cache.get::<FundFactsheetResponse>(&cache_key) {
                    return Ok(c);
                }

                let model = if sf_norm == "provident-fund" {
                    let fn_opt = (!fund_key.is_empty()).then_some(fund_key.as_str());
                    this.build_pvd_factsheet(&sf_sym, fn_opt).await
                } else {
                    this.build_mutual_fund_factsheet(&sf_sym).await
                };

                this.cache.set(cache_key, model.clone(), Some(3600.0));
                Ok(model)
            })
            .await;

        res.unwrap_or_else(|_| {
            FundFactsheetResponse::empty(&symbol.to_uppercase(), &sym_clean, &normalized_type)
        })
    }

    async fn build_mutual_fund_factsheet(&self, symbol: &str) -> FundFactsheetResponse {
        let base_symbol = strip_fund_or_bk_suffix(symbol);
        let sym_upper = base_symbol.to_uppercase();
        let profile = self.fetch_fund_profile(&base_symbol, &sym_upper).await;

        let Some(prof) = profile else {
            let mut empty =
                FundFactsheetResponse::empty(&symbol.to_uppercase(), &base_symbol, "mutual-fund");
            empty.fund_name = Some(base_symbol);
            return empty;
        };
        let Some(proj_id) = clean_str(prof.get("proj_id")) else {
            let mut empty =
                FundFactsheetResponse::empty(&symbol.to_uppercase(), &base_symbol, "mutual-fund");
            empty.fund_name = Some(base_symbol);
            return empty;
        };

        let target_class = clean_str(prof.get("fund_class_name"));
        let base = self.sec_mf_base();

        let u_urls = format!("{base}/factsheet/urls");
        let u_risk = format!("{base}/factsheet/risk-spectrum");
        let u_bench = format!("{base}/factsheet/benchmarks");
        let u_div = format!("{base}/factsheet/dividend-policy");
        let u_fees = format!("{base}/factsheet/fees");
        let u_perf = format!("{base}/factsheet/performance");
        let u_stats = format!("{base}/factsheet/statistics");
        let u_alloc = format!("{base}/factsheet/asset-allocation");
        let u_top5 = format!("{base}/factsheet/top5-holdings");
        let u_mins = format!("{base}/factsheet/subscription-redemption-minimums");
        let u_periods = format!("{base}/factsheet/subscription-redemption-periods");
        let q_pid = [("proj_id", proj_id.as_str())];
        let q_pid_latest = [("proj_id", proj_id.as_str()), ("latest", "true")];

        let (
            urls_raw,
            risk_raw,
            bench_raw,
            div_raw,
            fees_raw,
            perf_raw,
            stats_raw,
            alloc_raw,
            top5_raw,
            mins_raw,
            periods_raw,
        ) = tokio::join!(
            self.fetch_sec_json(&u_urls, &q_pid),
            self.fetch_sec_json(&u_risk, &q_pid_latest),
            self.fetch_sec_json(&u_bench, &q_pid_latest),
            self.fetch_sec_json(&u_div, &q_pid_latest),
            self.fetch_sec_json(&u_fees, &q_pid_latest),
            self.fetch_sec_json(&u_perf, &q_pid_latest),
            self.fetch_sec_json(&u_stats, &q_pid_latest),
            self.fetch_sec_json(&u_alloc, &q_pid_latest),
            self.fetch_sec_json(&u_top5, &q_pid_latest),
            self.fetch_sec_json(&u_mins, &q_pid_latest),
            self.fetch_sec_json(&u_periods, &q_pid_latest),
        );

        let tc_ref = target_class.as_deref();
        let url_items =
            Self::filter_by_class(Self::extract_items(urls_raw.as_ref()), tc_ref, &sym_upper);
        let url_row = url_items.into_iter().next().unwrap_or_default();

        let risk_items = Self::extract_items(risk_raw.as_ref());
        let risk_row = risk_items.into_iter().next().unwrap_or_default();

        let mut bench_items = Self::extract_items(bench_raw.as_ref());
        bench_items.sort_by_key(|x| parse_int(x.get("group_seq"), 99));
        let bench_parts: Vec<String> = bench_items
            .iter()
            .filter_map(|x| clean_str(x.get("benchmark")))
            .collect();
        let benchmark_text = (!bench_parts.is_empty()).then(|| bench_parts.join(" + "));
        let benchmark_remark = bench_items.iter().find_map(|b| {
            clean_str(b.get("benchmark_remark")).or_else(|| clean_str(b.get("remark")))
        });

        let div_items =
            Self::filter_by_class(Self::extract_items(div_raw.as_ref()), tc_ref, &sym_upper);
        let div_row = div_items.into_iter().next().unwrap_or_default();

        let fee_items_raw =
            Self::filter_by_class(Self::extract_items(fees_raw.as_ref()), tc_ref, &sym_upper);
        let mut fees = Vec::new();
        for f_row in fee_items_raw {
            let Some(desc) = clean_str(f_row.get("fee_type_desc"))
                .or_else(|| clean_str(f_row.get("fee_other_desc")))
            else {
                continue;
            };
            fees.push(FactsheetFeeItem {
                description: desc,
                ceiling_rate: format_fee_rate(f_row.get("rate")),
                actual_rate: format_fee_rate(f_row.get("actual_value")),
                note: clean_str(f_row.get("fee_other_desc")),
            });
        }

        let perf_items_raw =
            Self::filter_by_class(Self::extract_items(perf_raw.as_ref()), tc_ref, &sym_upper);
        let mut performance = Vec::new();
        for p_row in perf_items_raw {
            let (Some(category), Some(period)) = (
                clean_str(p_row.get("performance_type_desc")),
                clean_str(p_row.get("reference_period")),
            ) else {
                continue;
            };
            let raw_val = p_row
                .get("performance_value")
                .filter(|v| !v.is_null())
                .or_else(|| p_row.get("performance_val"));
            performance.push(FactsheetPerformanceItem {
                category,
                period,
                value: parse_float(raw_val),
            });
        }

        let stats_items =
            Self::filter_by_class(Self::extract_items(stats_raw.as_ref()), tc_ref, &sym_upper);
        let statistics = stats_items.first().map(|s_row| FactsheetStatistics {
            max_drawdown: parse_float(s_row.get("maximum_drawdown")),
            sharpe_ratio: parse_float(s_row.get("sharpe_ratio")),
            tracking_error: parse_float(s_row.get("tracking_error")),
            fx_hedging: clean_str(s_row.get("fx_hedging")),
            turnover_ratio: parse_float(s_row.get("portfolio_turnover_ratio")),
            beta: parse_float(s_row.get("beta")),
            alpha: parse_float(s_row.get("alpha")),
            yield_to_maturity: parse_float(s_row.get("yield_to_maturity")),
            portfolio_duration: clean_str(s_row.get("portfolio_duration_period")),
            recovering_period: clean_str(s_row.get("recovering_period")),
        });

        let alloc_items_raw = select_latest_period_rows(&Self::extract_items(alloc_raw.as_ref()));
        let asset_allocation = build_allocation_items(
            &alloc_items_raw,
            "asset_seq",
            &["asset_name"],
            "asset_ratio",
        );

        let top5_items_raw = select_latest_period_rows(&Self::extract_items(top5_raw.as_ref()));
        let top_holdings = build_holding_items(
            &top5_items_raw,
            "asset_seq",
            "asset_name",
            "asset_ratio",
            None,
            None,
        );

        let min_items =
            Self::filter_by_class(Self::extract_items(mins_raw.as_ref()), tc_ref, &sym_upper);
        let min_row = min_items.into_iter().next().unwrap_or_default();
        let period_items = Self::filter_by_class(
            Self::extract_items(periods_raw.as_ref()),
            tc_ref,
            &sym_upper,
        );

        let mut sub_period: Option<String> = None;
        let mut redempt_period: Option<String> = None;
        let mut settlement_period: Option<String> = None;
        for per_row in period_items {
            let p_type = clean_str(per_row.get("type"))
                .unwrap_or_default()
                .to_lowercase();
            if p_type == "subscription" && sub_period.is_none() {
                sub_period = clean_str(per_row.get("period"));
            } else if p_type == "redemption" {
                if redempt_period.is_none() {
                    redempt_period = clean_str(per_row.get("period"))
                        .or_else(|| clean_str(per_row.get("redemp_period_oth")));
                }
                if settlement_period.is_none() {
                    settlement_period = clean_str(per_row.get("settlement_period"));
                }
            }
        }

        let min_init = parse_float(min_row.get("minimum_sub_ipo"));
        let min_next = parse_float(min_row.get("minimum_sub"));
        let min_red = parse_float(min_row.get("minimum_redempt"));
        let trade_curr = clean_str(min_row.get("minimum_sub_cur"))
            .or_else(|| clean_str(min_row.get("minimum_redempt_cur")));

        let trade_conditions = if min_init.is_some()
            || min_next.is_some()
            || min_red.is_some()
            || sub_period.is_some()
            || redempt_period.is_some()
            || settlement_period.is_some()
        {
            Some(FactsheetTradeConditions {
                minimum_initial_sub: min_init,
                minimum_next_sub: min_next,
                minimum_redempt: min_red,
                currency: trade_curr,
                subscription_period: sub_period,
                redemption_period: redempt_period,
                settlement_period,
            })
        } else {
            None
        };

        let mgmt_code = clean_str(prof.get("management_style"));
        let mgmt_style = mgmt_code.map(|code| {
            management_style_desc(&code)
                .map(str::to_string)
                .unwrap_or(code)
        });
        let raw_div_policy = clean_str(div_row.get("dividend_policy"));

        FundFactsheetResponse {
            symbol: symbol.to_uppercase(),
            display_symbol: base_symbol.clone(),
            asset_type: "mutual-fund".to_string(),
            proj_id: Some(proj_id),
            fund_name: clean_str(prof.get("proj_name_en"))
                .or_else(|| clean_str(prof.get("proj_name_th")))
                .or(Some(base_symbol)),
            fund_name_th: clean_str(prof.get("proj_name_th")),
            amc_name: clean_str(prof.get("comp_name_en"))
                .or_else(|| clean_str(prof.get("comp_name_th"))),
            amc_name_th: clean_str(prof.get("comp_name_th")),
            fund_class_name: if target_class.as_deref() == Some("main") {
                None
            } else {
                target_class
            },
            policy_desc: clean_str(prof.get("policy_desc")),
            investment_policy_desc: decode_policy_text(prof.get("investment_policy_desc")),
            management_style: mgmt_style,
            objective: None,
            aimc_type: None,
            aimc_description: None,
            risk_level: clean_str(risk_row.get("risk_spectrum")),
            risk_description: clean_str(risk_row.get("risk_spectrum_desc")),
            benchmark: benchmark_text,
            benchmark_remark,
            dividend_policy: raw_div_policy,
            inception_date: clean_str(prof.get("regis_date"))
                .or_else(|| clean_str(prof.get("init_date"))),
            pdf_url: clean_str(url_row.get("pdf_factsheet")),
            amc_url: clean_str(url_row.get("amc_url_factsheet")),
            as_of_date: clean_str(url_row.get("as_of_date")),
            feeder_master_fund: clean_str(prof.get("feederfund_master_fund")),
            feeder_country: clean_str(prof.get("feederfund_country")),
            fx_hedging_policy: clean_str(prof.get("exchange_rate_protection_policy")),
            tax_incentive_type: clean_str(prof.get("fund_class_tax_incentive_type")),
            isin_code: clean_str(prof.get("fund_class_isin_code")),
            fees,
            performance,
            statistics,
            asset_allocation,
            top_holdings,
            trade_conditions,
        }
    }

    async fn build_pvd_factsheet(
        &self,
        symbol: &str,
        fund_name: Option<&str>,
    ) -> FundFactsheetResponse {
        let sym_upper = symbol.trim().to_uppercase();
        let effective_fund_name = fund_name
            .map(str::trim)
            .filter(|s| !s.is_empty())
            .unwrap_or("ไทยพาณิชย์ มาสเตอร์ฟันด์")
            .to_string();
        let default_meta = default_pvd_metadata(&sym_upper);
        let default_name = default_pvd_name(&sym_upper).unwrap_or(sym_upper.as_str());

        let proj_id = self.fetch_pvd_proj_id(&effective_fund_name).await;
        let policy_map = if let Some(pid) = proj_id.as_deref() {
            self.fetch_pvd_policies(Some(pid), Some(&effective_fund_name))
                .await
        } else {
            HashMap::new()
        };
        let policy_info = policy_map.get(&sym_upper);

        let (returns_raw, trail_raw, fees_raw, stats_raw, asset_raw, sec_raw) =
            if let Some(pid) = proj_id.as_deref() {
                let pvd_base = format!("{}/factsheet/{}", self.sec_pvd_base(), pid);
                let u_ret = format!("{pvd_base}/return");
                let u_trail = format!("{pvd_base}/trailreturn");
                let u_fee = format!("{pvd_base}/fee");
                let u_stat = format!("{pvd_base}/statistics");
                let u_asset = format!("{pvd_base}/top5/assettype");
                let u_sec = format!("{pvd_base}/top5/securities");
                tokio::join!(
                    self.fetch_sec_json(&u_ret, &[]),
                    self.fetch_sec_json(&u_trail, &[]),
                    self.fetch_sec_json(&u_fee, &[]),
                    self.fetch_sec_json(&u_stat, &[]),
                    self.fetch_sec_json(&u_asset, &[]),
                    self.fetch_sec_json(&u_sec, &[]),
                )
            } else {
                (None, None, None, None, None, None)
            };

        let mut performance = Vec::new();
        for (cat_label, raw_payload) in [
            ("Calendar / Cumulative Return", returns_raw.as_ref()),
            ("Trailing Return", trail_raw.as_ref()),
        ] {
            let mut rows =
                Self::filter_pvd_rows(Self::extract_items(raw_payload), policy_info, &sym_upper);
            rows.sort_by_key(|x| parse_int(x.get("seq"), 99));
            for row in rows {
                let Some(period) = clean_str(row.get("return_year")) else {
                    continue;
                };
                performance.push(FactsheetPerformanceItem {
                    category: cat_label.to_string(),
                    period,
                    value: parse_float(row.get("return_rate")),
                });
            }
        }

        let mut fee_rows = Self::filter_pvd_rows(
            Self::extract_items(fees_raw.as_ref()),
            policy_info,
            &sym_upper,
        );
        fee_rows.sort_by_key(|x| parse_int(x.get("seq"), 99));
        let mut fees = Vec::new();
        for f_row in fee_rows {
            let Some(desc) = clean_str(f_row.get("fee_type_desc")) else {
                continue;
            };
            let rate_str = format_fee_rate(f_row.get("fee_rate"));
            let is_ceiling = desc == "TotalFeeMax";
            fees.push(FactsheetFeeItem {
                description: desc,
                ceiling_rate: if is_ceiling { rate_str.clone() } else { None },
                actual_rate: if is_ceiling { None } else { rate_str },
                note: None,
            });
        }

        let stat_rows = select_latest_period_rows(&Self::filter_pvd_rows(
            Self::extract_items(stats_raw.as_ref()),
            policy_info,
            &sym_upper,
        ));
        let mut stats_as_of = None;
        let statistics = stat_rows.first().map(|s_row| {
            stats_as_of = clean_str(s_row.get("period"));
            let ytm_val = s_row
                .get("yield_to_maturity")
                .filter(|v| !v.is_null())
                .or_else(|| s_row.get("yeild_to_maturity"));
            FactsheetStatistics {
                max_drawdown: parse_float(s_row.get("max_drawdown")),
                sharpe_ratio: parse_float(s_row.get("sharpe_ratio")),
                tracking_error: parse_float(s_row.get("tracking_error")),
                fx_hedging: clean_str(s_row.get("fx_hedging")),
                turnover_ratio: parse_float(s_row.get("port_turnover")),
                beta: parse_float(s_row.get("beta")),
                alpha: parse_float(s_row.get("alpha")),
                yield_to_maturity: parse_float(ytm_val),
                portfolio_duration: clean_str(s_row.get("port_duration")),
                recovering_period: clean_str(s_row.get("recovering_period")),
            }
        });

        let asset_rows = select_latest_period_rows(&Self::filter_pvd_rows(
            Self::extract_items(asset_raw.as_ref()),
            policy_info,
            &sym_upper,
        ));
        let asset_allocation = build_allocation_items(
            &asset_rows,
            "asset_allocation_seq",
            &["asset_allocation", "assetliab_name_th"],
            "asset_ratio",
        );

        let sec_rows = select_latest_period_rows(&Self::filter_pvd_rows(
            Self::extract_items(sec_raw.as_ref()),
            policy_info,
            &sym_upper,
        ));
        let top_holdings = build_holding_items(
            &sec_rows,
            "secur_seq",
            "secur_name",
            "secur_invest_size",
            Some("secur_credit_rating"),
            Some("secur_isin_code"),
        );

        let fallback_period = asset_rows
            .first()
            .and_then(|r| clean_str(r.get("period")))
            .or_else(|| sec_rows.first().and_then(|r| clean_str(r.get("period"))));

        let sub_policy_name = policy_info
            .and_then(|p| clean_str(p.get("name")))
            .unwrap_or_else(|| default_name.to_string());
        let foreign_code = policy_info.and_then(|p| clean_str(p.get("foreignRiskLevel")));
        let master_fund_name = policy_info
            .and_then(|p| clean_str(p.get("fundName")))
            .unwrap_or(effective_fund_name);

        FundFactsheetResponse {
            symbol: sym_upper.clone(),
            display_symbol: sym_upper,
            asset_type: "provident-fund".to_string(),
            proj_id,
            fund_name: Some(sub_policy_name.clone()),
            fund_name_th: Some(sub_policy_name),
            amc_name: Some(master_fund_name.clone()),
            amc_name_th: Some(master_fund_name),
            fund_class_name: None,
            policy_desc: policy_info
                .and_then(|p| clean_str(p.get("policyName")))
                .or_else(|| default_meta.map(|m| m.policy_name.to_string())),
            investment_policy_desc: None,
            management_style: None,
            objective: policy_info
                .and_then(|p| clean_str(p.get("objective")))
                .or_else(|| default_meta.map(|m| m.objective.to_string())),
            aimc_type: policy_info
                .and_then(|p| clean_str(p.get("aimcType")))
                .or_else(|| default_meta.map(|m| m.aimc_type.to_string())),
            aimc_description: policy_info
                .and_then(|p| clean_str(p.get("aimcDescription")))
                .or_else(|| default_meta.map(|m| m.aimc_description.to_string())),
            risk_level: policy_info
                .and_then(|p| clean_str(p.get("riskLevel")))
                .or_else(|| default_meta.map(|m| m.risk_level.to_string())),
            risk_description: None,
            benchmark: None,
            benchmark_remark: None,
            dividend_policy: None,
            inception_date: policy_info.and_then(|p| clean_str(p.get("inceptionDate"))),
            pdf_url: None,
            amc_url: None,
            as_of_date: stats_as_of.or(fallback_period),
            feeder_master_fund: None,
            feeder_country: None,
            fx_hedging_policy: foreign_code.map(|code| {
                pvd_foreign_risk_desc(&code)
                    .map(str::to_string)
                    .unwrap_or(code)
            }),
            tax_incentive_type: None,
            isin_code: None,
            fees,
            performance,
            statistics,
            asset_allocation,
            top_holdings,
            trade_conditions: None,
        }
    }
}

pub fn strip_fund_suffix(symbol: &str) -> String {
    static RE: OnceLock<Regex> = OnceLock::new();
    let re = RE.get_or_init(|| Regex::new(r"(?i)\.(FUND|BKFUND)$").expect("valid regex"));
    re.replace(symbol.trim(), "").trim().to_string()
}

pub fn strip_fund_or_bk_suffix(symbol: &str) -> String {
    static RE: OnceLock<Regex> = OnceLock::new();
    let re = RE.get_or_init(|| Regex::new(r"(?i)\.(FUND|BKFUND|BK)$").expect("valid regex"));
    re.replace(symbol.trim(), "").trim().to_string()
}
