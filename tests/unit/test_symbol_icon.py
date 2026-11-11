from unittest.mock import AsyncMock, patch

import httpx
import pytest
from fastapi.testclient import TestClient

from main import app
from services.icon_service import IconService
from utils.cache import TTLCache
from utils.symbol_icon_utils import (
    clean_ticker_for_url,
    generate_symbol_svg,
    get_symbol_color,
    get_symbol_logo_config,
    get_symbol_monogram,
)


def test_clean_ticker_for_url():
    assert clean_ticker_for_url("AAPL") == "AAPL"
    assert clean_ticker_for_url("BRK.B") == "BRK-B"
    assert clean_ticker_for_url("PTT.BK") == "PTT"
    assert clean_ticker_for_url("ES-GTECHSSF.FUND") == "ES-GTECHSSF"
    assert clean_ticker_for_url("ES-GTECHSSF.BKFUND") == "ES-GTECHSSF"
    assert clean_ticker_for_url("BTC.CRYPTO") == "BTC"
    assert clean_ticker_for_url("") == ""


def test_get_symbol_monogram():
    assert get_symbol_monogram("BTC") == "BTC"
    assert get_symbol_monogram("PTT") == "PTT"
    assert get_symbol_monogram("V") == "V"
    assert get_symbol_monogram("AAPL") == "AA"
    assert get_symbol_monogram("BRK.B") == "BR"
    assert get_symbol_monogram("ES-GTECHSSF.FUND") == "ES"
    assert get_symbol_monogram("") == "?"


def test_get_symbol_color_exact_match():
    # Exact parity with ShareLot TypeScript getSymbolColor
    assert get_symbol_color("AAPL") == "#19b3eb"
    assert get_symbol_color("BTC") == "#2e6fd6"
    assert get_symbol_color("PTT") == "#c93822"
    assert get_symbol_color("ES-GTECHSSF") == "#bee133"
    assert get_symbol_color("BRK.B") == "#66be27"
    assert get_symbol_color("") == "#6366f1"

    # Case & suffix invariance
    assert get_symbol_color("aapl") == get_symbol_color("AAPL")
    assert get_symbol_color("PTT.BK") == get_symbol_color("PTT")
    assert get_symbol_color("BTC.CRYPTO") == get_symbol_color("BTC")
    assert get_symbol_color("ES-GTECHSSF.FUND") == get_symbol_color("ES-GTECHSSF")


def test_get_symbol_logo_config():
    # Mutual fund
    mf_config = get_symbol_logo_config("ES-GTECHSSF.FUND", "mutual-fund")
    assert mf_config["is_mutual_fund"] is True
    assert mf_config["primary_url"] is None
    assert mf_config["secondary_url"] is None

    # Provident fund
    pvd_config = get_symbol_logo_config("PVD-TEST", "provident-fund")
    assert pvd_config["is_mutual_fund"] is True

    # Thai stock
    th_config = get_symbol_logo_config("PTT.BK", "thai-stock")
    assert th_config["is_mutual_fund"] is False
    assert "set.or.th" in th_config["primary_url"]
    assert "parqet.com" in th_config["secondary_url"]

    # Crypto
    crypto_config = get_symbol_logo_config("BTC.CRYPTO", "crypto")
    assert crypto_config["is_mutual_fund"] is False
    assert "coincap.io" in crypto_config["primary_url"]
    assert "cryptocurrency-icons" in crypto_config["secondary_url"]

    # US stock
    us_config = get_symbol_logo_config("AAPL", "us-stock")
    assert us_config["is_mutual_fund"] is False
    assert "parqet.com" in us_config["primary_url"]
    assert "financialmodelingprep.com" in us_config["secondary_url"]


def test_generate_symbol_svg():
    # Mutual fund SVG includes bank icon path
    mf_svg = generate_symbol_svg("ES-GTECHSSF.FUND", "mutual-fund")
    assert mf_svg.startswith(b"<svg")
    assert b"M3 21h18" in mf_svg

    # Stock SVG includes monogram text
    stock_svg = generate_symbol_svg("AAPL", "us-stock")
    assert stock_svg.startswith(b"<svg")
    assert b">AA<" in stock_svg


@pytest.mark.asyncio
async def test_icon_service_mutual_fund():
    mock_client = AsyncMock(spec=httpx.AsyncClient)
    service = IconService(client=mock_client, cache=TTLCache())

    content, media_type = await service.get_symbol_icon("ES-GTECHSSF.FUND", "mutual-fund")
    assert media_type == "image/svg+xml"
    assert b"M3 21h18" in content
    # Should not make any outbound HTTP calls for mutual funds
    mock_client.get.assert_not_called()


@pytest.mark.asyncio
async def test_icon_service_primary_cdn_success():
    mock_client = AsyncMock(spec=httpx.AsyncClient)
    fake_png = b"\x89PNG\r\n\x1a\n" + b"\x00" * 100
    mock_response = httpx.Response(
        200,
        content=fake_png,
        headers={"content-type": "image/png"},
        request=httpx.Request("GET", "https://assets.parqet.com/logos/symbol/AAPL?format=png"),
    )
    mock_client.get.return_value = mock_response

    cache = TTLCache()
    service = IconService(client=mock_client, cache=cache)

    content, media_type = await service.get_symbol_icon("AAPL", "us-stock")
    assert media_type == "image/png"
    assert content == fake_png
    assert mock_client.get.call_count == 1

    # Second call should be served from memory cache without new HTTP request
    content2, media_type2 = await service.get_symbol_icon("AAPL", "us-stock")
    assert content2 == fake_png
    assert mock_client.get.call_count == 1


@pytest.mark.asyncio
async def test_icon_service_primary_fails_secondary_succeeds():
    mock_client = AsyncMock(spec=httpx.AsyncClient)
    fake_png = b"\x89PNG\r\n\x1a\n" + b"\x00" * 100

    def mock_get(url, **kwargs):
        if "parqet.com" in url:
            return httpx.Response(404, request=httpx.Request("GET", url))
        return httpx.Response(
            200,
            content=fake_png,
            headers={"content-type": "image/png"},
            request=httpx.Request("GET", url),
        )

    mock_client.get.side_effect = mock_get
    service = IconService(client=mock_client, cache=TTLCache())

    content, media_type = await service.get_symbol_icon("AAPL", "us-stock")
    assert media_type == "image/png"
    assert content == fake_png
    assert mock_client.get.call_count == 2


@pytest.mark.asyncio
async def test_icon_service_both_cdns_fail_fallback_svg():
    mock_client = AsyncMock(spec=httpx.AsyncClient)
    mock_client.get.return_value = httpx.Response(404, request=httpx.Request("GET", "https://fail"))

    service = IconService(client=mock_client, cache=TTLCache())

    content, media_type = await service.get_symbol_icon("AAPL", "us-stock")
    assert media_type == "image/svg+xml"
    assert b">AA<" in content


def test_router_icon_endpoints():
    client = TestClient(app)

    # 1. Path param test for mutual fund
    resp_mf = client.get("/icon/ES-GTECHSSF.FUND?asset_type=mutual-fund")
    assert resp_mf.status_code == 200
    assert resp_mf.headers["content-type"].startswith("image/svg+xml")
    assert "public, max-age=" in resp_mf.headers.get("cache-control", "")

    # 2. Query param test
    resp_query = client.get("/icon?symbol=ES-GTECHSSF.FUND&asset_type=mutual-fund")
    assert resp_query.status_code == 200
    assert resp_query.headers["content-type"].startswith("image/svg+xml")

    # 3. Metadata endpoint
    resp_meta = client.get("/icon/meta/AAPL?asset_type=us-stock")
    assert resp_meta.status_code == 200
    data = resp_meta.json()
    assert data["symbol"] == "AAPL"
    assert data["clean_ticker"] == "AAPL"
    assert data["monogram"] == "AA"
    assert data["brand_color"] == "#19b3eb"
    assert data["is_mutual_fund"] is False
    assert "/api/backend/icon/AAPL" in data["icon_url"]
