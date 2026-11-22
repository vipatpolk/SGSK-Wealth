# ADR-002: Financial Calculation Parity (Rust Backend & TypeScript Domain)

- **Status:** Accepted (Implemented in M1 & M2)
- **Scope:** `backend/src/features/portfolio/`, `packages/domain/src/local-fifo.utils.ts`, `fixtures/accounting/fifo_scenarios.json`

## Context
FIFO share lot accounting, multi-currency conversion, fee adjustments, and CSV row parsing execute both on the Rust backend (for cloud Google Sheets portfolios) and in TypeScript (for local on-device portfolios). Even minor divergences in date sorting, floating-point epsilon thresholds, `EX-OUT`/`EX-IN` classification, or malformed CSV filtering cause cloud and local views to disagree.

## Decision
1. Establish a single language-neutral fixture suite at `fixtures/accounting/fifo_scenarios.json` covering FIFO lot consumption, partial sells with fees, same-day ordering, leap-day boundaries, oversells, exchange trades, zero/epsilon filtering, fee > gross proceeds, neutral dividend rows, multi-currency totals, crypto fractional precision, and invalid CSV row rejection.
2. Require both Rust (`backend/tests/test_accounting_parity.rs`) and TypeScript (`packages/domain/src/__tests__/accounting-parity.spec.ts`) to assert exact parity against `fifo_scenarios.json` in CI (`npm run check`).
3. Keep domain accounting logic framework-free inside `packages/domain/` enforced by `scripts/check-boundaries.mjs`.

## Consequences
- Any accounting or CSV parser change must preserve cross-language fixture parity before merge.
- Both `@sgsk-wealth/web` and `@sgsk-wealth/mobile` inherit identical pure calculation semantics without Angular or Capacitor runtime coupling.
