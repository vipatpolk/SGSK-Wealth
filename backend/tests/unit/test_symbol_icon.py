from unittest.mock import AsyncMock

import httpx
import pytest
from fastapi.testclient import TestClient

from main import app
from routers import icon as icon_router
from services.icon_service import IconService
from services.nav_service import NavService
from utils.cache import TTLCache, ttl_cache
from utils.symbol_icon_utils import (
    clean_ticker_for_url,
    derive_amc_code,
    extract_brand_tokens,
    extract_domain_candidates,
    generate_amc_svg,
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


def test_dynamic_domain_and_amc_name_helpers():
    # URL with missing scheme + path
    assert extract_domain_candidates("www.ktam.co.th/page/th/funddetail.aspx") == [
        "www.ktam.co.th",
        "ktam.co.th",
    ]
    # Subdomain + apex domain (non-ccTLD and multi-label ccTLD)
    assert extract_domain_candidates("https://documents.mfcfund.com/factsheet.pdf") == [
        "documents.mfcfund.com",
        "mfcfund.com",
    ]
    assert extract_domain_candidates("https://www.eastspring.co.th/funds/es-gtech") == [
        "www.eastspring.co.th",
        "eastspring.co.th",
    ]
    assert extract_domain_candidates("https://docs.uobam.co.th/doc.pdf") == [
        "docs.uobam.co.th",
        "uobam.co.th",
    ]
    assert extract_domain_candidates("") == []

    # Brand token extraction & AMC badge code derivation
    assert extract_brand_tokens("AIA COMPANY LIMITED") == ["AIA"]
    assert extract_brand_tokens("SCB ASSET MANAGEMENT COMPANY LIMITED") == ["SCB"]
    assert derive_amc_code("SCB ASSET MANAGEMENT COMPANY LIMITED") == "SCB"
    assert derive_amc_code("KASIKORN ASSET MANAGEMENT COMPANY LIMITED", abbr_name="KASSET") == "KASSET"
    assert derive_amc_code("EASTSPRING ASSET MANAGEMENT (THAILAND) COMPANY LIMITED") == "EASTSP"


def test_generate_symbol_svg_and_amc_svg():
    # Mutual fund fallback SVG includes bank icon path
    mf_svg = generate_symbol_svg("ES-GTECHSSF.FUND", "mutual-fund")
    assert mf_svg.startswith(b"<svg")
    assert b"M3 21h18" in mf_svg

    # Stock SVG includes monogram text
    stock_svg = generate_symbol_svg("AAPL", "us-stock")
    assert stock_svg.startswith(b"<svg")
    assert b">AA<" in stock_svg

    # Branded AMC SVG includes AMC code & brand color
    amc_svg = generate_amc_svg("SCBAM", "#4e2a84")
    assert amc_svg.startswith(b"<svg")
    assert b">SCBAM<" in amc_svg
    assert b"#4e2a84" in amc_svg


@pytest.mark.asyncio
async def test_nav_service_dynamic_amc_resolution_mf_and_pvd_sister_entity():
    ttl_cache.clear()
    mock_client = AsyncMock(spec=httpx.AsyncClient)

    def mock_get(url, **kwargs):
        if "general-info/profiles?fund_class_name=KT-ENERGY" in url:
            return httpx.Response(
                200,
                json={
                    "items": [
                        {
                            "proj_id": "M001",
                            "unique_id": "C0000000460",
                            "comp_name_en": "KRUNG THAI ASSET MANAGEMENT PUBLIC COMPANY LIMITED",
                            "fund_class_name": "KT-ENERGY",
                        }
                    ]
                },
                request=httpx.Request("GET", url),
            )
        if "factsheet/urls?proj_id=M001" in url:
            return httpx.Response(
                200,
                json={"items": [{"amc_url_factsheet": "www.ktam.co.th/page/th/funddetail.aspx"}]},
                request=httpx.Request("GET", url),
            )
        if "/factsheet/amc" in url:
            return httpx.Response(
                200,
                json=[
                    {
                        "unique_id": "C0000000708",
                        "abbr_name": "AIA",
                        "name_en": "AIA COMPANY LIMITED",
                    }
                ],
                request=httpx.Request("GET", url),
            )
        if "general-info/profiles?company_info=C0000000708" in url:
            return httpx.Response(204, request=httpx.Request("GET", url))
        if "general-info/amcs" in url:
            return httpx.Response(
                200,
                json={
                    "items": [
                        {
                            "unique_id": "C0000031161",
                            "comp_name_en": "AIA INVESTMENT MANAGEMENT (THAILAND) LIMITED",
                        }
                    ],
                    "next_cursor": "",
                },
                request=httpx.Request("GET", url),
            )
        if "general-info/profiles?company_info=C0000031161" in url:
            return httpx.Response(
                200,
                json={"items": [{"proj_id": "M099"}]},
                request=httpx.Request("GET", url),
            )
        if "factsheet/urls?proj_id=M099" in url:
            return httpx.Response(
                200,
                json={"items": [{"amc_url_factsheet": "https://www.aiaim.co.th/factsheet.pdf"}]},
                request=httpx.Request("GET", url),
            )
        return httpx.Response(404, request=httpx.Request("GET", url))

    def mock_post(url, **kwargs):
        if "/factsheet/fund" in url:
            return httpx.Response(
                200,
                json=[{"proj_id": "P001", "unique_id": "C0000000708", "fund_status": "RG", "proj_name_th": "เอไอเอ พีวีดี"}],
                request=httpx.Request("POST", url),
            )
        return httpx.Response(404, request=httpx.Request("POST", url))

    mock_client.get.side_effect = mock_get
    mock_client.post.side_effect = mock_post

    nav = NavService(client=mock_client)

    mf_details = await nav.resolve_fund_amc_details("KT-ENERGY.FUND", "mutual-fund")
    assert mf_details["amc_id"] == "C0000000460"
    assert mf_details["website_host"] == "www.ktam.co.th"

    pvd_details = await nav.resolve_fund_amc_details("PVD-AIA", "provident-fund", "เอไอเอ พีวีดี")
    assert pvd_details["amc_id"] == "C0000000708"
    assert pvd_details["abbr_name"] == "AIA"
    assert pvd_details["website_host"] == "www.aiaim.co.th"


@pytest.mark.asyncio
async def test_icon_service_mutual_fund_resolves_dynamic_website_and_caches_per_amc():
    ttl_cache.clear()
    fake_png = b"\x89PNG\r\n\x1a\n" + b"\x00" * 100
    mock_client = AsyncMock(spec=httpx.AsyncClient)

    def mock_get(url, **kwargs):
        # Subdomain fails gstatic, apex domain (mfcfund.com) succeeds
        if "faviconV2" in url and "url=https://mfcfund.com" in url:
            return httpx.Response(
                200,
                content=fake_png,
                headers={"content-type": "image/png"},
                request=httpx.Request("GET", url),
            )
        return httpx.Response(404, request=httpx.Request("GET", url))

    mock_client.get.side_effect = mock_get

    mock_nav = AsyncMock(spec=NavService)
    mock_nav.resolve_fund_amc_details.return_value = {
        "amc_id": "C0000000023",
        "amc_name": "MFC ASSET MANAGEMENT PUBLIC COMPANY LIMITED",
        "abbr_name": "MFC",
        "website_host": "documents.mfcfund.com",
        "proj_id": "M123",
    }

    service = IconService(client=mock_client, cache=TTLCache(), nav_service=mock_nav)

    content, media_type = await service.get_symbol_icon("M-AAA.FUND", "mutual-fund")
    assert media_type == "image/png"
    assert content == fake_png
    calls_after_first = mock_client.get.call_count
    assert calls_after_first == 2

    # Second distinct fund from the same AMC shares cached AMC logo with zero extra HTTP fetches
    content2, media_type2 = await service.get_symbol_icon("M-BBB.FUND", "mutual-fund")
    assert media_type2 == "image/png"
    assert content2 == fake_png
    assert mock_client.get.call_count == calls_after_first


@pytest.mark.asyncio
async def test_icon_service_html_scrape_and_ddg_and_dynamic_svg_fallbacks():
    ttl_cache.clear()
    fake_png = b"\x89PNG\r\n\x1a\n" + b"\x00" * 100
    mock_client = AsyncMock(spec=httpx.AsyncClient)

    def mock_get(url, **kwargs):
        if url == "https://www.uobam.co.th/":
            return httpx.Response(
                200,
                text='<html><head><link rel="apple-touch-icon" href="/assets/apple-icon.png"></head></html>',
                headers={"content-type": "text/html"},
                request=httpx.Request("GET", url),
            )
        if url == "https://www.uobam.co.th/assets/apple-icon.png":
            return httpx.Response(
                200,
                content=fake_png,
                headers={"content-type": "image/png"},
                request=httpx.Request("GET", url),
            )
        return httpx.Response(404, request=httpx.Request("GET", url))

    mock_client.get.side_effect = mock_get

    mock_nav = AsyncMock(spec=NavService)
    mock_nav.resolve_fund_amc_details.return_value = {
        "amc_id": "C0000000623",
        "amc_name": "UOB ASSET MANAGEMENT (THAILAND) COMPANY LIMITED",
        "abbr_name": "UOBAMTH",
        "website_host": "www.uobam.co.th",
        "proj_id": "M0623",
    }

    service = IconService(client=mock_client, cache=TTLCache(), nav_service=mock_nav)

    # gstatic 404s on uobam.co.th -> falls back to homepage HTML apple-touch-icon
    content, media_type = await service.get_symbol_icon("UOBEQ.FUND", "mutual-fund")
    assert media_type == "image/png"
    assert content == fake_png

    # Unknown fund with no SEC AMC details -> no guessing -> generic bank building SVG
    mock_nav.resolve_fund_amc_details.return_value = {
        "amc_id": None,
        "amc_name": None,
        "abbr_name": None,
        "website_host": None,
        "proj_id": None,
    }
    unknown_content, unknown_type = await service.get_symbol_icon("SCB-NO-SEC.FUND", "mutual-fund")
    assert unknown_type == "image/svg+xml"
    assert b"M3 21h18" in unknown_content

    # Identified AMC with all external image probes failing -> dynamically derived branded AMC SVG
    mock_nav.resolve_fund_amc_details.return_value = {
        "amc_id": "C0000099999",
        "amc_name": "NOVA ASSET MANAGEMENT COMPANY LIMITED",
        "abbr_name": None,
        "website_host": "www.unreachable-amc.invalid",
        "proj_id": "M999",
    }
    amc_svg, amc_type = await service.get_symbol_icon("NOVAEQ.FUND", "mutual-fund")
    assert amc_type == "image/svg+xml"
    assert b">NOVA<" in amc_svg


@pytest.mark.asyncio
async def test_icon_service_provident_fund_resolves_amc_by_fund_name():
    ttl_cache.clear()
    fake_png = b"\x89PNG\r\n\x1a\n" + b"\x00" * 100
    mock_client = AsyncMock(spec=httpx.AsyncClient)

    def mock_get(url, **kwargs):
        if "faviconV2" in url and "www.scbam.com" in url:
            return httpx.Response(
                200,
                content=fake_png,
                headers={"content-type": "image/png"},
                request=httpx.Request("GET", url),
            )
        return httpx.Response(404, request=httpx.Request("GET", url))

    mock_client.get.side_effect = mock_get

    mock_nav = AsyncMock(spec=NavService)
    mock_nav.resolve_fund_amc_details.return_value = {
        "amc_id": "C0000000239",
        "amc_name": "SCB ASSET MANAGEMENT COMPANY LIMITED",
        "abbr_name": "SCBAM",
        "website_host": "www.scbam.com",
        "proj_id": "P239",
    }

    service = IconService(client=mock_client, cache=TTLCache(), nav_service=mock_nav)

    content, media_type = await service.get_symbol_icon(
        "PVDSP500",
        "provident-fund",
        "ไทยพาณิชย์ มาสเตอร์ฟันด์",
    )
    assert media_type == "image/png"
    assert content == fake_png
    mock_nav.resolve_fund_amc_details.assert_awaited_once_with(
        "PVDSP500",
        "provident-fund",
        "ไทยพาณิชย์ มาสเตอร์ฟันด์",
    )


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
    content2, _media_type2 = await service.get_symbol_icon("AAPL", "us-stock")
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


def test_router_icon_endpoints(monkeypatch):
    fake_png = b"\x89PNG\r\n\x1a\n" + b"\x00" * 100
    mock_client = AsyncMock(spec=httpx.AsyncClient)
    mock_client.get.return_value = httpx.Response(
        200,
        content=fake_png,
        headers={"content-type": "image/png"},
        request=httpx.Request("GET", "https://t0.gstatic.com/faviconV2?url=https://www.scbam.com&size=128"),
    )
    mock_nav = AsyncMock(spec=NavService)
    mock_nav.resolve_fund_amc_details.return_value = {
        "amc_id": "C0000000239",
        "amc_name": "SCB ASSET MANAGEMENT COMPANY LIMITED",
        "abbr_name": "SCBAM",
        "website_host": "www.scbam.com",
        "proj_id": "M0002_2563",
    }

    monkeypatch.setattr(
        icon_router,
        "service",
        IconService(client=mock_client, cache=TTLCache(), nav_service=mock_nav),
    )

    client = TestClient(app)

    # 1. Path param test for mutual fund -> resolves AMC PNG dynamically
    resp_mf = client.get("/icon/SCBSFF.FUND?asset_type=mutual-fund")
    assert resp_mf.status_code == 200
    assert resp_mf.headers["content-type"].startswith("image/png")
    assert "public, max-age=" in resp_mf.headers.get("cache-control", "")

    # 2. Query param test with PVD fund_name
    resp_query = client.get(
        "/icon?symbol=PVDSP500&asset_type=provident-fund&fund_name=ไทยพาณิชย์%20มาสเตอร์ฟันด์"
    )
    assert resp_query.status_code == 200
    assert resp_query.headers["content-type"].startswith("image/png")

    # 3. Metadata endpoint
    resp_meta = client.get("/icon/meta/AAPL?asset_type=us-stock")
    assert resp_meta.status_code == 200
    data = resp_meta.json()
    assert data["symbol"] == "AAPL"
    assert data["clean_ticker"] == "AAPL"
    assert data["monogram"] == "AA"
    assert data["brand_color"] == "#19b3eb"
    assert data["is_mutual_fund"] is False
    assert data["amc_id"] is None
    assert data["amc_domain"] is None
    assert "/api/backend/icon/AAPL" in data["icon_url"]

    # 4. PVD metadata endpoint includes dynamic amc_id, amc_name, amc_domain & fund_name
    resp_pvd_meta = client.get(
        "/icon/meta/PVDSP500?asset_type=provident-fund&fund_name=ไทยพาณิชย์%20มาสเตอร์ฟันด์"
    )
    assert resp_pvd_meta.status_code == 200
    pvd_data = resp_pvd_meta.json()
    assert pvd_data["amc_id"] == "C0000000239"
    assert pvd_data["amc_domain"] == "www.scbam.com"
    assert "fund_name=" in pvd_data["icon_url"]
