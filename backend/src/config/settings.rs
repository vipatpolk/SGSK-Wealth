use std::collections::HashSet;
use std::env;
use std::path::PathBuf;
use std::sync::OnceLock;

use sha2::{Digest, Sha256};

const BLOCKED_KEY_HASHES: &[&str] = &[
    // SHA-256 hashes of retired / compromised keys
    "497ffb45f54901336b84e6d9a3ef1d6b063c94db66e790adcec6c2811518da3d",
    "83bfda08b5ebeb7128efa25b8739774ba251e1e3bba12e3344030544c5205f9e",
    "def635122f7fe058c3ceeb6e67dfa728e5818e1889204bc91dcccc3fae597897",
];

const INSECURE_NAMED_KEYS: &[&str] = &[
    "dev_secret_key_change_in_prod",
    "your_sec_subscription_key_here",
    "changeme",
];

pub const NATIVE_MOBILE_ORIGINS: &[&str] = &[
    "http://localhost",
    "https://localhost",
    "capacitor://localhost",
];

pub const DEFAULT_SEC_PVD_BASE_URL: &str = "https://api.sec.or.th/v1/pvd";
pub const DEFAULT_SEC_MF_BASE_URL: &str = "https://api.sec.or.th/v2/fund";
pub const DEFAULT_SHEETS_BASE_URL: &str = "https://docs.google.com/spreadsheets/d";
pub const DEFAULT_BINANCE_BASE_URL: &str = "https://api.binance.th";
pub const DEFAULT_SET_TH_URL: &str =
    "https://weblink.set.or.th/dat/eod/listedcompany/static/listedCompanies_th_TH.xls";
pub const DEFAULT_SET_EN_URL: &str =
    "https://weblink.set.or.th/dat/eod/listedcompany/static/listedCompanies_en_US.xls";
pub const DEFAULT_YAHOO_BASE_URL: &str = "https://query1.finance.yahoo.com";
pub const DEFAULT_YAHOO_FALLBACK_BASE_URL: &str = "https://query2.finance.yahoo.com";
pub const DEFAULT_GOOGLE_OAUTH_TOKEN_URL: &str = "https://oauth2.googleapis.com/token";
pub const DEFAULT_LOGO_DEV_IMG_BASE_URL: &str = "https://img.logo.dev";
pub const DEFAULT_LOGO_DEV_API_BASE_URL: &str = "https://api.logo.dev";

#[derive(Debug, Clone)]
pub struct Settings {
    pub environment: String,
    pub backend_api_key: String,
    pub backend_api_key_previous: String,
    pub allowed_origins: Vec<String>,
    pub blocked_direct_hosts: Vec<String>,
    pub sec_subscription_key: String,
    pub google_spreadsheet_id: String,
    pub google_pvd_spreadsheet_id: String,
    pub google_service_account_json: String,
    pub google_oauth_token_url: String,
    pub sec_pvd_base_url: String,
    pub sec_mf_base_url: String,
    pub sheets_base_url: String,
    pub binance_base_url: String,
    pub set_th_url: String,
    pub set_en_url: String,
    pub yahoo_base_url: String,
    pub yahoo_fallback_base_url: String,
    pub yfinance_timeout_seconds: f64,
    pub yfinance_retries: i32,
    pub yfinance_max_concurrency: usize,
    pub yfinance_dividend_period: String,
    pub yfinance_cache_dir: String,
    pub supabase_url: String,
    pub supabase_publishable_key: String,
    pub supabase_service_role_key: String,
    pub supabase_jwks_url: String,
    pub supabase_jwt_audience: String,
    pub supabase_jwt_secret: String,
    pub authorized_portfolio_emails: Vec<String>,
    pub logo_dev_publishable_key: String,
    pub logo_dev_secret_key: String,
    pub logo_dev_img_base_url: String,
    pub logo_dev_api_base_url: String,
}

impl Default for Settings {
    fn default() -> Self {
        Self {
            environment: "development".to_string(),
            backend_api_key: "dev_secret_key_change_in_prod".to_string(),
            backend_api_key_previous: String::new(),
            allowed_origins: vec![
                "http://localhost:4200".to_string(),
                "http://localhost:4201".to_string(),
                "http://localhost".to_string(),
                "https://localhost".to_string(),
                "capacitor://localhost".to_string(),
                "https://sgsk-wealth.vercel.app".to_string(),
            ],
            blocked_direct_hosts: vec![
                "api-sgsk-wealth.vercel.app".to_string(),
                "sgsk-backend.vercel.app".to_string(),
            ],
            sec_subscription_key: String::new(),
            google_spreadsheet_id: "sample_spreadsheet_id".to_string(),
            google_pvd_spreadsheet_id: "sample_pvd_spreadsheet_id".to_string(),
            google_service_account_json: String::new(),
            google_oauth_token_url: DEFAULT_GOOGLE_OAUTH_TOKEN_URL.to_string(),
            sec_pvd_base_url: DEFAULT_SEC_PVD_BASE_URL.to_string(),
            sec_mf_base_url: DEFAULT_SEC_MF_BASE_URL.to_string(),
            sheets_base_url: DEFAULT_SHEETS_BASE_URL.to_string(),
            binance_base_url: DEFAULT_BINANCE_BASE_URL.to_string(),
            set_th_url: DEFAULT_SET_TH_URL.to_string(),
            set_en_url: DEFAULT_SET_EN_URL.to_string(),
            yahoo_base_url: DEFAULT_YAHOO_BASE_URL.to_string(),
            yahoo_fallback_base_url: DEFAULT_YAHOO_FALLBACK_BASE_URL.to_string(),
            yfinance_timeout_seconds: 10.0,
            yfinance_retries: 1,
            yfinance_max_concurrency: 8,
            yfinance_dividend_period: "max".to_string(),
            yfinance_cache_dir: String::new(),
            supabase_url: String::new(),
            supabase_publishable_key: String::new(),
            supabase_service_role_key: String::new(),
            supabase_jwks_url: String::new(),
            supabase_jwt_audience: "authenticated".to_string(),
            supabase_jwt_secret: String::new(),
            authorized_portfolio_emails: vec!["vipatpolk@gmail.com".to_string()],
            logo_dev_publishable_key: String::new(),
            logo_dev_secret_key: String::new(),
            logo_dev_img_base_url: DEFAULT_LOGO_DEV_IMG_BASE_URL.to_string(),
            logo_dev_api_base_url: DEFAULT_LOGO_DEV_API_BASE_URL.to_string(),
        }
    }
}

impl Settings {
    pub fn from_env() -> Result<Self, String> {
        load_dotenv_files();
        let defaults = Self::default();

        let environment = env_var("ENVIRONMENT").unwrap_or(defaults.environment);
        let backend_api_key = env_var("BACKEND_API_KEY").unwrap_or(defaults.backend_api_key);
        let backend_api_key_previous =
            env_var("BACKEND_API_KEY_PREVIOUS").unwrap_or(defaults.backend_api_key_previous);
        let allowed_origins = env_var("ALLOWED_ORIGINS")
            .map(|v| parse_list_env(&v))
            .unwrap_or(defaults.allowed_origins);
        let blocked_direct_hosts = env_var("BLOCKED_DIRECT_HOSTS")
            .map(|v| parse_list_env(&v))
            .unwrap_or(defaults.blocked_direct_hosts);
        let sec_subscription_key =
            env_var("SEC_SUBSCRIPTION_KEY").unwrap_or(defaults.sec_subscription_key);
        let google_spreadsheet_id =
            env_var("GOOGLE_SPREADSHEET_ID").unwrap_or(defaults.google_spreadsheet_id);
        let google_pvd_spreadsheet_id =
            env_var("GOOGLE_PVD_SPREADSHEET_ID").unwrap_or(defaults.google_pvd_spreadsheet_id);
        let google_service_account_json =
            env_var("GOOGLE_SERVICE_ACCOUNT_JSON").unwrap_or(defaults.google_service_account_json);
        let google_oauth_token_url =
            env_var("GOOGLE_OAUTH_TOKEN_URL").unwrap_or(defaults.google_oauth_token_url);
        let sec_pvd_base_url = env_var("SEC_PVD_BASE_URL").unwrap_or(defaults.sec_pvd_base_url);
        let sec_mf_base_url = env_var("SEC_MF_BASE_URL").unwrap_or(defaults.sec_mf_base_url);
        let sheets_base_url = env_var("SHEETS_BASE_URL").unwrap_or(defaults.sheets_base_url);
        let binance_base_url = env_var("BINANCE_BASE_URL").unwrap_or(defaults.binance_base_url);
        let set_th_url = env_var("SET_TH_URL").unwrap_or(defaults.set_th_url);
        let set_en_url = env_var("SET_EN_URL").unwrap_or(defaults.set_en_url);
        let yahoo_base_url = env_var("YAHOO_BASE_URL").unwrap_or(defaults.yahoo_base_url);
        let yahoo_fallback_base_url =
            env_var("YAHOO_FALLBACK_BASE_URL").unwrap_or(defaults.yahoo_fallback_base_url);

        let yfinance_timeout_seconds = env_var("YFINANCE_TIMEOUT_SECONDS")
            .and_then(|v| v.parse::<f64>().ok())
            .unwrap_or(defaults.yfinance_timeout_seconds);
        let yfinance_retries = env_var("YFINANCE_RETRIES")
            .and_then(|v| v.parse::<i32>().ok())
            .unwrap_or(defaults.yfinance_retries);
        let yfinance_max_concurrency = env_var("YFINANCE_MAX_CONCURRENCY")
            .and_then(|v| v.parse::<usize>().ok())
            .unwrap_or(defaults.yfinance_max_concurrency);
        let yfinance_dividend_period =
            env_var("YFINANCE_DIVIDEND_PERIOD").unwrap_or(defaults.yfinance_dividend_period);
        let yfinance_cache_dir =
            env_var("YFINANCE_CACHE_DIR").unwrap_or(defaults.yfinance_cache_dir);
        let supabase_url = env_var("SUPABASE_URL").unwrap_or(defaults.supabase_url);
        let supabase_publishable_key =
            env_var("SUPABASE_PUBLISHABLE_KEY").unwrap_or(defaults.supabase_publishable_key);
        let supabase_service_role_key = env_var("SUPABASE_SERVICE_ROLE_KEY")
            .or_else(|| env_var("SUPABASE_SECRET_KEY"))
            .unwrap_or(defaults.supabase_service_role_key);
        let supabase_jwks_url = env_var("SUPABASE_JWKS_URL").unwrap_or(defaults.supabase_jwks_url);
        let supabase_jwt_audience =
            env_var("SUPABASE_JWT_AUDIENCE").unwrap_or(defaults.supabase_jwt_audience);
        let supabase_jwt_secret =
            env_var("SUPABASE_JWT_SECRET").unwrap_or(defaults.supabase_jwt_secret);
        let authorized_portfolio_emails = env_var("AUTHORIZED_PORTFOLIO_EMAILS")
            .map(|v| parse_list_env(&v))
            .unwrap_or(defaults.authorized_portfolio_emails);
        let logo_dev_publishable_key = env_var("LOGO_DEV_PUBLISHABLE_KEY")
            .or_else(|| env_var("LOGO_DEV_TOKEN"))
            .unwrap_or(defaults.logo_dev_publishable_key);
        let logo_dev_secret_key =
            env_var("LOGO_DEV_SECRET_KEY").unwrap_or(defaults.logo_dev_secret_key);
        let logo_dev_img_base_url =
            env_var("LOGO_DEV_IMG_BASE_URL").unwrap_or(defaults.logo_dev_img_base_url);
        let logo_dev_api_base_url =
            env_var("LOGO_DEV_API_BASE_URL").unwrap_or(defaults.logo_dev_api_base_url);

        let settings = Self {
            environment,
            backend_api_key,
            backend_api_key_previous,
            allowed_origins,
            blocked_direct_hosts,
            sec_subscription_key,
            google_spreadsheet_id,
            google_pvd_spreadsheet_id,
            google_service_account_json,
            google_oauth_token_url,
            sec_pvd_base_url,
            sec_mf_base_url,
            sheets_base_url,
            binance_base_url,
            set_th_url,
            set_en_url,
            yahoo_base_url,
            yahoo_fallback_base_url,
            yfinance_timeout_seconds,
            yfinance_retries,
            yfinance_max_concurrency,
            yfinance_dividend_period,
            yfinance_cache_dir,
            supabase_url,
            supabase_publishable_key,
            supabase_service_role_key,
            supabase_jwks_url,
            supabase_jwt_audience,
            supabase_jwt_secret,
            authorized_portfolio_emails,
            logo_dev_publishable_key,
            logo_dev_secret_key,
            logo_dev_img_base_url,
            logo_dev_api_base_url,
        };
        settings.validate_production_security()?;
        Ok(settings)
    }

    pub fn validate_production_security(&self) -> Result<(), String> {
        if self.environment.eq_ignore_ascii_case("production") {
            let key_hash = sha256_hex(&self.backend_api_key);
            if self.backend_api_key.is_empty()
                || INSECURE_NAMED_KEYS.contains(&self.backend_api_key.as_str())
                || BLOCKED_KEY_HASHES.contains(&key_hash.as_str())
            {
                return Err(
                    "CRITICAL: BACKEND_API_KEY must be securely configured via environment variables in production."
                        .to_string(),
                );
            }
            if self.backend_api_key.len() < 32 {
                return Err(
                    "CRITICAL: BACKEND_API_KEY must be at least 32 characters in production."
                        .to_string(),
                );
            }
            if !self.backend_api_key_previous.is_empty() {
                let prev_hash = sha256_hex(&self.backend_api_key_previous);
                if INSECURE_NAMED_KEYS.contains(&self.backend_api_key_previous.as_str())
                    || BLOCKED_KEY_HASHES.contains(&prev_hash.as_str())
                    || self.backend_api_key_previous.len() < 32
                {
                    return Err(
                        "CRITICAL: BACKEND_API_KEY_PREVIOUS must be a valid secure key during rotation."
                            .to_string(),
                    );
                }
            }
            if self.google_spreadsheet_id.is_empty()
                || self.google_spreadsheet_id == "sample_spreadsheet_id"
            {
                return Err(
                    "CRITICAL: GOOGLE_SPREADSHEET_ID must be securely configured via environment variables in production."
                        .to_string(),
                );
            }
            if self.supabase_url.trim().is_empty() {
                return Err("CRITICAL: SUPABASE_URL must be configured in production.".to_string());
            }
            if !self
                .authorized_portfolio_emails
                .iter()
                .any(|email| !email.trim().is_empty())
            {
                return Err(
                    "CRITICAL: AUTHORIZED_PORTFOLIO_EMAILS must contain at least one authorized email in production."
                        .to_string(),
                );
            }
        }
        Ok(())
    }

    pub fn resolved_allowed_origins(&self) -> Vec<String> {
        let mut merged = Vec::new();
        let mut seen = HashSet::new();

        for origin in self
            .allowed_origins
            .iter()
            .map(|s| s.as_str())
            .chain(NATIVE_MOBILE_ORIGINS.iter().copied())
        {
            let cleaned = origin.trim().trim_end_matches('/').to_string();
            if !cleaned.is_empty() && seen.insert(cleaned.clone()) {
                merged.push(cleaned);
            }
        }
        merged
    }

    pub fn resolved_supabase_jwks_url(&self) -> String {
        let explicit = self.supabase_jwks_url.trim();
        if !explicit.is_empty() {
            return explicit.to_string();
        }
        let base = self.supabase_url.trim().trim_end_matches('/');
        if !base.is_empty() {
            return format!("{base}/auth/v1/.well-known/jwks.json");
        }
        String::new()
    }

    pub fn resolved_supabase_issuer(&self) -> String {
        let base = self.supabase_url.trim().trim_end_matches('/');
        if base.is_empty() {
            return String::new();
        }
        format!("{base}/auth/v1")
    }

    pub fn is_production(&self) -> bool {
        self.environment.eq_ignore_ascii_case("production")
    }

    pub fn is_development(&self) -> bool {
        self.environment.eq_ignore_ascii_case("development")
    }
}

pub fn sha256_hex(input: &str) -> String {
    let mut hasher = Sha256::new();
    hasher.update(input.as_bytes());
    hex::encode(hasher.finalize())
}

fn env_var(key: &str) -> Option<String> {
    if let Ok(val) = env::var(key) {
        return Some(val);
    }
    let lower = key.to_ascii_lowercase();
    if let Ok(val) = env::var(&lower) {
        return Some(val);
    }
    for (k, v) in env::vars() {
        if k.eq_ignore_ascii_case(key) {
            return Some(v);
        }
    }
    None
}

fn parse_list_env(raw: &str) -> Vec<String> {
    let trimmed = raw.trim();
    if trimmed.is_empty() {
        return Vec::new();
    }
    if trimmed.starts_with('[') {
        if let Ok(parsed) = serde_json::from_str::<Vec<String>>(trimmed) {
            return parsed;
        }
    }
    trimmed
        .split(',')
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty())
        .collect()
}

pub fn load_dotenv_files() {
    static LOADED: OnceLock<()> = OnceLock::new();
    LOADED.get_or_init(|| {
        let candidates = candidate_env_paths();
        for path in candidates {
            if path.is_file() {
                let _ = dotenvy::from_path(&path);
            }
        }
    });
}

fn candidate_env_paths() -> Vec<PathBuf> {
    let mut paths = Vec::new();
    if let Ok(cwd) = env::current_dir() {
        paths.push(cwd.join(".env"));
        if let Some(parent) = cwd.parent() {
            paths.push(parent.join(".env"));
        }
    }
    let manifest_dir = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
    if let Some(root_dir) = manifest_dir.parent() {
        paths.push(root_dir.join(".env"));
    }
    paths.push(manifest_dir.join(".env"));
    paths
}
