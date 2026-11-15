# AI-Native SDLC Artifact Chain & Canonical Templates

In an AI-native engineering organization, markdown artifacts committed to version control constitute the single source of truth and the audit trail across the software development lifecycle.

---

## 1. The Artifact Chain of Custody

The lifecycle is defined by a strict chain of progression:

$$\text{intent.md} \xrightarrow{\text{PO Review}} \text{spec.md} \xrightarrow{\text{Plan Mode}} \text{plan.md} \xrightarrow{\text{Implementation}} \text{Diff + Local Tests} \xrightarrow{\text{PR}} \text{REVIEW.md} \xrightarrow{\text{Prod}} \text{bands.yaml / Evals}$$

Every document builds on the previous artifact and references its commit hash or file path.

---

## 2. Stage 1 Template: `intent.md`

`intent.md` captures business pain points and desired outcomes in plain language.

```markdown
# Intent: [Short Title of the Feature or Fix]
Author: [Name, Role / Team]
Date: [YYYY-MM-DD]
Status: draft | accepted | rejected
Link: [Optional link to Jira/Issue ID or customer feedback]

## 1. Problem Statement
- **Current State:** What cannot be done today, or what is currently failing?
- **Impact & Evidence:** Who is impacted, and what is the measurable cost (e.g. support calls, transaction latency)?
- **Trigger:** Did this originate from a user idea, support ticket, or automated telemetry alert?

## 2. Proposed Outcome
- **Desired State:** What does the ideal capability look like once solved?
- **Business Value:** What metric improves upon delivery?

## 3. Target Personas and Affected Systems
- **User Personas:** [e.g. Wealth Management Advisors, Retail Investors]
- **Internal Systems:** [e.g. backend/settlement-service, frontend/portfolio-view]
- **External Dependencies:** [e.g. SET Trade API, SEC Data Gateway]

## 4. Constraints & Non-Negotiables
- **Security & Privacy:** [e.g. No PII stored in local browser storage; zero plain-text API keys]
- **Compatibility:** [e.g. Maintain backward compatibility with v1 API clients]
- **Regulatory / Financial:** [e.g. SEC T+1 or SET T+2 settlement rules]

## 5. Scope Boundaries
- **In Scope:** [Bullet list of explicit deliverables]
- **Out of Scope:** [Explicit list of items deferred to future iterations]

## 6. Open Questions
- [ ] [Question 1: Business rule clarification]
- [ ] [Question 2: Integration dependency confirmation]

---
## Product Owner Sign-off
- **Decision:** Accepted / Rejected / Revision Requested
- **Signed By:** [PO Name]
- **Date:** [YYYY-MM-DD]
- **Notes:** [Rationale for approval or rejection]
```

---

## 3. Stage 2 Template: `spec.md`

`spec.md` collapses requirements and technical design into a single actionable specification.

```markdown
# Technical Specification: [Feature Name]
Derived From: intent/[change-name].md (commit: [git-sha])
Author: [Architect / Agent]
Date: [YYYY-MM-DD]
Status: draft | approved

## 1. Overview & Architectural Decisions
- **Summary:** Concise technical description of the proposed solution.
- **Architectural Pattern:** [e.g. CQRS, Event-Driven, Reactive State Service]
- **Alternatives Considered:**
  - *Option A:* [Why it was evaluated and why it was rejected]
  - *Option B (Selected):* [Why this provides the best tradeoff]

## 2. Detailed Technical Requirements
- **Functional Requirements:**
  - `REQ-01`: [Requirement description with acceptance criteria]
  - `REQ-02`: [Requirement description with acceptance criteria]
- **Non-Functional Requirements:**
  - *Performance:* Latency $< 200\text{ms}$ at p95.
  - *Reliability:* Graceful fallback if external pricing service returns 503.

## 3. Data Contracts & API Schemas
- **Endpoints:**
  - `POST /api/v2/dividends/calculate`
    - Request:
      ```json
      {
        "portfolioId": "string",
        "asOfDate": "2026-11-15"
      }
      ```
    - Response:
      ```json
      {
        "grossAmount": 1500.00,
        "withholdingTax": 150.00,
        "netAmount": 1350.00,
        "currency": "THB"
      }
      ```

## 4. Security & Compliance Enforcement
- Applicable Skills: `dividend-payments`, `sec-open-apis`, `auth`
- Auth Mechanism: Bearer JWT validation via gateway.
- Data Handling: PII masking applied to all account identifiers.

## 5. Areas of Concern & Policy Conflicts (Must be resolved before Build)
> [!WARNING]
> **Conflict #1: Settlement Latency vs. Instant Cash Update**
> - *Description:* User expects instant cash balance update, but SET equity settlement requires T+2 clearance.
> - *Proposed Resolution:* Display provisional pending cash balance with an indicator tag.
> - *Policy Owner Approval:* Approved by Compliance Lead on [YYYY-MM-DD].
```

---

## 4. Stage 3 Template: `plan.md`

`plan.md` is generated exclusively in **Plan Mode** before touching any production code.

```markdown
# Implementation Plan: [Feature Name]
Spec Source: docs/specs/[change-name].spec.md
Approved By: [Engineer Name / Tech Lead]
Date: [YYYY-MM-DD]

## 1. Scope & File Modifications
| Operation | File Path | Purpose |
| :--- | :--- | :--- |
| **CREATE** | `backend/services/settlement_service.py` | Implement T+2 settlement date calculator |
| **CREATE** | `backend/tests/test_settlement_service.py` | Unit tests for calendar and holiday edge cases |
| **MODIFY** | `backend/routers/portfolio_router.py` | Mount new settlement calculation endpoint |
| **MODIFY** | `frontend/src/app/portfolio/settlement-view.ts` | Angular view component for settlement dates |

## 2. Sequenced Steps of Execution
1. **Step 1: Test Scaffolding (TDD)**
   - Create `backend/tests/test_settlement_service.py` with failing assertions for bank holidays and weekends.
2. **Step 2: Core Domain Logic**
   - Implement `SettlementService.calculate_settlement_date()` using Thai holiday calendar rules.
3. **Step 3: Verification**
   - Run `pytest backend/tests/test_settlement_service.py` until 100% green.
4. **Step 4: Router Integration**
   - Wire route into FastAPI app with dependency injection and error handling.
5. **Step 5: Frontend Integration**
   - Consume new endpoint in Angular reactive signal store and update component template.
6. **Step 6: Full Verification Loop**
   - Execute `npm run check` (linter, unit tests, frontend build).

## 3. Blast Radius & Risk Assessment
- **Shared Modules Affected:** `PortfolioCalculationEngine`
- **Potential Regressions:** Existing cash lot FIFO reconciliation could receive un-settled transactions.
- **Mitigation:** Wrap settlement filter in unit-tested query wrapper.

## 4. Concrete Proof Criteria
- `npm run test:backend` passes with >= 85% branch coverage.
- Zero `mypy` or `ruff` lint errors.
- Frontend build succeeds within budget limits.
```

---

## 5. Stage 5 Template: `REVIEW.md`

`REVIEW.md` resides at repository root or `.github/` to establish universal review policy for both agent and human reviews.

```markdown
# Repository Pull Request Review Guidelines

Every Pull Request must be evaluated across three mandatory passes. Findings must cite the pass name and include an actionable fix recommendation.

## Pass 1: Logic, Concurrency & Edge Cases
- Verify boundary conditions (zero values, off-by-one, empty collections).
- Check asynchronous state management, unhandled promise rejections, and race conditions.
- Ensure strict immutability where required.

## Pass 2: Security, Privacy & Compliance
- Check for SQL injection, command injection, and SSRF risks.
- Enforce that secrets and API keys are never hardcoded or logged.
- Verify PII scrubbing from logs and telemetry traces.
- Enforce proper authorization checks on all mutating operations.

## Pass 3: Spec & Plan Compliance
- Verify that the diff directly implements the accepted `spec.md` and `plan.md`.
- Flag any undeclared file modifications or out-of-scope refactoring.
- Ensure that tests verify the exact acceptance criteria promised in the plan.

## Severity Definitions & Nit Caps
- **Important:** Blocks PR approval. Security flaws, breaking API changes, missing tests, unhandled exceptions.
- **Nit:** Non-blocking suggestions (naming, comments, minor styling).
- **Rule:** Report at most 5 nits per review. Summarize remaining minor suggestions as a single count.
```

---

## 6. Stage 6 Template: `bands.yaml`

`bands.yaml` defines statistical process control parameters for closed-loop autonomous monitoring.

```yaml
version: 1
service: sgsk-wealth-backend
evaluation_window: rolling_14d
ruleset: western_electric

metrics:
  - id: api_5xx_rate
    metric_name: http_requests_total{status=~"5.."}
    baseline: rolling_7d
    thresholds:
      1_sigma:
        action: log
        description: "Normal variance. Record to telemetry."
      2_sigma:
        action: diagnose
        tools: ["Read", "Grep", "LogQuery"]
        output: "docs/diagnostics/api-5xx-incident.md"
      3_sigma:
        action: propose
        routes:
          - pull_request: "scripts/quarantine_or_revert.py"
          - runbook: "rollback_deployment"
          - notification: "slack:#wealth-oncall"

  - id: ci_test_failure_rate
    metric_name: ci_job_failures{job="backend-tests"}
    baseline: rolling_30d
    thresholds:
      2_sigma:
        action: diagnose
      3_sigma:
        action: propose
        routes:
          - create_intent: "intent/ci-flaky-test-remediation.md"
