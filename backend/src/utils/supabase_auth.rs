use std::collections::HashSet;
use std::sync::Arc;

use axum::extract::FromRequestParts;
use axum::http::request::Parts;
use jsonwebtoken::jwk::{Jwk, JwkSet};
use jsonwebtoken::{decode, decode_header, Algorithm, DecodingKey, Validation};
use serde::{Deserialize, Serialize};
use serde_json::Value;

use crate::config::settings::{sha256_hex, Settings};
use crate::error::AppError;
use crate::ports::{IdentityProfilePort, SupabaseProfileAdapter};
use crate::state::AppState;
use crate::utils::cache::{AsyncSingleflight, TTLCache};
use crate::utils::http_client::HttpResources;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct AuthenticatedUser {
    pub user_id: String,
    pub email: String,
    pub role: String,
    pub providers: Vec<String>,
    pub email_verified: bool,
    pub can_view_cloud_portfolio: bool,
}

#[derive(Clone)]
pub struct SupabaseTokenVerifier {
    http: Arc<HttpResources>,
    cache: Arc<TTLCache>,
    singleflight: Arc<AsyncSingleflight>,
    profile_port: Arc<dyn IdentityProfilePort>,
}

impl SupabaseTokenVerifier {
    pub fn new(
        http: Arc<HttpResources>,
        cache: Arc<TTLCache>,
        singleflight: Arc<AsyncSingleflight>,
    ) -> Self {
        let profile_port: Arc<dyn IdentityProfilePort> =
            Arc::new(SupabaseProfileAdapter::new(Arc::clone(&http)));
        Self::with_profile_port(http, cache, singleflight, profile_port)
    }

    pub fn with_profile_port(
        http: Arc<HttpResources>,
        cache: Arc<TTLCache>,
        singleflight: Arc<AsyncSingleflight>,
        profile_port: Arc<dyn IdentityProfilePort>,
    ) -> Self {
        Self {
            http,
            cache,
            singleflight,
            profile_port,
        }
    }

    async fn fetch_jwks_set(
        &self,
        jwks_url: &str,
        force_refresh: bool,
    ) -> Result<JwkSet, AppError> {
        let cache_key = format!("supabase_jwks::{jwks_url}");
        if !force_refresh {
            if let Some(cached) = self.cache.get::<JwkSet>(&cache_key) {
                return Ok(cached);
            }
        }

        let sf_key = format!("jwks_fetch::{jwks_url}::{force_refresh}");
        let http = Arc::clone(&self.http);
        let cache = Arc::clone(&self.cache);
        let url_owned = jwks_url.to_string();
        let cache_key_clone = cache_key.clone();

        self.singleflight
            .execute(&sf_key, move || async move {
                if !force_refresh {
                    if let Some(inner) = cache.get::<JwkSet>(&cache_key_clone) {
                        return Ok(inner);
                    }
                }
                let res = http
                    .client
                    .get(&url_owned)
                    .timeout(std::time::Duration::from_secs(5))
                    .send()
                    .await
                    .map_err(|e| AppError::unauthorized(format!("Failed to fetch JWKS: {e}")))?;

                if !res.status().is_success() {
                    return Err(AppError::unauthorized(format!(
                        "JWKS endpoint returned status {}",
                        res.status()
                    )));
                }
                let jwk_set = res
                    .json::<JwkSet>()
                    .await
                    .map_err(|e| AppError::unauthorized(format!("Invalid JWKS payload: {e}")))?;

                cache.set(cache_key_clone, jwk_set.clone(), Some(600.0));
                Ok(jwk_set)
            })
            .await
    }

    fn find_key_in_set<'a>(jwk_set: &'a JwkSet, kid: Option<&str>) -> Option<&'a Jwk> {
        if let Some(k) = kid {
            return jwk_set
                .keys
                .iter()
                .find(|key| key.common.key_id.as_deref() == Some(k));
        }
        if jwk_set.keys.len() == 1 {
            return Some(&jwk_set.keys[0]);
        }
        None
    }

    async fn decode_with_jwks(
        &self,
        token: &str,
        alg: Algorithm,
        kid: Option<&str>,
        settings: &Settings,
    ) -> Result<Value, AppError> {
        let jwks_url = settings.resolved_supabase_jwks_url();
        if jwks_url.is_empty() {
            return Err(AppError::unauthorized(
                "Supabase JWKS URL is not configured",
            ));
        }

        let mut jwk_set = self.fetch_jwks_set(&jwks_url, false).await?;
        let mut signing_key = Self::find_key_in_set(&jwk_set, kid).cloned();
        if signing_key.is_none() {
            jwk_set = self.fetch_jwks_set(&jwks_url, true).await?;
            signing_key = Self::find_key_in_set(&jwk_set, kid).cloned();
        }

        let jwk = signing_key
            .ok_or_else(|| AppError::unauthorized("Invalid or expired authentication token"))?;
        let decoding_key = DecodingKey::from_jwk(&jwk).map_err(|e| {
            tracing::warn!("Supabase JWK decoding key conversion failed (alg={alg:?}): {e}");
            AppError::unauthorized("Invalid or expired authentication token")
        })?;

        let mut validation = Validation::new(alg);
        validation.leeway = 30;
        validation.set_audience(&[settings.supabase_jwt_audience.as_str()]);
        let issuer = settings.resolved_supabase_issuer();
        if !issuer.is_empty() {
            validation.set_issuer(&[issuer.as_str()]);
        }

        let token_data = decode::<Value>(token, &decoding_key, &validation).map_err(|e| {
            tracing::warn!("Supabase JWKS token verification failed (alg={alg:?}): {e}");
            AppError::unauthorized("Invalid or expired authentication token")
        })?;
        Ok(token_data.claims)
    }

    async fn verify_via_auth_api(
        &self,
        token: &str,
        settings: &Settings,
    ) -> Result<Value, AppError> {
        let base_url = settings.supabase_url.trim().trim_end_matches('/');
        let pub_key = settings.supabase_publishable_key.trim();
        if base_url.is_empty() || pub_key.is_empty() {
            return Err(AppError::unauthorized(
                "Invalid or expired authentication token",
            ));
        }

        let token_digest = sha256_hex(token);
        let cache_key = format!("supabase_user_token::{token_digest}");
        if let Some(cached) = self.cache.get::<Value>(&cache_key) {
            return Ok(cached);
        }

        let url = format!("{base_url}/auth/v1/user");
        let res = self
            .http
            .client
            .get(&url)
            .header("Authorization", format!("Bearer {token}"))
            .header("apikey", pub_key)
            .timeout(std::time::Duration::from_secs(5))
            .send()
            .await
            .map_err(|_| AppError::unauthorized("Invalid or expired authentication token"))?;

        if res.status().as_u16() != 200 {
            return Err(AppError::unauthorized(
                "Invalid or expired authentication token",
            ));
        }

        let user_data: Value = res
            .json()
            .await
            .map_err(|_| AppError::unauthorized("Invalid or expired authentication token"))?;

        let normalized = serde_json::json!({
            "sub": user_data.get("id").and_then(|v| v.as_str()).unwrap_or(""),
            "email": user_data.get("email").and_then(|v| v.as_str()).unwrap_or(""),
            "is_anonymous": user_data.get("is_anonymous").and_then(|v| v.as_bool()).unwrap_or(false),
            "app_metadata": user_data.get("app_metadata").cloned().unwrap_or_else(|| serde_json::json!({})),
            "email_confirmed_at": user_data.get("email_confirmed_at").cloned().unwrap_or(Value::Null),
        });
        self.cache.set(cache_key, normalized.clone(), Some(60.0));
        Ok(normalized)
    }

    async fn fetch_profile_flags(
        &self,
        user_id: &str,
        token: &str,
        settings: &Settings,
    ) -> Option<(String, bool)> {
        if user_id.is_empty() {
            return None;
        }

        let cache_key = format!("supabase_profile_flags::{user_id}");
        if let Some(cached) = self.cache.get::<(String, bool)>(&cache_key) {
            return Some(cached);
        }

        let flags = self
            .profile_port
            .fetch_profile_flags(user_id, token, settings)
            .await?;
        self.cache.set(cache_key, flags.clone(), Some(60.0));
        Some(flags)
    }

    pub async fn verify_token(
        &self,
        token: &str,
        settings: &Settings,
    ) -> Result<AuthenticatedUser, AppError> {
        let header = decode_header(token).map_err(|e| {
            tracing::warn!("Supabase JWT header decode failed: {e}");
            AppError::unauthorized("Invalid or expired authentication token")
        })?;

        let claims: Value = match header.alg {
            Algorithm::ES256 | Algorithm::RS256 | Algorithm::EdDSA => {
                self.decode_with_jwks(token, header.alg, header.kid.as_deref(), settings)
                    .await?
            }
            Algorithm::HS256 => {
                let secret = settings.supabase_jwt_secret.trim();
                if !secret.is_empty() {
                    let mut validation = Validation::new(Algorithm::HS256);
                    validation.leeway = 30;
                    validation.set_audience(&[settings.supabase_jwt_audience.as_str()]);
                    let issuer = settings.resolved_supabase_issuer();
                    if !issuer.is_empty() {
                        validation.set_issuer(&[issuer.as_str()]);
                    }
                    decode::<Value>(
                        token,
                        &DecodingKey::from_secret(secret.as_bytes()),
                        &validation,
                    )
                    .map(|td| td.claims)
                    .map_err(|e| {
                        tracing::warn!("Supabase HS256 JWT verification failed: {e}");
                        AppError::unauthorized("Invalid or expired authentication token")
                    })?
                } else {
                    self.verify_via_auth_api(token, settings).await?
                }
            }
            other => {
                tracing::warn!("Unsupported JWT algorithm: {other:?}");
                return Err(AppError::unauthorized(
                    "Invalid or expired authentication token",
                ));
            }
        };

        if claims
            .get("is_anonymous")
            .and_then(|v| v.as_bool())
            .unwrap_or(false)
        {
            return Err(AppError::unauthorized(
                "Anonymous sessions are not authorized",
            ));
        }

        let user_id = claims
            .get("sub")
            .and_then(|v| v.as_str())
            .unwrap_or("")
            .trim()
            .to_string();
        let email = claims
            .get("email")
            .and_then(|v| v.as_str())
            .unwrap_or("")
            .trim()
            .to_lowercase();

        if user_id.is_empty() || email.is_empty() {
            return Err(AppError::unauthorized(
                "Invalid or incomplete authentication token",
            ));
        }

        let mut providers = Vec::new();
        if let Some(app_meta) = claims.get("app_metadata").and_then(|v| v.as_object()) {
            if let Some(raw_providers) = app_meta.get("providers").and_then(|v| v.as_array()) {
                for p in raw_providers {
                    if let Some(s) = p.as_str() {
                        if !s.is_empty() {
                            providers.push(s.to_string());
                        }
                    }
                }
            } else if let Some(single) = app_meta.get("provider").and_then(|v| v.as_str()) {
                if !single.is_empty() {
                    providers.push(single.to_string());
                }
            }
        }

        let allowed_emails: HashSet<String> = settings
            .authorized_portfolio_emails
            .iter()
            .map(|e| e.trim().to_lowercase())
            .filter(|e| !e.is_empty())
            .collect();
        let is_allowlisted_email = allowed_emails.contains(&email);

        let email_confirmed = if let Some(obj) = claims.as_object() {
            if let Some(val) = obj.get("email_confirmed_at") {
                !val.is_null()
            } else {
                true
            }
        } else {
            true
        };

        let profile_flags = self.fetch_profile_flags(&user_id, token, settings).await;
        let (role, can_view_cloud) = if let Some((db_role, db_can_view)) = profile_flags {
            (
                db_role,
                is_allowlisted_email && email_confirmed && db_can_view,
            )
        } else if !settings.is_development() {
            tracing::warn!(
                "Supabase user_profiles lookup failed or returned no row in non-development mode; denying cloud portfolio access"
            );
            ("user".to_string(), false)
        } else {
            let dev_role = if is_allowlisted_email {
                "owner".to_string()
            } else {
                "user".to_string()
            };
            (dev_role, is_allowlisted_email && email_confirmed)
        };

        Ok(AuthenticatedUser {
            user_id,
            email,
            role,
            providers,
            email_verified: email_confirmed,
            can_view_cloud_portfolio: can_view_cloud,
        })
    }
}

pub struct OptionalCurrentUser(pub Option<AuthenticatedUser>);

impl FromRequestParts<Arc<AppState>> for OptionalCurrentUser {
    type Rejection = AppError;

    async fn from_request_parts(
        parts: &mut Parts,
        state: &Arc<AppState>,
    ) -> Result<Self, Self::Rejection> {
        let Some(auth_header) = parts.headers.get(axum::http::header::AUTHORIZATION) else {
            return Ok(Self(None));
        };
        let auth_str = auth_header
            .to_str()
            .map_err(|_| AppError::unauthorized("Invalid authentication scheme"))?;

        let mut split = auth_str.splitn(2, ' ');
        let scheme = split.next().unwrap_or("");
        let credentials = split.next().unwrap_or("").trim();

        if credentials.is_empty() && scheme.is_empty() {
            return Ok(Self(None));
        }

        if !scheme.eq_ignore_ascii_case("bearer") {
            return Err(AppError::unauthorized("Invalid authentication scheme"));
        }

        if credentials.is_empty() {
            return Ok(Self(None));
        }

        let user = state
            .identity
            .token_verifier
            .verify_token(credentials, &state.infra.settings)
            .await?;
        Ok(Self(Some(user)))
    }
}

pub struct RequirePortfolioAuthorizedUser(pub AuthenticatedUser);

impl FromRequestParts<Arc<AppState>> for RequirePortfolioAuthorizedUser {
    type Rejection = AppError;

    async fn from_request_parts(
        parts: &mut Parts,
        state: &Arc<AppState>,
    ) -> Result<Self, Self::Rejection> {
        let OptionalCurrentUser(maybe_user) =
            OptionalCurrentUser::from_request_parts(parts, state).await?;
        let user = maybe_user.ok_or_else(|| AppError::unauthorized("Authentication required"))?;
        if !user.can_view_cloud_portfolio {
            return Err(AppError::forbidden(
                "Portfolio access is restricted to authorized accounts",
            ));
        }
        Ok(Self(user))
    }
}
