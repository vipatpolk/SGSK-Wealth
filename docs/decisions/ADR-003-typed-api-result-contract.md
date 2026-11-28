# ADR-003: Typed `ApiResult<T>` & Explicit Upstream HTTP Status Semantics

- **Status:** Accepted (Implemented in M1 & M4)
- **Scope:** `packages/contracts/src/api-result.model.ts`, `apps/web/app/composables/`, `backend/src/error.rs`, `backend/src/features/portfolio/api/`

## Context
Previously, HTTP failures (authentication errors, `403` denials, or upstream Google Sheets / market API outages) could be mapped to empty `SheetResult` or zeroed `PortfolioHoldingsResponse` payloads over HTTP `200`, making transient outages indistinguishable from an empty portfolio and risking accidental overwrites of cached UI state.

## Decision
1. Model all client API outcomes using the discriminated union `ApiResult<T> = ApiSuccess<T> | ApiFailure` (`apiOk`, `apiErr`, `mapHttpErrorToApiFailure`) in `@sgsk-wealth/contracts`.
2. In the Rust backend (`backend/src/error.rs::upstream_json_response`), map upstream timeout/unavailable errors to HTTP `503 Service Unavailable` and other upstream fetch errors to HTTP `502 Bad Gateway` while preserving the JSON error payload across `/share-lot/sheet/{tab_id}`, `/share-lot/sheets`, `/portfolio/holdings`, `/portfolio/performance`, `/portfolio/allocation`, and `/portfolio/dividend`.
3. Explicitly preserve HTTP `200 OK` when `/share-lot/sheet/{tab_id}` receives an unknown tab (`error: "Invalid tab id: ..."`, satisfying `TC-API-SL-03`).
4. Distinguish `unauthorized`, `forbidden`, `upstream`, and `partial-quote` (`warnings`) banners in Web and Mobile UIs without erasing previously cached or local portfolio data.

## Consequences
- Transient upstream outages surface recoverable banner states instead of zero-valued holdings.
- Offline router integration tests (`backend/tests/test_offline_ports_and_use_cases.rs`) continuously verify `200`, `502`, and `503` response contracts.
