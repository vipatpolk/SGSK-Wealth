use std::sync::Arc;

use axum::extract::{Query, State};
use axum::routing::{get, post};
use axum::{Json, Router};
use serde::{Deserialize, Serialize};

use crate::error::ValidatedJson;
use crate::features::market_data::models::requests::SummariesRequest;
use crate::features::market_data::services::price_service::PricesAndRateResponse;
use crate::state::AppState;
use crate::utils::auth::ApiKeyAuth;

#[derive(Deserialize)]
struct ExchangeRateQuery {
    #[serde(default = "default_usd")]
    from_currency: String,
    #[serde(default = "default_thb")]
    to_currency: String,
}

fn default_usd() -> String {
    "USD".to_string()
}

fn default_thb() -> String {
    "THB".to_string()
}

#[derive(Serialize)]
struct ExchangeRateResponse {
    rate: f64,
}

pub fn router() -> Router<Arc<AppState>> {
    Router::new()
        .route("/price/fetch-prices", post(fetch_prices_and_rate))
        .route("/price/exchange-rate", get(fetch_exchange_rate))
}

async fn fetch_prices_and_rate(
    _api_key: ApiKeyAuth,
    State(state): State<Arc<AppState>>,
    ValidatedJson(req): ValidatedJson<SummariesRequest>,
) -> Json<PricesAndRateResponse> {
    Json(
        state
            .market_data
            .price_service
            .fetch_prices_and_rate(&req.summaries)
            .await,
    )
}

async fn fetch_exchange_rate(
    _api_key: ApiKeyAuth,
    State(state): State<Arc<AppState>>,
    Query(q): Query<ExchangeRateQuery>,
) -> Json<ExchangeRateResponse> {
    let rate = state
        .market_data
        .price_service
        .fetch_exchange_rate(&q.from_currency, &q.to_currency)
        .await;
    Json(ExchangeRateResponse { rate })
}
