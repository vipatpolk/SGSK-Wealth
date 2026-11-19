import os
import tempfile
from datetime import datetime, timezone
from unittest.mock import MagicMock

import pandas as pd
import pytest
import yfinance as yf
from yfinance.exceptions import YFRateLimitError

from config.settings import Settings
from utils import yfinance_client as yf_mod
from utils.yfinance_client import (
    YahooQuote,
    YFinanceClient,
    _timestamp_to_utc_midnight_epoch,
    _to_finite_float,
    configure_yfinance,
    get_yfinance_client,
)


@pytest.fixture(autouse=True)
def reset_yfinance_config_state(monkeypatch, tmp_path):
    monkeypatch.setattr(yf_mod, "_configured", False)
    monkeypatch.setattr(yf_mod, "_client_instance", None)
    test_settings = Settings(yfinance_cache_dir=str(tmp_path / "yf-cache"), yfinance_retries=2)
    monkeypatch.setattr(yf_mod, "get_settings", lambda: test_settings)
    yield
    monkeypatch.setattr(yf_mod, "_configured", False)
    monkeypatch.setattr(yf_mod, "_client_instance", None)


@pytest.mark.unit
def test_configure_yfinance_sets_cache_and_is_idempotent(monkeypatch, tmp_path):
    set_loc_calls: list[str] = []
    monkeypatch.setattr(yf, "set_tz_cache_location", lambda path: set_loc_calls.append(path))

    default_settings = Settings(yfinance_cache_dir="", yfinance_retries=3)
    monkeypatch.setattr(yf_mod, "get_settings", lambda: default_settings)

    cache_dir = configure_yfinance()
    expected_default = os.path.join(tempfile.gettempdir(), "py-yfinance")
    assert cache_dir == expected_default
    assert set_loc_calls == [expected_default]
    assert yf.config.network.retries == 3
    assert yf.config.debug.logging is False

    # Second call without force=True is a no-op
    assert configure_yfinance() == expected_default
    assert len(set_loc_calls) == 1

    # force=True re-applies updated settings
    custom_dir = str(tmp_path / "custom-yf")
    custom_settings = Settings(yfinance_cache_dir=custom_dir, yfinance_retries=-1)
    monkeypatch.setattr(yf_mod, "get_settings", lambda: custom_settings)

    assert configure_yfinance(force=True) == custom_dir
    assert set_loc_calls == [expected_default, custom_dir]
    assert yf.config.network.retries == 0


@pytest.mark.unit
def test_helper_conversions():
    assert _to_finite_float(None) is None
    assert _to_finite_float("not-a-number") is None
    assert _to_finite_float(float("nan")) is None
    assert _to_finite_float(float("inf")) is None
    assert _to_finite_float("42.5") == 42.5

    bkk_ts = pd.Timestamp("2026-03-11 00:00:00", tz="Asia/Bangkok")
    epoch = _timestamp_to_utc_midnight_epoch(bkk_ts)
    assert datetime.fromtimestamp(epoch, tz=timezone.utc).strftime("%Y-%m-%d") == "2026-03-11"

    assert _timestamp_to_utc_midnight_epoch(1762785000) == 1762785000
    assert _timestamp_to_utc_midnight_epoch(float("nan")) == 0
    assert _timestamp_to_utc_midnight_epoch("invalid") == 0


@pytest.mark.unit
@pytest.mark.asyncio
async def test_get_quote_from_metadata_and_fallbacks(monkeypatch):
    monkeypatch.setattr(yf, "set_tz_cache_location", lambda _path: None)
    client = YFinanceClient(timeout_seconds=7.5)

    # Blank symbol short-circuit
    assert await client.get_quote("   ") == YahooQuote()

    # Primary: regularMarketPrice + longName + currency
    mock_ticker = MagicMock()
    mock_ticker.history.return_value = pd.DataFrame({"Close": [210.0, 212.5]})
    mock_ticker.get_history_metadata.return_value = {
        "regularMarketPrice": 215.25,
        "longName": "Apple Inc.",
        "shortName": "Apple",
        "currency": "USD",
    }
    monkeypatch.setattr(yf, "Ticker", lambda _sym: mock_ticker)

    quote = await client.get_quote("AAPL")
    assert quote == YahooQuote(price=215.25, name="Apple Inc.", currency="USD")
    mock_ticker.history.assert_called_once_with(
        period="5d",
        interval="1d",
        prepost=False,
        actions=False,
        auto_adjust=False,
        timeout=7.5,
        raise_errors=False,
    )

    # Fallback 1: hist["Close"] when regularMarketPrice is NaN
    mock_ticker.history.return_value = pd.DataFrame({"Close": [33.25, float("nan")]})
    mock_ticker.get_history_metadata.return_value = {
        "regularMarketPrice": float("nan"),
        "shortName": "PTT PCL",
        "currency": "THB",
    }
    quote_close = await client.get_quote("PTT.BK")
    assert quote_close == YahooQuote(price=33.25, name="PTT PCL", currency="THB")

    # Fallback 2: chartPreviousClose / previousClose when hist is empty
    mock_ticker.history.return_value = pd.DataFrame()
    mock_ticker.get_history_metadata.return_value = {
        "regularMarketPrice": None,
        "chartPreviousClose": 0.0,
        "previousClose": 199.5,
        "shortName": "Microsoft",
        "currency": "USD",
    }
    quote_prev = await client.get_quote("MSFT")
    assert quote_prev == YahooQuote(price=199.5, name="Microsoft", currency="USD")

    # Empty metadata and empty history
    mock_ticker.history.return_value = pd.DataFrame()
    mock_ticker.get_history_metadata.return_value = {}
    assert await client.get_quote("UNKNOWN") == YahooQuote()


@pytest.mark.unit
@pytest.mark.asyncio
async def test_get_exchange_rate_queries_fx_pair(monkeypatch):
    monkeypatch.setattr(yf, "set_tz_cache_location", lambda _path: None)
    seen_symbols: list[str] = []

    def fake_ticker(sym: str):
        seen_symbols.append(sym)
        t = MagicMock()
        t.history.return_value = pd.DataFrame({"Close": [34.85]})
        t.get_history_metadata.return_value = {"regularMarketPrice": 34.85, "currency": "THB"}
        return t

    monkeypatch.setattr(yf, "Ticker", fake_ticker)
    client = YFinanceClient()
    rate = await client.get_exchange_rate("USD", "THB")
    assert rate == 34.85
    assert seen_symbols == ["USDTHB=X"]


@pytest.mark.unit
@pytest.mark.asyncio
async def test_get_dividends_timezone_safety_and_types(monkeypatch):
    monkeypatch.setattr(yf, "set_tz_cache_location", lambda _path: None)
    client = YFinanceClient()

    assert await client.get_dividends("") == []

    # 1. Thai .BK Series (UTC+7 midnight must NOT shift backward by 1 day) & default period="max"
    called_periods: list[str] = []
    bkk_index = pd.DatetimeIndex(
        [
            pd.Timestamp("2025-09-10 00:00:00", tz="Asia/Bangkok"),
            pd.Timestamp("2026-03-11 00:00:00", tz="Asia/Bangkok"),
        ]
    )
    bkk_series = pd.Series([0.80, 1.30], index=bkk_index)

    mock_ticker = MagicMock()

    def _get_divs(period="max"):
        called_periods.append(period)
        return bkk_series

    mock_ticker.get_dividends.side_effect = _get_divs
    monkeypatch.setattr(yf, "Ticker", lambda _sym: mock_ticker)

    bk_divs = await client.get_dividends("PTT.BK")
    assert called_periods == ["max"]
    assert len(bk_divs) == 2
    # Sorted descending (newest first)
    assert datetime.fromtimestamp(bk_divs[0]["date"], tz=timezone.utc).strftime("%Y-%m-%d") == "2026-03-11"
    assert bk_divs[0]["amount"] == 1.30
    assert datetime.fromtimestamp(bk_divs[1]["date"], tz=timezone.utc).strftime("%Y-%m-%d") == "2025-09-10"
    assert bk_divs[1]["amount"] == 0.80

    # 2. Foreign-currency pd.DataFrame with NaN/zero filtering and explicit period override
    ny_index = pd.DatetimeIndex(
        [
            pd.Timestamp("2026-02-09 00:00:00", tz="America/New_York"),
            pd.Timestamp("2026-05-11 00:00:00", tz="America/New_York"),
            pd.Timestamp("2026-08-10 00:00:00", tz="America/New_York"),
        ]
    )
    df_divs = pd.DataFrame(
        {"Dividends": [0.25, float("nan"), 0.0], "currency": ["USD", "USD", "USD"]},
        index=ny_index,
    )
    mock_ticker.get_dividends.side_effect = None
    mock_ticker.get_dividends.return_value = df_divs

    us_divs = await client.get_dividends("AAPL", period="1y")
    mock_ticker.get_dividends.assert_called_with(period="1y")
    assert len(us_divs) == 1
    assert datetime.fromtimestamp(us_divs[0]["date"], tz=timezone.utc).strftime("%Y-%m-%d") == "2026-02-09"
    assert us_divs[0]["amount"] == 0.25

    # 3. DataFrame without Dividends column, None, and empty Series
    mock_ticker.get_dividends.return_value = pd.DataFrame({"Other": [1.0]})
    assert await client.get_dividends("X") == []

    mock_ticker.get_dividends.return_value = None
    assert await client.get_dividends("X") == []

    mock_ticker.get_dividends.return_value = pd.Series(dtype=float)
    assert await client.get_dividends("BRK-B") == []


@pytest.mark.unit
@pytest.mark.asyncio
async def test_yfinance_rate_limit_propagates_and_singleton(monkeypatch):
    monkeypatch.setattr(yf, "set_tz_cache_location", lambda _path: None)
    mock_ticker = MagicMock()
    mock_ticker.history.side_effect = YFRateLimitError()
    mock_ticker.get_dividends.side_effect = YFRateLimitError()
    monkeypatch.setattr(yf, "Ticker", lambda _sym: mock_ticker)

    client = get_yfinance_client()
    assert get_yfinance_client() is client

    with pytest.raises(YFRateLimitError):
        await client.get_quote("AAPL")

    with pytest.raises(YFRateLimitError):
        await client.get_dividends("AAPL")
