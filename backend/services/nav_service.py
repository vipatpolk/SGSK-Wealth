import asyncio
import base64
import html
import logging
import re
import urllib.parse
from datetime import datetime, timedelta
from typing import Any, cast

import httpx

from config.settings import get_settings
from models.factsheet import (
    FactsheetAllocationItem,
    FactsheetFeeItem,
    FactsheetHoldingItem,
    FactsheetPerformanceItem,
    FactsheetStatistics,
    FactsheetTradeConditions,
    FundFactsheetResponse,
)
from models.transaction import PriceData
from utils.cache import singleflight, ttl_cache
from utils.http_client import get_http_client, get_sec_semaphore
from utils.pvd_constants import DEFAULT_PVD_METADATA, DEFAULT_PVD_NAMES

logger = logging.getLogger(__name__)

SEC_API_CONFIG = {
    "baseUrl": "https://api.sec.or.th/v2/fund",
}

_MANAGEMENT_STYLE_MAP: dict[str, str] = {
    "AM": "AM - Active Management",
    "AN": "AN - Feeder Fund (Active Master)",
    "PM": "PM - Passive / Index Tracking",
    "PN": "PN - Feeder Fund (Passive Master)",
    "IM": "IM - Inverse",
    "IN": "IN - Feeder Fund (Inverse Master)",
    "LM": "LM - Leveraged",
    "LN": "LN - Feeder Fund (Leveraged Master)",
    "BH": "BH - Buy-and-Hold",
    "SM": "SM - Index Tracking (Occasional Alpha)",
    "OT": "OT - Others",
}

_PVD_FOREIGN_RISK_MAP: dict[str, str] = {
    "01": "Foreign Investment Only",
    "02": "Domestic & Foreign Investment",
    "03": "Domestic Investment Only",
}

_HTML_BREAK_RE = re.compile(r"(?i)<(?:br\s*/?|/p|/div|/li|/tr)>")
_HTML_TAG_RE = re.compile(r"<[^>]+>")
_BASE64_RE = re.compile(r"^[A-Za-z0-9+/=]+$")


def _clean_str(value: Any) -> str | None:
    if value is None:
        return None
    text = str(value).strip()
    return text if text else None


def _parse_float(value: Any) -> float | None:
    if value is None or isinstance(value, bool):
        return None
    if isinstance(value, (int, float)):
        num = float(value)
        return num if num == num and abs(num) != float("inf") else None
    text = str(value).strip().replace(",", "").rstrip("%")
    if not text or text == "-":
        return None
    try:
        num = float(text)
        return num if num == num and abs(num) != float("inf") else None
    except ValueError:
        return None


def _parse_int(value: Any, default: int = 0) -> int:
    parsed = _parse_float(value)
    return int(parsed) if parsed is not None else default


def _format_fee_rate(value: Any) -> str | None:
    text = _clean_str(value)
    if text is None:
        return None
    num = _parse_float(text)
    if num is not None:
        formatted = f"{num:.4f}".rstrip("0").rstrip(".")
        return f"{formatted}%"
    return text


def _decode_policy_text(raw: Any) -> str | None:
    text = _clean_str(raw)
    if text is None:
        return None
    if len(text) >= 12 and len(text) % 4 == 0 and _BASE64_RE.match(text):
        try:
            decoded_bytes = base64.b64decode(text, validate=True)
            decoded = decoded_bytes.decode("utf-8").strip()
            if decoded and all(ord(ch) >= 32 or ch in "\r\n\t" for ch in decoded):
                text = decoded
        except Exception:
            pass
    text = _HTML_BREAK_RE.sub("\n", text)
    text = _HTML_TAG_RE.sub("", text)
    text = html.unescape(text)
    lines = [re.sub(r"[ \t]+", " ", line).strip() for line in text.splitlines()]
    cleaned = "\n".join(line for line in lines if line)
    return cleaned or None


def _normalize_label(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip().casefold()


def _normalize_period_key(raw: Any) -> str:
    text = _clean_str(raw)
    if not text or text == "-":
        return ""
    digits = "".join(ch for ch in text if ch.isdigit())
    if len(digits) == 6:
        return f"{digits}00"
    if len(digits) >= 8:
        return digits[:8]
    return text


def _select_latest_period_rows(
    rows: list[dict[str, Any]],
    date_keys: tuple[str, ...] = ("period", "as_of_date", "end_date", "start_date"),
) -> list[dict[str, Any]]:
    if not rows:
        return []
    for key in date_keys:
        keyed = [(_normalize_period_key(r.get(key)), r) for r in rows]
        valid_keys = [k for k, _ in keyed if k]
        if valid_keys:
            latest_key = max(valid_keys)
            return [r for k, r in keyed if k == latest_key]
    return rows


def _pvd_policy_rank(item: dict[str, Any]) -> tuple[int, int, str]:
    end_date = _clean_str(item.get("sub_policy_end_date"))
    is_active = 1 if (not end_date or end_date == "-") else 0
    start_or_incept = _clean_str(item.get("sub_policy_inception_date")) or _clean_str(item.get("sub_policy_start_date"))
    has_dates = 1 if (start_or_incept and start_or_incept != "-") else 0
    upd_date = _clean_str(item.get("last_upd_date")) or _clean_str(item.get("last_updated")) or ""
    return (is_active, has_dates, upd_date)


def _build_allocation_items(
    rows: list[dict[str, Any]],
    seq_key: str,
    name_keys: tuple[str, ...],
    ratio_key: str,
) -> list[FactsheetAllocationItem]:
    sorted_rows = sorted(rows, key=lambda x: _parse_int(x.get(seq_key), 99))
    result: list[FactsheetAllocationItem] = []
    seen_names: set[str] = set()
    for idx, row in enumerate(sorted_rows, start=1):
        name: str | None = None
        for key in name_keys:
            name = _clean_str(row.get(key))
            if name:
                break
        ratio = _parse_float(row.get(ratio_key))
        if not name or ratio is None:
            continue
        norm_name = _normalize_label(name)
        if norm_name in seen_names:
            continue
        seen_names.add(norm_name)
        result.append(
            FactsheetAllocationItem(
                seq=_parse_int(row.get(seq_key), idx),
                name=name,
                ratio=ratio,
            )
        )
    return result


def _build_holding_items(
    rows: list[dict[str, Any]],
    seq_key: str,
    name_key: str,
    ratio_key: str,
    credit_key: str | None = None,
    isin_key: str | None = None,
) -> list[FactsheetHoldingItem]:
    sorted_rows = sorted(rows, key=lambda x: _parse_int(x.get(seq_key), 99))
    result: list[FactsheetHoldingItem] = []
    seen_keys: set[tuple[str, str]] = set()
    for idx, row in enumerate(sorted_rows, start=1):
        name = _clean_str(row.get(name_key))
        ratio = _parse_float(row.get(ratio_key))
        if not name or ratio is None:
            continue
        isin_val = _clean_str(row.get(isin_key)) if isin_key else None
        dedupe_key = (_normalize_label(name), (isin_val or "").upper())
        if dedupe_key in seen_keys:
            continue
        seen_keys.add(dedupe_key)
        result.append(
            FactsheetHoldingItem(
                seq=_parse_int(row.get(seq_key), idx),
                name=name,
                ratio=ratio,
                creditRating=_clean_str(row.get(credit_key)) if credit_key else None,
                isin=isin_val,
            )
        )
    return result


class NavService:
    def __init__(self, client: httpx.AsyncClient | None = None):
        settings = get_settings()
        self.headers = {
            "Ocp-Apim-Subscription-Key": settings.sec_subscription_key,
            "Accept": "application/json",
        }
        self._custom_client = client

    @property
    def client(self) -> httpx.AsyncClient:
        return self._custom_client or get_http_client()

    async def fetch_fund_navs(self, symbols: list[str]) -> dict[str, PriceData]:
        unique_symbols = list(set(symbols))
        if not unique_symbols:
            return {}

        results = await asyncio.gather(*[self.fetch_single_fund_nav(sym) for sym in unique_symbols])

        price_map = {}
        for r in results:
            if r["data"].price > 0 or (
                r["data"].name and r["data"].name != r["originalSymbol"] and r["data"].name != r["data"].symbol
            ):
                price_map[r["originalSymbol"]] = r["data"]

        return price_map

    async def fetch_pvd_proj_id(self, fund_name: str) -> str | None:
        """Resolve SEC PVD proj_id dynamically from fund name via POST /factsheet/fund."""
        clean_name = (fund_name or "").strip()
        if not clean_name:
            return None

        settings = get_settings()
        cache_key = f"sec_pvd_proj_id_{clean_name}"
        cached = ttl_cache.get(cache_key)
        if cached is not None:
            return cast(str, cached)

        async def _do_fetch() -> str | None:
            c = ttl_cache.get(cache_key)
            if c is not None:
                return cast(str, c)

            url = f"{settings.sec_pvd_base_url}/factsheet/fund"
            try:
                async with get_sec_semaphore():
                    res = await self.client.post(
                        url,
                        headers=self.headers,
                        json={"FundName": clean_name},
                    )
                if res.status_code == 204:
                    return None
                res.raise_for_status()
                raw_list = res.json()
                if not isinstance(raw_list, list) or not raw_list:
                    return None

                active_statuses = {"RG", "SE"}
                candidates = [r for r in raw_list if isinstance(r, dict) and r.get("proj_id")]
                if not candidates:
                    return None

                exact_active = next(
                    (
                        r
                        for r in candidates
                        if r.get("fund_status") in active_statuses
                        and str(r.get("proj_name_th") or "").strip() == clean_name
                    ),
                    None,
                )
                first_active = next(
                    (r for r in candidates if r.get("fund_status") in active_statuses),
                    None,
                )
                exact_any = next(
                    (r for r in candidates if str(r.get("proj_name_th") or "").strip() == clean_name),
                    None,
                )
                matched = exact_active or first_active or exact_any or candidates[0]
                resolved_proj_id = str(matched["proj_id"]).strip()
                if not resolved_proj_id:
                    return None

                resolved_fund_name = str(matched.get("proj_name_th") or "").strip()
                if resolved_fund_name:
                    ttl_cache.set(f"sec_pvd_fund_name_{resolved_proj_id}", resolved_fund_name, ttl=86400.0)

                ttl_cache.set(cache_key, resolved_proj_id, ttl=86400.0)
                return resolved_proj_id
            except Exception:
                return None

        return await singleflight.execute(f"fetch_pvd_proj_id_{clean_name}", _do_fetch)

    async def fetch_pvd_policies(
        self, proj_id: str | None = None, fund_name: str | None = None
    ) -> dict[str, dict[str, Any]]:
        settings = get_settings()
        target_proj_id = (proj_id or "").strip() or None
        if not target_proj_id and fund_name:
            target_proj_id = await self.fetch_pvd_proj_id(fund_name)
        if not target_proj_id:
            return {}

        resolved_fund_name = str(
            ttl_cache.get(f"sec_pvd_fund_name_{target_proj_id}") or fund_name or ""
        ).strip()

        cache_key = f"sec_pvd_policies_{target_proj_id}"
        cached = ttl_cache.get(cache_key)
        if cached is not None:
            cached_map = cast(dict[str, dict[str, Any]], cached)
            if resolved_fund_name:
                return {
                    k: ({**v, "fundName": resolved_fund_name} if not v.get("fundName") else v)
                    for k, v in cached_map.items()
                }
            return cached_map

        async def _do_fetch() -> dict[str, dict[str, Any]]:
            c = ttl_cache.get(cache_key)
            if c is not None:
                c_map = cast(dict[str, dict[str, Any]], c)
                if resolved_fund_name:
                    return {
                        k: ({**v, "fundName": resolved_fund_name} if not v.get("fundName") else v)
                        for k, v in c_map.items()
                    }
                return c_map

            url = f"{settings.sec_pvd_base_url}/factsheet/{target_proj_id}/policy"
            try:
                async with get_sec_semaphore():
                    res = await self.client.get(url, headers=self.headers)
                if res.status_code == 204:
                    return {}
                res.raise_for_status()
                raw_list = res.json()
                if not isinstance(raw_list, list):
                    return {}

                policy_map: dict[str, dict[str, Any]] = {}
                best_ranks: dict[str, tuple[int, int, str]] = {}
                for item in raw_list:
                    sub_id = item.get("sub_policy_id")
                    if sub_id:
                        key = str(sub_id).strip().upper()
                        rank = _pvd_policy_rank(item)
                        if key in best_ranks and rank < best_ranks[key]:
                            continue
                        best_ranks[key] = rank
                        policy_map[key] = {
                            "subPolicyId": _clean_str(sub_id) or str(sub_id),
                            "policyId": _clean_str(item.get("policy_id")) or "",
                            "uniqueSubPolicyId": _clean_str(item.get("unique_sub_policy_id")) or "",
                            "name": _clean_str(item.get("sub_policy_name")) or "",
                            "fundName": resolved_fund_name,
                            "policyName": _clean_str(item.get("policy_name")) or "",
                            "aimcType": _clean_str(item.get("aimc_type")) or "",
                            "aimcDescription": _clean_str(item.get("aimc_description")) or "",
                            "riskLevel": _clean_str(item.get("risk_level")) or "",
                            "objective": _clean_str(item.get("objective")) or "",
                            "inceptionDate": _clean_str(item.get("sub_policy_inception_date")) or "",
                            "foreignRiskLevel": _clean_str(item.get("foreign_risk_level")) or "",
                        }

                ttl_cache.set(cache_key, policy_map, ttl=86400.0)
                return policy_map
            except Exception:
                return {}

        return await singleflight.execute(f"fetch_pvd_policies_{target_proj_id}", _do_fetch)

    async def fetch_single_fund_nav(self, symbol: str) -> dict[str, Any]:
        cache_key = f"sec_nav_single_{symbol}"
        cached = ttl_cache.get(cache_key)
        if cached is not None:
            return cast(dict[str, Any], cached)

        async def _do_fetch_nav() -> dict[str, Any]:
            c = ttl_cache.get(cache_key)
            if c is not None:
                return cast(dict[str, Any], c)

            clean_symbol = re.sub(r"(?i)\.(FUND|BKFUND)$", "", symbol).strip()
            sym_upper = clean_symbol.upper()

            profile = await self.fetch_fund_profile(clean_symbol, sym_upper)
            if not profile or not profile.get("proj_id"):
                res_empty = {
                    "originalSymbol": symbol,
                    "data": PriceData(symbol=symbol, name=clean_symbol, nameTh="", price=0.0, currency="THB"),
                }
                return res_empty

            name_en = str(profile.get("proj_name_en") or "").strip()
            name_th = str(profile.get("proj_name_th") or "").strip()
            fund = {
                "projId": profile["proj_id"],
                "name": name_en or name_th or clean_symbol,
                "nameTh": name_th,
                "targetClass": profile.get("fund_class_name"),
            }

            res = await self.fetch_fund_nav_data(symbol, clean_symbol, sym_upper, fund)
            if res["data"].price > 0:
                ttl_cache.set(cache_key, res, ttl=1800.0)
            return res

        return await singleflight.execute(f"sec_nav_single_{symbol}", _do_fetch_nav)

    async def fetch_fund_profile(self, clean_symbol: str, sym_upper: str) -> Any:
        cache_key = f"sec_profile_{clean_symbol.upper()}"
        cached = ttl_cache.get(cache_key)
        if cached is not None:
            return cached

        async def _do_fetch_profile() -> Any:
            c = ttl_cache.get(cache_key)
            if c is not None:
                return c

            try:
                url1 = (
                    f"{SEC_API_CONFIG['baseUrl']}/general-info/profiles?fund_class_name={urllib.parse.quote(clean_symbol)}"
                )
                async with get_sec_semaphore():
                    res = await self.client.get(url1, headers=self.headers)
                res.raise_for_status()
                class_items = []
                if res.status_code != 204:
                    data = res.json()
                    class_items = data.get("items", [])

                for i in class_items:
                    if (
                        str(i.get("fund_class_name")).upper() == sym_upper
                        or str(i.get("proj_abbr_name")).upper() == sym_upper
                    ):
                        ttl_cache.set(cache_key, i, ttl=86400.0)
                        return i

                url2 = f"{SEC_API_CONFIG['baseUrl']}/general-info/profiles?project_info={urllib.parse.quote(clean_symbol)}"
                async with get_sec_semaphore():
                    res2 = await self.client.get(url2, headers=self.headers)
                res2.raise_for_status()
                proj_items = []
                if res2.status_code != 204:
                    data2 = res2.json()
                    proj_items = data2.get("items", [])

                if not proj_items:
                    return None

                matched = None
                for i in proj_items:
                    if str(i.get("proj_abbr_name")).upper() == sym_upper and i.get("fund_class_name") == "main":
                        matched = i
                        break
                if not matched:
                    for i in proj_items:
                        if str(i.get("fund_class_name")).upper() == sym_upper:
                            matched = i
                            break
                if not matched:
                    for i in proj_items:
                        if str(i.get("proj_abbr_name")).upper() == sym_upper:
                            matched = i
                            break
                if not matched:
                    matched = proj_items[0]

                if matched:
                    ttl_cache.set(cache_key, matched, ttl=86400.0)
                return matched
            except Exception:
                return None

        return await singleflight.execute(f"sec_profile_{clean_symbol.upper()}", _do_fetch_profile)

    async def fetch_fund_nav_data(
        self, symbol: str, clean_symbol: str, sym_upper: str, fund: dict[str, Any]
    ) -> dict[str, Any]:
        end = datetime.now()
        start = end - timedelta(days=30)

        def fmt_date(d: datetime) -> str:
            return d.strftime("%Y-%m-%d")

        url = f"{SEC_API_CONFIG['baseUrl']}/daily-info/nav?proj_id={urllib.parse.quote(fund['projId'])}&start_nav_date={fmt_date(start)}&end_nav_date={fmt_date(end)}"
        try:
            async with get_sec_semaphore():
                res = await self.client.get(url, headers=self.headers)
            res.raise_for_status()
            data_raw = res.json()
            data = data_raw if isinstance(data_raw, list) else data_raw.get("items", [])

            if not data:
                return {
                    "originalSymbol": symbol,
                    "data": PriceData(
                        symbol=symbol,
                        name=fund["name"],
                        nameTh=str(fund.get("nameTh") or ""),
                        price=0.0,
                        currency="THB",
                    ),
                }

            filtered_data = [
                d
                for d in data
                if str(d.get("fund_class_name")).upper() == str(fund.get("targetClass") or clean_symbol).upper()
            ]
            if not filtered_data and fund.get("targetClass") != "main":
                filtered_data = [d for d in data if str(d.get("fund_class_name")).upper() == sym_upper]
            if not filtered_data:
                filtered_data = [d for d in data if d.get("fund_class_name") == "main"]
            if not filtered_data:
                filtered_data = data

            filtered_data.sort(key=lambda x: x["nav_date"], reverse=True)
            latest = filtered_data[0]
            nav = latest.get("last_val", 0)

            return {
                "originalSymbol": symbol,
                "data": PriceData(
                    symbol=symbol,
                    name=fund["name"],
                    nameTh=str(fund.get("nameTh") or ""),
                    price=float(nav) if nav else 0.0,
                    currency="THB",
                ),
            }
        except Exception:
            return {
                "originalSymbol": symbol,
                "data": PriceData(
                    symbol=symbol,
                    name=fund["name"],
                    nameTh=str(fund.get("nameTh") or ""),
                    price=0.0,
                    currency="THB",
                ),
            }

    async def fetch_fund_dividend_history(self, symbol: str) -> list[dict[str, Any]]:
        cache_key = f"sec_div_{symbol}"
        cached = ttl_cache.get(cache_key)
        if cached is not None:
            return cast(list[dict[str, Any]], cached)

        async def _do_fetch_div_hist() -> list[dict[str, Any]]:
            c = ttl_cache.get(cache_key)
            if c is not None:
                return cast(list[dict[str, Any]], c)

            clean_symbol = re.sub(r"(?i)\.(FUND|BKFUND)$", "", symbol).strip()
            sym_upper = clean_symbol.upper()

            headers = self.headers
            try:
                # 1. Try direct class_abbr_name query
                url1 = f"{SEC_API_CONFIG['baseUrl']}/daily-info/dividend-history?class_abbr_name={urllib.parse.quote(clean_symbol)}"
                async with get_sec_semaphore():
                    res = await self.client.get(url1, headers=headers)
                if res.status_code == 200:
                    raw_items = res.json().get("items", [])
                    if raw_items and isinstance(raw_items, list):
                        items = cast(list[dict[str, Any]], raw_items)
                        ttl_cache.set(cache_key, items, ttl=3600.0)
                        return items

                # 2. Try by fund profile proj_id fallback
                profile = await self.fetch_fund_profile(clean_symbol, sym_upper)
                if profile and profile.get("proj_id"):
                    proj_id = profile["proj_id"]
                    url2 = f"{SEC_API_CONFIG['baseUrl']}/daily-info/dividend-history?proj_id={urllib.parse.quote(proj_id)}"
                    async with get_sec_semaphore():
                        res2 = await self.client.get(url2, headers=headers)
                    if res2.status_code == 200:
                        raw_items2 = res2.json().get("items", [])
                        if isinstance(raw_items2, list):
                            items2 = cast(list[dict[str, Any]], raw_items2)
                            filtered = [
                                i
                                for i in items2
                                if str(i.get("class_abbr_name") or i.get("fund_class_name") or "").upper() == sym_upper
                            ]
                            final_res = filtered if filtered else items2
                            ttl_cache.set(cache_key, final_res, ttl=3600.0)
                            return final_res
                return []
            except Exception:
                return []

        return await singleflight.execute(f"sec_div_{symbol}", _do_fetch_div_hist)

    async def fetch_all_fund_dividends(self, symbols: list[str]) -> dict[str, list[dict[str, Any]]]:
        unique_symbols = list(set(symbols))
        if not unique_symbols:
            return {}

        results = await asyncio.gather(*[self.fetch_fund_dividend_history(sym) for sym in unique_symbols])
        return {sym: res for sym, res in zip(unique_symbols, results)}

    async def _fetch_sec_json(self, url: str, params: dict[str, str] | None = None) -> Any:
        target_url = f"{url}?{urllib.parse.urlencode(params)}" if params else url
        try:
            async with get_sec_semaphore():
                res = await self.client.get(target_url, headers=self.headers)
            if res.status_code == 204 or not getattr(res, "text", " "):
                return None
            res.raise_for_status()
            return res.json()
        except Exception as exc:
            logger.debug("SEC request failed for %s: %s", target_url, exc)
            return None

    @staticmethod
    def _extract_items(payload: Any) -> list[dict[str, Any]]:
        if isinstance(payload, dict) and isinstance(payload.get("items"), list):
            return [x for x in payload["items"] if isinstance(x, dict)]
        if isinstance(payload, list):
            return [x for x in payload if isinstance(x, dict)]
        return []

    @staticmethod
    def _filter_by_class(
        items: list[dict[str, Any]],
        target_class: str | None,
        sym_upper: str,
    ) -> list[dict[str, Any]]:
        if not items:
            return []
        candidates: list[str] = []
        if target_class and target_class.strip():
            candidates.append(target_class.strip().upper())
        if sym_upper not in candidates:
            candidates.append(sym_upper)

        for cand in candidates:
            exact = [x for x in items if str(x.get("fund_class_name") or "").strip().upper() == cand]
            if exact:
                return exact

        main_rows = [
            x
            for x in items
            if str(x.get("fund_class_name") or "").strip().upper() in {"MAIN", "-", ""}
        ]
        return main_rows if main_rows else items

    @staticmethod
    def _filter_pvd_rows(
        items: list[dict[str, Any]],
        policy_info: dict[str, Any] | None,
        sym_upper: str,
    ) -> list[dict[str, Any]]:
        if not items:
            return []
        unique_id = str((policy_info or {}).get("uniqueSubPolicyId") or "").strip()
        policy_id = str((policy_info or {}).get("policyId") or "").strip()
        sub_policy_name = str((policy_info or {}).get("name") or "").strip()

        has_uid_field = any(str(x.get("unique_sub_policy_id") or "").strip() for x in items)
        has_sub_id_field = any(str(x.get("sub_policy_id") or "").strip() for x in items)

        if unique_id and has_uid_field:
            by_unique = [x for x in items if str(x.get("unique_sub_policy_id") or "").strip() == unique_id]
            if by_unique:
                return by_unique
            if sym_upper and has_sub_id_field:
                return [x for x in items if str(x.get("sub_policy_id") or "").strip().upper() == sym_upper]
            return []

        if sym_upper and has_sub_id_field:
            return [x for x in items if str(x.get("sub_policy_id") or "").strip().upper() == sym_upper]

        if sub_policy_name:
            by_sub_name = [
                x
                for x in items
                if str(x.get("sub_policy_name") or "").strip() == sub_policy_name
            ]
            if by_sub_name:
                return by_sub_name

        # Fallback to policy_id only when endpoint rows lack sub-policy identifiers
        # to avoid pulling unrelated sibling sub-policies under the same umbrella policy.
        if policy_id and not has_uid_field and not has_sub_id_field:
            return [x for x in items if str(x.get("policy_id") or "").strip() == policy_id]

        return []

    async def fetch_fund_factsheet(
        self,
        symbol: str,
        asset_type: str = "mutual-fund",
        fund_name: str | None = None,
    ) -> FundFactsheetResponse:
        """Fetch and aggregate unified SEC Open API factsheet data for Mutual Funds or Provident Funds."""
        sym_clean = symbol.strip()
        normalized_type = (asset_type or "mutual-fund").strip().lower()
        fund_key = (fund_name or "").strip()
        cache_key = f"factsheet_v1_{normalized_type}_{sym_clean.upper()}_{fund_key}"
        cached = ttl_cache.get(cache_key)
        if cached is not None:
            return cast(FundFactsheetResponse, cached)

        async def _do_fetch() -> FundFactsheetResponse:
            c = ttl_cache.get(cache_key)
            if c is not None:
                return cast(FundFactsheetResponse, c)

            res_model: FundFactsheetResponse
            if normalized_type == "provident-fund":
                res_model = await self._build_pvd_factsheet(sym_clean, fund_key or None)
            else:
                res_model = await self._build_mutual_fund_factsheet(sym_clean)

            ttl_cache.set(cache_key, res_model, ttl=3600.0)
            return res_model

        return cast(
            FundFactsheetResponse,
            await singleflight.execute(f"factsheet_{normalized_type}_{sym_clean.upper()}_{fund_key}", _do_fetch),
        )

    async def _build_mutual_fund_factsheet(self, symbol: str) -> FundFactsheetResponse:
        base_symbol = re.sub(r"(?i)\.(FUND|BKFUND|BK)$", "", symbol).strip()
        sym_upper = base_symbol.upper()
        profile = await self.fetch_fund_profile(base_symbol, sym_upper)

        if not profile or not profile.get("proj_id"):
            return FundFactsheetResponse(
                symbol=symbol.upper(),
                displaySymbol=base_symbol,
                assetType="mutual-fund",
                fundName=base_symbol,
            )

        proj_id = str(profile["proj_id"])
        target_class = _clean_str(profile.get("fund_class_name"))
        base = SEC_API_CONFIG["baseUrl"]

        urls_raw, risk_raw, bench_raw, div_raw, fees_raw, perf_raw, stats_raw, alloc_raw, top5_raw, mins_raw, periods_raw = await asyncio.gather(
            self._fetch_sec_json(f"{base}/factsheet/urls", {"proj_id": proj_id}),
            self._fetch_sec_json(f"{base}/factsheet/risk-spectrum", {"proj_id": proj_id, "latest": "true"}),
            self._fetch_sec_json(f"{base}/factsheet/benchmarks", {"proj_id": proj_id, "latest": "true"}),
            self._fetch_sec_json(f"{base}/factsheet/dividend-policy", {"proj_id": proj_id, "latest": "true"}),
            self._fetch_sec_json(f"{base}/factsheet/fees", {"proj_id": proj_id, "latest": "true"}),
            self._fetch_sec_json(f"{base}/factsheet/performance", {"proj_id": proj_id, "latest": "true"}),
            self._fetch_sec_json(f"{base}/factsheet/statistics", {"proj_id": proj_id, "latest": "true"}),
            self._fetch_sec_json(f"{base}/factsheet/asset-allocation", {"proj_id": proj_id, "latest": "true"}),
            self._fetch_sec_json(f"{base}/factsheet/top5-holdings", {"proj_id": proj_id, "latest": "true"}),
            self._fetch_sec_json(
                f"{base}/factsheet/subscription-redemption-minimums",
                {"proj_id": proj_id, "latest": "true"},
            ),
            self._fetch_sec_json(
                f"{base}/factsheet/subscription-redemption-periods",
                {"proj_id": proj_id, "latest": "true"},
            ),
        )

        url_items = self._filter_by_class(self._extract_items(urls_raw), target_class, sym_upper)
        url_row: dict[str, Any] = url_items[0] if url_items else {}

        risk_items = self._extract_items(risk_raw)
        risk_row: dict[str, Any] = risk_items[0] if risk_items else {}

        bench_items = sorted(self._extract_items(bench_raw), key=lambda x: _parse_int(x.get("group_seq"), 99))
        benchmark_text = (
            " + ".join(b for b in (_clean_str(x.get("benchmark")) for x in bench_items) if b) or None
        )
        benchmark_remark: str | None = None
        for b_row in bench_items:
            remark_val = _clean_str(b_row.get("benchmark_remark")) or _clean_str(b_row.get("remark"))
            if remark_val:
                benchmark_remark = remark_val
                break

        div_items = self._filter_by_class(self._extract_items(div_raw), target_class, sym_upper)
        div_row: dict[str, Any] = div_items[0] if div_items else {}

        fee_items_raw = self._filter_by_class(self._extract_items(fees_raw), target_class, sym_upper)
        fees: list[FactsheetFeeItem] = []
        for f_row in fee_items_raw:
            desc = _clean_str(f_row.get("fee_type_desc")) or _clean_str(f_row.get("fee_other_desc"))
            if not desc:
                continue
            fees.append(
                FactsheetFeeItem(
                    description=desc,
                    ceilingRate=_format_fee_rate(f_row.get("rate")),
                    actualRate=_format_fee_rate(f_row.get("actual_value")),
                    note=_clean_str(f_row.get("fee_other_desc")),
                )
            )

        perf_items_raw = self._filter_by_class(self._extract_items(perf_raw), target_class, sym_upper)
        performance: list[FactsheetPerformanceItem] = []
        for p_row in perf_items_raw:
            category = _clean_str(p_row.get("performance_type_desc"))
            period = _clean_str(p_row.get("reference_period"))
            if not category or not period:
                continue
            raw_val = (
                p_row.get("performance_value")
                if p_row.get("performance_value") is not None
                else p_row.get("performance_val")
            )
            performance.append(
                FactsheetPerformanceItem(
                    category=category,
                    period=period,
                    value=_parse_float(raw_val),
                )
            )

        stats_items = self._filter_by_class(self._extract_items(stats_raw), target_class, sym_upper)
        statistics: FactsheetStatistics | None = None
        if stats_items:
            s_row = stats_items[0]
            statistics = FactsheetStatistics(
                maxDrawdown=_parse_float(s_row.get("maximum_drawdown")),
                sharpeRatio=_parse_float(s_row.get("sharpe_ratio")),
                trackingError=_parse_float(s_row.get("tracking_error")),
                fxHedging=_clean_str(s_row.get("fx_hedging")),
                turnoverRatio=_parse_float(s_row.get("portfolio_turnover_ratio")),
                beta=_parse_float(s_row.get("beta")),
                alpha=_parse_float(s_row.get("alpha")),
                yieldToMaturity=_parse_float(s_row.get("yield_to_maturity")),
                portfolioDuration=_clean_str(s_row.get("portfolio_duration_period")),
                recoveringPeriod=_clean_str(s_row.get("recovering_period")),
            )

        alloc_items_raw = _select_latest_period_rows(self._extract_items(alloc_raw))
        asset_allocation = _build_allocation_items(
            alloc_items_raw,
            seq_key="asset_seq",
            name_keys=("asset_name",),
            ratio_key="asset_ratio",
        )

        top5_items_raw = _select_latest_period_rows(self._extract_items(top5_raw))
        top_holdings = _build_holding_items(
            top5_items_raw,
            seq_key="asset_seq",
            name_key="asset_name",
            ratio_key="asset_ratio",
        )

        min_items = self._filter_by_class(self._extract_items(mins_raw), target_class, sym_upper)
        min_row: dict[str, Any] = min_items[0] if min_items else {}
        period_items = self._filter_by_class(self._extract_items(periods_raw), target_class, sym_upper)

        sub_period: str | None = None
        redempt_period: str | None = None
        settlement_period: str | None = None
        for per_row in period_items:
            p_type = str(per_row.get("type") or "").strip().lower()
            if p_type == "subscription" and not sub_period:
                sub_period = _clean_str(per_row.get("period"))
            elif p_type == "redemption":
                if not redempt_period:
                    redempt_period = _clean_str(per_row.get("period")) or _clean_str(per_row.get("redemp_period_oth"))
                if not settlement_period:
                    settlement_period = _clean_str(per_row.get("settlement_period"))

        trade_conditions: FactsheetTradeConditions | None = None
        min_init = _parse_float(min_row.get("minimum_sub_ipo"))
        min_next = _parse_float(min_row.get("minimum_sub"))
        min_red = _parse_float(min_row.get("minimum_redempt"))
        trade_curr = _clean_str(min_row.get("minimum_sub_cur")) or _clean_str(min_row.get("minimum_redempt_cur"))
        if any(
            val is not None
            for val in (min_init, min_next, min_red, sub_period, redempt_period, settlement_period)
        ):
            trade_conditions = FactsheetTradeConditions(
                minimumInitialSub=min_init,
                minimumNextSub=min_next,
                minimumRedempt=min_red,
                currency=trade_curr,
                subscriptionPeriod=sub_period,
                redemptionPeriod=redempt_period,
                settlementPeriod=settlement_period,
            )

        mgmt_code = _clean_str(profile.get("management_style"))
        mgmt_style = _MANAGEMENT_STYLE_MAP.get(mgmt_code, mgmt_code) if mgmt_code else None
        raw_div_policy = _clean_str(div_row.get("dividend_policy"))

        return FundFactsheetResponse(
            symbol=symbol.upper(),
            displaySymbol=base_symbol,
            assetType="mutual-fund",
            projId=proj_id,
            fundName=_clean_str(profile.get("proj_name_en")) or _clean_str(profile.get("proj_name_th")) or base_symbol,
            fundNameTh=_clean_str(profile.get("proj_name_th")),
            amcName=_clean_str(profile.get("comp_name_en")) or _clean_str(profile.get("comp_name_th")),
            amcNameTh=_clean_str(profile.get("comp_name_th")),
            fundClassName=None if target_class == "main" else target_class,
            policyDesc=_clean_str(profile.get("policy_desc")),
            investmentPolicyDesc=_decode_policy_text(profile.get("investment_policy_desc")),
            managementStyle=mgmt_style,
            riskLevel=_clean_str(risk_row.get("risk_spectrum")),
            riskDescription=_clean_str(risk_row.get("risk_spectrum_desc")),
            benchmark=benchmark_text,
            benchmarkRemark=benchmark_remark,
            dividendPolicy=raw_div_policy,
            inceptionDate=_clean_str(profile.get("regis_date")) or _clean_str(profile.get("init_date")),
            pdfUrl=_clean_str(url_row.get("pdf_factsheet")),
            amcUrl=_clean_str(url_row.get("amc_url_factsheet")),
            asOfDate=_clean_str(url_row.get("as_of_date")),
            feederMasterFund=_clean_str(profile.get("feederfund_master_fund")),
            feederCountry=_clean_str(profile.get("feederfund_country")),
            fxHedgingPolicy=_clean_str(profile.get("exchange_rate_protection_policy")),
            taxIncentiveType=_clean_str(profile.get("fund_class_tax_incentive_type")),
            isinCode=_clean_str(profile.get("fund_class_isin_code")),
            fees=fees,
            performance=performance,
            statistics=statistics,
            assetAllocation=asset_allocation,
            topHoldings=top_holdings,
            tradeConditions=trade_conditions,
        )

    async def _build_pvd_factsheet(self, symbol: str, fund_name: str | None) -> FundFactsheetResponse:
        sym_upper = symbol.strip().upper()
        effective_fund_name = (fund_name or "ไทยพาณิชย์ มาสเตอร์ฟันด์").strip()
        default_meta = DEFAULT_PVD_METADATA.get(sym_upper, {})
        default_name = DEFAULT_PVD_NAMES.get(sym_upper, sym_upper)

        proj_id = await self.fetch_pvd_proj_id(effective_fund_name)
        policy_map: dict[str, dict[str, Any]] = {}
        if proj_id:
            policy_map = await self.fetch_pvd_policies(proj_id=proj_id, fund_name=effective_fund_name)

        policy_info: dict[str, Any] = policy_map.get(sym_upper, {})
        settings = get_settings()

        returns_raw: Any = None
        trail_raw: Any = None
        fees_raw: Any = None
        stats_raw: Any = None
        asset_raw: Any = None
        sec_raw: Any = None
        if proj_id:
            pvd_base = f"{settings.sec_pvd_base_url}/factsheet/{proj_id}"
            returns_raw, trail_raw, fees_raw, stats_raw, asset_raw, sec_raw = await asyncio.gather(
                self._fetch_sec_json(f"{pvd_base}/return"),
                self._fetch_sec_json(f"{pvd_base}/trailreturn"),
                self._fetch_sec_json(f"{pvd_base}/fee"),
                self._fetch_sec_json(f"{pvd_base}/statistics"),
                self._fetch_sec_json(f"{pvd_base}/top5/assettype"),
                self._fetch_sec_json(f"{pvd_base}/top5/securities"),
            )

        performance: list[FactsheetPerformanceItem] = []
        for cat_label, raw_payload in (("Calendar / Cumulative Return", returns_raw), ("Trailing Return", trail_raw)):
            rows = sorted(
                self._filter_pvd_rows(self._extract_items(raw_payload), policy_info, sym_upper),
                key=lambda x: _parse_int(x.get("seq"), 99),
            )
            for row in rows:
                period = _clean_str(row.get("return_year"))
                if not period:
                    continue
                performance.append(
                    FactsheetPerformanceItem(
                        category=cat_label,
                        period=period,
                        value=_parse_float(row.get("return_rate")),
                    )
                )

        fee_rows = sorted(
            self._filter_pvd_rows(self._extract_items(fees_raw), policy_info, sym_upper),
            key=lambda x: _parse_int(x.get("seq"), 99),
        )
        fees: list[FactsheetFeeItem] = []
        for f_row in fee_rows:
            desc = _clean_str(f_row.get("fee_type_desc"))
            if not desc:
                continue
            rate_str = _format_fee_rate(f_row.get("fee_rate"))
            is_ceiling = desc == "TotalFeeMax"
            fees.append(
                FactsheetFeeItem(
                    description=desc,
                    ceilingRate=rate_str if is_ceiling else None,
                    actualRate=None if is_ceiling else rate_str,
                )
            )

        stat_rows = _select_latest_period_rows(
            self._filter_pvd_rows(self._extract_items(stats_raw), policy_info, sym_upper)
        )
        statistics: FactsheetStatistics | None = None
        stats_as_of: str | None = None
        if stat_rows:
            s_row = stat_rows[0]
            stats_as_of = _clean_str(s_row.get("period"))
            ytm_val = (
                s_row.get("yield_to_maturity")
                if s_row.get("yield_to_maturity") is not None
                else s_row.get("yeild_to_maturity")
            )
            statistics = FactsheetStatistics(
                maxDrawdown=_parse_float(s_row.get("max_drawdown")),
                sharpeRatio=_parse_float(s_row.get("sharpe_ratio")),
                trackingError=_parse_float(s_row.get("tracking_error")),
                fxHedging=_clean_str(s_row.get("fx_hedging")),
                turnoverRatio=_parse_float(s_row.get("port_turnover")),
                beta=_parse_float(s_row.get("beta")),
                alpha=_parse_float(s_row.get("alpha")),
                yieldToMaturity=_parse_float(ytm_val),
                portfolioDuration=_clean_str(s_row.get("port_duration")),
                recoveringPeriod=_clean_str(s_row.get("recovering_period")),
            )

        asset_rows = _select_latest_period_rows(
            self._filter_pvd_rows(self._extract_items(asset_raw), policy_info, sym_upper)
        )
        asset_allocation = _build_allocation_items(
            asset_rows,
            seq_key="asset_allocation_seq",
            name_keys=("asset_allocation", "assetliab_name_th"),
            ratio_key="asset_ratio",
        )

        sec_rows = _select_latest_period_rows(
            self._filter_pvd_rows(self._extract_items(sec_raw), policy_info, sym_upper)
        )
        top_holdings = _build_holding_items(
            sec_rows,
            seq_key="secur_seq",
            name_key="secur_name",
            ratio_key="secur_invest_size",
            credit_key="secur_credit_rating",
            isin_key="secur_isin_code",
        )
        fallback_period = _clean_str((asset_rows[0] if asset_rows else {}).get("period")) or _clean_str(
            (sec_rows[0] if sec_rows else {}).get("period")
        )

        sub_policy_name = _clean_str(policy_info.get("name")) or default_name
        foreign_code = _clean_str(policy_info.get("foreignRiskLevel"))
        master_fund_name = _clean_str(policy_info.get("fundName")) or effective_fund_name

        return FundFactsheetResponse(
            symbol=sym_upper,
            displaySymbol=sym_upper,
            assetType="provident-fund",
            projId=proj_id,
            fundName=sub_policy_name,
            fundNameTh=sub_policy_name,
            amcName=master_fund_name,
            amcNameTh=master_fund_name,
            policyDesc=_clean_str(policy_info.get("policyName")) or default_meta.get("policyName"),
            objective=_clean_str(policy_info.get("objective")) or default_meta.get("objective"),
            aimcType=_clean_str(policy_info.get("aimcType")) or default_meta.get("aimcType"),
            aimcDescription=_clean_str(policy_info.get("aimcDescription")) or default_meta.get("aimcDescription"),
            riskLevel=_clean_str(policy_info.get("riskLevel")) or default_meta.get("riskLevel"),
            inceptionDate=_clean_str(policy_info.get("inceptionDate")),
            asOfDate=stats_as_of or fallback_period,
            fxHedgingPolicy=_PVD_FOREIGN_RISK_MAP.get(foreign_code, foreign_code) if foreign_code else None,
            fees=fees,
            performance=performance,
            statistics=statistics,
            assetAllocation=asset_allocation,
            topHoldings=top_holdings,
        )
