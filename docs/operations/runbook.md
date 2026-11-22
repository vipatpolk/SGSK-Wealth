# SGSK-Wealth Operations Runbook

## 1. Environment Variable Matrix (`backend/src/config/settings.rs` & `main.rs`)

All backend settings are loaded from process environment variables and optional `.env` files at startup (`Settings::from_env()`). In `ENVIRONMENT=production`, `Settings::validate_production_security()` fails fast if required secrets or identifiers are missing or insecure.

| Variable | Default (`Settings::default`) | Required in Production | Notes |
|---|---|---|---|
| `HOST` | `127.0.0.1` | No | Bind host read by `backend/src/main.rs` |
| `PORT` | `8000` | No | Bind port read by `backend/src/main.rs` |
| `ENVIRONMENT` | `development` | **Yes (`production`)** | Enables strict API key, origin, spreadsheet ID & fail-closed profile checks |
| `BACKEND_API_KEY` | `dev_secret_key_change_in_prod` | **Yes (>= 32 chars)** | Shared secret validated via `X-API-Key` (`ApiKeyAuth`); blocked/short keys fail startup |
| `BACKEND_API_KEY_PREVIOUS` | `""` | No (optional rotation) | Secondary accepted `X-API-Key` during zero-downtime key rotation (>= 32 chars if set) |
| `ALLOWED_ORIGINS` | Dev + Capacitor + `https://sgsk-wealth.vercel.app` | Recommended | CSV or JSON array; merged with native mobile origins (`http://localhost`, `https://localhost`, `capacitor://localhost`) |
| `AUTHORIZED_PORTFOLIO_EMAILS` | `vipatpolk@gmail.com` | **Yes (non-empty)** | CSV or JSON array of allowlisted cloud-portfolio owner email(s) |
| `GOOGLE_SPREADSHEET_ID` | `sample_spreadsheet_id` | **Yes (non-sample)** | Google Sheets document ID for transaction tabs; `"sample_spreadsheet_id"` fails startup |
| `GOOGLE_PVD_SPREADSHEET_ID` | `sample_pvd_spreadsheet_id` | If separate PVD sheet | Optional separate spreadsheet ID for PVD tab |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | `""` | For private sheets | Inline JSON string or filesystem path to Google service account credentials |
| `SHEETS_BASE_URL` | `https://docs.google.com/spreadsheets/d` | No | Base URL for Google Sheets CSV export |
| `SUPABASE_URL` | `https://jjdnxifgpbdvntfwhyzz.supabase.co` | **Yes (non-empty)** | Supabase project base URL used for JWKS, `/auth/v1/user`, and `/rest/v1/user_profiles` |
| `SUPABASE_PUBLISHABLE_KEY` | `""` | Recommended | Sent as `apikey` header on `/rest/v1/user_profiles` & `/auth/v1/user` lookups |
| `SUPABASE_SERVICE_ROLE_KEY` | `""` | Optional | Also reads fallback alias `SUPABASE_SECRET_KEY` (used for icon Storage L2 caching) |
| `SUPABASE_JWKS_URL` | `""` | No | Overrides default `{SUPABASE_URL}/auth/v1/.well-known/jwks.json` |
| `SUPABASE_JWT_AUDIENCE` | `authenticated` | No | Expected JWT `aud` claim |
| `SUPABASE_JWT_SECRET` | `""` | Optional | Enables local HS256 JWT signature verification when configured |
| `SEC_SUBSCRIPTION_KEY` | `""` | Recommended | Thailand SEC Open Data API `Ocp-Apim-Subscription-Key` header |
| `SEC_MF_BASE_URL` | `https://api.sec.or.th/v2/fund` | No | Thailand SEC Mutual Fund API base URL |
| `SEC_PVD_BASE_URL` | `https://api.sec.or.th/v1/pvd` | No | Thailand SEC Provident Fund API base URL |
| `YAHOO_BASE_URL` | `https://query1.finance.yahoo.com` | No | Yahoo Finance quote/dividend upstream base URL |
| `YFINANCE_TIMEOUT_SECONDS` | `10.0` | No | Per-request Yahoo timeout in seconds |
| `YFINANCE_RETRIES` | `1` | No | Retry count for Yahoo requests |
| `YFINANCE_MAX_CONCURRENCY` | `8` | No | Semaphore permit limit for concurrent Yahoo requests |
| `YFINANCE_DIVIDEND_PERIOD` | `max` | No | Default dividend lookback period |
| `YFINANCE_CACHE_DIR` | `""` | No | Optional Yahoo client cache directory setting |
| `BINANCE_BASE_URL` | `https://api.binance.th` | No | Binance TH ticker API base URL |
| `SET_TH_URL` | SET listed companies `th_TH.xls` | No | SET Thai company name lookup feed |
| `SET_EN_URL` | SET listed companies `en_US.xls` | No | SET English company name lookup feed |
| `LOGO_DEV_PUBLISHABLE_KEY` | `""` | Optional | Also reads fallback alias `LOGO_DEV_TOKEN` |
| `LOGO_DEV_SECRET_KEY` | `""` | Optional | Secret key for Logo.dev API searches |
| `LOGO_DEV_IMG_BASE_URL` | `https://img.logo.dev` | No | Logo.dev image CDN base URL |
| `LOGO_DEV_API_BASE_URL` | `https://api.logo.dev` | No | Logo.dev API base URL |

---

## 2. Zero-Downtime `BACKEND_API_KEY` Rotation

1. Generate a high-entropy key of at least 32 characters (matching `Settings::validate_production_security()`).
2. Store the existing key in `BACKEND_API_KEY_PREVIOUS` and set the new key in `BACKEND_API_KEY` in the Vercel project **Environment Variables** (Sensitive/Secret).
3. Redeploy so both the Vercel edge transform (`vercel.json`) and Rust backend accept both keys simultaneously during propagation (`ApiKeyAuth` accepts either `backend_api_key` or non-empty `backend_api_key_previous`).
4. Verify Web (`https://sgsk-wealth.vercel.app`) and Mobile native traffic succeed cleanly without `401` spikes.
5. Clear `BACKEND_API_KEY_PREVIOUS` and trigger a final redeploy.

**Client Bundle Guard:** Never place `BACKEND_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, or `GOOGLE_SERVICE_ACCOUNT_JSON` in Angular `environment*.ts` or `apps/mobile` native assets. Verify every release build with `npm run check:secrets`.

---

## 3. Vercel Services Edge Header Injection & Direct-Access Guard (`vercel.json`)

- [vercel.json](../../vercel.json) deploys `apps/web` (`web` service) and `backend` (`backend` service, `@vercel/rust` entrypoint `src/main.rs`) under a single Vercel project.
- All external Web requests hit `/api/backend/*`, where the Vercel edge route injects `X-API-Key: $BACKEND_API_KEY` and rewrites to `/<path>`.
- `direct_access_block_middleware` in [middleware.rs](../../backend/src/middleware.rs) blocks direct external calls targeting raw backend deployment hosts unless forwarded through the frontend host or authorized `X-App-Source` mobile headers (exempting `/icon*`).

---

## 4. Supabase Auth & Fail-Closed Outage Triage

- **Symptoms**: Authorized owner sees local portfolio workspace or `/portfolio/*` returns HTTP `403` in production.
- **Root Cause**: Per [ADR-004](../decisions/ADR-004-fail-closed-production-owner-auth.md), non-development environments deny cloud access if `SupabaseProfileAdapter` (`/rest/v1/user_profiles`) returns non-`200`, times out (`5s`), or returns no matching row with `can_view_cloud_portfolio = true`.
- **Checks**:
  1. Inspect `/auth/me` with the user's Bearer JWT: check `authenticated`, `emailVerified`, `role`, and `canViewCloudPortfolio`.
  2. Verify `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, and `AUTHORIZED_PORTFOLIO_EMAILS` in Vercel environment variables.
  3. Confirm RLS policies on `public.user_profiles` allow authenticated users to `SELECT` their own `role, can_view_cloud_portfolio` row.

---

## 5. Upstream Provider Outage Triage (`502` / `503`)

Per [ADR-003](../decisions/ADR-003-typed-api-result-contract.md), `/share-lot/sheet/{tab_id}`, `/share-lot/sheets`, `/portfolio/holdings`, `/portfolio/performance`, `/portfolio/allocation`, and `/portfolio/dividend` inspect `result.error`:
- **`503 Service Unavailable`**: Upstream error string contains `timeout`, `timed out`, or `unavailable` (transient Google Sheets / upstream outage or slow response).
- **`502 Bad Gateway`**: Non-timeout upstream failure (e.g., invalid `GOOGLE_SERVICE_ACCOUNT_JSON`, permission error on `GOOGLE_SPREADSHEET_ID`, HTTP `500`/`403` from Google Sheets).
- **`200 OK` with `"Invalid tab id: ..."`**: Client requested an unsupported tab slug (`TC-API-SL-03`).
- **Response Check**: Check the `error` field in the JSON response body and client banners; verify `GOOGLE_SPREADSHEET_ID`, `GOOGLE_SERVICE_ACCOUNT_JSON`, `SEC_SUBSCRIPTION_KEY`, and upstream status.
