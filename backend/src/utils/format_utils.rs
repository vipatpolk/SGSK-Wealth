use regex::Regex;
use std::sync::OnceLock;

pub fn normalize_asset_type(raw_type: &str) -> Option<&'static str> {
    if raw_type.is_empty() {
        return None;
    }
    let normalized = raw_type.trim().to_lowercase();
    if normalized == "provident-fund"
        || normalized.contains("pvd")
        || normalized.contains("provident")
    {
        return Some("provident-fund");
    }
    if normalized == "thai-stock" || normalized.contains("thai") || normalized == "th" {
        return Some("thai-stock");
    }
    if normalized == "us-stock"
        || normalized.contains("u.s")
        || normalized.contains("us stock")
        || normalized.contains("united states")
    {
        return Some("us-stock");
    }
    if normalized == "crypto" || normalized.contains("crypto") {
        return Some("crypto");
    }
    if normalized == "mutual-fund" || normalized.contains("fund") || normalized.contains("mutual") {
        return Some("mutual-fund");
    }
    if normalized == "bond" || normalized.contains("bond") {
        return Some("bond");
    }
    None
}

pub fn get_asset_type(asset_type: Option<&str>, symbol: Option<&str>) -> String {
    if let Some(at) = asset_type {
        if !at.is_empty() && !matches!(at, "closed-position" | "all" | "unknown") {
            if let Some(normalized) = normalize_asset_type(at) {
                return normalized.to_string();
            }
            return at.to_string();
        }
    }

    if let Some(sym_raw) = symbol {
        let sym = sym_raw.to_uppercase();
        if sym.starts_with("PVD") || sym.ends_with(".PVD") {
            return "provident-fund".to_string();
        }
        if sym.ends_with(".FUND") || sym.ends_with(".BKFUND") {
            return "mutual-fund".to_string();
        }
        if sym.ends_with(".BK") {
            return "thai-stock".to_string();
        }
        if sym.ends_with(".CRYPTO") {
            return "crypto".to_string();
        }
    }
    "us-stock".to_string()
}

pub fn to_yahoo_symbol(symbol: &str) -> String {
    let trimmed = symbol.trim();
    if trimmed.is_empty() {
        return String::new();
    }
    let upper = trimmed.to_uppercase();
    if upper.ends_with(".FUND") {
        return trimmed[..trimmed.len() - 5].to_string();
    }
    if upper.ends_with(".BKFUND") || upper.ends_with(".CRYPTO") {
        return trimmed[..trimmed.len() - 7].to_string();
    }
    if upper.ends_with(".BK") {
        return trimmed.to_string();
    }
    trimmed.replace(['.', '/'], "-")
}

pub fn resolve_quote_currency(quote: &str) -> String {
    if quote.is_empty() {
        return String::new();
    }
    let q = quote.to_uppercase();
    if q == "THB" {
        return "THB".to_string();
    }
    if q.contains("USD") || q == "DAI" {
        return "USD".to_string();
    }
    q
}

pub fn display_symbol(symbol: &str) -> String {
    static SUFFIX_RE: OnceLock<Regex> = OnceLock::new();
    let trimmed = symbol.trim();
    if trimmed.is_empty() {
        return String::new();
    }
    let re = SUFFIX_RE
        .get_or_init(|| Regex::new(r"(?i)\.(FUND|BKFUND|BK|CRYPTO)$").expect("valid suffix regex"));
    re.replace(trimmed, "").to_string()
}

pub fn convert_currency(amount: f64, from_curr: &str, to_curr: &str, exchange_rate: f64) -> f64 {
    let from_upper = from_curr.to_uppercase();
    let to_upper = to_curr.to_uppercase();
    let norm_from = if from_upper == "USDT" {
        "USD"
    } else {
        from_upper.as_str()
    };
    let norm_to = if to_upper == "USDT" {
        "USD"
    } else {
        to_upper.as_str()
    };

    if norm_from == norm_to || exchange_rate <= 0.0 {
        return amount;
    }

    if norm_from == "USD" && norm_to == "THB" {
        return amount * exchange_rate;
    }
    if norm_from == "THB" && norm_to == "USD" {
        return amount / exchange_rate;
    }

    amount
}

pub fn asset_type_label_from_str(asset_type: &str) -> String {
    match asset_type {
        "us-stock" => "U.S. Stock".to_string(),
        "thai-stock" => "Thai Stock".to_string(),
        "crypto" => "Cryptocurrency".to_string(),
        "mutual-fund" => "Mutual Fund".to_string(),
        "bond" => "Bond".to_string(),
        "provident-fund" => "Provident Fund".to_string(),
        other => title_case_dash(other),
    }
}

pub fn get_asset_type_label(asset_type: Option<&str>, symbol: Option<&str>) -> String {
    let resolved = get_asset_type(asset_type, symbol);
    asset_type_label_from_str(&resolved)
}

pub fn title_case_dash(input: &str) -> String {
    input
        .replace('-', " ")
        .split_whitespace()
        .map(|word| {
            let mut chars = word.chars();
            match chars.next() {
                Some(first) => {
                    format!("{}{}", first.to_uppercase(), chars.as_str().to_lowercase())
                }
                None => String::new(),
            }
        })
        .collect::<Vec<_>>()
        .join(" ")
}

/// Rounds a floating-point number to `digits` decimal places, using Python-like rounding
/// with tolerance for tiny binary representation drift.
pub fn round_digits(value: f64, digits: i32) -> f64 {
    if !value.is_finite() {
        return 0.0;
    }
    let factor = 10f64.powi(digits);
    let scaled = value * factor;
    let floored = scaled.floor();
    let frac = scaled - floored;
    let rounded = if (frac - 0.5).abs() < 1e-12 {
        // Round half to even to match Python's `round()`
        if (floored as i64) % 2 == 0 {
            floored
        } else {
            floored + 1.0
        }
    } else {
        scaled.round()
    };
    let result = rounded / factor;
    if result == -0.0 {
        0.0
    } else {
        result
    }
}
