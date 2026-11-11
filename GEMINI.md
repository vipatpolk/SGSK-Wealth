# SGSK-Wealth Monorepo Quality Assurance Standards

This repository is a monorepo consisting of:
- **`backend/`**: Python FastAPI backend service
- **`frontend/`**: Angular 22 Single Page Application
- **`e2e/`**: Standalone Java E2E test suite (Playwright, Rest Assured, Cucumber-JVM, JUnit 5 & Allure)
- **`.agents/`**: Shared agent skills and financial domain guidelines

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
  Executes backend linting, backend tests, frontend unit tests, and production frontend build.

- **Frontend Only**:
  ```bash
  npm run dev:frontend
  npm run test:frontend
  npm run test:e2e
  npm run build
  ```

- **Backend Only**:
  ```bash
  npm run dev:backend
  npm run lint:backend
  npm run test:backend
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
- `npm run test:frontend` (Runs `ng test --watch=false`)
- `npm run build` (Ensures zero compilation errors and budget compliance)
