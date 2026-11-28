pub mod auth;
pub mod error;
pub mod middleware;
pub mod routes;
pub mod state;

use std::sync::Arc;

use axum::middleware as axum_middleware;
use axum::routing::get;
use axum::{Json, Router};
use sgsk_application::{get_health_status, HealthStatus};
use sgsk_database::{SupabaseConfig, SupabaseProfileRepository};
use sgsk_integrations::market_data::{HttpFundNavAdapter, HttpMarketPriceAdapter};
use sgsk_integrations::sheets::{GoogleSheetsConfig, GoogleSheetsTransactionAdapter};

use crate::middleware::security_headers_middleware;
use crate::routes::api_routes;
use crate::state::{ApiConfig, ApiState};

/// Builds the Axum application with `/api/v1/*` and dual-mounted `/api/backend/*` routes.
pub fn create_app(state: Arc<ApiState>) -> Router {
    let routes = api_routes();
    Router::new()
        .route("/", get(root_health))
        .nest("/api/v1", routes.clone())
        .nest("/api/backend", routes)
        .with_state(state)
        .layer(axum_middleware::from_fn(security_headers_middleware))
}

/// Convenience builder using environment-configured adapters.
pub fn create_router() -> Router {
    let state = Arc::new(ApiState {
        config: ApiConfig::default(),
        sheets: Arc::new(GoogleSheetsTransactionAdapter::new(GoogleSheetsConfig {
            base_url: std::env::var("SHEETS_BASE_URL")
                .unwrap_or_else(|_| "https://docs.google.com/spreadsheets/d".to_string()),
            spreadsheet_id: std::env::var("GOOGLE_SPREADSHEET_ID").unwrap_or_default(),
            pvd_spreadsheet_id: std::env::var("GOOGLE_PVD_SPREADSHEET_ID").unwrap_or_default(),
        })),
        prices: Arc::new(HttpMarketPriceAdapter::new(
            std::env::var("FX_ENDPOINT_URL").unwrap_or_default(),
        )),
        navs: Arc::new(HttpFundNavAdapter::new(
            std::env::var("SEC_BASE_URL").unwrap_or_default(),
            std::env::var("SEC_API_KEY").unwrap_or_default(),
        )),
        identity: Arc::new(SupabaseProfileRepository::new(SupabaseConfig {
            base_url: std::env::var("SUPABASE_URL").unwrap_or_default(),
            publishable_key: std::env::var("SUPABASE_PUBLISHABLE_KEY").unwrap_or_default(),
        })),
    });
    create_app(state)
}

async fn root_health() -> Json<HealthStatus> {
    Json(get_health_status())
}
