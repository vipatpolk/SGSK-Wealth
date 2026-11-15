import re
import urllib.parse
from typing import Any, cast

import httpx

from services.nav_service import NavService
from utils.cache import AsyncSingleflight, TTLCache
from utils.format_utils import get_asset_type
from utils.http_client import get_http_client
from utils.symbol_icon_utils import (
    clean_ticker_for_url,
    derive_amc_code,
    extract_domain_candidates,
    generate_amc_svg,
    generate_symbol_svg,
    get_symbol_color,
    get_symbol_logo_config,
)

_LINK_TAG_RE = re.compile(r"<link\b[^>]*>", re.IGNORECASE)
_REL_ATTR_RE = re.compile(r'\brel\s*=\s*["\']([^"\']*)["\']', re.IGNORECASE)
_HREF_ATTR_RE = re.compile(r'\bhref\s*=\s*["\']([^"\']+)["\']', re.IGNORECASE)


class IconService:
    """Service for resolving, fetching, caching, and generating ticker symbol icons."""

    def __init__(
        self,
        client: httpx.AsyncClient | None = None,
        cache: TTLCache | None = None,
        nav_service: NavService | None = None,
    ) -> None:
        self._client = client
        self._cache = cache if cache is not None else TTLCache(default_ttl_seconds=86400.0, max_entries=2000)
        self._singleflight = AsyncSingleflight()
        self._nav_service = nav_service

    def _get_client(self) -> httpx.AsyncClient:
        return self._client if self._client is not None else get_http_client()

    def _get_nav_service(self) -> NavService:
        if self._nav_service is None:
            self._nav_service = NavService(client=self._client)
        return self._nav_service

    async def _probe_url(self, url: str | None) -> tuple[bytes, str] | None:
        if not url:
            return None
        client = self._get_client()
        try:
            resp = await client.get(url, timeout=4.0)
            content_type = resp.headers.get("content-type", "").lower()
            if (
                resp.status_code == 200
                and ("image/" in content_type or "svg" in content_type)
                and len(resp.content) > 50
            ):
                media_type = content_type.split(";")[0].strip()
                return (resp.content, media_type)
        except Exception:
            pass
        return None

    async def _fetch_first_valid_logo(
        self,
        urls: tuple[str | None, ...],
    ) -> tuple[bytes, str] | None:
        for url in urls:
            result = await self._probe_url(url)
            if result is not None:
                return result
        return None

    @staticmethod
    def _extract_html_icon_urls(html_text: str, base_url: str) -> list[str]:
        """Extracts and prioritizes favicon / apple-touch-icon URLs from an HTML document."""
        preferred: list[str] = []
        standard: list[str] = []
        seen: set[str] = set()

        for tag in _LINK_TAG_RE.findall(html_text or ""):
            rel_match = _REL_ATTR_RE.search(tag)
            href_match = _HREF_ATTR_RE.search(tag)
            if not rel_match or not href_match:
                continue
            rel_val = rel_match.group(1).lower()
            if "icon" not in rel_val:
                continue
            abs_url = urllib.parse.urljoin(base_url, href_match.group(1).strip())
            if not abs_url.startswith(("http://", "https://")) or abs_url in seen:
                continue
            seen.add(abs_url)
            if "apple-touch-icon" in rel_val or abs_url.lower().endswith(".svg") or "192" in tag or "180" in tag:
                preferred.append(abs_url)
            else:
                standard.append(abs_url)

        return preferred + standard

    async def _scrape_homepage_icons(self, domains: list[str]) -> tuple[bytes, str] | None:
        """Scrapes <link rel='...icon...'> tags and /favicon.ico from the AMC homepage."""
        client = self._get_client()
        candidate_urls: list[str] = []
        seen: set[str] = set()

        if domains:
            homepage = f"https://{domains[0]}/"
            try:
                resp = await client.get(
                    homepage,
                    headers={"User-Agent": "Mozilla/5.0"},
                    timeout=4.0,
                )
                if resp.status_code == 200 and resp.text:
                    for icon_url in self._extract_html_icon_urls(resp.text, str(resp.url or homepage)):
                        if icon_url not in seen:
                            seen.add(icon_url)
                            candidate_urls.append(icon_url)
            except Exception:
                pass

        for domain in domains:
            favicon_url = f"https://{domain}/favicon.ico"
            if favicon_url not in seen:
                seen.add(favicon_url)
                candidate_urls.append(favicon_url)

        return await self._fetch_first_valid_logo(tuple(candidate_urls))

    async def _fetch_dynamic_amc_logo(self, website_host: str) -> tuple[bytes, str] | None:
        """Dynamically probes faviconV2, homepage HTML icons, and DuckDuckGo for a host."""
        domains = extract_domain_candidates(website_host)
        if not domains:
            return None

        # 1. Google Favicon V2 (Option A primary)
        gstatic_urls = tuple(
            f"https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://{domain}&size=128"
            for domain in domains
        )
        fetched = await self._fetch_first_valid_logo(gstatic_urls)
        if fetched is not None:
            return fetched

        # 2. AMC homepage HTML <link> icons + /favicon.ico fallback
        scraped = await self._scrape_homepage_icons(domains)
        if scraped is not None:
            return scraped

        # 3. DuckDuckGo icon fallback
        ddg_urls = tuple(f"https://icons.duckduckgo.com/ip3/{domain}.ico" for domain in domains)
        return await self._fetch_first_valid_logo(ddg_urls)

    async def _get_amc_logo(self, details: dict[str, str | None]) -> tuple[bytes, str]:
        amc_id = details.get("amc_id")
        website_host = details.get("website_host")
        amc_name = details.get("amc_name")
        abbr_name = details.get("abbr_name")

        cache_id = amc_id or website_host or amc_name or "unknown"
        amc_cache_key = f"amc_logo:{cache_id}"
        cached = self._cache.get(amc_cache_key)
        if cached is not None and isinstance(cached, tuple) and len(cached) == 2:
            return (cast(bytes, cached[0]), cast(str, cached[1]))

        async def _fetch_amc() -> tuple[bytes, str]:
            inner_cached = self._cache.get(amc_cache_key)
            if inner_cached is not None and isinstance(inner_cached, tuple) and len(inner_cached) == 2:
                return (cast(bytes, inner_cached[0]), cast(str, inner_cached[1]))

            if website_host:
                fetched = await self._fetch_dynamic_amc_logo(website_host)
                if fetched is not None:
                    self._cache.set(amc_cache_key, fetched, ttl=86400.0)
                    return fetched

            amc_code = derive_amc_code(amc_name, abbr_name)
            brand_color = get_symbol_color(amc_id or amc_name or amc_code)
            fallback_svg = generate_amc_svg(amc_code, brand_color)
            fallback_res = (fallback_svg, "image/svg+xml")
            self._cache.set(amc_cache_key, fallback_res, ttl=3600.0)
            return fallback_res

        return await self._singleflight.execute(amc_cache_key, _fetch_amc)

    async def get_symbol_icon(
        self,
        symbol: str,
        asset_type: str = "",
        fund_name: str = "",
    ) -> tuple[bytes, str]:
        """Resolves the icon image bytes and media type for the given symbol.

        Order of resolution:
        1. Memory TTL cache hit.
        2. Empty symbol -> generates fallback SVG immediately.
        3. Mutual-fund / provident-fund -> dynamically resolves managing AMC and official website
           via SEC Open APIs, probes favicon/icon endpoints, and falls back to a dynamically derived
           AMC monogram SVG or generic bank SVG (no hardcoded AMC guessing).
        4. Other assets -> probes primary CDN URL, then secondary CDN URL, then monogram SVG.
        """
        sym_clean = (symbol or "").strip()
        fund_clean = (fund_name or "").strip()
        resolved_type = get_asset_type(asset_type, sym_clean)
        cache_key = (
            f"icon:{sym_clean.upper()}:{resolved_type}:{fund_clean}"
            if resolved_type == "provident-fund" and fund_clean
            else f"icon:{sym_clean.upper()}:{resolved_type}"
        )

        cached = self._cache.get(cache_key)
        if cached is not None and isinstance(cached, tuple) and len(cached) == 2:
            return (cast(bytes, cached[0]), cast(str, cached[1]))

        async def _fetch() -> tuple[bytes, str]:
            if not sym_clean:
                svg = generate_symbol_svg("", resolved_type)
                result = (svg, "image/svg+xml")
                self._cache.set(cache_key, result, ttl=86400.0)
                return result

            config = get_symbol_logo_config(sym_clean, resolved_type)
            if config.get("is_mutual_fund"):
                details = await self._get_nav_service().resolve_fund_amc_details(
                    sym_clean,
                    resolved_type,
                    fund_clean or None,
                )
                if details.get("amc_id") or details.get("website_host") or details.get("amc_name"):
                    amc_res = await self._get_amc_logo(details)
                    ttl = 86400.0 if amc_res[1] != "image/svg+xml" else 3600.0
                    self._cache.set(cache_key, amc_res, ttl=ttl)
                    return amc_res

                svg = generate_symbol_svg(sym_clean, resolved_type)
                result = (svg, "image/svg+xml")
                self._cache.set(cache_key, result, ttl=3600.0)
                return result

            fetched = await self._fetch_first_valid_logo(
                (config.get("primary_url"), config.get("secondary_url"))
            )
            if fetched is not None:
                self._cache.set(cache_key, fetched, ttl=86400.0)
                return fetched

            fallback_svg = generate_symbol_svg(sym_clean, resolved_type)
            fallback_res = (fallback_svg, "image/svg+xml")
            self._cache.set(cache_key, fallback_res, ttl=3600.0)
            return fallback_res

        return await self._singleflight.execute(cache_key, _fetch)

    async def get_symbol_metadata(
        self,
        symbol: str,
        asset_type: str = "",
        fund_name: str = "",
    ) -> dict[str, Any]:
        """Returns JSON metadata describing the dynamically resolved icon details for a symbol."""
        sym_clean = (symbol or "").strip()
        fund_clean = (fund_name or "").strip()
        resolved_type = get_asset_type(asset_type, sym_clean)
        config = get_symbol_logo_config(sym_clean, resolved_type)

        icon_url = f"/api/backend/icon/{sym_clean}?asset_type={resolved_type}"
        if resolved_type == "provident-fund" and fund_clean:
            icon_url = f"{icon_url}&fund_name={urllib.parse.quote(fund_clean)}"

        amc_id: str | None = None
        amc_name: str | None = None
        amc_domain: str | None = None
        if config["is_mutual_fund"] and sym_clean:
            details = await self._get_nav_service().resolve_fund_amc_details(
                sym_clean,
                resolved_type,
                fund_clean or None,
            )
            amc_id = details.get("amc_id")
            amc_name = details.get("amc_name")
            amc_domain = details.get("website_host")

        return {
            "symbol": sym_clean,
            "asset_type": resolved_type,
            "clean_ticker": clean_ticker_for_url(sym_clean),
            "monogram": config["monogram"],
            "brand_color": config["brand_color"],
            "is_mutual_fund": config["is_mutual_fund"],
            "amc_id": amc_id,
            "amc_name": amc_name,
            "amc_domain": amc_domain,
            "icon_url": icon_url,
        }
