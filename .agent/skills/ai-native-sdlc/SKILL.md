---
name: ai-native-sdlc
description: >-
  Authoritative guide and operational engineering standards for the AI-Native Software Development Lifecycle (SDLC). Covers the 6 non-linear stages (Plan, Design, Build, Test, Deploy, Maintain), git-versioned artifact chains (intent.md -> spec.md -> plan.md -> diff/tests -> PR/REVIEW.md -> bands.yaml/evals), plan-mode and auto-mode execution, advisory skills vs. deterministic hooks, continuous evals, bidirectional PR review, and autonomous closed-loop maintenance.
---

# The AI-Native SDLC: Enterprise Engineering Guide & Operational Standards

This skill operationalizes the principles, stage-by-stage plays, and governance architectures outlined in Anthropic's *AI-Native SDLC Playbook*. It defines how engineering teams, technical leads, product owners, and autonomous AI agents collaborate across the entire software development lifecycle when code generation is no longer the bottleneck.

---

## 1. Executive Summary & Paradigm Shift

### Code is No Longer the Bottleneck
In traditional software development, the implementation phase (writing and testing code) was the most labor-intensive and costly phase. Heavy processes—such as multi-week PRD drafting, story point estimation rituals, architectural boards, and manual code review cycles—evolved specifically to force alignment before committing expensive engineering time.

When agentic coding assistants (such as Claude Code, Antigravity, and Codex) compress implementation to minutes or hours:
1. **The bottleneck moves to human-speed stages**: Planning, architecture/design sign-off, testing/review, and deployment gates now dominate elapsed time.
2. **Traditional human controls fail**: Reviewing every line of diff by hand cannot keep up with high-throughput agent diffs.
3. **Governance costs spike**: Bottlenecks form at approval gates if exceptions still route to weekly or monthly committees.

### The Core Shift: From Linear Waterfall to the Committed Artifact Chain
The AI-native SDLC reimagines development not as a linear handoff between siloed roles, but as a **closed loop connected by machine-actionable, human-readable markdown artifacts committed to version control**.

```
┌───────────────────────────────────────────────────────────────────────────────────┐
│                     THE AI-NATIVE SDLC CLOSED ARTIFACT LOOP                       │
└───────────────────────────────────────────────────────────────────────────────────┘
   [Stage 1: PLAN]       [Stage 2: DESIGN]       [Stage 3: BUILD]     [Stage 4: TEST]
     intent.md      ──▶      spec.md        ──▶      plan.md     ──▶   Diff + Tests
    (Originator)           (PO + Skills)          (Plan Mode)        (Local Feedback)
         ▲                                                                   │
         │                                                                   ▼
   [Stage 6: MAINTAIN]    [Stage 5: DEPLOY]      [Stage 5: DEPLOY]    [Stage 5: DEPLOY]
    intent.md (Bug)  ◀──   Production Gate  ◀──  Branch Protect  ◀──   REVIEW.md (PR)
   (Breach / Eval)         (Hook / Sign-off)     (Code Owner)         (Dual Review)
```

### Stage Shift Matrix

| Stage | Traditional SDLC | AI-Native SDLC | Primary Artifact |
| :--- | :--- | :--- | :--- |
| **1. Plan** | Requirements gathered by committees; distilled via weeks of workshops and PRDs. | Originator brainstorms with AI to capture problem, constraints, and success criteria in plain language. | `intent.md` |
| **2. Design** | Analysts write specs; designers create wireframes separately; security reviews occur late. | Requirements and technical design collapse into a single prompted session constrained by versioned skills. | `spec.md` |
| **3. Build** | Engineers jump into code; architecture stays in heads; docs and tests written post-hoc. | Implementation strictly blocked until a written plan is approved in plan mode. Knowledge in versioned files (`CLAUDE.md`, skills). | `plan.md` |
| **4. Test** | QA gates at release boundaries; tests written after code or skipped under deadline. | Continuous self-verification feedback loops locally; continuous agent evals in CI. Bug fixes strictly require test-first. | Passing test logs & `evals/*.json` |
| **5. Deploy** | Humans review every diff line; approval queues stall release; runbooks executed manually. | Bidirectional agent PR review (`REVIEW.md`); deterministic hooks as approval gates; rehearsed single-command rollbacks. | `REVIEW.md` & PR metadata |
| **6. Maintain** | Reactive monitoring; alerts wake engineers at 3 AM; incident post-mortems sit in tickets. | Continuous deterministic control bands (`bands.yaml`) invoke AI to diagnose and file new `intent.md` or trigger pre-approved runbooks. | `bands.yaml` & post-mortem evals |

---

## 2. The Artifact Chain of Custody

Every stage must commit an artifact before the next stage begins. The chain of git commits serves as the immutable audit trail.

### 1. `intent.md` (Stage 1: Plan)
- **Role:** Captures the problem statement, affected users/systems, constraints, and open questions in the originator's own words.
- **Location:** `intent/<change-name>.md` or monorepo project root.
- **Gate:** Product Owner (PO) signs off and merges before design begins.

### 2. `spec.md` (Stage 2: Design)
- **Role:** Technical requirements, design tradeoffs, API contracts, UX flows, and explicitly flagged policy/security concerns.
- **Location:** Alongside `intent.md` (e.g. `intent/<change-name>.spec.md` or `docs/specs/`).
- **Gate:** PO and Technical Lead resolve flagged concerns before engineering implementation.

### 3. `plan.md` (Stage 3: Build)
- **Role:** Step-by-step implementation plan generated in plan mode before touching code. Contains exact files modified, sequence of steps, blast radius/risks, and quantifiable proof criteria.
- **Location:** In the feature branch root or commit message.
- **Gate:** Engineer or Technical Lead approval is mandatory before code generation.

### 4. Diff & Local Verification Evidence (Stage 4: Test)
- **Role:** Clean git diff alongside command execution logs proving tests, build, and lint pass with zero warnings.
- **Gate:** Local test target exit code `0`; agent blocked from weakening or deleting test assertions.

### 5. `REVIEW.md` & Check Runs (Stage 5: Deploy)
- **Role:** Dual-direction review findings (Bugs, Security, Compliance vs. `spec.md`/`plan.md`). Severity triage (Important vs. Nit).
- **Gate:** Branch protection requires human code-owner approval; deterministic hooks enforce production release authorizations.

### 6. `bands.yaml` & Continuous Evals (Stage 6: Maintain)
- **Role:** Statistical control limits for operational metrics. Regression test evals committed after every incident.
- **Gate:** CI eval pass rate must not degrade.

---

## 3. Stage-by-Stage Plays & Operational Standards

### Stage 1 — Plan: Capture as `intent.md`

#### Getting Started
- **Prerequisites:** None.
- **Infrastructure:** AI agent interface for non-technical contributors; shared version-controlled repository or monorepo directory (e.g. `intent/`).

#### Execution Protocol
1. **Plain-Language Brainstorming:** The originator explains the pain point or feature idea to the agent without technical jargon.
2. **Socratic Refinement:** The agent prompts for:
   - What cannot be done today?
   - Who is affected (personas, user groups, systems)?
   - What does success look like?
   - What is strictly out of scope?
   - What known constraints (security, regulatory, PII, budget) exist?
3. **Artifact Generation:** The agent structures the output into standard `intent.md`.
4. **Human Review & Commit:** The originator corrects any misinterpretations and commits the file to version control.
5. **PO Acceptance:** Product Owner reviews `intent.md`, resolves open questions, and signs off.

#### Canonical `intent.md` Template
```markdown
# Intent: [Short Title of Capability]
Author: [Name / Role]
Date: [YYYY-MM-DD]
Status: draft | accepted | rejected

## 1. Problem
[Describe what is broken, missing, or inefficient today. Quantify if possible.]

## 2. Proposed Outcome
[Describe the expected behavior and capability once this work is complete.]

## 3. Affected Users and Systems
- **Users / Roles:** [e.g., Retail Investors, Support Operators]
- **Services / Repos:** [e.g., backend/portfolio_service, frontend/dashboard]

## 4. Constraints & Non-Negotiables
- [e.g., Zero PII leakage in browser state]
- [e.g., Must comply with SET T+2 / SEC T+1 settlement cycles]
- [e.g., No breaking changes to existing public v1 endpoints]

## 5. Open Questions
- [ ] [Key question requiring PO or architecture alignment]
```

#### Metrics
- **Leading Indicator:** Elapsed time from initial discussion to committed `intent.md` (Target: $< 4$ hours vs. weeks of PRD meetings).
- **Lagging Indicator:** Survival rate (% of `intent.md` files accepted into Design without abandonment or complete restart).

---

### Stage 2 — Design: Requirements & Design Collapse

#### Getting Started
- **Prerequisites:** Accepted `intent.md`; organization skills available (brand, security, UX, regulatory).
- **Infrastructure:** Claude / AI agent with access to repository context and skills.

#### Execution Protocol
1. **Prompted Session with Skills Loaded:** The PO or architect starts a session feeding `intent.md`.
2. **Apply Live Constraints:** Skills (e.g. security policies, database conventions, UI design systems) act as live constraints while the spec is drafted, rather than discovered in a review weeks later.
3. **Flag Conflicts Early:** The agent explicitly flags conflicting requirements (e.g., high security vs. zero-click onboarding) in a dedicated `Areas of Concern` section.
4. **Resolution Before Engineering:** The PO consults policy owners (security, legal, compliance) to resolve flagged areas before any code is written.
5. **Spec Commit:** Save and commit `spec.md` alongside `intent.md`.

#### Canonical Prompt for Stage 2
```markdown
Read the attached intent.md and generate a comprehensive requirements and technical design spec (spec.md) for integrating this into our codebase. Apply all relevant workspace skills for security, compliance, architecture, and UI. Document the spec thoroughly, ready for engineering planning. Clearly flag any areas of concern, contradictions between constraints, or architectural risks.
```

#### Metrics
- **Leading Indicator:** Elapsed time between `intent.md` commit and `spec.md` commit.
- **Lagging Indicator:** Requirements rework after build begins (measured by `spec.md` commits dated after the first `plan.md` commit).

---

### Stage 3 — Build: Plan Mode, Skills, Hooks, and Parallel Sessions

#### Core Rule: Never Implement Without an Accepted Plan
The agent must never generate production code directly from a spec or user prompt. Work begins in **Plan Mode** (`/plan` or `--plan`), where the agent inspects the codebase in a read-only state and formulates an implementation plan.

#### Execution Protocol
1. **Plan Formulation:** Feed `spec.md` (and `CLAUDE.md` context) into Plan Mode. Request an implementation plan that details:
   - Exact files to be created, edited, or deleted.
   - Step-by-step sequencing of operations.
   - Identified failure modes, performance bottlenecks, and risks.
   - Exact quantifiable verification steps (tests to run, expected outputs).
2. **Interrogate the Plan:** The engineer questions assumptions:
   - *"What existing functionality could this break?"*
   - *"Which step carries the highest blast radius?"*
   - *"What alternative architectures did you reject and why?"*
3. **Commit `plan.md`:** Commit the approved plan. This forms the baseline against which PR reviews will evaluate the diff.
4. **Autonomous Execution:** Switch to implementation (or auto-mode for low-risk routine changes).
5. **Synchronized Updates:** If implementation deviates from the plan during coding, update `plan.md` within the same commit.

#### Canonical `plan.md` Template
```markdown
# Plan: [Feature Name] (derived from spec.md [YYYY-MM-DD])

## 1. Files That Change
- `backend/services/tax_service.py` (modify: add withholding calculation)
- `backend/tests/test_tax_service.py` (new tests)
- `frontend/src/app/tax/tax-summary.component.ts` (modify)

## 2. Order of Work
1. Write failing unit test reproducing scenario in `test_tax_service.py`.
2. Implement backend calculation logic behind existing model.
3. Expose calculation via authenticated route in `tax_controller.py`.
4. Update frontend component and bind to reactive state.
5. Execute end-to-end smoke verification.

## 3. Risks & Blast Radius
- Tax calculation modifies shared portfolio valuation pipeline; must maintain backward compatibility for historical lots.

## 4. Proof of Correctness
- `npm run test:backend` passes with >= 80% branch coverage.
- `npm run test:frontend` succeeds without warnings.
- Visual screenshot verification matches design spec token values.
```

#### Parallel Sessions & Subagents
- **Parallel Worktrees:** Run multiple independent tasks in isolated Git worktrees (`git worktree add ../feature-branch feature-branch`). Never allow two parallel agent sessions to modify the same working directory.
- **Specialized Subagents:**
  - *Codebase Researcher:* Read-only exploration of dependencies and past commits without polluting the primary context window.
  - *Verifier Agent:* Fresh context agent running after build to verify against `plan.md` and report discrepancies without bias.
  - *Code Simplifier:* Post-build agent that cleans up dead code, redundant comments, and unnecessary abstractions.

#### Metrics
- **Leading Indicator:** First-pass implementation success rate (PRs merged without requiring plan overhaul).
- **Lagging Indicator:** Diff drift (discrepancy between committed `plan.md` and final merged diff).

---

### Stage 4 — Test: Local Feedback Loops & Continuous Evals

#### Play 1: The Local Verification Feedback Loop
Never leave test verification to CI or human reviewers. Give the agent an immediate, quantifiable, local feedback mechanism.

1. **Unified Single-Command Targets:** Standardize checks into exit-code-driven scripts (e.g. `npm run test:backend`, `make test`).
2. **Quantified Goals:** Direct the agent to explicit targets:
   - ❌ *"Make sure the tests look good."*
   - ✅ *"Run `npm run test:backend` and ensure all 42 tests in `test_dividend.py` pass with 0 errors and >= 85% coverage."*
3. **Test-Driven Fixes (TDD for Bug Fixes):**
   - Step 1: Write a minimal reproduction test that demonstrates the bug.
   - Step 2: Run the test and verify it fails with the expected assertion failure.
   - Step 3: Commit the failing test.
   - Step 4: Instruct the agent to make the test pass **without modifying the test file**.
   - *Governance Hook:* Use a pre-tool hook to forbid modifying test files during fix tasks.

#### Play 2: Continuous Agent Evals in CI
Code has regression tests; agent configurations (`CLAUDE.md`, skills, system prompts, hooks) require **Agent Evals**.

- **Eval Dataset:** Maintain 20–50 real-world historical engineering tasks with known good solutions in `evals/*.json`.
- **CI Trigger:** Run headless eval benchmarks whenever `CLAUDE.md`, `.agent/skills/`, or `.claude/` files are modified.
- **Incident Learning:** Every production incident or escaped bug must yield a new automated eval added to the regression suite.

#### Canonical CI Eval Workflow (`.github/workflows/agent-evals.yml`)
```yaml
name: Agent Evals Regression Suite
on:
  pull_request:
    paths:
      - 'CLAUDE.md'
      - '.agent/skills/**'
      - '.claude/**'
  schedule:
    - cron: '0 3 * * *' # Nightly run

jobs:
  run-evals:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run Evals Harness
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
        run: |
          python scripts/run_agent_evals.py --suite evals/core-suite.json --threshold 0.95
```

---

### Stage 5 — Deploy: Bidirectional PR Review & Approval Gates

#### Play 1: Bidirectional PR Review (`REVIEW.md`)
In an AI-native team, the agent both gives reviews on human/agent PRs and receives review comments to autonomously fix issues.

1. **Structured Review Protocol (`REVIEW.md`):** Divide review passes into distinct categories:
   - **Pass 1: Logic & Correctness:** Subtle edge cases, race conditions, null pointer risks, off-by-one errors.
   - **Pass 2: Security & Privacy:** Injection vulnerabilities, unescaped queries, auth bypass, PII in logs/transcripts.
   - **Pass 3: Spec & Plan Compliance:** Does the diff implement what was promised in `spec.md` and `plan.md`? Are there undeclared file changes?
2. **Severity Hierarchy:**
   - **Critical / Important:** Violates security policy, breaks backward compatibility, causes data loss. Blocks merge.
   - **Nit:** Formatting, style, cosmetic naming. Cap nits at maximum 5 per review; do not spam diffs.
3. **Autonomous Self-Healing:** Authors tag `@agent` or run a sweep command on PR review comments. The agent reads the comment, updates the code, runs the local test loop, and pushes the fix.

#### Play 2: Separation of Duties & Release Gates
- **The Agent Cannot Approve Its Own Work:** Branch protection must require an authorized human code owner sign-off.
- **Hooks as Approval Gates:** Actions with high blast radius (deploying to production, running database migrations, modifying IAM roles) must trigger deterministic pre-execution hooks that halt until authorized.

#### Canonical Release Gate Hook (`.claude/hooks/production-gate.sh`)
```bash
#!/bin/bash
# PreToolUse hook for command executions
cmd=$(jq -r '.tool_input.command' < /dev/stdin)

if [[ "$cmd" =~ (deploy:production|kubectl.*apply.*prod|terraform.*apply) ]]; then
  if [ -z "$RELEASE_APPROVAL_TOKEN" ]; then
    echo "ERROR: Production deployment blocked. A valid RELEASE_APPROVAL_TOKEN must be supplied." >&2
    exit 2 # Exit code 2 blocks the tool call and returns the stderr to the agent
  fi
fi
exit 0
```

---

### Stage 6 — Maintain: Closing the Loop (Autonomous Maintenance)

The ultimate maturity stage of the AI-native SDLC is **closing the loop**: shifting maintenance from a reactive human-on-call model to an autonomous event-driven lifecycle.

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                         AUTONOMOUS CLOSED-LOOP SYSTEM                            │
└──────────────────────────────────────────────────────────────────────────────────┘
   Production Telemetry / CI Metric
                 │
                 ▼
     [Deterministic Monitor] ── (Western Electric Control Bands)
                 │
      ┌──────────┴──────────┐
      │ 1σ: Log only        │
      │ 2σ: Diagnose        ▼
      │ 3σ: Propose ──▶ [Headless Agent]
      └─────────────────────┬───────────────────────────┐
                            ▼                           ▼
                     Small / Known Fix          Architectural / Broad
                            │                           │
                            ▼                           ▼
                    Autonomous Pull Request        File intent.md
                    (Runs Stage 4 & 5 gates)     (Enters Stage 1 Loop)
```

#### Play 1: Statistical Control Bands (`bands.yaml`)
Avoid noisy threshold alerts. Use statistical process control (rolling mean $\mu$ and standard deviation $\sigma$ over rolling windows):
- **Tier 1 ($1\sigma$ deviation):** Informational log entry. No action.
- **Tier 2 ($2\sigma$ deviation):** Trigger headless agent in read-only diagnostic mode (`tools: Read, Grep, LogFetch`). Agent writes a diagnostic summary report.
- **Tier 3 ($3\sigma$ deviation):** Agent authorized to act under strict boundaries:
  - Open a quarantine PR for flaky tests or revert PR.
  - Or trigger an approved, pre-rehearsed rollback pipeline.
  - Or generate an `intent.md` in the triage queue for human engineering sign-off.

#### Play 2: Scheduled Codebase Scans & On-Call First Responders
- **Scheduled Deep Scans:** Weekly headless runs scanning the entire repo for newly disclosed CVEs, outdated patterns, and security flaws using the most capable model. Validated findings produce pull requests with accompanying eval tests.
- **Agent On-Call (Claude Tag / Chat Integrations):** Agent acts as the first responder in incident channels:
  - Fetches logs and reproduces stack traces via MCP.
  - Proposes immediate hypotheses and mitigation steps.
  - Generates the post-mortem record into `docs/incidents/` upon resolution.
  - Generates a regression eval test so the issue never reoccurs.

---

## 4. Governance, Safety & Enterprise Configuration

To deploy agentic workflows safely at enterprise scale, implement the **Defense-in-Depth Control Stack**:

```
┌──────────────────────────────────────────────────────────────┐
│ 1. ADVISORY CONTROLS (Skills & CLAUDE.md)                    │
│    • Informs agent of conventions, standards, and rules      │
├──────────────────────────────────────────────────────────────┤
│ 2. DETERMINISTIC CONTROLS (PreToolUse & PostToolUse Hooks)   │
│    • Blocks actions, denies sensitive paths, formats diffs   │
├──────────────────────────────────────────────────────────────┤
│ 3. ENVIRONMENT & SANDBOX ISOLATION                           │
│    • OS-level microVM/container; network domain allowlists    │
├──────────────────────────────────────────────────────────────┤
│ 4. ACCESS CONTROL & SECRETS PRIVILEGE MINIMIZATION           │
│    • Strips credentials (~/.ssh, .env); ephemeral tokens     │
├──────────────────────────────────────────────────────────────┤
│ 5. REPOSITORY GATES (Branch Protection & DORA Audit)         │
│    • Human code-owner approvals; immutable git audit trail   │
└──────────────────────────────────────────────────────────────┘
```

### Managed Enterprise Settings (`settings.json`)
```json
{
  "permissions": {
    "deny": [
      "Read(.env*)",
      "Read(./secrets/**)",
      "Read(~/.ssh/**)",
      "Read(~/.aws/**)",
      "WebFetch",
      "Bash(curl *)",
      "Bash(wget *)"
    ],
    "allow": [
      "Bash(git status)",
      "Bash(git diff *)",
      "Bash(npm run test*)",
      "Bash(npm run lint*)",
      "Bash(make test)"
    ],
    "disableBypassPermissionsMode": "disable"
  },
  "allowManagedPermissionRulesOnly": true,
  "sandbox": {
    "enabled": true,
    "failIfUnavailable": true,
    "allowUnsandboxedCommands": false,
    "network": {
      "allowedDomains": [
        "github.com",
        "registry.npmjs.org",
        "pypi.org"
      ]
    }
  },
  "allowManagedHooksOnly": true,
  "requiredMinimumVersion": "2.1.193"
}
```

---

## 5. Summary Operational Checklist

| Stage | Activity | Done When |
| :--- | :--- | :--- |
| **Plan** | Author `intent.md` | PO approves and merges `intent.md` with zero unresolved core scope questions. |
| **Design** | Generate `spec.md` | All security and policy conflicts flagged, reviewed, and resolved. |
| **Build** | Plan Mode (`plan.md`) | `plan.md` committed with file list, sequence, risks, and proof steps. |
| **Build** | Implementation | Code and tests written; zero unapproved deviations from `plan.md`. |
| **Test** | Local Feedback Loop | Local test suite exits `0` with clean lint; bug reproduction test passes. |
| **Test** | Continuous Evals | All CI eval test suites pass without score degradation. |
| **Deploy** | Dual PR Review | Agent runs logic, security, and compliance passes against `REVIEW.md`. |
| **Deploy** | Human Approval Gate | Branch protection signed by human code owner; release gate passes. |
| **Maintain** | Anomaly Detection | Monitor `bands.yaml` triggers; incidents produce regression evals. |

---

## 6. Directory References & Supporting Assets

- Canonical Templates: [artifact-chain-and-templates.md](file:///c:/dev/SGSK-Wealth/.agent/skills/ai-native-sdlc/references/artifact-chain-and-templates.md)
- Governance, Hooks & Security: [governance-hooks-and-security.md](file:///c:/dev/SGSK-Wealth/.agent/skills/ai-native-sdlc/references/governance-hooks-and-security.md)
- Closed-Loop & Continuous Evals: [closed-loop-and-continuous-evals.md](file:///c:/dev/SGSK-Wealth/.agent/skills/ai-native-sdlc/references/closed-loop-and-continuous-evals.md)
- End-to-End Worked Example: [full-lifecycle-walkthrough.md](file:///c:/dev/SGSK-Wealth/.agent/skills/ai-native-sdlc/examples/full-lifecycle-walkthrough.md)
- Artifact Linter Script: [validate_sdlc_artifacts.py](file:///c:/dev/SGSK-Wealth/.agent/skills/ai-native-sdlc/scripts/validate_sdlc_artifacts.py)
