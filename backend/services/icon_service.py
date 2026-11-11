from typing import Any, cast

import httpx

from utils.cache import AsyncSingleflight, TTLCache
from utils.format_utils import get_asset_type
from utils.http_client import get_http_client
from utils.symbol_icon_utils import (
    clean_ticker_for_url,
    generate_symbol_svg,
    get_symbol_logo_config,
)


class IconService:
    """Service for resolving, fetching, caching, and generating ticker symbol icons."""

    def __init__(
        self,
        client: httpx.AsyncClient | None = None,
        cache: TTLCache | None = None,
    ) -> None:
        self._client = client
        self._cache = cache if cache is not None else TTLCache(default_ttl_seconds=86400.0, max_entries=2000)
        self._singleflight = AsyncSingleflight()

    def _get_client(self) -> httpx.AsyncClient:
        return self._client if self._client is not None else get_http_client()

    async def get_symbol_icon(self, symbol: str, asset_type: str = "") -> tuple[bytes, str]:
        """Resolves the icon image bytes and media type for the given symbol.

        Order of resolution:
        1. Memory TTL cache hit.
        2. If mutual-fund / provident-fund or empty symbol -> generates SVG immediately.
        3. Attempts primary CDN URL.
        4. Attempts secondary CDN URL.
        5. Falls back to generating a responsive monogram SVG.
        """
        sym_clean = (symbol or "").strip()
        resolved_type = get_asset_type(asset_type, sym_clean)
        cache_key = f"icon:{sym_clean.upper()}:{resolved_type}"

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
                svg = generate_symbol_svg(sym_clean, resolved_type)
                result = (svg, "image/svg+xml")
                self._cache.set(cache_key, result, ttl=86400.0)
                return result

            client = self._get_client()

            async def _probe(url: str | None) -> tuple[bytes, str] | None:
                if not url:
                    return None
                try:
                    resp = await client.get(url, timeout=4.0)
                    content_type = resp.headers.get("content-type", "").lower()
                    if (
                        resp.status_code == 200
                        and ("image/" in content_type or "svg" in content_type)
                        and len(resp.content) > 64
                    ):
                        media_type = content_type.split(";")[0].strip()
                        return (resp.content, media_type)
                except Exception:
                    pass
                return None

            # 1. Try primary CDN
            primary_res = await _probe(config.get("primary_url"))
            if primary_res is not None:
                self._cache.set(cache_key, primary_res, ttl=86400.0)
                return primary_res

            # 2. Try secondary CDN
            secondary_res = await _probe(config.get("secondary_url"))
            if secondary_res is not None:
                self._cache.set(cache_key, secondary_res, ttl=86400.0)
                return secondary_res

            # 3. Fallback to generated monogram SVG
            fallback_svg = generate_symbol_svg(sym_clean, resolved_type)
            fallback_res = (fallback_svg, "image/svg+xml")
            self._cache.set(cache_key, fallback_res, ttl=3600.0)
            return fallback_res

        return await self._singleflight.execute(cache_key, _fetch)

    def get_symbol_metadata(self, symbol: str, asset_type: str = "") -> dict[str, Any]:
        """Returns JSON metadata describing the resolved icon details for a symbol."""
        sym_clean = (symbol or "").strip()
        resolved_type = get_asset_type(asset_type, sym_clean)
        config = get_symbol_logo_config(sym_clean, resolved_type)

        return {
            "symbol": sym_clean,
            "asset_type": resolved_type,
            "clean_ticker": clean_ticker_for_url(sym_clean),
            "monogram": config["monogram"],
            "brand_color": config["brand_color"],
            "is_mutual_fund": config["is_mutual_fund"],
            "icon_url": f"/api/backend/icon/{sym_clean}?asset_type={resolved_type}",
        }
