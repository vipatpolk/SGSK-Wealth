# Closed-Loop Operations and Continuous Agent Evals

The terminal stage of an AI-Native SDLC is closing the loop between production telemetry, regression evaluation, and autonomous intent generation.

---

## 1. The Autonomous Closed-Loop Architecture

Traditional operations are reactive: an alarm triggers, pages an engineer at 3 AM, and the investigation, fix, and post-mortem take days or weeks.

In an AI-native organization, deterministic monitoring continuously assesses production health against statistical baselines. When a metric breaches a control band, a headless agent is automatically spun up to diagnose, remediate, or draft an `intent.md`.

```
┌────────────────────────────────────────────────────────────────────────┐
│                   CLOSED-LOOP MAINTENANCE WORKFLOW                     │
└────────────────────────────────────────────────────────────────────────┘
                    [Production Telemetry / Logs]
                                  │
                                  ▼
                [Deterministic SPC Detection Script]
                     (Western Electric Rules)
                                  │
         ┌────────────────────────┼────────────────────────┐
         ▼                        ▼                        ▼
     1σ Drift                 2σ Anomaly               3σ Breach
    (Log Only)           (Headless Diagnosis)      (Remediation Tier)
                                  │                        │
                                  ▼                        ▼
                        [Diagnostic Report]        Is blast radius
                        Generated in PR / Docs       bounded & safe?
                                                           │
                                             ┌─────────────┴─────────────┐
                                             ▼                           ▼
                                           [YES]                       [NO]
                                             │                           │
                                             ▼                           ▼
                                     [Autonomous PR /            [Generate intent.md]
                                     Rollback Runbook]           Triage Queue for PO
```

---

## 2. Statistical Process Control (SPC) with Western Electric Rules

Do not rely on brittle static thresholds (e.g. `latency > 500ms`). Static thresholds generate high false-positive rates during peak hours and miss subtle degradations during low-traffic windows.

Use rolling statistics over a 14-day or 30-day baseline:
- Mean: $\mu = \frac{1}{N}\sum x_i$
- Standard Deviation: $\sigma = \sqrt{\frac{1}{N}\sum (x_i - \mu)^2}$

### Western Electric Control Rules
1. **Rule 1 (Gross Breach):** Any single data point falls outside $3\sigma$.
2. **Rule 2 (Zone A Drift):** 2 out of 3 consecutive points fall beyond $2\sigma$ on the same side of the mean.
3. **Rule 3 (Zone B Trend):** 4 out of 5 consecutive points fall beyond $1\sigma$ on the same side of the mean.
4. **Rule 4 (Systematic Shift):** 8 consecutive points fall on the same side of the mean.

### Automated Response Actions
| Signal | Action | Agent Tooling Allowed | Human Role |
| :--- | :--- | :--- | :--- |
| **$1\sigma$ Trend** | Telemetry logging | None | None |
| **$2\sigma$ Anomaly** | Headless Diagnosis | `Read`, `Grep`, `LogFetch` | Triage diagnostic summary |
| **$3\sigma$ Bounded** | Autonomous PR / Rollback | `Git(create-branch)`, `Edit`, `Bash(make test)` | Approves PR or release |
| **$3\sigma$ Complex** | Generate `intent.md` | `Write(intent/*.md)` | PO accepts into Stage 2 Design |

---

## 3. Continuous Agent Evaluations (Evals) in CI

### What is an Agent Eval?
Software changes are tested with unit/integration tests; agent configuration changes (`CLAUDE.md`, system prompts, skills, hooks) are tested with **Agent Evals**.

An eval is an automated task runner that invokes the agent in a clean environment with a specific prompt, provides reference files, and grades the agent's output against deterministic assertions and LLM-as-a-judge rubrics.

### Anatomy of an Eval Test Case (`evals/task-dividend-t2.json`)
```json
{
  "id": "EVAL-SEC-01",
  "name": "Thailand SET T+2 Dividend Calculation Compliance",
  "description": "Verifies agent correctly accounts for SET T+2 settlement and Thai 10% withholding tax",
  "prompt": "Calculate the net dividend payout for 10,000 shares of PTT.BK with DPS of 2.00 THB and record date 2026-11-20.",
  "required_skills": ["dividend-payments"],
  "allowed_tools": ["Bash", "Read"],
  "checks": [
    {
      "type": "command_exit_code",
      "command": "python -m pytest backend/tests/test_dividend_service.py",
      "expected": 0
    },
    {
      "type": "regex_match",
      "pattern": "Gross:\\s*20,000(\\.00)?\\s*THB",
      "target": "output"
    },
    {
      "type": "regex_match",
      "pattern": "Withholding\\s*\\(10%\\):\\s*2,000(\\.00)?\\s*THB",
      "target": "output"
    },
    {
      "type": "regex_match",
      "pattern": "Net:\\s*18,000(\\.00)?\\s*THB",
      "target": "output"
    }
  ]
}
```

### The Golden Rule of Post-Mortems: Incident $\rightarrow$ Eval
Whenever a bug or vulnerability escapes to production or is caught during security review:
1. Conduct the incident root-cause analysis.
2. Fix the immediate issue in code.
3. **Commit a new permanent eval file in `evals/` replicating the failure mode.**
4. From that day onward, every future prompt, skill update, or agent model upgrade is regression-tested against that exact failure mode.
