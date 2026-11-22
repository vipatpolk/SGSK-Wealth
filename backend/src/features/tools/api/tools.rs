use std::sync::Arc;

use axum::extract::State;
use axum::routing::post;
use axum::{Json, Router};

use crate::error::{AppError, ValidatedJson};
use crate::features::tools::models::tools::{
    RebalanceCalculateRequest, RebalanceCalculateResponse, SimulateOrderRequest,
    SimulateOrderResponse, SolveTargetCostRequest, SolveTargetCostResponse, TvmCalculateRequest,
    TvmCalculateResponse,
};
use crate::state::AppState;
use crate::utils::auth::ApiKeyAuth;
use crate::utils::supabase_auth::{
    AuthenticatedUser, OptionalCurrentUser, RequirePortfolioAuthorizedUser,
};

fn enforce_symbol_lookup_authorization(
    has_initial_position: bool,
    symbol: Option<&str>,
    current_user: Option<&AuthenticatedUser>,
) -> Result<(), AppError> {
    if !has_initial_position && symbol.is_some_and(|s| !s.is_empty()) {
        let user = current_user.ok_or_else(|| AppError::unauthorized("Authentication required"))?;
        if !user.can_view_cloud_portfolio {
            return Err(AppError::forbidden(
                "Portfolio access is restricted to authorized accounts",
            ));
        }
    }
    Ok(())
}

pub fn router() -> Router<Arc<AppState>> {
    Router::new()
        .route("/portfolio/tools/simulate", post(simulate_orders))
        .route("/portfolio/tools/solve-target", post(solve_target_cost))
        .route("/portfolio/tools/tvm", post(calculate_tvm))
        .route("/portfolio/tools/rebalance", post(calculate_rebalance))
}

async fn simulate_orders(
    _api_key: ApiKeyAuth,
    OptionalCurrentUser(current_user): OptionalCurrentUser,
    State(state): State<Arc<AppState>>,
    ValidatedJson(req): ValidatedJson<SimulateOrderRequest>,
) -> Result<Json<SimulateOrderResponse>, AppError> {
    enforce_symbol_lookup_authorization(
        req.initial_position.is_some(),
        req.symbol.as_deref(),
        current_user.as_ref(),
    )?;
    Ok(Json(
        state.portfolio.tools_service.simulate_order(&req).await,
    ))
}

async fn solve_target_cost(
    _api_key: ApiKeyAuth,
    OptionalCurrentUser(current_user): OptionalCurrentUser,
    State(state): State<Arc<AppState>>,
    ValidatedJson(req): ValidatedJson<SolveTargetCostRequest>,
) -> Result<Json<SolveTargetCostResponse>, AppError> {
    enforce_symbol_lookup_authorization(
        req.initial_position.is_some(),
        req.symbol.as_deref(),
        current_user.as_ref(),
    )?;
    Ok(Json(
        state.portfolio.tools_service.solve_target_cost(&req).await,
    ))
}

async fn calculate_tvm(
    _api_key: ApiKeyAuth,
    State(state): State<Arc<AppState>>,
    ValidatedJson(req): ValidatedJson<TvmCalculateRequest>,
) -> Json<TvmCalculateResponse> {
    Json(state.portfolio.tools_service.calculate_tvm(&req).await)
}

async fn calculate_rebalance(
    _api_key: ApiKeyAuth,
    _user: RequirePortfolioAuthorizedUser,
    State(state): State<Arc<AppState>>,
    ValidatedJson(req): ValidatedJson<RebalanceCalculateRequest>,
) -> Json<RebalanceCalculateResponse> {
    Json(
        state
            .portfolio
            .tools_service
            .calculate_rebalance(&req)
            .await,
    )
}
