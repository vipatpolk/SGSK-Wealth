# SEC Open APIs Python Integration Workflows (`Fund v2` & `PVD v1`)

Production-ready async `httpx` patterns for calling Thailand SEC Open APIs (`https://api.sec.or.th`), including cursor pagination, `204 No Content` handling, `429` rate-limit backoff, and `SGSK-Wealth` `NavService` integration.

---

## 1. Shared HTTP Client, Auth Headers & `204` / `429` Guard

```python
import asyncio
from typing import Any
import httpx

SEC_BASE_URL = "https://api.sec.or.th"

def sec_headers(subscription_key: str) -> dict[str, str]:
    return {
        "Ocp-Apim-Subscription-Key": subscription_key,
        "Accept": "application/json",
    }

async def sec_request(
    client: httpx.AsyncClient,
    semaphore: asyncio.Semaphore,
    method: str,
    path: str,
    headers: dict[str, str],
    *,
    params: dict[str, Any] | None = None,
    json_body: dict[str, Any] | None = None,
    max_retries: int = 3,
) -> Any:
    """Execute a throttled SEC Open API request handling 204 No Content and 429 backoff."""
    url = f"{SEC_BASE_URL}{path}"
    for attempt in range(max_retries + 1):
        async with semaphore:
            resp = await client.request(
                method,
                url,
                headers=headers,
                params=params,
                json=json_body,
                timeout=15.0,
            )
        if resp.status_code == 204:
            return None
        if resp.status_code == 429 and attempt < max_retries:
            retry_after = float(resp.headers.get("Retry-After", 2**attempt))
            await asyncio.sleep(retry_after)
            continue
        resp.raise_for_status()
        return resp.json()
    return None
```

---

## 2. Cursor Pagination Helper (`/v2/fund/*`)

All `/v2/fund/*` endpoints return `{ "message", "page_size", "next_cursor", "items" }`. Stop iterating when `next_cursor == ""` (or missing).

```python
async def fetch_all_fund_pages(
    client: httpx.AsyncClient,
    semaphore: asyncio.Semaphore,
    path: str,
    headers: dict[str, str],
    params: dict[str, Any] | None = None,
    page_size: int = 100,
) -> list[dict[str, Any]]:
    items: list[dict[str, Any]] = []
    cursor: str | None = None
    base_params = dict(params or {})

    while True:
        query = {**base_params, "page_size": max(1, min(page_size, 100))}
        if cursor:
            query["next_cursor"] = cursor

        data = await sec_request(client, semaphore, "GET", path, headers, params=query)
        if not isinstance(data, dict):
            break

        page_items = data.get("items") or []
        items.extend(page_items)

        cursor = data.get("next_cursor") or ""
        if not cursor or not page_items:
            break

    return items
```

---

## 3. End-to-End Mutual Fund Resolution: Symbol -> `proj_id` -> Factsheet, NAV & Dividends

Because `/v2/fund/general-info/profiles` supports filtering by either `fund_class_name` (for multi-class funds) or `project_info` (for single-class `"main"` funds or project abbreviations), query `fund_class_name` first and fall back to `project_info`:

```python
async def resolve_and_fetch_fund(
    client: httpx.AsyncClient,
    semaphore: asyncio.Semaphore,
    headers: dict[str, str],
    symbol: str,
    start_nav_date: str,
    end_nav_date: str,
) -> dict[str, Any]:
    clean_symbol = symbol.strip().upper()

    # Step 1: Lookup fund profile (try share class first, then project_info)
    profiles = await fetch_all_fund_pages(
        client, semaphore, "/v2/fund/general-info/profiles", headers,
        params={"fund_class_name": clean_symbol},
    )
    if not profiles:
        profiles = await fetch_all_fund_pages(
            client, semaphore, "/v2/fund/general-info/profiles", headers,
            params={"project_info": clean_symbol},
        )

    # Prefer active ("Registered" / "IPO") and "main" class if multiple returned
    profile = next(
        (p for p in profiles if p.get("fund_class_name") == clean_symbol),
        next((p for p in profiles if p.get("fund_class_name") == "main"), profiles[0]),
    )
    proj_id = profile["proj_id"]
    class_name = profile.get("fund_class_name", "main")

    # Step 2: Fetch Daily NAV (note query params: start_nav_date / end_nav_date)
    nav_rows = await fetch_all_fund_pages(
        client, semaphore, "/v2/fund/daily-info/nav", headers,
        params={
            "proj_id": proj_id,
            "start_nav_date": start_nav_date,
            "end_nav_date": end_nav_date,
            "fund_class_name": class_name,
        },
    )
    nav_rows.sort(key=lambda r: r.get("nav_date", ""), reverse=True)

    # Step 3: Fetch Latest Effective Factsheet Risk & Fees
    risk_rows = await fetch_all_fund_pages(
        client, semaphore, "/v2/fund/factsheet/risk-spectrum", headers,
        params={"proj_id": proj_id, "latest": "true"},
    )
    fee_rows = await fetch_all_fund_pages(
        client, semaphore, "/v2/fund/factsheet/fees", headers,
        params={"proj_id": proj_id, "fund_class_name": class_name, "latest": "true"},
    )

    # Step 4: Fetch Dividend History & match class_abbr_name client-side
    div_rows = await fetch_all_fund_pages(
        client, semaphore, "/v2/fund/daily-info/dividend-history", headers,
        params={"proj_id": proj_id},
    )
    matching_divs = [
        d for d in div_rows
        if d.get("class_abbr_name") in (class_name, "-", None, "")
    ]

    return {
        "profile": profile,
        "latest_nav": nav_rows[0] if nav_rows else None,
        "risk_spectrum": risk_rows[0] if risk_rows else None,
        "fees": fee_rows,
        "dividends": matching_divs,
    }
```

---

## 4. End-to-End PVD Lookup (`/v1/pvd/factsheet/*`)

PVD v1 endpoints return direct JSON lists `[...]` rather than `{ "items": [...] }`:

```python
async def fetch_pvd_overview(
    client: httpx.AsyncClient,
    semaphore: asyncio.Semaphore,
    headers: dict[str, str],
    proj_id: str,
    period_yyyymm: str,
    nav_date_yyyymmdd: str,
) -> dict[str, Any]:
    policies, fees, returns, allocation, nav = await asyncio.gather(
        sec_request(client, semaphore, "GET", f"/v1/pvd/factsheet/{proj_id}/policy", headers),
        sec_request(client, semaphore, "GET", f"/v1/pvd/factsheet/{proj_id}/fee", headers),
        sec_request(client, semaphore, "GET", f"/v1/pvd/factsheet/{proj_id}/return", headers),
        sec_request(client, semaphore, "GET", f"/v1/pvd/factsheet/{proj_id}/PVDFullPort/{period_yyyymm}", headers),
        sec_request(client, semaphore, "GET", f"/v1/pvd/factsheet/{proj_id}/nav/{nav_date_yyyymmdd}", headers),
    )
    return {
        "policies": policies or [],
        "fees": fees or [],
        "returns": returns or [],
        "allocation": allocation or [],
        "monthly_nav": nav or [],
    }
```

---

## 5. `SGSK-Wealth` Backend Integration Notes

In `SGSK-Wealth`, SEC API calls live in [`backend/services/nav_service.py`](../../../../backend/services/nav_service.py) using:
- **Settings** (`backend/config/settings.py`):
  - `sec_subscription_key`: injected from `SEC_SUBSCRIPTION_KEY` env var (never hardcode keys)
  - `sec_pvd_base_url`: `"https://api.sec.or.th/v1/pvd"`
  - Dynamic PVD `proj_id` lookup: `NavService.fetch_pvd_proj_id(fund_name)` queries `POST /v1/pvd/factsheet/fund` with `{"FundName": ...}` using the `"Fund"` column from the PVD Google Sheet (`SymbolSummary.pvdFundName`)
- **Concurrency Semaphore** (`backend/utils/http_client.py`):
  - `get_sec_semaphore()` initializes `asyncio.Semaphore(10)` alongside a shared pooled `httpx.AsyncClient`.
- **Caching & Request Coalescing**:
  - Responses are wrapped with `ttl_cache` and `singleflight` inside `NavService` to avoid duplicate SEC requests under concurrent frontend loads.
