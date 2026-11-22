use std::sync::Arc;

use axum::body::Bytes;
use axum::extract::{Query, State};
use axum::response::Response;
use axum::routing::{get, post};
use axum::Router;
use serde::Deserialize;

use crate::error::{upstream_json_response, AppError};
use crate::features::portfolio::models::allocation::TargetAllocationRequest;
use crate::state::AppState;
use crate::utils::auth::ApiKeyAuth;
use crate::utils::supabase_auth::RequirePortfolioAuthorizedUser;

#[derive(Deserialize)]
struct HoldingsQuery {
    #[serde(default = "default_all")]
    tab_id: String,
    #[serde(default = "default_thb")]
    currency: String,
}

#[derive(Deserialize)]
struct PerformanceQuery {
    #[serde(default = "default_timeframe")]
    timeframe: String,
    #[serde(default)]
    start_date: Option<String>,
    #[serde(default)]
    end_date: Option<String>,
    #[serde(default = "default_thb")]
    currency: String,
}

#[derive(Deserialize)]
struct AllocationQuery {
    #[serde(default = "default_thb")]
    currency: String,
}

#[derive(Deserialize)]
struct DividendQuery {
    #[serde(default = "default_thb")]
    currency: String,
    #[serde(default = "default_all")]
    tab_id: String,
}

fn default_all() -> String {
    "all".to_string()
}

fn default_thb() -> String {
    "THB".to_string()
}

fn default_timeframe() -> String {
    "ALL".to_string()
}

pub fn router() -> Router<Arc<AppState>> {
    Router::new()
        .route("/portfolio/holdings", get(get_portfolio_holdings))
        .route("/portfolio/performance", get(get_portfolio_performance))
        .route("/portfolio/allocation", post(get_portfolio_allocation))
        .route("/portfolio/dividend", get(get_portfolio_dividend))
}

async fn get_portfolio_holdings(
    _api_key: ApiKeyAuth,
    _user: RequirePortfolioAuthorizedUser,
    State(state): State<Arc<AppState>>,
    Query(q): Query<HoldingsQuery>,
) -> Response {
    let res = state
        .portfolio
        .valuation_service
        .get_portfolio_holdings(&q.tab_id, &q.currency)
        .await;
    upstream_json_response(&res, res.error.as_deref())
}

async fn get_portfolio_performance(
    _api_key: ApiKeyAuth,
    _user: RequirePortfolioAuthorizedUser,
    State(state): State<Arc<AppState>>,
    Query(q): Query<PerformanceQuery>,
) -> Response {
    let res = state
        .portfolio
        .performance_service
        .get_performance_analytics(
            &q.timeframe,
            q.start_date.as_deref(),
            q.end_date.as_deref(),
            &q.currency,
        )
        .await;
    upstream_json_response(&res, res.error.as_deref())
}

async fn get_portfolio_allocation(
    _api_key: ApiKeyAuth,
    _user: RequirePortfolioAuthorizedUser,
    State(state): State<Arc<AppState>>,
    Query(q): Query<AllocationQuery>,
    body: Bytes,
) -> Result<Response, AppError> {
    let req: Option<TargetAllocationRequest> = if body.iter().all(|b| b.is_ascii_whitespace()) {
        None
    } else {
        Some(
            serde_json::from_slice::<TargetAllocationRequest>(&body)
                .map_err(|e| AppError::unprocessable(e.to_string()))?,
        )
    };
    let targets = req.as_ref().map(|r| &r.target_allocation);
    let res = state
        .portfolio
        .allocation_service
        .calculate_allocation(targets, &q.currency)
        .await;
    Ok(upstream_json_response(&res, res.error.as_deref()))
}

async fn get_portfolio_dividend(
    _api_key: ApiKeyAuth,
    _user: RequirePortfolioAuthorizedUser,
    State(state): State<Arc<AppState>>,
    Query(q): Query<DividendQuery>,
) -> Response {
    let res = state
        .portfolio
        .dividend_service
        .get_dividend_analytics(&q.currency, &q.tab_id)
        .await;
    upstream_json_response(&res, res.error.as_deref())
}
