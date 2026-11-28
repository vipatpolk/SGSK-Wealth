use std::sync::Arc;

use axum::extract::FromRequestParts;
use axum::http::request::Parts;

use crate::error::ApiError;
use crate::state::ApiState;

pub struct ApiKeyAuth;

impl FromRequestParts<Arc<ApiState>> for ApiKeyAuth {
    type Rejection = ApiError;

    async fn from_request_parts(
        parts: &mut Parts,
        state: &Arc<ApiState>,
    ) -> Result<Self, Self::Rejection> {
        let key = parts
            .headers
            .get("X-API-Key")
            .and_then(|v| v.to_str().ok())
            .unwrap_or("");

        let cfg = &state.config;
        let valid = (!cfg.backend_api_key.is_empty() && key == cfg.backend_api_key)
            || (!cfg.backend_api_key_previous.is_empty() && key == cfg.backend_api_key_previous)
            || (cfg.is_development && key == "dev_secret_key_change_in_prod");

        if valid {
            Ok(Self)
        } else {
            Err(ApiError::unauthorized_api_key())
        }
    }
}

#[derive(Debug, Clone)]
pub struct AuthenticatedUser {
    pub user_id: String,
    pub role: String,
    pub can_view_cloud_portfolio: bool,
}

pub struct OptionalCurrentUser(pub Option<AuthenticatedUser>);

impl FromRequestParts<Arc<ApiState>> for OptionalCurrentUser {
    type Rejection = ApiError;

    async fn from_request_parts(
        parts: &mut Parts,
        state: &Arc<ApiState>,
    ) -> Result<Self, Self::Rejection> {
        let Some(auth_header) = parts
            .headers
            .get(axum::http::header::AUTHORIZATION)
            .and_then(|v| v.to_str().ok())
        else {
            return Ok(Self(None));
        };

        let Some(token) = auth_header.strip_prefix("Bearer ").map(str::trim) else {
            return Ok(Self(None));
        };
        if token.is_empty() {
            return Ok(Self(None));
        }

        let user_id = parts
            .headers
            .get("x-user-id")
            .and_then(|v| v.to_str().ok())
            .map(str::trim)
            .filter(|s| !s.is_empty())
            .unwrap_or(token);

        let flags = state
            .identity
            .fetch_profile_flags(user_id, token)
            .await
            .map_err(ApiError::from)?;

        let Some((role, can_view_cloud_portfolio)) = flags else {
            return Ok(Self(None));
        };

        Ok(Self(Some(AuthenticatedUser {
            user_id: user_id.to_string(),
            role,
            can_view_cloud_portfolio,
        })))
    }
}

pub struct RequirePortfolioAuthorizedUser(pub AuthenticatedUser);

impl FromRequestParts<Arc<ApiState>> for RequirePortfolioAuthorizedUser {
    type Rejection = ApiError;

    async fn from_request_parts(
        parts: &mut Parts,
        state: &Arc<ApiState>,
    ) -> Result<Self, Self::Rejection> {
        let OptionalCurrentUser(maybe_user) =
            OptionalCurrentUser::from_request_parts(parts, state).await?;
        let user = maybe_user.ok_or_else(|| ApiError::unauthorized("Authentication required"))?;
        if !user.can_view_cloud_portfolio {
            return Err(ApiError::forbidden(
                "Portfolio access is restricted to authorized accounts",
            ));
        }
        Ok(Self(user))
    }
}
