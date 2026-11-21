use axum::body::Body;
use axum::extract::Request;
use axum::http::header::{HeaderName, HeaderValue};
use axum::http::{Method, StatusCode, Uri};
use axum::middleware::Next;
use axum::response::{IntoResponse, Response};
use tower_http::cors::{AllowHeaders, AllowMethods, AllowOrigin, CorsLayer};

use crate::config::settings::Settings;

const VALID_APP_SOURCES: &[&str] = &[
    "ShareLot",
    "ShareLot-Client",
    "SGSK-Wealth",
    "SGSK-Wealth-Client",
    "SGSK-Wealth-Mobile",
    "SGSK-Wealth-Capacitor",
];

/// Normalizes optional `/api/backend` prefix when routed directly or via Vercel rewrites.
pub async fn normalize_prefix_middleware(mut req: Request<Body>, next: Next) -> Response {
    let path = req.uri().path();
    if path == "/api/backend" || path.starts_with("/api/backend/") {
        let stripped = path.strip_prefix("/api/backend").unwrap_or("");
        let new_path = if stripped.is_empty() { "/" } else { stripped };
        let new_path_and_query = match req.uri().query() {
            Some(q) => format!("{new_path}?{q}"),
            None => new_path.to_string(),
        };
        if let Ok(pq) = new_path_and_query.parse() {
            let mut parts = req.uri().clone().into_parts();
            parts.path_and_query = Some(pq);
            if let Ok(updated_uri) = Uri::from_parts(parts) {
                *req.uri_mut() = updated_uri;
            }
        }
    }
    next.run(req).await
}

pub async fn security_headers_middleware(req: Request<Body>, next: Next) -> Response {
    let mut response = next.run(req).await;
    let headers = response.headers_mut();
    headers.insert(
        HeaderName::from_static("x-content-type-options"),
        HeaderValue::from_static("nosniff"),
    );
    headers.insert(
        HeaderName::from_static("x-frame-options"),
        HeaderValue::from_static("DENY"),
    );
    headers.insert(
        HeaderName::from_static("x-xss-protection"),
        HeaderValue::from_static("1; mode=block"),
    );
    headers.insert(
        HeaderName::from_static("referrer-policy"),
        HeaderValue::from_static("strict-origin-when-cross-origin"),
    );
    headers.insert(
        HeaderName::from_static("strict-transport-security"),
        HeaderValue::from_static("max-age=31536000; includeSubDomains"),
    );
    response
}

pub async fn direct_access_block_middleware(req: Request<Body>, next: Next) -> Response {
    if req.method() == Method::OPTIONS {
        return next.run(req).await;
    }

    let headers = req.headers();
    let header_str = |name: &str| -> String {
        headers
            .get(name)
            .and_then(|v| v.to_str().ok())
            .unwrap_or("")
            .to_string()
    };

    let host = header_str("host")
        .to_lowercase()
        .split(':')
        .next()
        .unwrap_or("")
        .to_string();
    let forwarded_host = header_str("x-forwarded-host")
        .to_lowercase()
        .split(':')
        .next()
        .unwrap_or("")
        .to_string();

    let app_source = headers
        .get("x-app-source")
        .or_else(|| headers.get("x-requested-with"))
        .and_then(|v| v.to_str().ok())
        .filter(|s| !s.is_empty())
        .map(str::to_string);

    let sec_fetch_dest = header_str("sec-fetch-dest");
    let sec_fetch_mode = header_str("sec-fetch-mode");
    let accept = header_str("accept");

    // 1. Block direct browser navigation
    let is_browser_direct_navigation = sec_fetch_dest == "document"
        || sec_fetch_mode == "navigate"
        || (accept.contains("text/html") && app_source.is_none());

    if is_browser_direct_navigation && app_source.is_none() {
        return (
            StatusCode::FORBIDDEN,
            [(
                axum::http::header::CONTENT_TYPE,
                "application/json",
            )],
            r#"{"detail": "Direct browser access to backend is prohibited. Please access via the SGSK Wealth web application."}"#,
        )
            .into_response();
    }

    // 2. Block direct access targeting legacy standalone backend hosts (or preview branches named backend)
    let is_target_backend_host = host == "api-sgsk-wealth.vercel.app"
        || host == "sgsk-backend.vercel.app"
        || (host.ends_with(".vercel.app")
            && (host.contains("backend") || host.contains("api-sgsk-wealth")));

    let path = req.uri().path();
    let is_icon_path = path.starts_with("/icon") || path.starts_with("/api/backend/icon");

    if is_target_backend_host && !is_icon_path {
        let is_forwarded_from_frontend = !forwarded_host.is_empty() && forwarded_host != host;
        let has_valid_app_signature = app_source
            .as_deref()
            .is_some_and(|src| VALID_APP_SOURCES.contains(&src));

        if !is_forwarded_from_frontend && !has_valid_app_signature {
            return (
                StatusCode::FORBIDDEN,
                [(
                    axum::http::header::CONTENT_TYPE,
                    "application/json",
                )],
                r#"{"detail": "Direct access to backend origin is prohibited. Requests must originate through the web application proxy."}"#,
            )
                .into_response();
        }
    }

    next.run(req).await
}

pub fn build_cors_layer(settings: &Settings) -> CorsLayer {
    let origins: Vec<HeaderValue> = settings
        .resolved_allowed_origins()
        .into_iter()
        .filter_map(|origin| origin.parse::<HeaderValue>().ok())
        .collect();

    CorsLayer::new()
        .allow_origin(AllowOrigin::list(origins))
        .allow_credentials(true)
        .allow_methods(AllowMethods::mirror_request())
        .allow_headers(AllowHeaders::mirror_request())
}
