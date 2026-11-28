use std::collections::HashMap;
use std::sync::Arc;

use axum::extract::{Path, Query, State};
use axum::routing::{get, post};
use axum::{Json, Router};
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use sgsk_application::{
    compute_allocation, compute_fifo_from_csv, compute_fifo_from_tabs, get_health_status,
    run_order_simulation, run_target_cost_solver, HealthStatus,
};
use sgsk_domain::allocation::{PortfolioAllocation, PositionValueInput};
use sgsk_domain::tools::{
    OrderSimulationResult, OrderStep, PositionSnapshot, TargetCostInput, TargetCostResult,
};
use sgsk_domain::transaction::FifoResult;
use sgsk_domain::AssetTabId;

use crate::auth::{ApiKeyAuth, OptionalCurrentUser, RequirePortfolioAuthorizedUser};
use crate::error::ApiError;
use crate::state::ApiState;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AuthMeResponse {
    pub authenticated: bool,
    pub user_id: Option<String>,
    pub role: String,
    pub can_view_cloud_portfolio: bool,
    pub portfolio_source: &'static str,
}

#[derive(Deserialize)]
pub struct ExchangeRateQuery {
    #[serde(default = "default_usd")]
    pub from_currency: String,
    #[serde(default = "default_thb")]
    pub to_currency: String,
}

#[derive(Serialize)]
pub struct ExchangeRateResponse {
    #[serde(with = "rust_decimal::serde::str")]
    pub rate: Decimal,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AllocationRequest {
    #[serde(default)]
    pub positions: Vec<PositionValueInput>,
    #[serde(default)]
    pub target_allocation: Option<HashMap<String, Decimal>>,
    #[serde(default = "default_thb")]
    pub currency: String,
    #[serde(default = "default_fx")]
    pub exchange_rate: Decimal,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SimulateRequest {
    pub initial_position: PositionSnapshot,
    pub steps: Vec<OrderStep>,
    #[serde(default)]
    pub tax_fee_percent: Decimal,
}

fn default_usd() -> String {
    "USD".to_string()
}

fn default_thb() -> String {
    "THB".to_string()
}

fn default_fx() -> Decimal {
    Decimal::from(35)
}

fn parse_tab_id(raw: &str) -> Result<AssetTabId, ApiError> {
    match raw.trim() {
        "all" => Ok(AssetTabId::All),
        "us-stock" => Ok(AssetTabId::UsStock),
        "thai-stock" => Ok(AssetTabId::ThaiStock),
        "crypto" => Ok(AssetTabId::Crypto),
        "mutual-fund" => Ok(AssetTabId::MutualFund),
        "bond" => Ok(AssetTabId::Bond),
        "provident-fund" => Ok(AssetTabId::ProvidentFund),
        "closed-position" => Ok(AssetTabId::ClosedPosition),
        other => Err(ApiError::unprocessable(format!("Invalid tab id: {other}"))),
    }
}

fn tab_id_slug(tab: AssetTabId) -> &'static str {
    match tab {
        AssetTabId::All => "all",
        AssetTabId::UsStock => "us-stock",
        AssetTabId::ThaiStock => "thai-stock",
        AssetTabId::Crypto => "crypto",
        AssetTabId::MutualFund => "mutual-fund",
        AssetTabId::Bond => "bond",
        AssetTabId::ProvidentFund => "provident-fund",
        AssetTabId::ClosedPosition => "closed-position",
    }
}

pub fn api_routes() -> Router<Arc<ApiState>> {
    Router::new()
        .route("/health", get(health_handler))
        .route("/auth/me", get(auth_me_handler))
        .route("/share-lot/sheet/{tab_id}", get(share_lot_sheet_handler))
        .route("/share-lot/sheets", get(share_lot_all_handler))
        .route("/portfolio/allocation", post(allocation_handler))
        .route("/portfolio/tools/simulate", post(simulate_handler))
        .route("/portfolio/tools/solve-target", post(solve_target_handler))
        .route("/price/exchange-rate", get(exchange_rate_handler))
}

async fn health_handler() -> Json<HealthStatus> {
    Json(get_health_status())
}

async fn auth_me_handler(
    _api_key: ApiKeyAuth,
    OptionalCurrentUser(user): OptionalCurrentUser,
) -> Json<AuthMeResponse> {
    let Some(user) = user else {
        return Json(AuthMeResponse {
            authenticated: false,
            user_id: None,
            role: "guest".to_string(),
            can_view_cloud_portfolio: false,
            portfolio_source: "local",
        });
    };
    let source = if user.can_view_cloud_portfolio {
        "google_sheets"
    } else {
        "local"
    };
    Json(AuthMeResponse {
        authenticated: true,
        user_id: Some(user.user_id),
        role: user.role,
        can_view_cloud_portfolio: user.can_view_cloud_portfolio,
        portfolio_source: source,
    })
}

async fn share_lot_sheet_handler(
    _api_key: ApiKeyAuth,
    _user: RequirePortfolioAuthorizedUser,
    State(state): State<Arc<ApiState>>,
    Path(tab_id): Path<String>,
) -> Result<Json<FifoResult>, ApiError> {
    let tab = parse_tab_id(&tab_id)?;
    let csv = state
        .sheets
        .fetch_tab_csv(tab)
        .await
        .map_err(ApiError::from)?;
    Ok(Json(compute_fifo_from_csv(&csv, tab_id_slug(tab))))
}

async fn share_lot_all_handler(
    _api_key: ApiKeyAuth,
    _user: RequirePortfolioAuthorizedUser,
    State(state): State<Arc<ApiState>>,
) -> Result<Json<FifoResult>, ApiError> {
    let tabs = state
        .sheets
        .fetch_all_tabs_csv()
        .await
        .map_err(ApiError::from)?;
    Ok(Json(compute_fifo_from_tabs(&tabs)))
}

async fn allocation_handler(
    _api_key: ApiKeyAuth,
    _user: RequirePortfolioAuthorizedUser,
    Json(req): Json<AllocationRequest>,
) -> Json<PortfolioAllocation> {
    Json(compute_allocation(
        &req.positions,
        req.target_allocation.as_ref(),
        &req.currency,
        req.exchange_rate,
    ))
}

async fn simulate_handler(
    _api_key: ApiKeyAuth,
    Json(req): Json<SimulateRequest>,
) -> Json<OrderSimulationResult> {
    Json(run_order_simulation(
        &req.initial_position,
        &req.steps,
        req.tax_fee_percent,
    ))
}

async fn solve_target_handler(
    _api_key: ApiKeyAuth,
    Json(req): Json<TargetCostInput>,
) -> Json<TargetCostResult> {
    Json(run_target_cost_solver(&req))
}

async fn exchange_rate_handler(
    _api_key: ApiKeyAuth,
    State(state): State<Arc<ApiState>>,
    Query(q): Query<ExchangeRateQuery>,
) -> Result<Json<ExchangeRateResponse>, ApiError> {
    let rate = state
        .prices
        .fetch_fx_rate(&q.from_currency, &q.to_currency)
        .await
        .map_err(ApiError::from)?;
    Ok(Json(ExchangeRateResponse { rate }))
}
