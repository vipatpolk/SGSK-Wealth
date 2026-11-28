# ADR-005: Target Architecture & Incremental Strangler Roadmap

- **Status:** Accepted
- **Scope:** Monorepo-wide (`crates/`, `apps/web-nuxt/`, `apps/mobile/`, `contracts/`, `e2e/`, `vercel.json`)

## Context

SGSK-Wealth is currently implemented as an Angular 22 Web SPA (`apps/web/`), an Angular 22 + Ionic 9 + Capacitor 8 mobile app (`apps/mobile/`), a single-crate Rust Axum 0.8 backend (`backend/`), and a Spring Boot 4.1 + Java 25 + Cucumber-JVM 8 E2E suite (`e2e/`).

To unify the Web and Mobile UI stack, enforce modular Rust crate boundaries with `rust_decimal` precision, adopt an OpenAPI 3.1 contract (`/api/v1/*`), and standardize cross-platform BDD automation without disrupting production stability or CI checks, we evaluated five key architectural decisions during Phase 0 discovery.

## Decision

1. **Cloud Portfolio Persistence (Keep Google Sheets):**
   - Continue syncing cloud owner portfolios read-only from Google Sheets via `TransactionSheetPort` (`GoogleSheetsAdapter`).
   - Preserve the existing Supabase schema (`user_profiles`, `user_settings`, `symbol_logo_cache`, and `symbol-logos` Storage bucket), Auth triggers, and RLS policies. Do not introduce Supabase PostgreSQL portfolio/transaction CRUD tables during the 1-to-1 parity phase.
2. **Guest / Local Portfolio Isolation & Server Compute:**
   - Preserve on-device guest/non-owner portfolios stored via `KeyValueStorageAdapter` (`localStorage` on Web, `@capacitor/preferences` on Mobile) and computed client-side using `@sgsk-wealth/domain` per [ADR-001](./ADR-001-local-cloud-portfolio-isolation.md) and [ADR-002](./ADR-002-financial-calculation-parity.md).
   - Keep authoritative Price, FX, Mutual Fund/PVD NAV, Factsheet, and Cloud Portfolio calculations strictly in the Rust backend.
3. **Deployment Platform (Continue Vercel Services):**
   - Continue deploying both the Web frontend and the Rust backend via Vercel Services (`vercel.json`), with Vercel Edge injecting `X-API-Key` for Web requests to `/api/backend/*` and `/api/v1/*`.
4. **BDD Test Stack (Keep Java 25 + Spring Boot 4.1):**
   - Retain Java 25, Spring Boot 4.1, Cucumber-JVM 8, Playwright Java, Appium Java, Rest Assured, and Allure 3 in `e2e/`.
   - Refactor `e2e/` incrementally into a multi-module Maven architecture (`bdd-core`, `web-adapter`, `mobile-adapter`, `api-adapter`, `test-runner`) using a shared `TestAdapter` contract and canonical `@cross-platform` Gherkin specifications.
5. **Incremental Strangler Migration in `main`:**
   - Introduce `crates/*` (Rust Cargo Workspace Modular Monolith), `contracts/openapi/openapi.yaml`, and `apps/web-nuxt/` incrementally alongside the existing `backend/`, `apps/web/`, and `apps/mobile/` in `main`.
   - Dual-mount legacy `/api/backend/*` routes alongside `/api/v1/*` in the Rust API during the transition so `npm run check` and all CI gates remain green at every commit.

## Consequences

- **Zero Big-Bang Risk:** Existing Angular Web, Ionic Mobile, single-crate Rust backend, and E2E gates continue to pass while new modules are built and verified domain by domain.
- **Shared Assets Reused:** `@sgsk-wealth/design-tokens`, `shared/src/i18n/{en,th}.ts`, `fixtures/accounting/fifo_scenarios.json`, and existing Capacitor native projects (`apps/mobile/ios/`, `apps/mobile/android/`) carry forward directly.
- **Decimal & Contract Rigor:** New `/api/v1/*` endpoints adopt OpenAPI 3.1, decimal-string JSON formatting for financial values, and `rust_decimal` in `crates/financial-engine`, reconciled against `/api/backend/*` before cutover.
