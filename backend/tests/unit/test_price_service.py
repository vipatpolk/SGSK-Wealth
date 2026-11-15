import pytest

from models.transaction import PriceData
from services.price_service import PriceService, _parse_set_listed_companies_html


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
