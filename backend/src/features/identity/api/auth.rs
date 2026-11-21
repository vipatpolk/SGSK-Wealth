use std::sync::Arc;

use axum::routing::get;
use axum::{Json, Router};
use serde::{Deserialize, Serialize};

use crate::state::AppState;
use crate::utils::auth::ApiKeyAuth;
use crate::utils::supabase_auth::OptionalCurrentUser;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct AuthMeResponse {
    pub authenticated: bool,
    pub user_id: Option<String>,
    pub email: Option<String>,
    pub role: String,
    pub providers: Vec<String>,
    pub can_view_cloud_portfolio: bool,
    pub portfolio_source: String,
}

pub fn router() -> Router<Arc<AppState>> {
    Router::new().route("/auth/me", get(get_auth_me))
}

async fn get_auth_me(
    _api_key: ApiKeyAuth,
    OptionalCurrentUser(current_user): OptionalCurrentUser,
) -> Json<AuthMeResponse> {
    let Some(user) = current_user else {
        return Json(AuthMeResponse {
            authenticated: false,
            user_id: None,
            email: None,
            role: "guest".to_string(),
            providers: Vec::new(),
            can_view_cloud_portfolio: false,
            portfolio_source: "local".to_string(),
        });
    };

    let portfolio_source = if user.can_view_cloud_portfolio {
        "google_sheets"
    } else {
        "local"
    };

    Json(AuthMeResponse {
        authenticated: true,
        user_id: Some(user.user_id),
        email: Some(user.email),
        role: user.role,
        providers: user.providers,
        can_view_cloud_portfolio: user.can_view_cloud_portfolio,
        portfolio_source: portfolio_source.to_string(),
    })
}
