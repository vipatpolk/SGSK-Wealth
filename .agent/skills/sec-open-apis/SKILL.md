---
name: sec-open-apis
description: Authoritative reference and integration guide for Thailand SEC Open Data APIs covering Mutual Funds (`/v2/fund/*`, 21 endpoints) and Provident Funds (`/v1/pvd/factsheet/*`, 15 endpoints). Use when implementing, debugging, or extending SEC mutual fund or PVD data ingestion (`nav_service.py`), resolving `proj_id` / share classes / AMC IDs, handling `Ocp-Apim-Subscription-Key` authentication, cursor pagination, `204 No Content` responses, factsheet time-series queries, or monthly/quarterly portfolio allocations and NAV lookups.
---

# SEC Thailand Open APIs (Fund & Provident Fund)

Reference standard for consuming Thailand Securities and Exchange Commission (SEC) Open Data APIs (`https://secopendata.sec.or.th/sec-open-apis`) across **Mutual Funds (`/v2/fund`, 21 endpoints)** and **Provident Funds / PVD (`/v1/pvd`, 15 endpoints)**.

## Quick Reference: Connection, Auth & Pagination

| Setting | Value / Behavior |
| :--- | :--- |
| **Base URL** | `https://api.sec.or.th` |
| **Auth Header** | `Ocp-Apim-Subscription-Key: <SEC_SUBSCRIPTION_KEY>` |
| **Accept Header** | `Accept: application/json` |
| **Rate Limit** | ~5 requests/sec (~300 req/min) per subscription key; throttled requests return `HTTP 429` |
| **Empty Filter Result** | May return `HTTP 204 No Content` with an empty body — always check `status_code == 204` before parsing JSON |
| **Fund v2 Envelope** | `{ "message", "page_size", "next_cursor", "items": [...] }` (`page_size` `1..100`, stop when `next_cursor == ""`) |
| **PVD v1 Envelope** | Direct JSON array `[...]` without `items` wrapper (handle `list` or `{ "items": [...] }` defensively) |
| **Factsheet Latest Flag** | Pass `latest=true` on time-series `/v2/fund/factsheet/*` routes (except `/urls`) to return only active snapshot and ignore `start_date`/`end_date` |

---

## API Surface Inventory

### 1. Mutual Funds (`/v2/fund/*`, 21 `GET` Endpoints)

| Group | Endpoints (`https://api.sec.or.th/v2/fund/...`) | Purpose |
| :--- | :--- | :--- |
| **General Info (5)** | `general-info/amcs`, `general-info/profiles`, `general-info/specifications`, `general-info/mutual-fund-fees`, `general-info/involve-parties` | AMC directory, fund/class profiles (`proj_id`, `fund_status`), SorNor 87/2558 special specs, project fee ceilings, related parties |
| **Factsheet (12)** | `factsheet/urls`, `factsheet/ipos`, `factsheet/benchmarks`, `factsheet/subscription-redemption-minimums`, `factsheet/subscription-redemption-periods`, `factsheet/risk-spectrum`, `factsheet/statistics`, `factsheet/dividend-policy`, `factsheet/fees`, `factsheet/performance`, `factsheet/asset-allocation`, `factsheet/top5-holdings` | PDF/AMC links (`as_of_date`), IPO window, benchmark, min trade/balance, dealing & `T+N` settlement periods, risk `RS1`–`RS8`/`RS81`, stats, dividend policy, ceiling vs. actual fees, historical returns/vol, asset mix, top 5 holdings |
| **Outstanding (2)** | `outstanding/portfolio` *(quarterly)*, `outstanding/portfolio-asset-type` *(monthly)* | 3-year historical holdings/allocations with a **45-day publication lag** after quarter/month-end; filter via `start_period` / `end_period` (`YYYYMM`) |
| **Daily Info (2)** | `daily-info/nav`, `daily-info/dividend-history` | Daily unit NAV (`last_val`), AUM (`net_asset`), buy/sell/switch prices (`start_nav_date`, `end_nav_date`), and book-close/payment dividend records |

### 2. Provident Funds (`/v1/pvd/factsheet/*`, 15 Endpoints)

Coverage is restricted to multi-employer **Pooled Funds (`PF`)** and **Master Pooled Funds (`PM`)** (single-employer funds are excluded). Filter fund lists to `fund_status in ("SE", "RG")` for active funds.

| Category | Endpoints (`https://api.sec.or.th/v1/pvd/factsheet/...`) | Purpose |
| :--- | :--- | :--- |
| **Discovery (3)** | `GET amc`, `GET {unique_id}/fund`, `POST fund` *(body: `{"FundName": "..."}`)* | Lookup managing AMC `unique_id`, list/search PVD `proj_id` records (`PF`/`PM`, `SE`/`RG`) |
| **Policy & Cost (4)** | `GET {proj_id}/policy`, `GET {proj_id}/return`, `GET {proj_id}/trailreturn`, `GET {proj_id}/fee` | Sub-policy structure (`sub_policy_id`, `unique_sub_policy_id`, `risk_level`, `aimc_type`), Y1–Y10/YTD/trailing returns, `ManagementFee` / `TotalFee` / `TotalFeeMin` / `TotalFeeMax` |
| **Allocation & Risk (7)** | `GET {proj_id}/PVDFullPort/{period}`, `GET {proj_id}/statistics`, `GET {proj_id}/top5/assettype`, `.../top5/securities`, `.../top5/foreign`, `.../top5/industry`, `.../top5/issuer` | Monthly asset mix (`YYYYMM`, 45d lag), risk metrics (Sharpe, MDD, YTM, Duration), and top-5 breakdowns by asset type, security (+ credit rating/ISIN), country, equity industry, bond issuer |
| **Monthly NAV (1)** | `GET {proj_id}/nav/{nav_date}` | Month-end sub-policy `net_asset` and `net_asset_per_unit` (`nav_date` = `YYYYMMDD`, 3Y history from `20240630`, **60-day lag**) |

---

## Core Operational Workflows

### Workflow 1: Resolve Mutual Fund Symbol -> `proj_id` -> Daily NAV & Dividends
1. Query `GET /v2/fund/general-info/profiles?fund_class_name=<SYMBOL>`.
2. If HTTP `204` or empty `items`, fall back to `GET /v2/fund/general-info/profiles?project_info=<SYMBOL>`.
3. Select active row (`fund_status` in `("Registered", "IPO")`), matching exact `fund_class_name` or preferring `"main"` for single-class funds, and extract `proj_id`.
4. Fetch daily NAV via `GET /v2/fund/daily-info/nav?proj_id=<proj_id>&start_nav_date=YYYY-MM-DD&end_nav_date=YYYY-MM-DD`, match `fund_class_name`, sort descending by `nav_date`, and read `last_val`.
5. Fetch dividends via `GET /v2/fund/daily-info/dividend-history?proj_id=<proj_id>` and filter client-side where `class_abbr_name` matches the class name or `"-"`.

### Workflow 2: Cursor Pagination & Rate-Limit Protection (`/v2/fund/*`)
1. Pass `page_size=100` (maximum allowed) on initial request.
2. While `response.get("next_cursor")` is non-empty and `items` is non-empty, pass `next_cursor=<cursor>` in the next request.
3. Bound concurrency with an `asyncio.Semaphore` and retry `HTTP 429` using `Retry-After` or exponential backoff.

### Workflow 3: PVD Policy, Allocation & Monthly NAV Retrieval (`/v1/pvd/*`)
1. Resolve `unique_id` via `GET /v1/pvd/factsheet/amc`, then `proj_id` via `GET /v1/pvd/factsheet/{unique_id}/fund` or `POST /v1/pvd/factsheet/fund` (`{"FundName": "..."}`). Keep `fund_status in ("SE", "RG")`.
2. Query `GET /v1/pvd/factsheet/{proj_id}/policy` to obtain `sub_policy_id`, `unique_sub_policy_id`, `aimc_type`, `risk_level`, and `objective`.
3. Account for publication lags when computing query dates:
   - `PVDFullPort/{period}`: format `period` as Gregorian `YYYYMM`, shifted back past the **45-day** month-end lag.
   - `nav/{nav_date}`: format `nav_date` as Gregorian month-end `YYYYMMDD` (earliest `20240630`), shifted back past the **60-day** month-end lag.
4. Watch for **Buddhist Era (พ.ศ.) dates** (`"2544-03-14"`) and `"-"` sentinels in `regis_date`, `cancel_date`, `sub_policy_start_date`, `sub_policy_inception_date`, and `sub_policy_end_date`.

### Workflow 4: `SGSK-Wealth` Integration (`backend/services/nav_service.py`)
- **Credentials & Config:** Configured in [`backend/config/settings.py`](../../../backend/config/settings.py) via `sec_subscription_key` (`SEC_SUBSCRIPTION_KEY`) and `sec_pvd_base_url` (`https://api.sec.or.th/v1/pvd`). PVD `proj_id` is resolved dynamically from the Google Sheet `"Fund"` column via `POST /v1/pvd/factsheet/fund`. Never hardcode keys.
- **Pooling & Throttling:** Uses `get_http_client()` and `get_sec_semaphore()` (`asyncio.Semaphore(10)`) from [`backend/utils/http_client.py`](../../../backend/utils/http_client.py).
- **Caching:** [`NavService`](../../../backend/services/nav_service.py) wraps Fund profile, Fund NAV, dividend history, and PVD policy fetches with `ttl_cache` and `singleflight`.

---

## Known SEC OpenAPI Quirks & Field Mismatches

Always code defensively around these verified catalog vs. payload differences:
- **`/v2/fund/outstanding/*` period params:** Prose mentions `period_start`/`period_end`, but the actual query parameter names are **`start_period`** and **`end_period`** (`YYYYMM`).
- **`/v2/fund/daily-info/nav` date params:** Prose mentions `nav_date_start`/`nav_date_end`, but the actual query parameter names are **`start_nav_date`** and **`end_nav_date`** (`YYYY-MM-DD`).
- **`/v2/fund/outstanding/portfolio` field names:** Dictionary documents `assetliab_code` and `market_value`, while payload examples show `assetliab_id` and `assetliab_value`.
- **`/v2/fund/factsheet/benchmarks` remark field:** Dictionary documents `remark`, while payload examples show `benchmark_remark`.
- **`/v2/fund/factsheet/subscription-redemption-minimums` currencies:** `*_cur` fields (e.g., `"THB   "`) can be right-padded with spaces — `.strip()` before comparison.
- **`/v1/pvd/factsheet/{proj_id}/statistics` YTM typo:** Dictionary documents `yield_to_maturity`, while payload example returns `yeild_to_maturity`.

---

## Deep Dive Resources

- **Mutual Fund Endpoints (21 APIs):** [`references/fund-api-reference.md`](./references/fund-api-reference.md) — full query parameters, enums, response dictionaries, and quirks.
- **PVD Endpoints (15 APIs):** [`references/pvd-api-reference.md`](./references/pvd-api-reference.md) — full path/body schemas, asset codes, lag windows, and Buddhist Era handling.
- **Python Workflows & Code Patterns:** [`examples/python-api-workflows.md`](./examples/python-api-workflows.md) — async `httpx` helpers, cursor pagination, retries, and `NavService` examples.
- **CLI Verification Script:** [`scripts/sec_api_client.py`](./scripts/sec_api_client.py) — zero-dependency CLI (`py .agent/skills/sec-open-apis/scripts/sec_api_client.py --help`) for inspecting live Fund v2 & PVD v1 endpoints using `SEC_SUBSCRIPTION_KEY`.
