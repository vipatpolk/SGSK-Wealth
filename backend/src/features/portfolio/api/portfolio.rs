use std::sync::Arc;

use axum::body::Bytes;
use axum::extract::{Query, State};
use axum::routing::{get, post};
use axum::{Json, Router};
use serde::Deserialize;

use crate::error::AppError;
use crate::features::dividends::models::dividend::PortfolioDividendResponse;
use crate::features::portfolio::models::allocation::{
    PortfolioAllocationResponse, TargetAllocationRequest,
};
use crate::features::portfolio::models::performance::PortfolioPerformanceResponse;
use crate::features::portfolio::models::portfolio::PortfolioHoldingsResponse;
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
) -> Json<PortfolioHoldingsResponse> {
    Json(
        state
            .valuation_service
            .get_portfolio_holdings(&q.tab_id, &q.currency)
            .await,
    )
}

async fn get_portfolio_performance(
    _api_key: ApiKeyAuth,
    _user: RequirePortfolioAuthorizedUser,
    State(state): State<Arc<AppState>>,
    Query(q): Query<PerformanceQuery>,
) -> Json<PortfolioPerformanceResponse> {
    Json(
        state
            .performance_service
            .get_performance_analytics(
                &q.timeframe,
                q.start_date.as_deref(),
                q.end_date.as_deref(),
                &q.currency,
            )
            .await,
    )
}

async fn get_portfolio_allocation(
    _api_key: ApiKeyAuth,
    _user: RequirePortfolioAuthorizedUser,
    State(state): State<Arc<AppState>>,
    Query(q): Query<AllocationQuery>,
    body: Bytes,
) -> Result<Json<PortfolioAllocationResponse>, AppError> {
    let req: Option<TargetAllocationRequest> = if body.iter().all(|b| b.is_ascii_whitespace()) {
        None
    } else {
        Some(
            serde_json::from_slice::<TargetAllocationRequest>(&body)
                .map_err(|e| AppError::unprocessable(e.to_string()))?,
        )
    };
    let targets = req.as_ref().map(|r| &r.target_allocation);
    Ok(Json(
        state
            .allocation_service
            .calculate_allocation(targets, &q.currency)
            .await,
    ))
}

async fn get_portfolio_dividend(
    _api_key: ApiKeyAuth,
    _user: RequirePortfolioAuthorizedUser,
    State(state): State<Arc<AppState>>,
    Query(q): Query<DividendQuery>,
) -> Json<PortfolioDividendResponse> {
    Json(
        state
            .dividend_service
            .get_dividend_analytics(&q.currency, &q.tab_id)
            .await,
    )
}
