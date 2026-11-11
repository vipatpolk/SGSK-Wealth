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
