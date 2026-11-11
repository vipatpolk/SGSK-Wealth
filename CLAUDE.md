# Claude Code Instructions — SGSK-Wealth Monorepo

@AGENTS.md

---

## Claude Code-Specific Configuration & Conventions

### 1. Skills Adapter (`.claude/skills/`)
Workspace skills are exposed in `.claude/skills/`, which is symlinked (or junction-linked on Windows) to `.agent/skills/` — the single source of truth for all coding agents.
- **Never duplicate skill files inside `.claude/skills/`**; always author and edit skills under `.agent/skills/<skill-name>/`.
- Invoke or load skills when working in their respective domains:
  - `/dividend-payments`: U.S. (SEC T+1) and Thai (SET T+2) equity dividends, XD/ex-date calculations, withholding taxes, and `backend/services/dividend_service.py`.
  - `/cucumber-bdd-best-practices`: Authoring or refactoring `.feature` files, Cucumber-JVM step definitions, Playwright Page Objects, and REST Assured steps in `e2e/`.
- If `.claude/skills` is missing on a fresh clone, run `npm run setup:agents` (also triggered automatically by `npm install` via `"prepare"`).

### 2. Tool & Shell Execution
- Run unified workspace scripts from the repository root (`npm run ...`) rather than chaining `cd` commands.
- On Windows hosts, invoke Python skill CLI utilities with `py` (e.g., `py .agent/skills/cucumber-bdd-best-practices/scripts/validate_gherkin.py --strict e2e/src/test/resources/features`).
- Ensure any E2E Java changes compile cleanly via `mvn -f e2e/pom.xml test-compile`.

### 3. Pre-Completion Verification Gate
Before concluding any task that modifies code, tests, or Gherkin specifications:
1. Run `npm run check` (`lint:gherkin`, `lint:backend`, `test:backend`, `test:frontend`, and production `build`).
2. When modifying `e2e/`, additionally run `npm run test:e2e:smoke` (or `npm run test:e2e:api` / `npm run test:e2e:ui`) to confirm end-to-end execution.
