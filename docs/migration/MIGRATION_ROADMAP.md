# SGSK-Wealth Migration, Cutover & Rollback Runbook

> **Scope:** Controlled Strangler Cutover on Vercel Services (`vercel.json`)
> **Architecture Reference:** [ADR-005](../decisions/ADR-005-target-architecture-and-strangler-roadmap.md)

---

## 1. Pre-Cutover Acceptance Checklist

All gates below must pass before modifying `vercel.json` for production cutover:

- [ ] **Rust Financial Correctness:** `cargo test --workspace` passes (including `golden_parity.rs` against `fixtures/accounting/fifo_scenarios.json`).
- [ ] **Rust Static Analysis:** `cargo fmt --all -- --check` and `cargo clippy --workspace --all-targets -- -D warnings` pass with 0 warnings.
- [ ] **Offline & Live Reconciliation:** `npm run reconcile:offline` passes and `npm run reconcile:api` passes against staging (`LEGACY_API_URL` vs `V1_API_URL`) within `1e-4` tolerance.
- [ ] **OpenAPI & Boundaries:** `npm run lint:openapi` and `npm run lint:boundaries` pass.
- [ ] **Nuxt Web & Secret Scan:** `npm run test:web-nuxt`, `npm run build:web-nuxt`, and `npm run check:secrets` pass with zero leaked keys.
- [ ] **Capacitor Mobile:** `npm run cap:sync:nuxt`, `mvn -f apps/mobile/android/pom.xml package`, and iOS build succeed.
- [ ] **Cross-Platform BDD:** `npm run lint:gherkin` passes; `@smoke`, `@api`, `@web`, `@mobile`, and `@cross-platform` suites pass with Allure reports archived.
- [ ] **Supabase RLS & Security:** Cross-user isolation (`401`/`403` negative tests) and Gitleaks secret scan pass.

---

## 2. Target Vercel Services Cutover (`vercel.json`)

When UAT sign-off is complete, update `vercel.json` to point:
1. `services.web`: `root: "apps/web-nuxt"`, `framework: "nuxtjs"`, `buildCommand: "npm run build"`, `outputDirectory: ".output/public"` (or Nuxt static/Nitro output).
2. `services.backend`: `root: "crates/api"` (or workspace binary `sgsk-api`), keeping Edge `X-API-Key` header injection on both `^/api/v1(?:/(.*))?$` and legacy `^/api/backend(?:/(.*))?$`.
3. Top-level `rewrites`: route `/api/v1(/.*)?` and `/api/backend(/.*)?` to `backend`, and `/(.*)` to `web`.

---

## 3. Staging Rehearsal & Production Cutover Steps

1. Deploy preview branch to Vercel Staging and verify `GET /api/v1/health` and `GET /api/backend/health` both return `200 OK` with security headers.
2. Run `LEGACY_API_URL=... V1_API_URL=... npm run reconcile:api`.
3. Run `npm run test:e2e:cross-platform` against staging URLs.
4. Promote production deployment via Vercel Dashboard / `vercel promote` during low-traffic window.
5. Monitor error rates, latency, and Supabase Auth logs for 24–48 hours.

---

## 4. Instant Rollback Procedure

Because `crates/api` dual-mounts `/api/backend/*` alongside `/api/v1/*` and the existing Supabase schema is untouched:
1. **Immediate (< 1 min):** Trigger **Vercel Instant Rollback** to the previous Angular + `backend/` production deployment.
2. **Git Revert:** Revert the `vercel.json` cutover commit in `main` if further hotfixes are required.
3. No database rollback is required since Google Sheets is read-only and Supabase tables (`user_profiles`, `user_settings`, `symbol_logo_cache`) remain backward-compatible.

---

## 5. Post-Stabilization Retirement Checklist

Only after 7+ days of stable production operation:
1. Remove legacy Angular `apps/web/`, Ionic `apps/mobile/src/`, `shared/`, and legacy `backend/` crate.
2. Remove `/api/backend/*` dual-mount from `crates/api/src/lib.rs` and `vercel.json`.
3. Archive `CAPACITOR_WEB_APP` toggle in `apps/mobile/capacitor.config.ts` to default permanently to Nuxt.
