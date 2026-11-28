use std::sync::Arc;

use sgsk_application::ports::{
    FundNavPort, IdentityProfilePort, MarketPricePort, TransactionSheetPort,
};

#[derive(Debug, Clone)]
pub struct ApiConfig {
    pub backend_api_key: String,
    pub backend_api_key_previous: String,
    pub is_development: bool,
}

impl Default for ApiConfig {
    fn default() -> Self {
        let env_mode = std::env::var("ENVIRONMENT")
            .or_else(|_| std::env::var("APP_ENV"))
            .unwrap_or_else(|_| "development".to_string());
        Self {
            backend_api_key: std::env::var("BACKEND_API_KEY").unwrap_or_default(),
            backend_api_key_previous: std::env::var("BACKEND_API_KEY_PREVIOUS").unwrap_or_default(),
            is_development: env_mode.eq_ignore_ascii_case("development")
                || env_mode.eq_ignore_ascii_case("dev"),
        }
    }
}

#[derive(Clone)]
pub struct ApiState {
    pub config: ApiConfig,
    pub sheets: Arc<dyn TransactionSheetPort>,
    pub prices: Arc<dyn MarketPricePort>,
    pub navs: Arc<dyn FundNavPort>,
    pub identity: Arc<dyn IdentityProfilePort>,
}
