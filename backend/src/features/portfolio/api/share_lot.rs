use std::sync::Arc;

use axum::extract::{Path, State};
use axum::routing::get;
use axum::{Json, Router};

use crate::features::portfolio::models::transaction::SheetResult;
use crate::state::AppState;
use crate::utils::auth::ApiKeyAuth;
use crate::utils::supabase_auth::RequirePortfolioAuthorizedUser;

pub fn router() -> Router<Arc<AppState>> {
    Router::new()
        .route("/share-lot/sheet/{tab_id}", get(fetch_sheet))
        .route("/share-lot/sheets", get(fetch_all_sheets))
}

async fn fetch_sheet(
    _api_key: ApiKeyAuth,
    _user: RequirePortfolioAuthorizedUser,
    State(state): State<Arc<AppState>>,
    Path(tab_id): Path<String>,
) -> Json<SheetResult> {
    Json(state.share_lot_service.fetch_sheet(&tab_id).await)
}

async fn fetch_all_sheets(
    _api_key: ApiKeyAuth,
    _user: RequirePortfolioAuthorizedUser,
    State(state): State<Arc<AppState>>,
) -> Json<SheetResult> {
    Json(state.share_lot_service.fetch_all_sheets().await)
}
