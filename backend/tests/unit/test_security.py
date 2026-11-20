import pytest


@pytest.mark.unit
def test_auth_unauthorized_without_api_key(unauth_api_client):
    res = unauth_api_client.get("/share-lot/sheets")
    assert res.status_code == 401
    assert res.json()["detail"] == "Invalid or missing API Key"


@pytest.mark.unit
def test_auth_unauthorized_with_wrong_api_key(unauth_api_client):
    res = unauth_api_client.get("/share-lot/sheets", headers={"X-API-Key": "wrong_key"})
    assert res.status_code == 401


@pytest.mark.unit
def test_auth_authorized_with_valid_api_key(api_client, mocked_external_apis):
    res = api_client.get("/share-lot/sheets")
    assert res.status_code == 200


@pytest.mark.unit
def test_auth_accepts_previous_key_during_rotation(
    unauth_api_client, owner_bearer_token, monkeypatch, mocked_external_apis
):
    from config.settings import Settings

    rotation_settings = Settings(
        backend_api_key="new_rotation_key_which_is_long_enough_1234567890",
        backend_api_key_previous="previous_rotation_key_which_is_long_enough_1234567890",
    )
    monkeypatch.setattr("utils.auth.get_settings", lambda: rotation_settings)

    res = unauth_api_client.get(
        "/share-lot/sheets",
        headers={
            "X-API-Key": "previous_rotation_key_which_is_long_enough_1234567890",
            "Authorization": f"Bearer {owner_bearer_token}",
        },
    )
    assert res.status_code == 200


@pytest.mark.unit
def test_auth_rejects_key_not_in_rotation_set(unauth_api_client, monkeypatch):
    from config.settings import Settings

    rotation_settings = Settings(
        backend_api_key="new_rotation_key_which_is_long_enough_1234567890",
        backend_api_key_previous="previous_rotation_key_which_is_long_enough_1234567890",
    )
    monkeypatch.setattr("utils.auth.get_settings", lambda: rotation_settings)

    res = unauth_api_client.get("/share-lot/sheets", headers={"X-API-Key": "unrecognized_key"})
    assert res.status_code == 401


@pytest.mark.unit
def test_security_headers_present(api_client, mocked_external_apis):
    res = api_client.get("/share-lot/sheets")
    assert res.headers.get("X-Content-Type-Options") == "nosniff"
    assert res.headers.get("X-Frame-Options") == "DENY"
    assert res.headers.get("X-XSS-Protection") == "1; mode=block"
    assert res.headers.get("Referrer-Policy") == "strict-origin-when-cross-origin"
    assert "max-age=31536000" in res.headers.get("Strict-Transport-Security", "")


@pytest.mark.unit
def test_payload_bounding_nav_request(api_client):
    too_many_symbols = [f"FUND{i}" for i in range(51)]
    res = api_client.post("/nav/fetch", json={"symbols": too_many_symbols})
    assert res.status_code == 422


@pytest.mark.unit
def test_payload_bounding_summaries_request(api_client):
    too_many_summaries = [{"symbol": f"SYM{i}", "assetType": "us-stock"} for i in range(51)]
    res = api_client.post("/price/fetch-prices", json={"summaries": too_many_summaries})
    assert res.status_code == 422


@pytest.mark.unit
def test_direct_access_to_vercel_backend_blocked(api_client, mocked_external_apis):
    # Direct access with host sgsk-backend.vercel.app and no proxy/app headers is blocked
    res = api_client.get(
        "/share-lot/sheets",
        headers={"Host": "sgsk-backend.vercel.app"},
    )
    assert res.status_code == 403
    assert "Direct access to backend origin is prohibited" in res.json()["detail"]

    # Direct access with new host api-sgsk-wealth.vercel.app and no proxy/app headers is also blocked
    res_wealth = api_client.get(
        "/share-lot/sheets",
        headers={"Host": "api-sgsk-wealth.vercel.app"},
    )
    assert res_wealth.status_code == 403
    assert "Direct access to backend origin is prohibited" in res_wealth.json()["detail"]


@pytest.mark.unit
def test_direct_access_root_to_vercel_backend_blocked(api_client):
    # Direct access to root / on sgsk-backend.vercel.app is blocked
    res = api_client.get(
        "/",
        headers={"Host": "sgsk-backend.vercel.app"},
    )
    assert res.status_code == 403
    assert "Direct access to backend origin is prohibited" in res.json()["detail"]

    res_wealth = api_client.get(
        "/",
        headers={"Host": "api-sgsk-wealth.vercel.app"},
    )
    assert res_wealth.status_code == 403
    assert "Direct access to backend origin is prohibited" in res_wealth.json()["detail"]


@pytest.mark.unit
def test_forwarded_proxy_access_to_vercel_backend_allowed(api_client, mocked_external_apis):
    # Access rewritten from frontend proxy (x-forwarded-host) is allowed
    res = api_client.get(
        "/share-lot/sheets",
        headers={
            "Host": "api-sgsk-wealth.vercel.app",
            "X-Forwarded-Host": "sgsk-wealth.vercel.app",
        },
    )
    assert res.status_code == 200


@pytest.mark.unit
def test_app_source_signature_access_to_vercel_backend_allowed(api_client, mocked_external_apis):
    # Access with verified app signature header is allowed for both ShareLot and SGSK-Wealth
    res = api_client.get(
        "/share-lot/sheets",
        headers={
            "Host": "api-sgsk-wealth.vercel.app",
            "X-App-Source": "ShareLot",
        },
    )
    assert res.status_code == 200

    res_wealth = api_client.get(
        "/share-lot/sheets",
        headers={
            "Host": "api-sgsk-wealth.vercel.app",
            "X-App-Source": "SGSK-Wealth",
        },
    )
    assert res_wealth.status_code == 200

    res_mobile = api_client.get(
        "/share-lot/sheets",
        headers={
            "Host": "api-sgsk-wealth.vercel.app",
            "X-App-Source": "SGSK-Wealth-Mobile",
        },
    )
    assert res_mobile.status_code == 200


@pytest.mark.unit
def test_production_settings_validation():
    from config.settings import Settings

    # Insecure default key in production must fail fast
    with pytest.raises(ValueError, match="CRITICAL: BACKEND_API_KEY must be securely configured"):
        Settings(
            environment="production",
            backend_api_key="dev_secret_key_change_in_prod",
            google_spreadsheet_id="valid_sheet_id",
        )

    # Short key in production must fail fast
    with pytest.raises(ValueError, match="at least 32 characters"):
        Settings(
            environment="production",
            backend_api_key="short_custom_key_less_than_32",
            google_spreadsheet_id="valid_sheet_id",
        )

    # Missing real spreadsheet ID in production must fail fast
    with pytest.raises(ValueError, match="CRITICAL: GOOGLE_SPREADSHEET_ID"):
        Settings(
            environment="production",
            backend_api_key="a" * 32,
            google_spreadsheet_id="sample_spreadsheet_id",
        )

    # Valid production settings must pass
    prod_settings = Settings(
        environment="production",
        backend_api_key="a" * 32,
        google_spreadsheet_id="custom_production_sheet_id_xyz",
    )
    assert prod_settings.environment == "production"

    # A secure previous key may be configured temporarily during rotation.
    rotation_settings = Settings(
        environment="production",
        backend_api_key="a" * 32,
        backend_api_key_previous="b" * 32,
        google_spreadsheet_id="custom_production_sheet_id_xyz",
    )
    assert rotation_settings.backend_api_key_previous == "b" * 32

    with pytest.raises(ValueError, match="CRITICAL: SUPABASE_URL"):
        Settings(
            environment="production",
            backend_api_key="a" * 32,
            google_spreadsheet_id="custom_production_sheet_id_xyz",
            supabase_url="",
        )

    with pytest.raises(ValueError, match="CRITICAL: AUTHORIZED_PORTFOLIO_EMAILS"):
        Settings(
            environment="production",
            backend_api_key="a" * 32,
            google_spreadsheet_id="custom_production_sheet_id_xyz",
            authorized_portfolio_emails=[],
        )


@pytest.mark.unit
@pytest.mark.parametrize(
    ("method", "endpoint", "body"),
    [
        ("GET", "/share-lot/sheets", None),
        ("GET", "/share-lot/sheet/us-stock", None),
        ("GET", "/portfolio/holdings", None),
        ("GET", "/portfolio/performance", None),
        ("GET", "/portfolio/dividend", None),
        ("POST", "/portfolio/allocation", {}),
        ("POST", "/portfolio/tools/rebalance", {"mode": "standard", "targetAllocations": {}, "currency": "THB"}),
    ],
)
def test_portfolio_endpoints_require_bearer_jwt(api_key_only_client, method, endpoint, body):
    res = api_key_only_client.post(endpoint, json=body) if method == "POST" else api_key_only_client.get(endpoint)
    assert res.status_code == 401
    assert res.json()["detail"] == "Authentication required"


@pytest.mark.unit
@pytest.mark.parametrize(
    ("method", "endpoint", "body"),
    [
        ("GET", "/share-lot/sheets", None),
        ("GET", "/share-lot/sheet/us-stock", None),
        ("GET", "/portfolio/holdings", None),
        ("GET", "/portfolio/performance", None),
        ("GET", "/portfolio/dividend", None),
        ("POST", "/portfolio/allocation", {}),
        ("POST", "/portfolio/tools/rebalance", {"mode": "standard", "targetAllocations": {}, "currency": "THB"}),
    ],
)
def test_portfolio_endpoints_forbid_non_owner_user(non_owner_api_client, method, endpoint, body):
    res = non_owner_api_client.post(endpoint, json=body) if method == "POST" else non_owner_api_client.get(endpoint)
    assert res.status_code == 403
    assert "restricted to authorized accounts" in res.json()["detail"]


@pytest.mark.unit
def test_rejects_invalid_expired_and_anonymous_jwts(api_key_only_client):
    from tests.conftest import build_test_supabase_jwt

    invalid_res = api_key_only_client.get("/portfolio/holdings", headers={"Authorization": "Bearer not-a-jwt"})
    assert invalid_res.status_code == 401

    expired_token = build_test_supabase_jwt(expired=True)
    expired_res = api_key_only_client.get(
        "/portfolio/holdings", headers={"Authorization": f"Bearer {expired_token}"}
    )
    assert expired_res.status_code == 401

    anon_token = build_test_supabase_jwt(is_anonymous=True)
    anon_res = api_key_only_client.get("/portfolio/holdings", headers={"Authorization": f"Bearer {anon_token}"})
    assert anon_res.status_code == 401

    unconfirmed_owner = build_test_supabase_jwt(email="vipatpolk@gmail.com", email_confirmed=False)
    unconfirmed_res = api_key_only_client.get(
        "/portfolio/holdings", headers={"Authorization": f"Bearer {unconfirmed_owner}"}
    )
    assert unconfirmed_res.status_code == 403


@pytest.mark.unit
def test_auth_me_returns_expected_states(api_key_only_client, non_owner_api_client, api_client):
    guest_res = api_key_only_client.get("/auth/me")
    assert guest_res.status_code == 200
    assert guest_res.json() == {
        "authenticated": False,
        "userId": None,
        "email": None,
        "role": "guest",
        "providers": [],
        "canViewCloudPortfolio": False,
        "portfolioSource": "local",
    }

    non_owner_res = non_owner_api_client.get("/auth/me")
    assert non_owner_res.status_code == 200
    non_owner_data = non_owner_res.json()
    assert non_owner_data["authenticated"] is True
    assert non_owner_data["email"] == "other.investor@example.com"
    assert non_owner_data["canViewCloudPortfolio"] is False
    assert non_owner_data["portfolioSource"] == "local"

    owner_res = api_client.get("/auth/me")
    assert owner_res.status_code == 200
    owner_data = owner_res.json()
    assert owner_data["authenticated"] is True
    assert owner_data["email"] == "vipatpolk@gmail.com"
    assert owner_data["role"] == "owner"
    assert owner_data["canViewCloudPortfolio"] is True
    assert owner_data["portfolioSource"] == "google_sheets"


@pytest.mark.unit
def test_tools_symbol_lookup_protected_while_stateless_tools_and_market_open_to_guests(
    api_key_only_client, non_owner_api_client, api_client, mocked_external_apis
):
    # Stateless TVM works for guests with API key
    tvm_res = api_key_only_client.post(
        "/portfolio/tools/tvm",
        json={"mode": "FV", "presentValue": 1000, "payment": 100, "annualRatePct": 8, "years": 5},
    )
    assert tvm_res.status_code == 200

    # Explicit snapshot simulation works for guests
    explicit_sim = api_key_only_client.post(
        "/portfolio/tools/simulate",
        json={
            "initialPosition": {"symbol": "AAPL", "shares": 10, "avgCost": 100, "marketPrice": 120, "currency": "USD"},
            "steps": [{"action": "BUY", "shares": 5, "price": 110}],
            "currency": "USD",
        },
    )
    assert explicit_sim.status_code == 200

    # Symbol lookup without initialPosition is gated: 401 for guest, 403 for non-owner, 200 for owner
    guest_lookup = api_key_only_client.post(
        "/portfolio/tools/simulate",
        json={"symbol": "AAPL", "steps": [{"action": "BUY", "shares": 5, "price": 110}], "currency": "USD"},
    )
    assert guest_lookup.status_code == 401

    non_owner_lookup = non_owner_api_client.post(
        "/portfolio/tools/solve-target",
        json={"symbol": "AAPL", "targetAvgCost": 95, "purchasePrice": 80, "currency": "USD"},
    )
    assert non_owner_lookup.status_code == 403

    owner_lookup = api_client.post(
        "/portfolio/tools/simulate",
        json={"symbol": "AAPL", "steps": [{"action": "BUY", "shares": 5, "price": 110}], "currency": "USD"},
    )
    assert owner_lookup.status_code == 200

    # Public market rate works for guests
    fx_res = api_key_only_client.get("/price/exchange-rate")
    assert fx_res.status_code == 200
    assert fx_res.json()["rate"] == 35.0


@pytest.mark.unit
@pytest.mark.asyncio
async def test_supabase_verifier_jwks_hs256_and_profile_checks(monkeypatch, respx_mock):
    from datetime import datetime, timedelta, timezone

    import jwt

    from config.settings import Settings
    from tests.conftest import _TEST_PUBLIC_JWK, build_test_supabase_jwt
    from utils.supabase_auth import SupabaseTokenVerifier

    verifier = SupabaseTokenVerifier()

    # 1. Real JWKS HTTP fetch path with respx
    jwks_url = "https://mock.supabase.co/auth/v1/.well-known/jwks.json"
    respx_mock.get(jwks_url).respond(status_code=200, json={"keys": [_TEST_PUBLIC_JWK]})

    settings_jwks = Settings(
        supabase_url="https://mock.supabase.co",
        authorized_portfolio_emails=["vipatpolk@gmail.com"],
    )
    rs256_token = build_test_supabase_jwt(
        email="vipatpolk@gmail.com",
        iss="https://mock.supabase.co/auth/v1",
    )
    user = await verifier.verify_token(rs256_token, settings=settings_jwks)
    assert user.email == "vipatpolk@gmail.com"
    assert user.can_view_cloud_portfolio is True

    # 2. HS256 secret verification path
    now = datetime.now(timezone.utc)
    hs_secret = "super-secret-hs256-signing-key-at-least-32-chars"
    hs_token = jwt.encode(
        {
            "sub": "user-hs-1",
            "email": "vipatpolk@gmail.com",
            "aud": "authenticated",
            "iss": "https://mock.supabase.co/auth/v1",
            "iat": int(now.timestamp()),
            "exp": int((now + timedelta(minutes=30)).timestamp()),
            "app_metadata": {"providers": ["email"]},
        },
        hs_secret,
        algorithm="HS256",
    )
    settings_hs = Settings(
        supabase_url="https://mock.supabase.co",
        supabase_jwt_secret=hs_secret,
        authorized_portfolio_emails=["vipatpolk@gmail.com"],
    )
    hs_user = await verifier.verify_token(hs_token, settings=settings_hs)
    assert hs_user.user_id == "user-hs-1"
    assert hs_user.can_view_cloud_portfolio is True

    # 3. Auth API fallback + user_profiles RLS verification when publishable key is configured
    respx_mock.get("https://mock.supabase.co/auth/v1/user").respond(
        status_code=200,
        json={
            "id": "user-hs-1",
            "email": "vipatpolk@gmail.com",
            "email_confirmed_at": now.isoformat(),
            "app_metadata": {"providers": ["email", "google"]},
        },
    )
    respx_mock.get("https://mock.supabase.co/rest/v1/user_profiles").respond(
        status_code=200,
        json=[{"role": "owner", "can_view_cloud_portfolio": True}],
    )
    settings_api = Settings(
        supabase_url="https://mock.supabase.co",
        supabase_publishable_key="sb_publishable_test_key",
        authorized_portfolio_emails=["vipatpolk@gmail.com"],
    )
    api_user = await verifier.verify_token(hs_token, settings=settings_api)
    assert api_user.role == "owner"
    assert api_user.providers == ["email", "google"]
    assert api_user.can_view_cloud_portfolio is True

    # 4. Non-Bearer auth header rejected
    from fastapi import HTTPException
    from fastapi.security import HTTPAuthorizationCredentials

    from utils.supabase_auth import get_optional_current_user

    with pytest.raises(HTTPException) as exc_info:
        await get_optional_current_user(HTTPAuthorizationCredentials(scheme="Basic", credentials="abc"))
    assert exc_info.value.status_code == 401


@pytest.mark.unit
def test_resolved_allowed_origins_preserves_native_mobile_origins():
    from config.settings import Settings

    settings = Settings(allowed_origins=["https://sgsk-wealth.vercel.app/"])
    resolved = settings.resolved_allowed_origins

    assert resolved[0] == "https://sgsk-wealth.vercel.app"
    for native_origin in ("http://localhost", "https://localhost", "capacitor://localhost"):
        assert native_origin in resolved
    assert len(resolved) == len(set(resolved))


@pytest.mark.unit
def test_mobile_capacitor_cors_preflight_and_api_request(api_key_only_client, mocked_external_apis):
    preflight_res = api_key_only_client.options(
        "/price/exchange-rate",
        headers={
            "Origin": "capacitor://localhost",
            "Access-Control-Request-Method": "GET",
            "Access-Control-Request-Headers": "X-App-Source, X-Requested-With, Authorization",
        },
    )
    assert preflight_res.status_code == 200
    assert preflight_res.headers.get("access-control-allow-origin") == "capacitor://localhost"

    api_res = api_key_only_client.get(
        "/price/exchange-rate",
        headers={
            "Origin": "http://localhost",
            "X-App-Source": "SGSK-Wealth-Mobile",
            "X-Requested-With": "SGSK-Wealth-Capacitor",
        },
    )
    assert api_res.status_code == 200
    assert api_res.headers.get("access-control-allow-origin") == "http://localhost"


@pytest.mark.unit
def test_icon_endpoint_allowed_on_preview_host_containing_backend(unauth_api_client, monkeypatch):
    async def _mock_get_symbol_icon(symbol: str, asset_type: str = "", fund_name: str = "") -> tuple[bytes, str]:
        return b"<svg></svg>", "image/svg+xml"

    monkeypatch.setattr("routers.icon.service.get_symbol_icon", _mock_get_symbol_icon)

    res = unauth_api_client.get(
        "/icon/AAPL?asset_type=us-stock",
        headers={
            "Host": "sgsk-wealth-git-vercel-backend-preview.vercel.app",
            "Sec-Fetch-Dest": "image",
            "Accept": "image/svg+xml,image/*,*/*;q=0.8",
        },
    )
    assert res.status_code == 200
    assert "image/svg+xml" in res.headers.get("content-type", "")
