# End-to-End Walkthrough: The AI-Native SDLC in Practice

This walkthrough traces a real change through all six stages of the AI-Native SDLC in the SGSK-Wealth monorepo: implementing an **Automated Dividend Entitlement Calculator** adhering to U.S. (SEC T+1) and Thai (SET T+2) settlement rules.

---

## Stage 1: Plan — Originator Brainstorming to `intent.md`

### 1. The Interaction
A wealth manager notes that clients are confused by ex-dividend dates across US and Thai equity holdings. The wealth manager opens an AI session:

> **Wealth Manager:** "Clients keep getting surprised when they buy a Thai stock on the XD date and don't receive the dividend payout, while for their US tech stocks, settlement is faster. Can we show them a clear entitlement countdown in the portfolio UI so they know the exact cutoff time to own shares?"

The AI acts as an analyst and Socratic partner:
> **AI:** "To make this actionable:
> 1. Thai SET equities follow T+2 settlement, meaning the share must be held at close before the XD date. US equities follow SEC T+1.
> 2. What systems need this? The backend portfolio service to compute entitlement status, and the Angular dashboard to render it.
> 3. Are there regulatory or data constraints?
> 4. Let's capture this in `intent/dividend-entitlement-countdown.md`."

### 2. Committed Artifact: `intent/dividend-entitlement-countdown.md`
```markdown
# Intent: Portfolio Dividend Entitlement Cutoff & Countdown
Author: S. Somchai (Wealth Advisory Team)
Date: 2026-11-15
Status: accepted

## 1. Problem
Investors frequently misunderstand settlement timing across U.S. (SEC T+1) and Thai (SET T+2) equity markets, leading to missed dividend payouts and customer support inquiries.

## 2. Proposed Outcome
The portfolio dashboard highlights upcoming ex-dividend dates with an entitlement status badge ("Entitled", "Cutoff in X hours", "Ex-Dividend / Not Entitled") calculated using market settlement cycles and market holiday calendars.

## 3. Affected Users & Systems
- Target Users: Retail and Private Wealth Investors.
- Systems: `backend/routers/dividend_router.py`, `backend/services/dividend_service.py`, `frontend/src/app/dividend/`.

## 4. Constraints
- Strict adherence to SET T+2 and SEC T+1 settlement cycles.
- Zero extra latency on initial portfolio dashboard render (< 150ms cached).
- Comply with SEC Open Data API guidelines for mutual fund dividends where applicable.

## 5. Open Questions
- [x] Should we support stock dividends and cash dividends identically? (Answer: Yes, label with dividend type).

## Sign-off
- Decision: Accepted by Product Owner (P. Vipat) on 2026-11-15.
```

---

## Stage 2: Design — Collapsing Requirements & Design into `spec.md`

### 1. Generating the Spec
The Product Owner triggers a prompt with the canonical workspace skills loaded:
- `.agent/skills/dividend-payments/SKILL.md`
- `.agent/skills/sec-open-apis/SKILL.md`

The AI generates `docs/specs/dividend-entitlement.spec.md` and flags an area of concern:
> [!WARNING]
> **Flagged Policy Concern #1: Exchange Trading Holidays**
> U.S. markets (NYSE/NASDAQ) and Thai markets (SET) observe different national and bank holidays. Settlement days are business days only. If an investor purchases a Thai equity on a Friday preceding a Thai bank holiday on Monday, settlement moves to Wednesday. The service must consume official SET/BOT holiday calendars to prevent erroneous entitlement countdowns.

The PO routes this to the Lead Architect, who approves caching the official SET holiday table in SQLite.

---

## Stage 3: Build — Plan Mode to Code

### 1. Entering Plan Mode
The engineer starts the session in **Plan Mode** (`/plan`):

```markdown
Read intent/dividend-entitlement-countdown.md and docs/specs/dividend-entitlement.spec.md. Formulate a comprehensive implementation plan before modifying any code.
```

The agent inspects the codebase and produces `plan.md`:
```markdown
# Plan: Dividend Entitlement Countdown Service
Date: 2026-11-15

## 1. Files That Change
- `backend/services/settlement_calendar_service.py` (new)
- `backend/services/dividend_entitlement_service.py` (new)
- `backend/tests/test_dividend_entitlement.py` (new)
- `backend/routers/dividend_router.py` (modify: add entitlement endpoint)
- `frontend/src/app/features/dividends/entitlement-badge.component.ts` (new)

## 2. Order of Work
1. Create unit tests covering SEC T+1 vs. SET T+2 holiday edge cases in `test_dividend_entitlement.py`.
2. Implement holiday calendar and settlement arithmetic.
3. Expose `/api/v1/dividends/entitlement` route.
4. Build Angular badge component with reactive status signal.
5. Verify via unified test suite `npm run check`.

## 3. Risks
- Holiday calendar API rate limits; mitigated by SQLite local caching with 24h TTL.

## 4. Proof of Correctness
- All backend unit tests pass with >= 85% coverage.
- Linter clean (`ruff` + `mypy` zero errors).
```

The engineer approves the plan and commits `plan.md`.

### 2. Test-First Implementation
The agent follows strict TDD:
1. Writes `backend/tests/test_dividend_entitlement.py` with failing assertions for Friday purchases before Monday bank holidays.
2. Runs `pytest backend/tests/test_dividend_entitlement.py` $\rightarrow$ Fails (Red).
3. Writes the domain logic in `dividend_entitlement_service.py` $\rightarrow$ Passes (Green).
4. Implements Angular component and mounts in dashboard.

---

## Stage 4: Test — Local Verification Feedback Loop

The agent runs the local pre-commit check specified in repository standards:
```powershell
npm run check
```
1. `validate_gherkin.py` passes strict check.
2. `ruff check .` and `mypy .` pass with 0 errors.
3. `pytest` executes 124 tests in 2.1 seconds $\rightarrow$ 100% green.
4. Angular production build completes within budget.

---

## Stage 5: Deploy — Bidirectional PR Review & Release Gate

### 1. Agent Reviews the PR
The agent runs three review passes defined in `REVIEW.md`:
- **Pass 1 (Logic):** Confirmed boundary condition on ex-date trading hours (16:30 BKK for SET, 16:00 EST for NYSE).
- **Pass 2 (Security):** Confirmed JWT gateway authentication; zero unescaped SQL queries.
- **Pass 3 (Spec):** Verified against `docs/specs/dividend-entitlement.spec.md`. Diff matches `plan.md` exactly.
- **Nit (1 reported):** Variable `d_set` renamed to `set_settlement_date` for readability.

### 2. Autonomous PR Self-Healing
The developer comments: `@agent please address the variable naming nit.`
The agent updates the code, re-runs `npm run test:backend`, and pushes the commit.

### 3. Human Code Owner Approval & Release Gate
- Human Tech Lead reviews diff and signs off via GitHub Branch Protection.
- Production deploy hook (`production-gate.sh`) verifies the presence of authorized release tokens before deploying.

---

## Stage 6: Maintain — Closing the Loop

### 1. Statistical Monitoring
A deterministic script (`scripts/monitor_settlement_api.py`) runs every hour, measuring API latency and error rates against a rolling 14-day baseline in `bands.yaml`.

### 2. Incident Prevention (Continuous Eval)
A permanent eval test is added to `evals/dividend-settlement-eval.json` ensuring that no future refactoring breaks the SET T+2 / SEC T+1 holiday calculation.
