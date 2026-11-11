# SGSK-Wealth Monorepo Agent & Quality Assurance Standards

This repository is a monorepo consisting of:
- **`backend/`**: Python FastAPI backend service
- **`frontend/`**: Angular 22 Single Page Application
- **`e2e/`**: Standalone Java E2E test suite (Playwright, Rest Assured, Cucumber-JVM, JUnit 5 & Allure)
- **`.agent/skills/`**: Single source of truth for shared agent skills and domain guidelines

---

## Available Workspace Skills (`.agent/skills/`)

All agents (Antigravity, OpenAI Codex, and Claude Code via `.claude/skills/`) share these canonical skills:

| Skill | Path | When to Load |
| :--- | :--- | :--- |
| **`dividend-payments`** | [`.agent/skills/dividend-payments/SKILL.md`](.agent/skills/dividend-payments/SKILL.md) | U.S. (SEC T+1) and Thai (SET T+2) equity dividends, ex-dividend/XD dates, withholding taxes (15% W-8BEN / 30% NRA, 10% Thai / 0% BOI), stock dividends, and `dividend_service.py`. |
| **`cucumber-bdd-best-practices`** | [`.agent/skills/cucumber-bdd-best-practices/SKILL.md`](.agent/skills/cucumber-bdd-best-practices/SKILL.md) | Authoring, reviewing, or refactoring `.feature` Gherkin specifications, Cucumber step definitions, Playwright Page Objects, REST Assured steps, and tagging taxonomy in `e2e/`. |

---

## Unified Monorepo Commands (From Workspace Root)

- **Start Development (Both Backend & Frontend)**:
  ```bash
  npm start
  # or
  npm run dev
  ```
  Runs FastAPI on `http://127.0.0.1:8000` and Angular dev server on `http://localhost:4200` (with proxy to `:8000`).

- **Run All Pre-Commit Checks**:
  ```bash
  npm run check
  ```
  Executes Gherkin strict linting, backend linting, backend tests, frontend unit tests, and production frontend build.

- **Frontend Only**:
  ```bash
  npm run dev:frontend
  npm run test:frontend
  npm run build
  ```

- **Backend Only**:
  ```bash
  npm run dev:backend
  npm run lint:backend
  npm run test:backend
  ```

- **E2E & BDD Suite (`e2e/`)**:
  ```bash
  npm run lint:gherkin
  npm run test:e2e:smoke
  npm run test:e2e:api
  npm run test:e2e:ui
  npm run test:e2e
  ```

---

## Mandatory Quality Verification Before Commit/Push

Before committing or pushing any changes, verify that the following checks pass:

### 1. Backend Verification (`backend/`)
From root:
- `npm run lint:backend` (Runs `ruff check .` and `mypy .`)
- `npm run test:backend` (Runs `pytest -m "not live_e2e"`)

Strict backend guidelines:
- Never redeclare variable type annotations inside separate conditional branches (causes mypy `[no-redef]`). Declare types before `if/else` blocks.
- Maintain test coverage (enforced at $\ge 80\%$).

### 2. Frontend Verification (`frontend/`)
From root:
- `npm run test:frontend` (Runs Vitest / `ng test --watch=false`)
- `npm run build` (Ensures zero compilation errors and budget compliance)

### 3. E2E & BDD Verification (`e2e/`)
From root:
- `npm run lint:gherkin` (Runs `validate_gherkin.py --strict` across all `.feature` files)
- `npm run test:e2e:smoke` (Runs `@smoke`-tagged API and Playwright UI scenarios)
