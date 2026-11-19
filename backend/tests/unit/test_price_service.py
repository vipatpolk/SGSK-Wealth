from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock

import pytest

from models.transaction import PriceData
from services.price_service import PriceService, _parse_set_listed_companies_html
from utils.cache import ttl_cache
from utils.yfinance_client import YahooQuote


@pytest.fixture
def service():
    return PriceService()


@pytest.mark.unit
def test_resolve_crypto_price(service):
    tickers = [
        {"symbol": "BTCTHB", "price": "3000000.00"},
        {"symbol": "BTCUSDT", "price": "90000.00"},
        {"symbol": "ETHTHB", "price": "100000.00"},
    ]

    price, currency = service._resolve_crypto_price("BTC.CRYPTO", tickers)
    assert price == 3000000.00
    assert currency == "THB"

    price, currency = service._resolve_crypto_price("ETH.CRYPTO", tickers)
    assert price == 100000.00
    assert currency == "THB"

    price, currency = service._resolve_crypto_price("UNKNOWN.CRYPTO", tickers)
    assert price == 0.0
    assert currency == ""


@pytest.mark.unit
def test_is_crypto_and_fund_helpers(service):
    assert service._is_crypto({"symbol": "BTC.CRYPTO"}) is True
    assert service._is_crypto({"assetType": "crypto", "symbol": "BTC"}) is True
    assert service._is_crypto({"symbol": "AAPL"}) is False

    assert service._is_fund({"symbol": "K-CHANGE.FUND"}) is True
    assert service._is_fund({"symbol": "K-CHANGE.BKFUND"}) is True
    assert service._is_fund({"assetType": "mutual-fund", "symbol": "K-CHANGE"}) is True
    assert service._is_fund({"symbol": "AAPL"}) is False


@pytest.mark.unit
@pytest.mark.asyncio
async def test_fetch_exchange_rate_same_currency(service):
    rate = await service.fetch_exchange_rate("USD", "USD")
    assert rate == 1.0


@pytest.mark.unit
@pytest.mark.asyncio
async def test_fetch_stock_prices_mocked(service, monkeypatch):
    async def mock_fetch_single_stock(symbol: str):
        if symbol == "AAPL":
            return "AAPL", PriceData(symbol="AAPL", name="Apple Inc.", price=180.50, currency="USD")
        return symbol, PriceData(symbol=symbol, name="", price=0.0, currency="")

    monkeypatch.setattr(service, "_fetch_single_stock", mock_fetch_single_stock)

    price_map = await service.fetch_stock_prices(["AAPL", "INVALID_SYM"])
    assert "AAPL" in price_map
    assert price_map["AAPL"].price == 180.50
    assert price_map["AAPL"].name == "Apple Inc."
    assert price_map["AAPL"].nameTh == ""
    assert "INVALID_SYM" not in price_map


@pytest.mark.unit
def test_parse_set_listed_companies_html_cp874():
    html_text = """
    <html><body><table>
      <tr><td>Symbol</td><td>Company</td></tr>
      <tr><td>PTT</td><td>บริษัท ปตท.   จำกัด (มหาชน)</td></tr>
      <tr><td>BDMS</td><td>บริษัท กรุงเทพดุสิตเวชการ จำกัด(มหาชน) &amp; Co</td></tr>
    </table></body></html>
    """
    parsed = _parse_set_listed_companies_html(html_text.encode("cp874"))
    assert "SYMBOL" not in parsed
    assert parsed["PTT"] == "บริษัท ปตท. จำกัด (มหาชน)"
    assert parsed["BDMS"] == "บริษัท กรุงเทพดุสิตเวชการ จำกัด(มหาชน) & Co"


@pytest.mark.unit
@pytest.mark.asyncio
async def test_fetch_stock_prices_enriches_thai_bk_name_only(service, monkeypatch):
    from utils.cache import ttl_cache

    ttl_cache.clear()

    async def mock_fetch_single_stock(symbol: str):
        if symbol == "PTT.BK":
            return "PTT.BK", PriceData(symbol="PTT.BK", name="PTT Public Company Limited", price=34.5, currency="THB")
        return "AAPL", PriceData(symbol="AAPL", name="Apple Inc.", price=225.0, currency="USD")

    async def mock_fetch_set_names():
        return {
            "PTT": {"th": "บริษัท ปตท. จำกัด (มหาชน)", "en": "PTT PUBLIC COMPANY LIMITED"},
            "AAPL": {"th": "SHOULD_NOT_BE_APPLIED", "en": ""},
        }

    monkeypatch.setattr(service, "_fetch_single_stock", mock_fetch_single_stock)
    monkeypatch.setattr(service, "_fetch_set_listed_company_names", mock_fetch_set_names)

    price_map = await service.fetch_stock_prices(["PTT.BK", "AAPL"])
    assert price_map["PTT.BK"].name == "PTT Public Company Limited"
    assert price_map["PTT.BK"].nameTh == "บริษัท ปตท. จำกัด (มหาชน)"
    assert price_map["AAPL"].name == "Apple Inc."
    assert price_map["AAPL"].nameTh == ""


@pytest.mark.unit
@pytest.mark.asyncio
async def test_fetch_exchange_rate_via_yfinance_client_and_fallback():
    ttl_cache.clear()
    yf_mock = MagicMock()
    yf_mock.get_exchange_rate = AsyncMock(return_value=34.25)
    svc = PriceService(yf_client=yf_mock)

    rate1 = await svc.fetch_exchange_rate("USD", "THB")
    rate2 = await svc.fetch_exchange_rate("USD", "THB")
    assert rate1 == 34.25
    assert rate2 == 34.25
    yf_mock.get_exchange_rate.assert_awaited_once_with("USD", "THB")

    ttl_cache.clear()
    yf_mock.get_exchange_rate = AsyncMock(side_effect=RuntimeError("rate limit"))
    assert await svc.fetch_exchange_rate("USD", "THB") == 0.0


@pytest.mark.unit
@pytest.mark.asyncio
async def test_fetch_single_stock_via_yfinance_client_and_fallback():
    ttl_cache.clear()
    yf_mock = MagicMock()
    yf_mock.get_quote = AsyncMock(return_value=YahooQuote(price=455.25, name="Berkshire Hathaway Inc.", currency="USD"))
    svc = PriceService(yf_client=yf_mock)

    sym, data1 = await svc._fetch_single_stock("BRK.B")
    _, data2 = await svc._fetch_single_stock("BRK.B")
    assert sym == "BRK.B"
    assert data1 == PriceData(symbol="BRK.B", name="Berkshire Hathaway Inc.", price=455.25, currency="USD")
    assert data2 == data1
    yf_mock.get_quote.assert_awaited_once_with("BRK-B")

    ttl_cache.clear()
    yf_mock.get_quote = AsyncMock(side_effect=RuntimeError("network error"))
    sym_err, err_data = await svc._fetch_single_stock("AAPL")
    assert sym_err == "AAPL"
    assert err_data == PriceData(symbol="AAPL", name="", price=0.0, currency="")


@pytest.mark.unit
@pytest.mark.asyncio
async def test_fetch_crypto_prices_resolves_common_and_dynamic_names(monkeypatch):
    ttl_cache.clear()
    yf_mock = MagicMock()

    async def mock_get_quote(sym: str) -> YahooQuote:
        if sym == "SUI-USD":
            return YahooQuote(price=2.1, name="Sui", currency="USD")
        raise RuntimeError("lookup failed")

    yf_mock.get_quote = AsyncMock(side_effect=mock_get_quote)
    svc = PriceService(yf_client=yf_mock)

    async def mock_binance():
        return [
            {"symbol": "BTCTHB", "price": "3100000"},
            {"symbol": "SUITHB", "price": "75.5"},
            {"symbol": "ERRUSDT", "price": "1.2"},
        ]

    monkeypatch.setattr(svc, "_fetch_binance_tickers", mock_binance)

    prices = await svc.fetch_crypto_prices(["BTC.CRYPTO", "SUI.CRYPTO", "ERR.CRYPTO"])
    assert prices["BTC.CRYPTO"] == PriceData(symbol="BTC.CRYPTO", name="Bitcoin", price=3100000.0, currency="THB")
    assert prices["SUI.CRYPTO"] == PriceData(symbol="SUI.CRYPTO", name="Sui", price=75.5, currency="THB")
    assert prices["ERR.CRYPTO"] == PriceData(symbol="ERR.CRYPTO", name="", price=1.2, currency="USD")

    # BTC.CRYPTO used COMMON_CRYPTO_NAMES fast path, so only SUI-USD and ERR-USD queried yfinance
    called_syms = [call.args[0] for call in yf_mock.get_quote.await_args_list]
    assert called_syms == ["SUI-USD", "ERR-USD"]

    # Second call for SUI.CRYPTO hits ttl_cache
    yf_mock.get_quote.reset_mock()
    _, cached_name = await svc._fetch_yahoo_crypto_name("SUI.CRYPTO")
    assert cached_name == "Sui"
    yf_mock.get_quote.assert_not_called()


@pytest.mark.unit
@pytest.mark.asyncio
async def test_fetch_stock_dividends_via_yfinance_client():
    ttl_cache.clear()
    now_ts = int(datetime.now(timezone.utc).timestamp())
    recent_ts_1 = now_ts - 30 * 86400
    recent_ts_2 = now_ts - 120 * 86400
    old_ts = now_ts - 500 * 86400

    yf_mock = MagicMock()
    yf_mock.get_dividends = AsyncMock(
        return_value=[
            {"amount": 0.25, "date": recent_ts_1},
            {"amount": 0.24, "date": recent_ts_2},
            {"amount": 0.22, "date": old_ts},
        ]
    )
    svc = PriceService(yf_client=yf_mock)

    # Crypto & mutual funds are excluded; AAPL is queried once and cached
    res = await svc.fetch_stock_dividends(["AAPL", "BTC.CRYPTO", "K-USA.FUND"])
    assert list(res.keys()) == ["AAPL"]
    assert res["AAPL"]["trailing_12m_dps"] == pytest.approx(0.49)
    assert len(res["AAPL"]["dividends"]) == 3
    yf_mock.get_dividends.assert_awaited_once_with("AAPL")

    # Second call hits cache
    res_cached = await svc.fetch_stock_dividends(["AAPL"])
    assert res_cached == res
    yf_mock.get_dividends.assert_awaited_once()

    # Error degrades gracefully without caching
    ttl_cache.clear()
    yf_mock.get_dividends = AsyncMock(side_effect=RuntimeError("boom"))
    err_res = await svc.fetch_stock_dividends(["MSFT"])
    assert err_res == {"MSFT": {"trailing_12m_dps": 0.0, "dividends": []}}
