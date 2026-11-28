# SGSK-Wealth Monorepo Agent & Quality Assurance Standards

This repository is a monorepo consisting of:
- **`backend/`**: Rust (Axum + Tokio) backend service
- **`crates/`**: Modular Rust workspace crates (`common`, `domain`, `financial-engine`, `application`, `database`, `integrations`, `api`)
- **`packages/contracts/`**: Framework-free TypeScript API & DTO contracts (`@sgsk-wealth/contracts`)
- **`packages/design-tokens/`**: Layered CSS design tokens (`primitives`, `semantic`, `financial`, `assets`, `components`) for Web & Mobile (`@sgsk-wealth/design-tokens`)
- **`packages/domain/`**: Framework-free financial domain logic, FIFO calculator, TVM, rebalance & CSV utilities (`@sgsk-wealth/domain`)
- **`apps/web/`**: Nuxt 4 + Vue 3 + Tailwind CSS v4 Single Page Application (`@sgsk-wealth/web`)
- **`apps/mobile/`**: Capacitor 8 Native iOS (`apps/mobile/ios/`) and Android (`apps/mobile/android/` via Maven) shells hydrated from the Nuxt SPA
- **`e2e/`**: Standalone Spring Boot E2E test suite (Spring Boot, Playwright, Appium, Rest Assured, Cucumber-JVM, JUnit 5 & Allure)
- **`.agent/skills/`**: Single source of truth for shared agent skills and domain guidelines

---

## Available Workspace Skills (`.agent/skills/`)

All agents (Antigravity, OpenAI Codex, and Claude Code via `.claude/skills/`) share these canonical skills:

| Skill | Path | When to Load |
| :--- | :--- | :--- |
| **`dividend-payments`** | [`.agent/skills/dividend-payments/SKILL.md`](.agent/skills/dividend-payments/SKILL.md) | U.S. (SEC T+1) and Thai (SET T+2) equity dividends, ex-dividend/XD dates, withholding taxes (15% W-8BEN / 30% NRA, 10% Thai / 0% BOI), stock dividends, and `dividend_service.rs`. |
| **`cucumber-bdd-best-practices`** | [`.agent/skills/cucumber-bdd-best-practices/SKILL.md`](.agent/skills/cucumber-bdd-best-practices/SKILL.md) | Authoring, reviewing, or refactoring `.feature` Gherkin specifications, Cucumber step definitions, Playwright Page Objects, REST Assured steps, and tagging taxonomy in `e2e/`. |
| **`fifo-cost-basis`** | [`.agent/skills/fifo-cost-basis/SKILL.md`](.agent/skills/fifo-cost-basis/SKILL.md) | First In, First Out (FIFO) inventory valuation (COGS, ending inventory, GAAP/IFRS vs. LIFO) and portfolio cost-basis accounting (lot matching, acquisition fees, FIFO vs. Average Cost, `share_lot_service.rs`). |
| **`sec-open-apis`** | [`.agent/skills/sec-open-apis/SKILL.md`](.agent/skills/sec-open-apis/SKILL.md) | Thailand SEC Open Data APIs for Mutual Funds (`/v2/fund/*`, 21 endpoints) and Provident Funds (`/v1/pvd/factsheet/*`, 15 endpoints), cursor pagination, `Ocp-Apim-Subscription-Key` auth, `204` handling, and `nav_service.rs`. |
| **`ai-native-sdlc`** | [`.agent/skills/ai-native-sdlc/SKILL.md`](.agent/skills/ai-native-sdlc/SKILL.md) | Authoritative guide and operational standards for the AI-Native Software Development Lifecycle across all 6 stages (Plan, Design, Build, Test, Deploy, Maintain), artifact chains (`intent.md` -> `spec.md` -> `plan.md` -> `REVIEW.md` -> `bands.yaml`), plan mode, continuous evals, and closed-loop maintenance. |

---

## Unified Monorepo Commands (From Workspace Root)

- **Start Development (Both Backend & Frontend)**:
  ```bash
  npm start
  # or
  npm run dev
  ```
  Runs Rust Axum backend on `http://127.0.0.1:8000` and Nuxt 4 dev server on `http://localhost:4200` (with proxy to `:8000`).

- **Run All Pre-Commit Checks**:
  ```bash
  npm run check
  ```
  Executes architecture boundary linting, Gherkin strict linting, OpenAPI linting, `@sgsk-wealth/contracts` tests, `@sgsk-wealth/domain` tests, `@sgsk-wealth/design-tokens` tests, backend linting/tests, `crates/*` workspace linting/tests, Nuxt web unit tests, Nuxt static generation (`generate:web`), and bundle secret scanning.

- **Web Frontend Only**:
  ```bash
  npm run dev:web
  npm run test:web
  npm run build:web
  npm run generate:web
  ```

- **Mobile Shells (Capacitor iOS & Android) Only**:
  ```bash
  npm run cap:sync
  mvn -f apps/mobile/android/pom.xml package
  ```

- **Backend & Workspace Crates**:
  ```bash
  npm run dev:backend
  npm run lint:backend
  npm run test:backend
  npm run lint:crates
  npm run test:crates
  ```

- **E2E & BDD Suite (`e2e/`)**:
  ```bash
  npm run lint:gherkin
  npm run test:e2e:smoke
  npm run test:e2e:api
  npm run test:e2e:web
  npm run test:e2e:mobile
  npm run test:e2e
  ```

---

## Mandatory Quality Verification Before Commit/Push

Before committing or pushing any changes, verify that the following checks pass:

### 1. Backend Verification (`backend/`)
From root:
- `npm run lint:backend` (Runs `cargo fmt --all -- --check` and `cargo clippy --all-targets -- -D warnings`)
- `npm run test:backend` (Runs `cargo test`)

Strict backend guidelines:
- Treat all Clippy warnings as errors (`-D warnings`) and keep code `rustfmt`-clean.
- Maintain comprehensive unit and integration test parity across core accounting engines, external market data parsers, authentication/CORS security controls, and all HTTP routers.

### 2. Web, Mobile & Pure Packages Verification (`apps/web/`, `apps/mobile/`, `packages/`)
From root:
- `npm run lint:boundaries` / `npm run lint:openapi` / `npm run test:contracts` / `npm run test:domain` / `npm run test:tokens`
- `npm run test:web` (Runs Vitest across `apps/web/tests/`)
- `npm run generate:web` / `npm run cap:sync` / `npm run check:secrets` (Ensures zero compilation errors, Capacitor asset parity, and zero client bundle secret leaks)

### 3. Cross-Platform Mobile Standards (iOS & Android)
Whenever implementing or enhancing features, UI flows, APIs, or shared utilities, explicitly evaluate and maintain parity across **Web (`apps/web/`)**, **iOS (`apps/mobile/ios/`)**, and **Android (`apps/mobile/android/`)**:
- **Shared-First Architecture**: Keep framework-free DTOs in `packages/contracts/` (`@sgsk-wealth/contracts`), layered CSS color tokens in `packages/design-tokens/` (`@sgsk-wealth/design-tokens`), pure financial logic in `packages/domain/` (`@sgsk-wealth/domain`), and Nuxt/Vue composables, components, and i18n dictionaries (`en.ts`/`th.ts`) inside `apps/web/app/`. Never hardcode relative `/api/backend/...` paths inside UI components—use `useApiClient()` so Capacitor iOS (`capacitor://`) and Android (`http://10.0.2.2:8000`) resolve endpoints cleanly.
- **Native UX & Adaptive Behavior**: Preserve responsive mobile bottom navigation and modal sheets, shared `Dark` / `Light` / `System` theme tokens from `@sgsk-wealth/design-tokens` (`#0B1220` dark / `#FFFFFF` light status bar syncing), safe-area insets (`env(safe-area-inset-*)`), `@capacitor/status-bar` theme syncing, `@capacitor/haptics` feedback, `@capacitor/preferences` persistence, and `@capacitor/app` back-button handling.
- **Native Packaging & Selectors**: When shipping UI changes, keep `e2e/` selectors (`[data-symbol-lots]`, etc.), sync the built Nuxt SPA bundle to native assets (`npm run cap:sync`, which runs `generate:web` + `node scripts/sync-nuxt-capacitor.mjs`), and verify Android APK compilation (`mvn -f apps/mobile/android/pom.xml package`, overriding `-Dandroid.compileSdk=<installed-sdk>` if needed) alongside iOS sync.

### 4. E2E & BDD Verification (`e2e/`)
From root:
- `npm run lint:gherkin` (Runs `validate_gherkin.py --strict` across all `.feature` files)
- `npm run test:e2e:smoke` (Runs `@smoke`-tagged scenarios)
- `npm run test:e2e:mobile` (Runs `@mobile`-tagged Appium + Cucumber scenarios)
