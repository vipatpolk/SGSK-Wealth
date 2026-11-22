# ADR-001: Local & Cloud Portfolio Isolation

- **Status:** Accepted (Implemented across M1–M4)
- **Scope:** `backend/src/utils/supabase_auth.rs`, `shared/src/providers/`, `apps/web/`, `apps/mobile/`

## Context
SGSK-Wealth serves two distinct runtime data modes within the same application shell:
1. **Cloud Portfolio** (live Google Sheets transaction sync + server-side FIFO valuation via the Rust Axum backend).
2. **Local On-Device Portfolio** (guest or non-owner user workspace stored on device via `KeyValueStorageAdapter` and computed client-side by `@sgsk-wealth/domain`).

Early iterations allowed UI views to check `activeDataSource()` directly and risked stale tab cache entries leaking between `cloud` and `local` transitions or unauthenticated requests attempting cloud endpoints.

## Decision
1. Enforce cloud portfolio authorization server-side via `RequirePortfolioAuthorizedUser` on `/share-lot/*`, `/portfolio/*`, and symbol-lookup paths of `/portfolio/tools/{simulate,solve-target,rebalance}`.
2. Route all client portfolio reads/refreshes through `PortfolioDataProvider` (`CloudPortfolioProvider` and `LocalPortfolioProvider`) orchestrated by `PortfolioSourceCoordinator`.
3. Clear `tabCache` automatically whenever `activeSource()` transitions (`cloud <-> local`) or `resetForSignOut()` runs, preventing cross-mode cache bleed.
4. Inject platform storage explicitly via `KEY_VALUE_STORAGE_ADAPTER` (`WebLocalStorageAdapter` on Web; `NativePlatformService::createKeyValueStorageAdapter` backed by Capacitor `Preferences` on Mobile).

## Consequences
- UI feature components render `PortfolioSourceCoordinator` data uniformly without storage or source-selection branching.
- Guests and signed-in non-owner accounts never invoke `/share-lot/*` or owner `/portfolio/*` endpoints.
