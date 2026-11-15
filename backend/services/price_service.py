import asyncio
import html
import re
import time
import urllib.parse
from typing import Any, cast

import httpx

from models.transaction import PriceData
from services.nav_service import NavService
from utils.cache import singleflight, ttl_cache
from utils.format_utils import resolve_quote_currency, to_yahoo_symbol
from utils.http_client import get_binance_semaphore, get_http_client, get_yahoo_semaphore

SET_LISTED_COMPANIES_TH_URL = "https://weblink.set.or.th/dat/eod/listedcompany/static/listedCompanies_th_TH.xls"
SET_LISTED_COMPANIES_EN_URL = "https://weblink.set.or.th/dat/eod/listedcompany/static/listedCompanies_en_US.xls"


def _parse_set_listed_companies_html(raw_bytes: bytes) -> dict[str, str]:
    """Parse SET cp874 XLS-HTML listed-companies table into {SYMBOL: company_name}."""
    text = raw_bytes.decode("cp874", errors="replace")
    parsed: dict[str, str] = {}
    for row_html in re.findall(r"<tr[^>]*>(.*?)</tr>", text, flags=re.IGNORECASE | re.DOTALL):
        cells = re.findall(r"<td[^>]*>(.*?)</td>", row_html, flags=re.IGNORECASE | re.DOTALL)
        if len(cells) < 2:
            continue
        sym_raw = html.unescape(re.sub(r"<[^>]+>", "", cells[0])).strip().upper()
        name_raw = re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", "", cells[1]))).strip()
        if not sym_raw or not name_raw or " " in sym_raw or sym_raw in {"SYMBOL", "หลักทรัพย์", "SECURITIES"}:
            continue
        parsed[sym_raw] = name_raw
    return parsed

COMMON_CRYPTO_NAMES: dict[str, str] = {
    "BTC": "Bitcoin",
    "ETH": "Ethereum",
    "SOL": "Solana",
    "USDT": "Tether USDt",
    "BNB": "BNB",
    "XRP": "XRP",
    "ADA": "Cardano",
    "DOGE": "Dogecoin",
    "DOT": "Polkadot",
    "AVAX": "Avalanche",
}


class PriceService:
    def __init__(self, client: httpx.AsyncClient | None = None, nav_service: NavService | None = None):
        self.nav_service = nav_service or NavService(client=client)
        self._custom_client = client

    @property
    def client(self) -> httpx.AsyncClient:
        return self._custom_client or get_http_client()

    async def fetch_prices_and_rate(self, summaries: list[dict[str, str]]) -> dict[str, Any]:
        prices_task = self.fetch_prices(summaries)
        rate_task = self.fetch_exchange_rate()

        prices, rate = await asyncio.gather(prices_task, rate_task)
        return {"prices": prices, "rate": rate}

    async def fetch_exchange_rate(self, from_currency: str = "USD", to_currency: str = "THB") -> float:
        if from_currency == to_currency:
            return 1.0

        cache_key = f"rate_{from_currency}_{to_currency}"
        cached = ttl_cache.get(cache_key)
        if cached is not None:
            return cast(float, cached)

        async def _do_fetch_rate() -> float:
            c = ttl_cache.get(cache_key)
            if c is not None:
                return cast(float, c)

            pair = f"{from_currency}{to_currency}=X"
            url = f"https://query1.finance.yahoo.com/v8/finance/chart/{urllib.parse.quote(pair)}?range=1d&interval=1d&includePrePost=false"
            try:
                async with get_yahoo_semaphore():
                    res = await self.client.get(url)
                res.raise_for_status()
                meta = res.json().get("chart", {}).get("result", [{}])[0].get("meta", {})
                rate = self._extract_yahoo_price(meta)
                if rate > 0:
                    ttl_cache.set(cache_key, rate, ttl=300.0)
                return rate
            except Exception:
                return 0.0

        return await singleflight.execute(f"fetch_rate_{from_currency}_{to_currency}", _do_fetch_rate)

    @staticmethod
    def _is_crypto(s: dict[str, str]) -> bool:
        return s.get("assetType") == "crypto" or s.get("symbol", "").upper().endswith(".CRYPTO")

    @staticmethod
    def _is_fund(s: dict[str, str]) -> bool:
        sym = s.get("symbol", "").upper()
        return s.get("assetType") == "mutual-fund" or sym.endswith(".FUND") or sym.endswith(".BKFUND")

    @staticmethod
    def _is_pvd(s: dict[str, str]) -> bool:
        return s.get("assetType") == "provident-fund" or s.get("symbol", "").upper().startswith("PVD")

    def _extract_yahoo_price(self, meta: dict[str, Any]) -> float:
        return meta.get("regularMarketPrice") or meta.get("chartPreviousClose") or meta.get("previousClose") or 0.0

    async def fetch_prices(self, summaries: list[dict[str, str]]) -> dict[str, PriceData]:
        if not summaries:
            return {}

        stock_symbols = list(
            set(
                [
                    s["symbol"]
                    for s in summaries
                    if not self._is_fund(s) and not self._is_crypto(s) and not self._is_pvd(s)
                ]
            )
        )
        thai_stock_symbols: set[str] = {
            s["symbol"]
            for s in summaries
            if (s.get("assetType") == "thai-stock" or s.get("symbol", "").upper().endswith(".BK"))
            and not self._is_fund(s)
            and not self._is_crypto(s)
            and not self._is_pvd(s)
        }
        crypto_symbols = list(set([s["symbol"] for s in summaries if self._is_crypto(s)]))
        fund_symbols = list(set([s["symbol"] for s in summaries if self._is_fund(s)]))

        tasks = []
        if stock_symbols:
            tasks.append(self.fetch_stock_prices(stock_symbols, thai_symbols=thai_stock_symbols))
        if crypto_symbols:
            tasks.append(self.fetch_crypto_prices(crypto_symbols))
        if fund_symbols:
            tasks.append(self.nav_service.fetch_fund_navs(fund_symbols))

        if not tasks:
            return {}

        results = await asyncio.gather(*tasks)
        merged = {}
        for res_map in results:
            merged.update(res_map)
        return merged

    async def _fetch_single_stock(self, symbol: str) -> tuple[str, PriceData]:
        cache_key = f"stock_price_{symbol}"
        cached = ttl_cache.get(cache_key)
        if cached is not None:
            return symbol, cached

        async def _do_fetch_stock() -> tuple[str, PriceData]:
            c = ttl_cache.get(cache_key)
            if c is not None:
                return symbol, c

            yahoo_symbol = to_yahoo_symbol(symbol)
            url = f"https://query1.finance.yahoo.com/v8/finance/chart/{urllib.parse.quote(yahoo_symbol)}?range=1d&interval=1d&includePrePost=false"
            try:
                async with get_yahoo_semaphore():
                    res = await self.client.get(url)
                res.raise_for_status()
                meta = res.json().get("chart", {}).get("result", [{}])[0].get("meta", {})
                price = self._extract_yahoo_price(meta)
                data = PriceData(
                    symbol=symbol,
                    name=meta.get("longName") or meta.get("shortName") or "",
                    price=price,
                    currency=meta.get("currency") or "",
                )
                if price > 0 or data.name:
                    ttl_cache.set(cache_key, data, ttl=60.0)
                return symbol, data
            except Exception:
                return symbol, PriceData(symbol=symbol, name="", price=0.0, currency="")

        return await singleflight.execute(f"stock_price_{symbol}", _do_fetch_stock)

    async def _fetch_set_html_map(self, url: str) -> dict[str, str]:
        try:
            res = await self.client.get(url, follow_redirects=True)
            res.raise_for_status()
            return _parse_set_listed_companies_html(res.content)
        except Exception:
            return {}

    async def _fetch_set_listed_company_names(self) -> dict[str, dict[str, str]]:
        """Dynamically fetch official Thai & English company names for all SET listed securities."""
        cache_key = "set_listed_company_names"
        cached = ttl_cache.get(cache_key)
        if cached is not None:
            return cast(dict[str, dict[str, str]], cached)

        async def _do_fetch_set_names() -> dict[str, dict[str, str]]:
            c = ttl_cache.get(cache_key)
            if c is not None:
                return cast(dict[str, dict[str, str]], c)

            th_map, en_map = await asyncio.gather(
                self._fetch_set_html_map(SET_LISTED_COMPANIES_TH_URL),
                self._fetch_set_html_map(SET_LISTED_COMPANIES_EN_URL),
            )
            combined: dict[str, dict[str, str]] = {}
            for sym in set(th_map) | set(en_map):
                combined[sym] = {
                    "th": th_map.get(sym, ""),
                    "en": en_map.get(sym, ""),
                }
            if combined:
                ttl_cache.set(cache_key, combined, ttl=86400.0)
            return combined

        return await singleflight.execute("set_listed_company_names", _do_fetch_set_names)

    async def fetch_stock_prices(
        self, symbols: list[str], thai_symbols: set[str] | None = None
    ) -> dict[str, PriceData]:
        resolved_thai: set[str] = {
            sym for sym in symbols if sym.upper().endswith(".BK") or (thai_symbols is not None and sym in thai_symbols)
        }
        set_names: dict[str, dict[str, str]] = {}
        results: list[tuple[str, PriceData]]
        if resolved_thai:
            stock_coro = asyncio.gather(*[self._fetch_single_stock(sym) for sym in symbols])
            set_coro = self._fetch_set_listed_company_names()
            raw_results, set_names = await asyncio.gather(stock_coro, set_coro)
            results = list(raw_results)
        else:
            results = list(await asyncio.gather(*[self._fetch_single_stock(sym) for sym in symbols]))

        price_map: dict[str, PriceData] = {}
        for sym, data in results:
            updated_data = data
            if sym in resolved_thai and set_names:
                base_sym = re.sub(r"(?i)\.BK$", "", sym).strip().upper()
                names_entry = set_names.get(base_sym, {})
                th_name = names_entry.get("th", "")
                en_name = names_entry.get("en", "")
                if th_name or en_name:
                    final_en = updated_data.name or en_name or th_name
                    final_curr = updated_data.currency or ("THB" if updated_data.price > 0 or th_name or en_name else "")
                    updated_data = updated_data.model_copy(
                        update={
                            "name": final_en,
                            "nameTh": th_name,
                            "currency": final_curr,
                        }
                    )
            if updated_data.price > 0 or updated_data.name:
                price_map[sym] = updated_data
        return price_map

    async def _fetch_binance_tickers(self) -> Any:
        cache_key = "binance_tickers"
        cached = ttl_cache.get(cache_key)
        if cached is not None:
            return cached

        async def _do_fetch_binance() -> Any:
            c = ttl_cache.get(cache_key)
            if c is not None:
                return c
            try:
                async with get_binance_semaphore():
                    res = await self.client.get("https://api.binance.th/api/v1/ticker/price")
                res.raise_for_status()
                data = res.json()
                ttl_cache.set(cache_key, data, ttl=30.0)
                return data
            except Exception:
                return []

        return await singleflight.execute("fetch_binance_tickers", _do_fetch_binance)

    async def _fetch_yahoo_crypto_name(self, symbol: str) -> tuple[str, str]:
        base = re.sub(r"(?i)\.CRYPTO$", "", symbol).strip().upper()
        if base in COMMON_CRYPTO_NAMES:
            return symbol, COMMON_CRYPTO_NAMES[base]

        cache_key = f"crypto_name_{symbol}"
        cached = ttl_cache.get(cache_key)
        if cached is not None:
            return symbol, cached

        yahoo_symbol = f"{base}-USD"
        url = f"https://query1.finance.yahoo.com/v8/finance/chart/{urllib.parse.quote(yahoo_symbol)}?range=1d&interval=1d&includePrePost=false"
        try:
            async with get_yahoo_semaphore():
                res = await self.client.get(url)
            res.raise_for_status()
            meta = res.json().get("chart", {}).get("result", [{}])[0].get("meta", {})
            name = meta.get("longName") or meta.get("shortName") or ""
            if name:
                ttl_cache.set(cache_key, name, ttl=86400.0)
            return symbol, name
        except Exception:
            return symbol, ""

    def _resolve_crypto_price(self, raw_symbol: str, tickers: list[dict[str, Any]]) -> tuple[float, str]:
        base = re.sub(r"(?i)\.CRYPTO$", "", raw_symbol).strip().upper()
        if not base or not tickers:
            return 0.0, ""
        matches = []
        for t in tickers:
            sym = t.get("symbol", "").upper()
            price = float(t.get("price", 0))
            if price <= 0:
                continue
            if sym == base:
                quote = "THB" if sym.endswith("THB") else ("USD" if "USD" in sym else "")
                matches.append((quote, resolve_quote_currency(quote) if quote else "", price))
            elif sym.startswith(base):
                quote = sym[len(base) :]
                matches.append((quote, resolve_quote_currency(quote), price))
        if not matches:
            return 0.0, ""

        best_match = (
            next((m for m in matches if m[1] == "THB"), None)
            or next((m for m in matches if m[1] == "USD"), None)
            or matches[0]
        )
        return best_match[2], best_match[1] or "USD"

    async def fetch_crypto_prices(self, symbols: list[str]) -> dict[str, PriceData]:
        tickers_task = self._fetch_binance_tickers()
        names_task = asyncio.gather(*[self._fetch_yahoo_crypto_name(sym) for sym in symbols])

        tickers, names = await asyncio.gather(tickers_task, names_task)
        name_map = dict(names)
        price_map = {}
        for symbol in symbols:
            price, currency = self._resolve_crypto_price(symbol, tickers)
            dynamic_name = name_map.get(symbol, "")
            price_map[symbol] = PriceData(symbol=symbol, name=dynamic_name, price=price, currency=currency)
        return price_map

    async def _fetch_single_stock_dividends(self, symbol: str) -> tuple[str, dict[str, Any]]:
        cache_key = f"stock_div_{symbol}"
        cached = ttl_cache.get(cache_key)
        if cached is not None:
            return symbol, cached

        async def _do_fetch_div() -> tuple[str, dict[str, Any]]:
            c = ttl_cache.get(cache_key)
            if c is not None:
                return symbol, c

            yahoo_symbol = to_yahoo_symbol(symbol)
            url = f"https://query1.finance.yahoo.com/v8/finance/chart/{urllib.parse.quote(yahoo_symbol)}?range=5y&interval=1mo&events=div"
            try:
                async with get_yahoo_semaphore():
                    res = await self.client.get(url)
                res.raise_for_status()
                result = res.json().get("chart", {}).get("result", [{}])[0]
                events = result.get("events", {})
                div_map = events.get("dividends", {})
                div_list = []
                now_ts = time.time()
                one_year_ago_ts = now_ts - (365 * 24 * 3600)
                trailing_12m = 0.0
                if isinstance(div_map, dict):
                    for ts_str, d in div_map.items():
                        amt = float(d.get("amount", 0.0))
                        dt = d.get("date", int(ts_str) if ts_str.isdigit() else 0)
                        div_list.append({"amount": amt, "date": dt})
                        if dt >= one_year_ago_ts:
                            trailing_12m += amt

                div_list.sort(key=lambda x: x.get("date", 0), reverse=True)
                res_data = {"trailing_12m_dps": trailing_12m, "dividends": div_list}
                ttl_cache.set(cache_key, res_data, ttl=3600.0)
                return symbol, res_data
            except Exception:
                return symbol, {"trailing_12m_dps": 0.0, "dividends": []}

        return await singleflight.execute(f"stock_div_{symbol}", _do_fetch_div)

    async def fetch_stock_dividends(self, symbols: list[str]) -> dict[str, dict[str, Any]]:
        unique = list(
            set([s for s in symbols if not self._is_crypto({"symbol": s}) and not self._is_fund({"symbol": s})])
        )
        if not unique:
            return {}
        results = await asyncio.gather(*[self._fetch_single_stock_dividends(sym) for sym in unique])
        return dict(results)
