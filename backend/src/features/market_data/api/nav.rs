use std::collections::HashMap;
use std::sync::Arc;

use axum::extract::rejection::QueryRejection;
use axum::extract::{Query, State};
use axum::routing::{get, post};
use axum::{Json, Router};
use serde::Deserialize;

use crate::error::{AppError, ValidatedJson};
use crate::features::market_data::models::factsheet::FundFactsheetResponse;
use crate::features::market_data::models::requests::NavRequest;
use crate::features::portfolio::models::transaction::PriceData;
use crate::state::AppState;
use crate::utils::auth::ApiKeyAuth;

#[derive(Deserialize)]
struct FactsheetQuery {
    symbol: String,
    #[serde(default = "default_mutual_fund")]
    asset_type: String,
    #[serde(default)]
    fund_name: Option<String>,
}

fn default_mutual_fund() -> String {
    "mutual-fund".to_string()
}

pub fn router() -> Router<Arc<AppState>> {
    Router::new()
        .route("/nav/fetch", post(fetch_navs))
        .route("/nav/factsheet", get(get_fund_factsheet))
}

async fn fetch_navs(
    _api_key: ApiKeyAuth,
    State(state): State<Arc<AppState>>,
    ValidatedJson(req): ValidatedJson<NavRequest>,
) -> Json<HashMap<String, PriceData>> {
    Json(state.nav_service.fetch_fund_navs(&req.symbols).await)
}

async fn get_fund_factsheet(
    _api_key: ApiKeyAuth,
    State(state): State<Arc<AppState>>,
    query_res: Result<Query<FactsheetQuery>, QueryRejection>,
) -> Result<Json<FundFactsheetResponse>, AppError> {
    let Query(q) = query_res.map_err(|e| AppError::unprocessable(e.body_text()))?;
    let res = state
        .nav_service
        .fetch_fund_factsheet(&q.symbol, &q.asset_type, q.fund_name.as_deref())
        .await;
    Ok(Json(res))
}
