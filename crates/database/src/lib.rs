use std::time::Duration;

use reqwest::Client;
use serde_json::Value;
use sgsk_application::ports::{IdentityProfilePort, PortFuture};
use sgsk_common::AppError;

/// Configuration for connecting to Supabase PostgREST with caller-scoped RLS.
#[derive(Debug, Clone)]
pub struct SupabaseConfig {
    pub base_url: String,
    pub publishable_key: String,
}

/// Repository querying `public.user_profiles` using the caller's bearer token
/// so Supabase RLS enforces own-row isolation.
#[derive(Clone)]
pub struct SupabaseProfileRepository {
    config: SupabaseConfig,
    client: Client,
}

impl SupabaseProfileRepository {
    pub fn new(config: SupabaseConfig) -> Self {
        let client = Client::builder()
            .timeout(Duration::from_secs(5))
            .build()
            .unwrap_or_else(|_| Client::new());
        Self { config, client }
    }
}

impl IdentityProfilePort for SupabaseProfileRepository {
    fn fetch_profile_flags<'a>(
        &'a self,
        user_id: &'a str,
        bearer_token: &'a str,
    ) -> PortFuture<'a, Result<Option<(String, bool)>, AppError>> {
        Box::pin(async move {
            let base_url = self.config.base_url.trim().trim_end_matches('/');
            let pub_key = self.config.publishable_key.trim();
            if base_url.is_empty() || pub_key.is_empty() || user_id.trim().is_empty() {
                return Ok(None);
            }

            let url = format!("{base_url}/rest/v1/user_profiles");
            let res = self
                .client
                .get(&url)
                .query(&[
                    ("select", "role,can_view_cloud_portfolio"),
                    ("id", &format!("eq.{user_id}")),
                ])
                .header("Authorization", format!("Bearer {bearer_token}"))
                .header("apikey", pub_key)
                .send()
                .await
                .map_err(|e| AppError::Upstream(format!("Supabase profile lookup failed: {e}")))?;

            if !res.status().is_success() {
                return Ok(None);
            }

            let rows = res
                .json::<Value>()
                .await
                .map_err(|e| AppError::Upstream(format!("Invalid Supabase profile JSON: {e}")))?;

            if let Some(first) = rows.as_array().and_then(|arr| arr.first()) {
                let role = first
                    .get("role")
                    .and_then(Value::as_str)
                    .filter(|s| !s.is_empty())
                    .unwrap_or("user")
                    .to_string();
                let can_view = first
                    .get("can_view_cloud_portfolio")
                    .and_then(Value::as_bool)
                    .unwrap_or(false);
                return Ok(Some((role, can_view)));
            }

            Ok(None)
        })
    }
}

#[cfg(test)]
mod tests {
    use super::{SupabaseConfig, SupabaseProfileRepository};
    use sgsk_application::ports::IdentityProfilePort;
    use wiremock::matchers::{header, method, path, query_param};
    use wiremock::{Mock, MockServer, ResponseTemplate};

    #[tokio::test]
    async fn resolves_owner_and_non_owner_profile_flags_via_rls_query() {
        let server = MockServer::start().await;
        Mock::given(method("GET"))
            .and(path("/rest/v1/user_profiles"))
            .and(query_param("id", "eq.user-owner"))
            .and(header("apikey", "pub-key"))
            .respond_with(ResponseTemplate::new(200).set_body_json(serde_json::json!([
                { "role": "owner", "can_view_cloud_portfolio": true }
            ])))
            .mount(&server)
            .await;

        Mock::given(method("GET"))
            .and(path("/rest/v1/user_profiles"))
            .and(query_param("id", "eq.user-denied"))
            .respond_with(ResponseTemplate::new(200).set_body_json(serde_json::json!([])))
            .mount(&server)
            .await;

        let repo = SupabaseProfileRepository::new(SupabaseConfig {
            base_url: server.uri(),
            publishable_key: "pub-key".into(),
        });

        let owner = repo
            .fetch_profile_flags("user-owner", "tok-1")
            .await
            .unwrap();
        assert_eq!(owner, Some(("owner".to_string(), true)));

        let denied = repo
            .fetch_profile_flags("user-denied", "tok-2")
            .await
            .unwrap();
        assert_eq!(denied, None);
    }
}
