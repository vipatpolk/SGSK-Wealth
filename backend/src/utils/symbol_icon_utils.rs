use std::collections::HashSet;
use std::sync::OnceLock;

use regex::Regex;
use url::Url;

use crate::utils::format_utils::{display_symbol, get_asset_type};

const MULTILABEL_SUFFIXES: &[&str] = &[
    ".co.th", ".or.th", ".in.th", ".ac.th", ".go.th", ".co.uk", ".org.uk", ".com.hk", ".com.sg",
    ".com.au", ".co.jp",
];

fn corporate_stopwords() -> &'static HashSet<&'static str> {
    static STOPWORDS: OnceLock<HashSet<&'static str>> = OnceLock::new();
    STOPWORDS.get_or_init(|| {
        [
            "ASSET",
            "MANAGEMENT",
            "FUND",
            "FUNDS",
            "INVESTMENT",
            "INVESTMENTS",
            "SECURITIES",
            "COMPANY",
            "LIMITED",
            "LTD",
            "PUBLIC",
            "PCL",
            "THAILAND",
            "CO",
            "PLC",
            "THE",
            "AND",
            "GROUP",
            "HOLDINGS",
            "INSURANCE",
        ]
        .into_iter()
        .collect()
    })
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct SymbolLogoConfig {
    pub primary_url: Option<String>,
    pub secondary_url: Option<String>,
    pub is_mutual_fund: bool,
    pub monogram: String,
    pub brand_color: String,
}

fn hsl_to_hex(h: f64, s: f64, lightness: f64) -> String {
    let a = s * lightness.min(1.0 - lightness);
    let channel = |n: i32| -> String {
        let k = (n as f64 + h / 30.0) % 12.0;
        let color = lightness - a * (k - 3.0).min(9.0 - k).clamp(-1.0, 1.0);
        let scaled = 255.0 * color;
        let floored = scaled.floor();
        let val = if (scaled - floored - 0.5).abs() < 1e-12 {
            if (floored as i64) % 2 == 0 {
                floored
            } else {
                floored + 1.0
            }
        } else {
            scaled.round()
        } as u8;
        format!("{val:02x}")
    };
    format!("#{}{}{}", channel(0), channel(8), channel(4))
}

pub fn clean_ticker_for_url(symbol: &str) -> String {
    let clean = display_symbol(symbol).trim().to_string();
    clean.replace(['.', '/'], "-")
}

pub fn get_symbol_monogram(symbol: &str) -> String {
    static NON_ALNUM_RE: OnceLock<Regex> = OnceLock::new();
    let clean = display_symbol(symbol).trim().to_uppercase();
    if clean.is_empty() {
        return "?".to_string();
    }
    if clean.chars().count() <= 3 {
        return clean;
    }
    let re = NON_ALNUM_RE.get_or_init(|| Regex::new(r"[^A-Z0-9]").expect("valid regex"));
    let letters_only = re.replace_all(&clean, "").to_string();
    if letters_only.is_empty() {
        clean.chars().take(2).collect()
    } else {
        letters_only.chars().take(2).collect()
    }
}

pub fn get_symbol_color(symbol: &str) -> String {
    let clean = display_symbol(symbol).to_uppercase().trim().to_string();
    if clean.is_empty() {
        return "#6366f1".to_string();
    }

    let mut h: i32 = 0;
    for ch in clean.chars() {
        h = (ch as i32).wrapping_add(h.wrapping_shl(5).wrapping_sub(h));
    }

    let hue = (h.wrapping_abs() % 360) as f64;
    let sat = 0.65 + ((h >> 3).wrapping_abs() % 20) as f64 / 100.0;
    let light = 0.45 + ((h >> 7).wrapping_abs() % 10) as f64 / 100.0;

    hsl_to_hex(hue, sat, light)
}

pub fn build_logo_dev_url(base_url: &str, path: &str, token: Option<&str>) -> String {
    let base = base_url.trim().trim_end_matches('/');
    let clean_path = path.trim().trim_start_matches('/');
    let mut url = format!("{base}/{clean_path}?format=png&size=128&fallback=404");
    if let Some(tk) = token.map(str::trim).filter(|s| !s.is_empty()) {
        url.push_str(&format!("&token={}", urlencoding::encode(tk)));
    }
    url
}

pub fn get_symbol_logo_config(symbol: &str, asset_type: &str) -> SymbolLogoConfig {
    get_symbol_logo_config_with_base(symbol, asset_type, "https://img.logo.dev", None)
}

pub fn get_symbol_logo_config_with_base(
    symbol: &str,
    asset_type: &str,
    img_base_url: &str,
    token: Option<&str>,
) -> SymbolLogoConfig {
    if symbol.is_empty() {
        return SymbolLogoConfig {
            primary_url: None,
            secondary_url: None,
            is_mutual_fund: false,
            monogram: "?".to_string(),
            brand_color: "#6366f1".to_string(),
        };
    }

    let resolved_type = get_asset_type(
        if asset_type.is_empty() {
            None
        } else {
            Some(asset_type)
        },
        Some(symbol),
    );
    let clean_ticker = clean_ticker_for_url(symbol);
    let brand_color = get_symbol_color(symbol);
    let monogram = get_symbol_monogram(symbol);

    if resolved_type == "mutual-fund" || resolved_type == "provident-fund" {
        return SymbolLogoConfig {
            primary_url: None,
            secondary_url: None,
            is_mutual_fund: true,
            monogram,
            brand_color,
        };
    }

    if resolved_type == "crypto" {
        let sym_lower = clean_ticker.to_lowercase();
        return SymbolLogoConfig {
            primary_url: Some(build_logo_dev_url(
                img_base_url,
                &format!("crypto/{sym_lower}"),
                token,
            )),
            secondary_url: None,
            is_mutual_fund: false,
            monogram,
            brand_color,
        };
    }

    if resolved_type == "thai-stock" {
        let clean_upper = clean_ticker.to_uppercase();
        return SymbolLogoConfig {
            primary_url: Some(build_logo_dev_url(
                img_base_url,
                &format!("ticker/{clean_upper}.BK"),
                token,
            )),
            secondary_url: Some(build_logo_dev_url(
                img_base_url,
                &format!("ticker/{clean_upper}"),
                token,
            )),
            is_mutual_fund: false,
            monogram,
            brand_color,
        };
    }

    let clean_upper = clean_ticker.to_uppercase();
    SymbolLogoConfig {
        primary_url: Some(build_logo_dev_url(
            img_base_url,
            &format!("ticker/{clean_upper}"),
            token,
        )),
        secondary_url: None,
        is_mutual_fund: false,
        monogram,
        brand_color,
    }
}

pub fn generate_symbol_svg(symbol: &str, asset_type: &str) -> Vec<u8> {
    let brand_color = get_symbol_color(symbol);
    let resolved_type = get_asset_type(
        if asset_type.is_empty() {
            None
        } else {
            Some(asset_type)
        },
        Some(symbol),
    );
    let monogram = get_symbol_monogram(symbol);

    let svg = if resolved_type == "mutual-fund" || resolved_type == "provident-fund" {
        format!(
            "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 64 64\" width=\"64\" height=\"64\">\n\
  <rect width=\"64\" height=\"64\" rx=\"14\" fill=\"{brand_color}\" fill-opacity=\"0.12\" stroke=\"{brand_color}\" stroke-opacity=\"0.25\" stroke-width=\"2\"/>\n\
  <g transform=\"translate(14, 14) scale(1.5)\" fill=\"none\" stroke=\"{brand_color}\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\">\n\
    <path d=\"M3 21h18\" />\n\
    <path d=\"M3 10h18\" />\n\
    <path d=\"M5 6l7-3 7 3\" />\n\
    <path d=\"M4 10v11\" />\n\
    <path d=\"M20 10v11\" />\n\
    <path d=\"M8 14v4\" />\n\
    <path d=\"M12 14v4\" />\n\
    <path d=\"M16 14v4\" />\n\
  </g>\n\
</svg>"
        )
    } else {
        let font_size = if monogram.chars().count() <= 2 {
            28
        } else {
            20
        };
        format!(
            "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 64 64\" width=\"64\" height=\"64\">\n\
  <rect width=\"64\" height=\"64\" rx=\"14\" fill=\"{brand_color}\" fill-opacity=\"0.12\" stroke=\"{brand_color}\" stroke-opacity=\"0.25\" stroke-width=\"2\"/>\n\
  <text x=\"50%\" y=\"54%\" dominant-baseline=\"middle\" text-anchor=\"middle\" fill=\"{brand_color}\" font-family=\"-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif\" font-size=\"{font_size}\" font-weight=\"700\">{monogram}</text>\n\
</svg>"
        )
    };
    svg.into_bytes()
}

pub fn generate_amc_svg(amc_code: &str, brand_color: &str) -> Vec<u8> {
    let trimmed = amc_code.trim().to_uppercase();
    let label: String = if trimmed.is_empty() {
        "?".to_string()
    } else {
        trimmed.chars().take(6).collect()
    };
    let label_len = label.chars().count();
    let font_size = if label_len <= 2 {
        24
    } else if label_len <= 3 {
        20
    } else if label_len <= 5 {
        14
    } else {
        12
    };
    let color = if brand_color.is_empty() {
        "#6366f1"
    } else {
        brand_color
    };
    let svg = format!(
        "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 64 64\" width=\"64\" height=\"64\">\n\
  <rect width=\"64\" height=\"64\" rx=\"14\" fill=\"{color}\" fill-opacity=\"0.14\" stroke=\"{color}\" stroke-opacity=\"0.32\" stroke-width=\"2\"/>\n\
  <text x=\"50%\" y=\"54%\" dominant-baseline=\"middle\" text-anchor=\"middle\" fill=\"{color}\" font-family=\"-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif\" font-size=\"{font_size}\" font-weight=\"700\" letter-spacing=\"-0.4\">{label}</text>\n\
</svg>"
    );
    svg.into_bytes()
}

pub fn extract_domain_candidates(raw_url: Option<&str>) -> Vec<String> {
    let value = raw_url.unwrap_or("").trim();
    if value.is_empty() {
        return Vec::new();
    }
    let normalized = if value.starts_with("http://") || value.starts_with("https://") {
        value.to_string()
    } else {
        format!("https://{value}")
    };
    let parsed = match Url::parse(&normalized) {
        Ok(u) => u,
        Err(_) => return Vec::new(),
    };
    let host = parsed
        .host_str()
        .unwrap_or("")
        .trim()
        .to_lowercase()
        .trim_end_matches('.')
        .to_string();
    if host.is_empty() || !host.contains('.') {
        return Vec::new();
    }

    let mut candidates = vec![host.clone()];
    let labels: Vec<&str> = host.split('.').collect();
    let min_labels = if MULTILABEL_SUFFIXES.iter().any(|s| host.ends_with(s)) {
        3
    } else {
        2
    };
    if labels.len() > min_labels {
        let apex = labels[labels.len() - min_labels..].join(".");
        if !candidates.contains(&apex) {
            candidates.push(apex);
        }
    }
    candidates
}

pub fn extract_brand_tokens(company_name: Option<&str>) -> Vec<String> {
    static PAREN_RE: OnceLock<Regex> = OnceLock::new();
    static WORD_RE: OnceLock<Regex> = OnceLock::new();

    let paren_re = PAREN_RE.get_or_init(|| Regex::new(r"\([^)]*\)").expect("valid regex"));
    let word_re = WORD_RE.get_or_init(|| Regex::new(r"[A-Z0-9]+").expect("valid regex"));

    let upper = company_name.unwrap_or("").to_uppercase();
    let raw = paren_re.replace_all(&upper, " ");
    let words: Vec<String> = word_re
        .find_iter(&raw)
        .map(|m| m.as_str().to_string())
        .collect();
    let stopwords = corporate_stopwords();
    let brand: Vec<String> = words
        .iter()
        .filter(|w| !stopwords.contains(w.as_str()) && w.len() >= 2)
        .cloned()
        .collect();
    if brand.is_empty() {
        words
    } else {
        brand
    }
}

pub fn derive_amc_code(amc_name: Option<&str>, abbr_name: Option<&str>) -> String {
    static NON_ALNUM_RE: OnceLock<Regex> = OnceLock::new();
    let re = NON_ALNUM_RE.get_or_init(|| Regex::new(r"[^A-Z0-9]").expect("valid regex"));
    let abbr_upper = abbr_name.unwrap_or("").to_uppercase();
    let abbr_clean = re.replace_all(&abbr_upper, "").to_string();
    if !abbr_clean.is_empty() {
        return abbr_clean.chars().take(6).collect();
    }

    let tokens = extract_brand_tokens(amc_name);
    if tokens.is_empty() {
        return "AMC".to_string();
    }
    if tokens.len() == 1 {
        return tokens[0].chars().take(6).collect();
    }
    let joined_len: usize = tokens.iter().map(|t| t.len()).sum();
    if tokens[0].len() <= 5 && joined_len > 6 {
        return tokens[0].clone();
    }
    let initials: String = tokens
        .iter()
        .take(6)
        .filter_map(|t| t.chars().next())
        .collect();
    if initials.len() >= 2 {
        initials
    } else {
        tokens[0].chars().take(5).collect()
    }
}
