use std::sync::Arc;

use axum::extract::FromRequestParts;
use axum::http::request::Parts;

use crate::error::AppError;
use crate::state::AppState;

pub struct ApiKeyAuth(pub String);

impl FromRequestParts<Arc<AppState>> for ApiKeyAuth {
    type Rejection = AppError;

    async fn from_request_parts(
        parts: &mut Parts,
        state: &Arc<AppState>,
    ) -> Result<Self, Self::Rejection> {
        let api_key = parts
            .headers
            .get("X-API-Key")
            .and_then(|v| v.to_str().ok())
            .map(str::to_string);

        let settings = &state.settings;
        let is_dev = settings.is_development();

        if let Some(key) = api_key {
            let valid = key == settings.backend_api_key
                || (!settings.backend_api_key_previous.is_empty()
                    && key == settings.backend_api_key_previous)
                || (is_dev && key == "dev_secret_key_change_in_prod");
            if valid {
                return Ok(Self(key));
            }
        }

        Err(AppError::unauthorized_api_key())
    }
}
