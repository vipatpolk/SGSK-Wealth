import asyncio
import logging
import math
import os
import tempfile
import threading
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any

import pandas as pd
import yfinance as yf

from config.settings import get_settings
from utils.http_client import get_yahoo_semaphore

_config_lock = threading.Lock()
_configured = False


@dataclass(frozen=True, slots=True)
class YahooQuote:
    """Normalized market quote and metadata extracted from yfinance."""

    price: float = 0.0
    name: str = ""
    currency: str = ""


def configure_yfinance(force: bool = False) -> str:
    """Configure yfinance cache directory, retries, and logging idempotently."""
    global _configured
    with _config_lock:
        settings = get_settings()
        cache_dir = settings.yfinance_cache_dir.strip() or os.path.join(tempfile.gettempdir(), "py-yfinance")
        if _configured and not force:
            return cache_dir

        os.makedirs(cache_dir, exist_ok=True)
        yf.set_tz_cache_location(cache_dir)

        yf.config.network.retries = max(0, settings.yfinance_retries)
        yf.config.debug.logging = False
        logging.getLogger("yfinance").setLevel(logging.CRITICAL)

        _configured = True
        return cache_dir


def _to_finite_float(value: Any) -> float | None:
    if value is None:
        return None
    try:
        num = float(value)
    except (TypeError, ValueError):
        return None
    return num if math.isfinite(num) else None


def _timestamp_to_utc_midnight_epoch(ts: Any) -> int:
    """Preserve exchange-local calendar date when converting dividend timestamps to UTC midnight."""
    if hasattr(ts, "year") and hasattr(ts, "month") and hasattr(ts, "day"):
        return int(datetime(int(ts.year), int(ts.month), int(ts.day), tzinfo=timezone.utc).timestamp())
    if isinstance(ts, (int, float)) and math.isfinite(float(ts)):
        return int(ts)
    return 0


class YFinanceClient:
    """Async-safe adapter around yfinance.Ticker using bounded thread offloading."""

    def __init__(self, timeout_seconds: float | None = None, dividend_period: str | None = None) -> None:
        settings = get_settings()
        self.timeout_seconds = timeout_seconds if timeout_seconds is not None else settings.yfinance_timeout_seconds
        self.dividend_period = dividend_period or settings.yfinance_dividend_period

    def _fetch_quote_sync(self, yahoo_symbol: str) -> YahooQuote:
        if not yahoo_symbol or not yahoo_symbol.strip():
            return YahooQuote()

        configure_yfinance()
        ticker = yf.Ticker(yahoo_symbol)
        hist = ticker.history(
            period="5d",
            interval="1d",
            prepost=False,
            actions=False,
            auto_adjust=False,
            timeout=self.timeout_seconds,
            raise_errors=False,
        )
        meta: Any = ticker.get_history_metadata() or {}

        price = 0.0
        for candidate in (
            meta.get("regularMarketPrice") if meta else None,
            self._extract_last_close(hist),
            meta.get("chartPreviousClose") if meta else None,
            meta.get("previousClose") if meta else None,
        ):
            parsed = _to_finite_float(candidate)
            if parsed is not None and parsed > 0:
                price = parsed
                break

        name = str((meta.get("longName") or meta.get("shortName") or "") if meta else "").strip()
        currency = str((meta.get("currency") or "") if meta else "").strip()
        return YahooQuote(price=price, name=name, currency=currency)

    @staticmethod
    def _extract_last_close(hist: pd.DataFrame | None) -> float | None:
        if hist is None or hist.empty or "Close" not in hist.columns:
            return None
        close_series = hist["Close"].dropna()
        if close_series.empty:
            return None
        return _to_finite_float(close_series.iloc[-1])

    def _fetch_dividends_sync(self, yahoo_symbol: str, period: str) -> list[dict[str, Any]]:
        if not yahoo_symbol or not yahoo_symbol.strip():
            return []

        configure_yfinance()
        ticker = yf.Ticker(yahoo_symbol)
        raw_divs: Any = ticker.get_dividends(period=period)
        if raw_divs is None:
            return []

        series: Any
        if isinstance(raw_divs, pd.DataFrame):
            if "Dividends" not in raw_divs.columns:
                return []
            series = raw_divs["Dividends"]
        else:
            series = raw_divs

        if series.empty:
            return []

        div_list: list[dict[str, Any]] = []
        for ts, raw_amt in series.items():
            amt = _to_finite_float(raw_amt)
            if amt is None or amt <= 0:
                continue
            dt = _timestamp_to_utc_midnight_epoch(ts)
            if dt > 0:
                div_list.append({"amount": amt, "date": dt})

        div_list.sort(key=lambda x: x["date"], reverse=True)
        return div_list

    async def get_quote(self, yahoo_symbol: str) -> YahooQuote:
        if not yahoo_symbol or not yahoo_symbol.strip():
            return YahooQuote()
        async with get_yahoo_semaphore():
            return await asyncio.to_thread(self._fetch_quote_sync, yahoo_symbol)

    async def get_exchange_rate(self, from_currency: str, to_currency: str) -> float:
        pair = f"{from_currency}{to_currency}=X"
        quote = await self.get_quote(pair)
        return quote.price

    async def get_dividends(self, yahoo_symbol: str, period: str | None = None) -> list[dict[str, Any]]:
        if not yahoo_symbol or not yahoo_symbol.strip():
            return []
        effective_period = period or self.dividend_period
        async with get_yahoo_semaphore():
            return await asyncio.to_thread(self._fetch_dividends_sync, yahoo_symbol, effective_period)


_client_instance: YFinanceClient | None = None


def get_yfinance_client() -> YFinanceClient:
    global _client_instance
    if _client_instance is None:
        _client_instance = YFinanceClient()
    return _client_instance
