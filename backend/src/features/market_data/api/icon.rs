use std::sync::Arc;

use axum::body::Body;
use axum::extract::{Path, Query, State};
use axum::http::header::{CACHE_CONTROL, CONTENT_TYPE};
use axum::http::StatusCode;
use axum::response::{IntoResponse, Response};
use axum::routing::get;
use axum::{Json, Router};
use serde::Deserialize;

use crate::features::market_data::services::icon_service::IconMetadata;
use crate::state::AppState;

#[derive(Deserialize, Default)]
struct IconQuery {
    #[serde(default)]
    symbol: String,
    #[serde(default)]
    asset_type: String,
    #[serde(default)]
    fund_name: String,
}

pub fn router() -> Router<Arc<AppState>> {
    Router::new()
        .route("/icon/meta/{*symbol}", get(get_icon_metadata))
        .route("/icon", get(get_icon_by_query))
        .route("/icon/{*symbol}", get(get_icon_by_path))
}

async fn get_icon_metadata(
    State(state): State<Arc<AppState>>,
    Path(symbol): Path<String>,
    Query(query): Query<IconQuery>,
) -> Json<IconMetadata> {
    let meta = state
        .market_data
        .icon_service
        .get_symbol_metadata(&symbol, &query.asset_type, &query.fund_name)
        .await;
    Json(meta)
}

async fn get_icon_by_query(
    State(state): State<Arc<AppState>>,
    Query(query): Query<IconQuery>,
) -> Response {
    let (content, media_type) = state
        .market_data
        .icon_service
        .get_symbol_icon(&query.symbol, &query.asset_type, &query.fund_name)
        .await;
    build_icon_response(content, &media_type)
}

async fn get_icon_by_path(
    State(state): State<Arc<AppState>>,
    Path(symbol): Path<String>,
    Query(query): Query<IconQuery>,
) -> Response {
    let (content, media_type) = state
        .market_data
        .icon_service
        .get_symbol_icon(&symbol, &query.asset_type, &query.fund_name)
        .await;
    build_icon_response(content, &media_type)
}

fn build_icon_response(content: Vec<u8>, media_type: &str) -> Response {
    Response::builder()
        .status(StatusCode::OK)
        .header(CONTENT_TYPE, media_type)
        .header(
            CACHE_CONTROL,
            "public, max-age=86400, stale-while-revalidate=604800",
        )
        .body(Body::from(content))
        .unwrap_or_else(|_| StatusCode::INTERNAL_SERVER_ERROR.into_response())
}
