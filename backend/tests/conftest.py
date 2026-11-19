import json
import os
import re
from datetime import datetime, timedelta, timezone
from typing import Any

import jwt
import pytest
from cryptography.hazmat.primitives.asymmetric import rsa
from fastapi.testclient import TestClient

from main import app
from services.nav_service import NavService
from services.price_service import PriceService
from services.share_lot_service import ShareLotService
from utils.cache import ttl_cache
from utils.supabase_auth import SupabaseTokenVerifier
from utils.yfinance_client import YahooQuote, YFinanceClient

FIXTURES_DIR = os.path.join(os.path.dirname(__file__), "fixtures")

_TEST_PRIVATE_KEY = rsa.generate_private_key(public_exponent=65537, key_size=2048)
_TEST_PUBLIC_JWK = jwt.algorithms.RSAAlgorithm.to_jwk(_TEST_PRIVATE_KEY.public_key(), as_dict=True)
_TEST_PUBLIC_JWK["kid"] = "test-key-1"
_TEST_PUBLIC_JWK["use"] = "sig"
_TEST_PUBLIC_JWK["alg"] = "RS256"
_TEST_JWKS = jwt.PyJWKSet.from_dict({"keys": [_TEST_PUBLIC_JWK]})


def build_test_supabase_jwt(
    email: str = "vipatpolk@gmail.com",
    sub: str = "00000000-0000-0000-0000-000000000001",
    *,
    is_anonymous: bool = False,
    expired: bool = False,
    aud: str = "authenticated",
    iss: str = "https://jjdnxifgpbdvntfwhyzz.supabase.co/auth/v1",
    providers: list[str] | None = None,
    email_confirmed: bool = True,
) -> str:
    now = datetime.now(timezone.utc)
    exp = now - timedelta(minutes=5) if expired else now + timedelta(hours=1)
    payload: dict[str, Any] = {
        "sub": sub,
        "email": email,
        "aud": aud,
        "iss": iss,
        "iat": int(now.timestamp()),
        "exp": int(exp.timestamp()),
        "role": "authenticated",
        "is_anonymous": is_anonymous,
        "app_metadata": {
            "provider": (providers or ["email"])[0],
            "providers": providers or ["email"],
        },
        "email_confirmed_at": now.isoformat() if email_confirmed else None,
    }
    return str(
        jwt.encode(
            payload,
            _TEST_PRIVATE_KEY,
            algorithm="RS256",
            headers={"kid": "test-key-1"},
        )
    )


@pytest.fixture(autouse=True)
def mock_supabase_jwks(monkeypatch):
    async def _mock_fetch_jwks_set(self, jwks_url: str, force_refresh: bool = False) -> jwt.PyJWKSet:
        return _TEST_JWKS

    monkeypatch.setattr(SupabaseTokenVerifier, "_fetch_jwks_set", _mock_fetch_jwks_set)


@pytest.fixture(autouse=True)
def clear_ttl_cache_between_tests():
    ttl_cache.clear()
    yield
    ttl_cache.clear()


@pytest.fixture
def owner_bearer_token() -> str:
    return build_test_supabase_jwt(email="vipatpolk@gmail.com", providers=["email", "google"])


@pytest.fixture
def non_owner_bearer_token() -> str:
    return build_test_supabase_jwt(
        email="other.investor@example.com",
        sub="00000000-0000-0000-0000-000000000002",
    )


@pytest.fixture
def api_client(owner_bearer_token):
    return TestClient(
        app,
        headers={
            "X-API-Key": "dev_secret_key_change_in_prod",
            "Authorization": f"Bearer {owner_bearer_token}",
        },
    )


@pytest.fixture
def api_key_only_client():
    return TestClient(app, headers={"X-API-Key": "dev_secret_key_change_in_prod"})


@pytest.fixture
def non_owner_api_client(non_owner_bearer_token):
    return TestClient(
        app,
        headers={
            "X-API-Key": "dev_secret_key_change_in_prod",
            "Authorization": f"Bearer {non_owner_bearer_token}",
        },
    )


@pytest.fixture
def unauth_api_client():
    return TestClient(app)


@pytest.fixture
def share_lot_service():
    return ShareLotService()


@pytest.fixture
def price_service():
    return PriceService()


@pytest.fixture
def nav_service():
    return NavService()


@pytest.fixture
def fixture_us_stock_csv():
    with open(os.path.join(FIXTURES_DIR, "sample_us_stock.csv"), encoding="utf-8") as f:
        return f.read()


@pytest.fixture
def fixture_thai_stock_csv():
    with open(os.path.join(FIXTURES_DIR, "sample_thai_stock.csv"), encoding="utf-8") as f:
        return f.read()


@pytest.fixture
def sample_csv_us_stock(fixture_us_stock_csv):
    return fixture_us_stock_csv


@pytest.fixture
def sample_csv_thai_stock(fixture_thai_stock_csv):
    return fixture_thai_stock_csv


@pytest.fixture
def sample_csv_closed_position():
    return """Symbol,Date,Quantity,Price,Currency,Asset Type
TSLA,2026-01-01,10,200.00,USD,us-stock
TSLA,2026-01-15,-10,250.00,USD,us-stock
"""


@pytest.fixture
def fixture_yahoo_finance_json():
    with open(os.path.join(FIXTURES_DIR, "sample_yahoo_finance.json"), encoding="utf-8") as f:
        return json.load(f)


@pytest.fixture
def fixture_binance_ticker_json():
    with open(os.path.join(FIXTURES_DIR, "sample_binance_ticker.json"), encoding="utf-8") as f:
        return json.load(f)


@pytest.fixture
def fixture_sec_nav_json():
    with open(os.path.join(FIXTURES_DIR, "sample_sec_nav.json"), encoding="utf-8") as f:
        return json.load(f)


@pytest.fixture
def mocked_external_apis(
    monkeypatch,
    respx_mock,
    fixture_us_stock_csv,
    fixture_yahoo_finance_json,
    fixture_binance_ticker_json,
    fixture_sec_nav_json,
):
    """Mocks all third-party external calls (Google Sheets, yfinance, Binance TH, SEC Thailand)."""
    # Mock Google Sheet CSV export
    respx_mock.get(url=re.compile(r"https://docs\.google\.com/spreadsheets/.*")).respond(
        status_code=200, text=fixture_us_stock_csv
    )

    # Mock yfinance client methods (yfinance uses curl_cffi rather than httpx)
    meta = fixture_yahoo_finance_json.get("chart", {}).get("result", [{}])[0].get("meta", {})
    mock_quote: YahooQuote = YahooQuote(
        price=float(meta.get("regularMarketPrice") or 185.50),
        name=str(meta.get("longName") or meta.get("shortName") or "Apple Inc."),
        currency=str(meta.get("currency") or "USD"),
    )

    async def _mock_get_quote(self, yahoo_symbol: str) -> YahooQuote:
        if yahoo_symbol.endswith("=X"):
            return YahooQuote(price=35.0, name=yahoo_symbol, currency="THB")
        return mock_quote

    async def _mock_get_exchange_rate(self, from_currency: str = "USD", to_currency: str = "THB") -> float:
        return 1.0 if from_currency == to_currency else 35.0

    async def _mock_get_dividends(self, yahoo_symbol: str, period: str | None = None) -> list[dict[str, Any]]:
        return []

    monkeypatch.setattr(YFinanceClient, "get_quote", _mock_get_quote)
    monkeypatch.setattr(YFinanceClient, "get_exchange_rate", _mock_get_exchange_rate)
    monkeypatch.setattr(YFinanceClient, "get_dividends", _mock_get_dividends)

    # Mock Binance TH Ticker API
    respx_mock.get(url=re.compile(r"https://api\.binance\.th/.*")).respond(
        status_code=200, json=fixture_binance_ticker_json
    )

    # Mock SEC Thailand NAV API
    respx_mock.get(url=re.compile(r"https://api\.sec\.or\.th/.*")).respond(status_code=200, json=fixture_sec_nav_json)

    return respx_mock
