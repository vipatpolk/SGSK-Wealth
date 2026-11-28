pub mod config;
pub mod error;
pub mod features;
pub mod middleware;
pub mod ports;
pub mod state;
pub mod utils;

use std::sync::Arc;

use axum::middleware as axum_middleware;
use axum::routing::get;
use axum::{Json, Router};
use serde_json::{json, Value};
use tower_http::compression::predicate::SizeAbove;
use tower_http::compression::CompressionLayer;

use crate::middleware::{
    build_cors_layer, direct_access_block_middleware, security_headers_middleware,
};
use crate::state::AppState;
use crate::utils::auth::ApiKeyAuth;

pub fn create_app(state: Arc<AppState>) -> Router {
    let cors_layer = build_cors_layer(&state.infra.settings);
    let compression_layer = CompressionLayer::new().compress_when(SizeAbove::new(1000));

    let api_routes = Router::new()
        .route("/", get(read_root))
        .route("/health", get(read_root))
        .merge(features::identity::api::auth::router())
        .merge(features::portfolio::api::share_lot::router())
        .merge(features::market_data::api::price::router())
        .merge(features::market_data::api::nav::router())
        .merge(features::portfolio::api::portfolio::router())
        .merge(features::tools::api::tools::router())
        .merge(features::market_data::api::icon::router());

    Router::new()
        .merge(api_routes.clone())
        .route("/api/v1/", get(read_root))
        .nest("/api/v1", api_routes.clone())
        .route("/api/backend/", get(read_root))
        .nest("/api/backend", api_routes)
        .with_state(state.clone())
        .layer(compression_layer)
        .layer(axum_middleware::from_fn_with_state(
            state,
            direct_access_block_middleware,
        ))
        .layer(axum_middleware::from_fn(security_headers_middleware))
        .layer(cors_layer)
}

async fn read_root(_api_key: ApiKeyAuth) -> Json<Value> {
    Json(json!({ "message": "Welcome to SGSKBackend!" }))
}
