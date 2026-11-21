use std::collections::HashMap;
use std::fs;
use std::path::Path;
use std::sync::Arc;

use chrono::Utc;
use jsonwebtoken::{encode, Algorithm, EncodingKey, Header};
use serde::{Deserialize, Serialize};

use crate::config::settings::{sha256_hex, Settings};
use crate::utils::cache::TTLCache;
use crate::utils::http_client::HttpResources;

const GOOGLE_SHEETS_SCOPES: &str =
    "https://www.googleapis.com/auth/spreadsheets.readonly https://www.googleapis.com/auth/drive.readonly";

#[derive(Deserialize)]
struct ServiceAccountJson {
    client_email: String,
    private_key: String,
    #[serde(default = "default_token_uri")]
    token_uri: String,
}

fn default_token_uri() -> String {
    "https://oauth2.googleapis.com/token".to_string()
}

#[derive(Serialize)]
struct GoogleJwtClaims<'a> {
    iss: &'a str,
    scope: &'a str,
    aud: &'a str,
    iat: i64,
    exp: i64,
}

#[derive(Deserialize)]
struct OAuthTokenResponse {
    access_token: Option<String>,
    expires_in: Option<f64>,
}

pub async fn get_google_auth_headers(
    settings: &Settings,
    http: &HttpResources,
    cache: &Arc<TTLCache>,
) -> HashMap<String, String> {
    let sa_info = settings.google_service_account_json.trim();
    if sa_info.is_empty() {
        return HashMap::new();
    }

    let cache_key = format!("google_sa_token::{}", sha256_hex(sa_info));
    if let Some(cached_token) = cache.get::<String>(&cache_key) {
        let mut headers = HashMap::new();
        headers.insert(
            "Authorization".to_string(),
            format!("Bearer {cached_token}"),
        );
        return headers;
    }

    let raw_json = if Path::new(sa_info).is_file() {
        match fs::read_to_string(sa_info) {
            Ok(content) => content,
            Err(err) => {
                tracing::warn!("[GoogleAuth] Failed to read service account file: {err}");
                return HashMap::new();
            }
        }
    } else {
        sa_info.to_string()
    };

    let sa: ServiceAccountJson = match serde_json::from_str(&raw_json) {
        Ok(parsed) => parsed,
        Err(err) => {
            tracing::warn!("[GoogleAuth] Failed to parse service account JSON: {err}");
            return HashMap::new();
        }
    };

    let now = Utc::now().timestamp();
    let claims = GoogleJwtClaims {
        iss: &sa.client_email,
        scope: GOOGLE_SHEETS_SCOPES,
        aud: &sa.token_uri,
        iat: now,
        exp: now + 3600,
    };

    let encoding_key = match EncodingKey::from_rsa_pem(sa.private_key.as_bytes()) {
        Ok(k) => k,
        Err(err) => {
            tracing::warn!("[GoogleAuth] Invalid RSA private key: {err}");
            return HashMap::new();
        }
    };

    let assertion = match encode(&Header::new(Algorithm::RS256), &claims, &encoding_key) {
        Ok(jwt) => jwt,
        Err(err) => {
            tracing::warn!("[GoogleAuth] Failed to sign OAuth assertion: {err}");
            return HashMap::new();
        }
    };

    let res = match http
        .client
        .post(&sa.token_uri)
        .form(&[
            ("grant_type", "urn:ietf:params:oauth:grant-type:jwt-bearer"),
            ("assertion", assertion.as_str()),
        ])
        .send()
        .await
    {
        Ok(r) => r,
        Err(err) => {
            tracing::warn!("[GoogleAuth] Failed to obtain service account token: {err}");
            return HashMap::new();
        }
    };

    if !res.status().is_success() {
        tracing::warn!(
            "[GoogleAuth] OAuth token endpoint returned {}",
            res.status()
        );
        return HashMap::new();
    }

    match res.json::<OAuthTokenResponse>().await {
        Ok(body) => {
            if let Some(token) = body.access_token.filter(|t| !t.is_empty()) {
                let ttl = (body.expires_in.unwrap_or(3600.0) - 60.0).max(60.0);
                cache.set(cache_key, token.clone(), Some(ttl));
                let mut headers = HashMap::new();
                headers.insert("Authorization".to_string(), format!("Bearer {token}"));
                return headers;
            }
        }
        Err(err) => {
            tracing::warn!("[GoogleAuth] Invalid OAuth token response: {err}");
        }
    }

    HashMap::new()
}
