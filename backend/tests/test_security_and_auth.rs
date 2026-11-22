use std::collections::HashSet;

use axum::body::Body;
use axum::http::{HeaderValue, Method, Request, StatusCode};
use base64::engine::general_purpose::URL_SAFE_NO_PAD;
use base64::Engine;
use http_body_util::BodyExt;
use jsonwebtoken::{encode, Algorithm, EncodingKey, Header};
use rand::rngs::OsRng;
use rsa::pkcs8::EncodePrivateKey;
use rsa::traits::PublicKeyParts;
use rsa::RsaPrivateKey;
use serde_json::json;
use sgsk_backend::config::settings::{Settings, NATIVE_MOBILE_ORIGINS};
use sgsk_backend::create_app;
use sgsk_backend::state::AppState;
use tower::ServiceExt;
use wiremock::matchers::{method, path};
use wiremock::{Mock, MockServer, ResponseTemplate};

#[tokio::test]
async fn test_api_key_rotation_security_headers_and_validation_limits() {
    let settings = Settings {
        backend_api_key: "primary_secret_key_that_is_over_32_chars!".to_string(),
        backend_api_key_previous: "previous_secret_key_over_32_chars_long!".to_string(),
        ..Settings::default()
    };
    let app = create_app(AppState::from_settings(settings));

    // Missing X-API-Key -> 401
    let no_key = Request::builder().uri("/").body(Body::empty()).unwrap();
    let res = app.clone().oneshot(no_key).await.unwrap();
    assert_eq!(res.status(), StatusCode::UNAUTHORIZED);
    let body = res.into_body().collect().await.unwrap().to_bytes();
    let parsed: serde_json::Value = serde_json::from_slice(&body).unwrap();
    assert_eq!(parsed["detail"], "Invalid or missing API Key");

    // Wrong X-API-Key -> 401
    let bad_key = Request::builder()
        .uri("/")
        .header("X-API-Key", "wrong-key")
        .body(Body::empty())
        .unwrap();
    assert_eq!(
        app.clone().oneshot(bad_key).await.unwrap().status(),
        StatusCode::UNAUTHORIZED
    );

    // Previous key accepted during key rotation + security headers present
    let prev_key = Request::builder()
        .uri("/")
        .header("X-API-Key", "previous_secret_key_over_32_chars_long!")
        .body(Body::empty())
        .unwrap();
    let prev_res = app.clone().oneshot(prev_key).await.unwrap();
    assert_eq!(prev_res.status(), StatusCode::OK);
    let headers = prev_res.headers();
    assert_eq!(headers.get("x-content-type-options").unwrap(), "nosniff");
    assert_eq!(headers.get("x-frame-options").unwrap(), "DENY");
    assert_eq!(headers.get("x-xss-protection").unwrap(), "1; mode=block");
    assert_eq!(
        headers.get("referrer-policy").unwrap(),
        "strict-origin-when-cross-origin"
    );
    assert!(headers.get("strict-transport-security").is_some());

    // >50 items in /nav/fetch and /price/fetch-prices -> 422 Unprocessable Entity
    let over_50: Vec<String> = (0..51).map(|i| format!("F{i}")).collect();
    let nav_req = Request::builder()
        .method("POST")
        .uri("/nav/fetch")
        .header("X-API-Key", "primary_secret_key_that_is_over_32_chars!")
        .header("Content-Type", "application/json")
        .body(Body::from(json!({ "symbols": over_50 }).to_string()))
        .unwrap();
    assert_eq!(
        app.clone().oneshot(nav_req).await.unwrap().status(),
        StatusCode::UNPROCESSABLE_ENTITY
    );

    let over_50_sum: Vec<serde_json::Value> = (0..51)
        .map(|i| json!({ "symbol": format!("S{i}") }))
        .collect();
    let prc_req = Request::builder()
        .method("POST")
        .uri("/price/fetch-prices")
        .header("X-API-Key", "primary_secret_key_that_is_over_32_chars!")
        .header("Content-Type", "application/json")
        .body(Body::from(json!({ "summaries": over_50_sum }).to_string()))
        .unwrap();
    assert_eq!(
        app.oneshot(prc_req).await.unwrap().status(),
        StatusCode::UNPROCESSABLE_ENTITY
    );
}

#[tokio::test]
async fn test_direct_host_blocking_and_capacitor_cors() {
    let settings = Settings::default();
    let mobile_origins: HashSet<String> = settings.resolved_allowed_origins().into_iter().collect();
    for expected in NATIVE_MOBILE_ORIGINS {
        assert!(mobile_origins.contains(*expected));
    }

    let app = create_app(AppState::from_settings(settings));

    // Direct access to blocked Vercel backend hosts without app source or forwarded host -> 403
    for host in ["sgsk-backend.vercel.app", "api-sgsk-wealth.vercel.app"] {
        let blocked = Request::builder()
            .uri("/")
            .header("Host", host)
            .header("X-API-Key", "dev_secret_key_change_in_prod")
            .body(Body::empty())
            .unwrap();
        assert_eq!(
            app.clone().oneshot(blocked).await.unwrap().status(),
            StatusCode::FORBIDDEN,
            "expected direct access block for {host}"
        );

        // Allowed when forwarded from frontend
        let forwarded = Request::builder()
            .uri("/")
            .header("Host", host)
            .header("X-Forwarded-Host", "sgsk-wealth.vercel.app")
            .header("X-API-Key", "dev_secret_key_change_in_prod")
            .body(Body::empty())
            .unwrap();
        assert_eq!(
            app.clone().oneshot(forwarded).await.unwrap().status(),
            StatusCode::OK
        );
    }

    // Valid X-App-Source headers allow backend host requests
    for src in ["ShareLot", "SGSK-Wealth", "SGSK-Wealth-Mobile"] {
        let req = Request::builder()
            .uri("/")
            .header("Host", "sgsk-backend.vercel.app")
            .header("X-App-Source", src)
            .header("X-API-Key", "dev_secret_key_change_in_prod")
            .body(Body::empty())
            .unwrap();
        assert_eq!(
            app.clone().oneshot(req).await.unwrap().status(),
            StatusCode::OK
        );
    }

    // /icon/* exempt on *backend*.vercel.app hosts
    let icon_req = Request::builder()
        .uri("/icon/meta/AAPL")
        .header("Host", "pr-1-backend.vercel.app")
        .header("X-API-Key", "dev_secret_key_change_in_prod")
        .body(Body::empty())
        .unwrap();
    assert_eq!(
        app.clone().oneshot(icon_req).await.unwrap().status(),
        StatusCode::OK
    );

    // Capacitor CORS preflight & standard request
    let preflight = Request::builder()
        .method(Method::OPTIONS)
        .uri("/auth/me")
        .header("Origin", "capacitor://localhost")
        .header("Access-Control-Request-Method", "GET")
        .header("Access-Control-Request-Headers", "X-API-Key,Authorization")
        .body(Body::empty())
        .unwrap();
    let preflight_res = app.clone().oneshot(preflight).await.unwrap();
    assert_eq!(preflight_res.status(), StatusCode::OK);
    assert_eq!(
        preflight_res.headers().get("access-control-allow-origin"),
        Some(&HeaderValue::from_static("capacitor://localhost"))
    );

    let cors_get = Request::builder()
        .uri("/auth/me")
        .header("Origin", "http://localhost")
        .header("X-API-Key", "dev_secret_key_change_in_prod")
        .body(Body::empty())
        .unwrap();
    let cors_res = app.oneshot(cors_get).await.unwrap();
    assert_eq!(cors_res.status(), StatusCode::OK);
    assert_eq!(
        cors_res.headers().get("access-control-allow-origin"),
        Some(&HeaderValue::from_static("http://localhost"))
    );

    // Custom BLOCKED_DIRECT_HOSTS configuration blocks configured host without X-App-Source
    let custom_blocked_settings = Settings {
        blocked_direct_hosts: vec!["custom-backend.example.com".to_string()],
        ..Settings::default()
    };
    let custom_app = create_app(AppState::from_settings(custom_blocked_settings));
    let custom_blocked = Request::builder()
        .uri("/")
        .header("Host", "custom-backend.example.com")
        .header("X-API-Key", "dev_secret_key_change_in_prod")
        .body(Body::empty())
        .unwrap();
    assert_eq!(
        custom_app.oneshot(custom_blocked).await.unwrap().status(),
        StatusCode::FORBIDDEN
    );
}

#[test]
fn test_production_settings_validation() {
    let mut prod = Settings {
        environment: "production".to_string(),
        ..Settings::default()
    };
    assert!(prod.validate_production_security().is_err());

    prod.backend_api_key = "a_very_secure_production_key_at_least_32_characters".to_string();
    // Still fails due to sample_spreadsheet_id
    assert!(prod.validate_production_security().is_err());

    prod.google_spreadsheet_id = "real_sheet_id_12345".to_string();
    // Option A: still fails closed when supabase_url is missing in production
    assert!(prod.validate_production_security().is_err());

    prod.supabase_url = "https://example.supabase.co".to_string();
    assert!(prod.validate_production_security().is_ok());

    prod.backend_api_key_previous = "short".to_string();
    assert!(prod.validate_production_security().is_err());
}

#[test]
fn test_supabase_es256_jwk_parsing() {
    let jwks_payload = json!({
        "keys": [{
            "alg": "ES256",
            "crv": "P-256",
            "ext": true,
            "key_ops": ["verify"],
            "kid": "c259f6f0-50e2-4046-b065-93a8820f7c9b",
            "kty": "EC",
            "use": "sig",
            "x": "mtcZYwJb2IyeccJUQWDCpJiptepgxPxbD_h5_ckhuZw",
            "y": "V8237KUKv_rRHC9VPpybxjtAgwlajzgpEUXSU0iZN0I"
        }]
    });
    let jwk_set: jsonwebtoken::jwk::JwkSet =
        serde_json::from_value(jwks_payload).expect("valid Supabase ES256 JWKS");
    assert_eq!(jwk_set.keys.len(), 1);
    jsonwebtoken::DecodingKey::from_jwk(&jwk_set.keys[0]).expect("valid ES256 decoding key");
}

#[tokio::test]
async fn test_supabase_auth_jwks_hs256_profiles_and_portfolio_gating() {
    let mock_server = MockServer::start().await;

    // Generate RS256 keypair and JWKS
    let priv_key = RsaPrivateKey::new(&mut OsRng, 2048).expect("rsa keygen");
    let pub_key = priv_key.to_public_key();
    let n_b64 = URL_SAFE_NO_PAD.encode(pub_key.n().to_bytes_be());
    let e_b64 = URL_SAFE_NO_PAD.encode(pub_key.e().to_bytes_be());
    let pem = priv_key
        .to_pkcs8_pem(rsa::pkcs8::LineEnding::LF)
        .expect("pkcs8 pem");
    let enc_key = EncodingKey::from_rsa_pem(pem.as_bytes()).expect("encoding key");

    Mock::given(method("GET"))
        .and(path("/auth/v1/.well-known/jwks.json"))
        .respond_with(ResponseTemplate::new(200).set_body_json(json!({
            "keys": [{
                "kty": "RSA",
                "use": "sig",
                "alg": "RS256",
                "kid": "test-kid-1",
                "n": n_b64,
                "e": e_b64
            }]
        })))
        .mount(&mock_server)
        .await;

    // User profile endpoint returning role + can_view_cloud_portfolio
    Mock::given(method("GET"))
        .and(path("/rest/v1/user_profiles"))
        .respond_with(ResponseTemplate::new(200).set_body_json(json!([
            {
                "role": "owner",
                "can_view_cloud_portfolio": true
            }
        ])))
        .mount(&mock_server)
        .await;

    // /auth/v1/user endpoint for opaque/HS256 fallback test
    Mock::given(method("GET"))
        .and(path("/auth/v1/user"))
        .respond_with(ResponseTemplate::new(200).set_body_json(json!({
            "id": "usr-api",
            "email": "guest@example.com",
            "is_anonymous": false,
            "email_confirmed_at": "2026-01-01T00:00:00Z",
            "app_metadata": { "provider": "email" }
        })))
        .mount(&mock_server)
        .await;

    let settings = Settings {
        supabase_url: mock_server.uri(),
        supabase_publishable_key: "sb_publishable_test".to_string(),
        authorized_portfolio_emails: vec!["owner@sgsk.io".to_string()],
        ..Settings::default()
    };

    let exp = (chrono::Utc::now().timestamp() + 3600) as u64;
    let issuer = settings.resolved_supabase_issuer();

    let mut header = Header::new(Algorithm::RS256);
    header.kid = Some("test-kid-1".to_string());

    let owner_jwt = encode(
        &header,
        &json!({
            "sub": "usr-owner",
            "email": "owner@sgsk.io",
            "aud": "authenticated",
            "iss": issuer,
            "exp": exp,
            "email_confirmed_at": "2026-01-01T00:00:00Z",
            "app_metadata": { "provider": "google" }
        }),
        &enc_key,
    )
    .unwrap();

    let unconfirmed_owner_jwt = encode(
        &header,
        &json!({
            "sub": "usr-unconfirmed",
            "email": "owner@sgsk.io",
            "aud": "authenticated",
            "iss": issuer,
            "exp": exp,
            "email_confirmed_at": null,
            "app_metadata": { "provider": "email" }
        }),
        &enc_key,
    )
    .unwrap();

    let guest_jwt = encode(
        &header,
        &json!({
            "sub": "usr-guest",
            "email": "other@example.com",
            "aud": "authenticated",
            "iss": issuer,
            "exp": exp,
            "email_confirmed_at": "2026-01-01T00:00:00Z"
        }),
        &enc_key,
    )
    .unwrap();

    let app = create_app(AppState::from_settings(settings.clone()));

    // 1. /auth/me unauthenticated -> authenticated=false
    let anon_me = Request::builder()
        .uri("/auth/me")
        .header("X-API-Key", "dev_secret_key_change_in_prod")
        .body(Body::empty())
        .unwrap();
    let anon_res = app.clone().oneshot(anon_me).await.unwrap();
    assert_eq!(anon_res.status(), StatusCode::OK);
    let anon_json: serde_json::Value =
        serde_json::from_slice(&anon_res.into_body().collect().await.unwrap().to_bytes()).unwrap();
    assert_eq!(anon_json["authenticated"], false);
    assert_eq!(anon_json["canViewCloudPortfolio"], false);

    // 2. /auth/me with verified owner JWT
    let owner_me = Request::builder()
        .uri("/auth/me")
        .header("X-API-Key", "dev_secret_key_change_in_prod")
        .header("Authorization", format!("Bearer {owner_jwt}"))
        .body(Body::empty())
        .unwrap();
    let owner_res = app.clone().oneshot(owner_me).await.unwrap();
    assert_eq!(owner_res.status(), StatusCode::OK);
    let owner_json: serde_json::Value =
        serde_json::from_slice(&owner_res.into_body().collect().await.unwrap().to_bytes()).unwrap();
    assert_eq!(owner_json["authenticated"], true);
    assert_eq!(owner_json["canViewCloudPortfolio"], true);
    assert_eq!(owner_json["email"], "owner@sgsk.io");

    // 3. Portfolio endpoint authorization: missing -> 401, unconfirmed owner -> 403, owner -> passes auth
    let unauth_holdings = Request::builder()
        .uri("/portfolio/holdings")
        .header("X-API-Key", "dev_secret_key_change_in_prod")
        .body(Body::empty())
        .unwrap();
    assert_eq!(
        app.clone().oneshot(unauth_holdings).await.unwrap().status(),
        StatusCode::UNAUTHORIZED
    );

    let unconf_holdings = Request::builder()
        .uri("/portfolio/holdings")
        .header("X-API-Key", "dev_secret_key_change_in_prod")
        .header("Authorization", format!("Bearer {unconfirmed_owner_jwt}"))
        .body(Body::empty())
        .unwrap();
    assert_eq!(
        app.clone().oneshot(unconf_holdings).await.unwrap().status(),
        StatusCode::FORBIDDEN
    );

    // 4. Symbol-lookup gating on /portfolio/tools/simulate & /solve-target
    let sim_payload = json!({
        "symbol": "AAPL",
        "steps": [],
        "currency": "USD"
    })
    .to_string();

    let guest_sim = Request::builder()
        .method("POST")
        .uri("/portfolio/tools/simulate")
        .header("X-API-Key", "dev_secret_key_change_in_prod")
        .header("Content-Type", "application/json")
        .body(Body::from(sim_payload.clone()))
        .unwrap();
    assert_eq!(
        app.clone().oneshot(guest_sim).await.unwrap().status(),
        StatusCode::UNAUTHORIZED
    );

    let forbidden_sim = Request::builder()
        .method("POST")
        .uri("/portfolio/tools/simulate")
        .header("X-API-Key", "dev_secret_key_change_in_prod")
        .header("Authorization", format!("Bearer {unconfirmed_owner_jwt}"))
        .header("Content-Type", "application/json")
        .body(Body::from(sim_payload))
        .unwrap();
    assert_eq!(
        app.clone().oneshot(forbidden_sim).await.unwrap().status(),
        StatusCode::FORBIDDEN
    );

    // /portfolio/tools/solve-target with explicit initialPosition is open to guests
    let guest_solve = Request::builder()
        .method("POST")
        .uri("/portfolio/tools/solve-target")
        .header("X-API-Key", "dev_secret_key_change_in_prod")
        .header("Content-Type", "application/json")
        .body(Body::from(
            json!({
                "initialPosition": { "symbol": "AAPL", "shares": 10, "avgCost": 200, "marketPrice": 150 },
                "targetAvgCost": 175,
                "purchasePrice": 150,
                "feePercent": 0,
                "currency": "USD"
            })
            .to_string(),
        ))
        .unwrap();
    assert_eq!(
        app.clone().oneshot(guest_solve).await.unwrap().status(),
        StatusCode::OK
    );

    // 5. HS256 JWT secret verification check
    let mut hs_settings = settings.clone();
    hs_settings.supabase_jwt_secret = "super_secret_hs256_signing_key_123456".to_string();
    hs_settings.authorized_portfolio_emails = vec!["other@example.com".to_string()];
    let hs_app = create_app(AppState::from_settings(hs_settings));
    let hs_token = encode(
        &Header::new(Algorithm::HS256),
        &json!({
            "sub": "usr-hs",
            "email": "other@example.com",
            "aud": "authenticated",
            "iss": issuer,
            "exp": exp,
            "email_confirmed_at": "2026-01-01T00:00:00Z"
        }),
        &EncodingKey::from_secret(b"super_secret_hs256_signing_key_123456"),
    )
    .unwrap();
    let hs_me = Request::builder()
        .uri("/auth/me")
        .header("X-API-Key", "dev_secret_key_change_in_prod")
        .header("Authorization", format!("Bearer {hs_token}"))
        .body(Body::empty())
        .unwrap();
    let hs_res = hs_app.oneshot(hs_me).await.unwrap();
    assert_eq!(hs_res.status(), StatusCode::OK);
    let hs_json: serde_json::Value =
        serde_json::from_slice(&hs_res.into_body().collect().await.unwrap().to_bytes()).unwrap();
    assert_eq!(hs_json["authenticated"], true);
    assert_eq!(hs_json["canViewCloudPortfolio"], true);

    // 6. Guest JWT & Auth API fallback with opaque HS256 token when secret is unset
    let guest_me = Request::builder()
        .uri("/auth/me")
        .header("X-API-Key", "dev_secret_key_change_in_prod")
        .header("Authorization", format!("Bearer {guest_jwt}"))
        .body(Body::empty())
        .unwrap();
    let guest_res = app.clone().oneshot(guest_me).await.unwrap();
    assert_eq!(guest_res.status(), StatusCode::OK);
    let guest_json: serde_json::Value =
        serde_json::from_slice(&guest_res.into_body().collect().await.unwrap().to_bytes()).unwrap();
    assert_eq!(guest_json["authenticated"], true);
    assert_eq!(guest_json["canViewCloudPortfolio"], false);

    let fallback_me = Request::builder()
        .uri("/auth/me")
        .header("X-API-Key", "dev_secret_key_change_in_prod")
        .header("Authorization", format!("Bearer {hs_token}"))
        .body(Body::empty())
        .unwrap();
    let fb_res = app.oneshot(fallback_me).await.unwrap();
    assert_eq!(fb_res.status(), StatusCode::OK);
    let fb_json: serde_json::Value =
        serde_json::from_slice(&fb_res.into_body().collect().await.unwrap().to_bytes()).unwrap();
    assert_eq!(fb_json["authenticated"], true);
    assert_eq!(fb_json["role"], "owner");
    assert_eq!(fb_json["canViewCloudPortfolio"], false);
}

#[tokio::test]
async fn test_complete_route_authorization_matrix_and_fail_closed_prod() {
    let mock_server = MockServer::start().await;

    let priv_key = RsaPrivateKey::new(&mut OsRng, 2048).expect("rsa keygen");
    let pub_key = priv_key.to_public_key();
    let n_b64 = URL_SAFE_NO_PAD.encode(pub_key.n().to_bytes_be());
    let e_b64 = URL_SAFE_NO_PAD.encode(pub_key.e().to_bytes_be());
    let pem = priv_key
        .to_pkcs8_pem(rsa::pkcs8::LineEnding::LF)
        .expect("pkcs8 pem");
    let enc_key = EncodingKey::from_rsa_pem(pem.as_bytes()).expect("encoding key");

    Mock::given(method("GET"))
        .and(path("/auth/v1/.well-known/jwks.json"))
        .respond_with(ResponseTemplate::new(200).set_body_json(json!({
            "keys": [{
                "kty": "RSA",
                "use": "sig",
                "alg": "RS256",
                "kid": "matrix-kid-1",
                "n": n_b64,
                "e": e_b64
            }]
        })))
        .mount(&mock_server)
        .await;

    // Simulate Supabase PostgREST outage (HTTP 500) to test fail-closed production owner check
    Mock::given(method("GET"))
        .and(path("/rest/v1/user_profiles"))
        .respond_with(ResponseTemplate::new(500).set_body_string("upstream error"))
        .mount(&mock_server)
        .await;

    let prod_api_key = "prod_super_secure_api_key_at_least_32_chars!";
    let prod_settings = Settings {
        environment: "production".to_string(),
        backend_api_key: prod_api_key.to_string(),
        google_spreadsheet_id: "real_sheet_id_prod".to_string(),
        supabase_url: mock_server.uri(),
        supabase_publishable_key: "sb_publishable_prod_test".to_string(),
        authorized_portfolio_emails: vec!["owner@sgsk.io".to_string()],
        ..Settings::default()
    };
    assert!(prod_settings.validate_production_security().is_ok());

    let app = create_app(AppState::from_settings(prod_settings.clone()));
    let issuer = prod_settings.resolved_supabase_issuer();
    let future_exp = (chrono::Utc::now().timestamp() + 3600) as u64;
    let past_exp = (chrono::Utc::now().timestamp() - 3600) as u64;

    let mut header = Header::new(Algorithm::RS256);
    header.kid = Some("matrix-kid-1".to_string());

    let make_jwt = |claims: serde_json::Value| encode(&header, &claims, &enc_key).unwrap();

    let owner_jwt = make_jwt(json!({
        "sub": "usr-owner-matrix",
        "email": "owner@sgsk.io",
        "aud": "authenticated",
        "iss": issuer,
        "exp": future_exp,
        "email_confirmed_at": "2026-01-01T00:00:00Z"
    }));
    let non_owner_jwt = make_jwt(json!({
        "sub": "usr-standard-matrix",
        "email": "standard@example.com",
        "aud": "authenticated",
        "iss": issuer,
        "exp": future_exp,
        "email_confirmed_at": "2026-01-01T00:00:00Z"
    }));
    let unconfirmed_owner_jwt = make_jwt(json!({
        "sub": "usr-unconf-matrix",
        "email": "owner@sgsk.io",
        "aud": "authenticated",
        "iss": issuer,
        "exp": future_exp,
        "email_confirmed_at": null
    }));
    let expired_jwt = make_jwt(json!({
        "sub": "usr-exp",
        "email": "owner@sgsk.io",
        "aud": "authenticated",
        "iss": issuer,
        "exp": past_exp,
        "email_confirmed_at": "2026-01-01T00:00:00Z"
    }));
    let wrong_aud_jwt = make_jwt(json!({
        "sub": "usr-aud",
        "email": "owner@sgsk.io",
        "aud": "wrong-audience",
        "iss": issuer,
        "exp": future_exp
    }));
    let wrong_iss_jwt = make_jwt(json!({
        "sub": "usr-iss",
        "email": "owner@sgsk.io",
        "aud": "authenticated",
        "iss": "https://evil.example.com/auth/v1",
        "exp": future_exp
    }));
    let anon_jwt = make_jwt(json!({
        "sub": "usr-anon",
        "email": "owner@sgsk.io",
        "aud": "authenticated",
        "iss": issuer,
        "exp": future_exp,
        "is_anonymous": true
    }));

    // 1. All 16 API-key-protected routes reject missing and invalid X-API-Key
    let api_key_routes: &[(&str, &str, Option<&str>)] = &[
        ("GET", "/", None),
        ("GET", "/auth/me", None),
        ("GET", "/portfolio/holdings", None),
        ("GET", "/portfolio/performance", None),
        ("POST", "/portfolio/allocation", Some("{}")),
        ("GET", "/portfolio/dividend", None),
        ("GET", "/share-lot/sheet/us-stock", None),
        ("GET", "/share-lot/sheets", None),
        (
            "POST",
            "/portfolio/tools/simulate",
            Some(r#"{"symbol":"AAPL","steps":[],"currency":"USD"}"#),
        ),
        (
            "POST",
            "/portfolio/tools/solve-target",
            Some(
                r#"{"symbol":"AAPL","targetAvgCost":100,"purchasePrice":90,"feePercent":0,"currency":"USD"}"#,
            ),
        ),
        (
            "POST",
            "/portfolio/tools/tvm",
            Some(
                r#"{"mode":"FV","presentValue":1000,"annualRate":5,"years":1,"compounding":"ANNUALLY"}"#,
            ),
        ),
        (
            "POST",
            "/portfolio/tools/rebalance",
            Some(r#"{"mode":"FULL_REBALANCE","targetAllocations":{},"currency":"USD"}"#),
        ),
        ("POST", "/price/fetch-prices", Some(r#"{"summaries":[]}"#)),
        ("GET", "/price/exchange-rate", None),
        ("POST", "/nav/fetch", Some(r#"{"symbols":[]}"#)),
        ("GET", "/nav/factsheet?symbol=KFSDIV", None),
    ];

    for (m, uri, body_opt) in api_key_routes {
        let mut req_no_key = Request::builder()
            .method(*m)
            .uri(*uri)
            .header("Content-Type", "application/json")
            .body(
                body_opt
                    .map(|b| Body::from(b.to_string()))
                    .unwrap_or_else(Body::empty),
            )
            .unwrap();
        assert_eq!(
            app.clone().oneshot(req_no_key).await.unwrap().status(),
            StatusCode::UNAUTHORIZED,
            "missing X-API-Key should 401 on {m} {uri}"
        );

        req_no_key = Request::builder()
            .method(*m)
            .uri(*uri)
            .header("X-API-Key", "wrong-api-key")
            .header("Content-Type", "application/json")
            .body(
                body_opt
                    .map(|b| Body::from(b.to_string()))
                    .unwrap_or_else(Body::empty),
            )
            .unwrap();
        assert_eq!(
            app.clone().oneshot(req_no_key).await.unwrap().status(),
            StatusCode::UNAUTHORIZED,
            "wrong X-API-Key should 401 on {m} {uri}"
        );
    }

    // Public icon routes (3 routes) remain accessible without X-API-Key
    for uri in ["/icon/meta/AAPL", "/icon?symbol=AAPL", "/icon/AAPL"] {
        let req = Request::builder().uri(uri).body(Body::empty()).unwrap();
        assert_eq!(
            app.clone().oneshot(req).await.unwrap().status(),
            StatusCode::OK,
            "public icon route {uri} should return 200"
        );
    }

    // 2. Owner-only routes (+ conditional tool lookups) enforce JWT & owner checks even with X-App-Source headers
    let owner_routes: &[(&str, &str, Option<&str>)] = &[
        ("GET", "/portfolio/holdings", None),
        ("GET", "/portfolio/performance", None),
        ("POST", "/portfolio/allocation", Some("{}")),
        ("GET", "/portfolio/dividend", None),
        ("GET", "/share-lot/sheet/us-stock", None),
        ("GET", "/share-lot/sheets", None),
        (
            "POST",
            "/portfolio/tools/rebalance",
            Some(r#"{"mode":"FULL_REBALANCE","targetAllocations":{},"currency":"USD"}"#),
        ),
        (
            "POST",
            "/portfolio/tools/simulate",
            Some(r#"{"symbol":"AAPL","steps":[],"currency":"USD"}"#),
        ),
        (
            "POST",
            "/portfolio/tools/solve-target",
            Some(
                r#"{"symbol":"AAPL","targetAvgCost":100,"purchasePrice":90,"feePercent":0,"currency":"USD"}"#,
            ),
        ),
    ];

    for (m, uri, body_opt) in owner_routes {
        // Missing JWT with X-App-Source diagnostic headers still 401
        let missing_jwt = Request::builder()
            .method(*m)
            .uri(*uri)
            .header("X-API-Key", prod_api_key)
            .header("X-App-Source", "SGSK-Wealth")
            .header("X-Requested-With", "SGSK-Wealth-Client")
            .header("Content-Type", "application/json")
            .body(
                body_opt
                    .map(|b| Body::from(b.to_string()))
                    .unwrap_or_else(Body::empty),
            )
            .unwrap();
        assert_eq!(
            app.clone().oneshot(missing_jwt).await.unwrap().status(),
            StatusCode::UNAUTHORIZED,
            "missing JWT must 401 on {m} {uri}"
        );

        // Invalid/expired/wrong-aud/wrong-iss/anonymous tokens -> 401
        for bad_tok in [
            "not.a.jwt",
            expired_jwt.as_str(),
            wrong_aud_jwt.as_str(),
            wrong_iss_jwt.as_str(),
            anon_jwt.as_str(),
        ] {
            let req = Request::builder()
                .method(*m)
                .uri(*uri)
                .header("X-API-Key", prod_api_key)
                .header("X-App-Source", "SGSK-Wealth")
                .header("Authorization", format!("Bearer {bad_tok}"))
                .header("Content-Type", "application/json")
                .body(
                    body_opt
                        .map(|b| Body::from(b.to_string()))
                        .unwrap_or_else(Body::empty),
                )
                .unwrap();
            assert_eq!(
                app.clone().oneshot(req).await.unwrap().status(),
                StatusCode::UNAUTHORIZED,
                "invalid JWT must 401 on {m} {uri}"
            );
        }

        // Non-owner and unconfirmed owner -> 403
        for forbidden_tok in [non_owner_jwt.as_str(), unconfirmed_owner_jwt.as_str()] {
            let req = Request::builder()
                .method(*m)
                .uri(*uri)
                .header("X-API-Key", prod_api_key)
                .header("X-App-Source", "SGSK-Wealth")
                .header("Authorization", format!("Bearer {forbidden_tok}"))
                .header("Content-Type", "application/json")
                .body(
                    body_opt
                        .map(|b| Body::from(b.to_string()))
                        .unwrap_or_else(Body::empty),
                )
                .unwrap();
            assert_eq!(
                app.clone().oneshot(req).await.unwrap().status(),
                StatusCode::FORBIDDEN,
                "non-owner/unconfirmed must 403 on {m} {uri}"
            );
        }

        // Fail-closed in production when PostgREST user_profiles fails (500) -> 403 even for allowlisted owner JWT
        let fail_closed_req = Request::builder()
            .method(*m)
            .uri(*uri)
            .header("X-API-Key", prod_api_key)
            .header("Authorization", format!("Bearer {owner_jwt}"))
            .header("Content-Type", "application/json")
            .body(
                body_opt
                    .map(|b| Body::from(b.to_string()))
                    .unwrap_or_else(Body::empty),
            )
            .unwrap();
        assert_eq!(
            app.clone().oneshot(fail_closed_req).await.unwrap().status(),
            StatusCode::FORBIDDEN,
            "production must fail-closed to 403 when user_profiles lookup fails on {m} {uri}"
        );
    }

    // 3. /auth/me confirms fail-closed state when user_profiles is unreachable in production
    let auth_me_req = Request::builder()
        .uri("/auth/me")
        .header("X-API-Key", prod_api_key)
        .header("Authorization", format!("Bearer {owner_jwt}"))
        .body(Body::empty())
        .unwrap();
    let auth_me_res = app.oneshot(auth_me_req).await.unwrap();
    assert_eq!(auth_me_res.status(), StatusCode::OK);
    let auth_me_json: serde_json::Value =
        serde_json::from_slice(&auth_me_res.into_body().collect().await.unwrap().to_bytes())
            .unwrap();
    assert_eq!(auth_me_json["authenticated"], true);
    assert_eq!(auth_me_json["role"], "user");
    assert_eq!(auth_me_json["canViewCloudPortfolio"], false);
    assert_eq!(auth_me_json["portfolioSource"], "local");
}
