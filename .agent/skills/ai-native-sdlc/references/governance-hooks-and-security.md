# Governance, Hooks, and Enterprise Security in the AI-Native SDLC

When AI agents author a substantial portion of code, traditional perimeter security and human manual oversight are insufficient. Security must be architectural, deterministic, and layered.

---

## 1. The Two-Layer Control Paradigm

Enterprise governance in an AI-native engineering environment operates on two distinct layers:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        TWO-LAYER CONTROL MODEL                         │
├───────────────────────────────────┬────────────────────────────────────┤
│ 1. ADVISORY CONTROLS (Soft)       │ 2. DETERMINISTIC CONTROLS (Hard)   │
├───────────────────────────────────┼────────────────────────────────────┤
│ • Skills (SKILL.md)               │ • Tool Hooks (Pre/Post Tool Use)   │
│ • Project Instructions (CLAUDE.md)│ • OS-Level Sandbox / MicroVM       │
│ • Prompts & Personas              │ • Network Egress Whitelists        │
│ • System Guidelines               │ • Protected File Permissions       │
│                                   │ • Branch Protection & CI Gates     │
│ ───────────────────────────────── │ ────────────────────────────────── │
│ *Goal: Makes violations rare*     │ *Goal: Makes violations impossible*│
└───────────────────────────────────┴────────────────────────────────────┘
```

A policy that must hold without exception (such as secrets protection or production deployment gates) must never rely solely on an advisory prompt. It requires a deterministic hook or sandbox restriction behind it.

---

## 2. Deterministic Hooks Architecture

Hooks execute before (`PreToolUse`) or after (`PostToolUse`) an agent tool call. They have three potential outcomes:
1. **Allow (Exit 0):** The tool call proceeds normally.
2. **Block (Exit 2):** The tool call is immediately aborted. Stderr is returned to the agent context as a feedback signal explaining why the action was rejected.
3. **Ask / Gate:** Execution pauses and requests human authorization before proceeding.

### Hook 1: Protecting Test Files During Bug Fixes (`prevent-test-weakening.sh`)
When an agent is instructed to fix a failing test, it may attempt to pass the check by simply deleting or modifying assertions. This hook blocks edits to test files during bug fix workflows.

```bash
#!/usr/bin/env bash
# .claude/hooks/prevent-test-weakening.sh
# Reads tool input JSON from stdin
input=$(cat)
file_path=$(echo "$input" | jq -r '.tool_input.path // empty')

# Check if current git branch or workflow is a bugfix
current_branch=$(git rev-parse --abbrev-ref HEAD)

if [[ "$current_branch" =~ ^(fix|bugfix)/ ]]; then
  if [[ "$file_path" =~ (test_|_test\.py|\.spec\.ts|\.feature$) ]]; then
    # Allow if the file is new (untracked), but block if modifying existing
    if git ls-files --error-unmatch "$file_path" >/dev/null 2>&1; then
      echo "GOVERNANCE VIOLATION: Modifying existing test files during a bug fix is prohibited." >&2
      echo "You must fix the production code under test, not the test itself." >&2
      exit 2
    fi
  fi
fi
exit 0
```

### Hook 2: Pre-Commit Lint & Auto-Format Hook (`auto-format.sh`)
Runs immediately after any file edit (`PostToolUse`) to ensure drift and style inconsistencies never enter the branch:

```bash
#!/usr/bin/env bash
# .claude/hooks/post-edit-format.sh
input=$(cat)
file_path=$(echo "$input" | jq -r '.tool_input.path // empty')

if [[ "$file_path" =~ \.py$ ]]; then
  ruff format "$file_path" >/dev/null 2>&1
  ruff check --fix "$file_path" >/dev/null 2>&1
elif [[ "$file_path" =~ \.(ts|js|html|css|json)$ ]]; then
  npx prettier --write "$file_path" >/dev/null 2>&1
fi
exit 0
```

### Hook 3: Production Release Approval Gate (`production-gate.sh`)
```bash
#!/usr/bin/env bash
# .claude/hooks/production-gate.sh
input=$(cat)
command=$(echo "$input" | jq -r '.tool_input.command // empty')

if [[ "$command" =~ (deploy|release|kubectl.*prod) ]]; then
  if [[ -z "$RELEASE_OFFICER_SIGNATURE" ]]; then
    echo "RELEASE GATE BLOCKED: Production mutations require human release officer signature." >&2
    echo "Action logged to OpenTelemetry compliance audit stream." >&2
    exit 2
  fi
fi
exit 0
```

---

## 3. Sandboxing & Network Isolation

### The Sandbox Boundary
Tools running in an agent session (bash, python, node) must be constrained by OS-level sandbox isolation (e.g. Docker, Firecracker microVM, or macOS/Linux seccomp/seatbelt).

### Rules for Secure Sandboxes:
1. **Network Egress Whitelist:** Deny unrestricted internet access. Whitelist only verified package registries and internal git remotes (e.g. `github.com`, `registry.npmjs.org`, `pypi.org`).
2. **Credential Stripping:** Never mount user credential directories (`~/.ssh`, `~/.aws`, `~/.kube`, `~/.gnupg`) into the agent's runtime container.
3. **Environment Sanitization:** Strip environment variables containing production secrets (`PROD_DB_PASSWORD`, `STRIPE_SECRET_KEY`) before spawning agent processes.
4. **No-Bypass Policy:** Set `"disableBypassPermissionsMode": "disable"` and `"failIfUnavailable": true` so an agent cannot disable the sandbox or fall back to an uncontained host shell.

---

## 4. Separation of Duties & Immutable Git Audit Trail

### Separation of Duties
1. **Author $\neq$ Approver:** The AI agent that authors code or opens a PR has zero technical permission to approve or merge that PR.
2. **Branch Protection:** Require at least one human Code Owner review and all green status checks (`npm run check`, eval suites).
3. **Attribution:** Non-interactive CI agents must commit using dedicated service identities (e.g., `git config user.name "AI-Native SDLC Worker"` and dedicated service account tokens).

### Audit Trail Construction
Every change must be traceable through git history:
```
Commit 1: intent: claims status self-service (Author: J. Ortiz [PO])
Commit 2: spec: claims status API & UI contract (Author: Architect + AI)
Commit 3: plan: step-by-step implementation plan (Author: Lead Dev + AI)
Commit 4: test: failing reproduction test for state transitions (Author: Lead Dev)
Commit 5: feat: implementation of status service and panel (Author: AI Agent)
Commit 6: review: address review findings from REVIEW.md pass (Author: AI Agent)
Commit 7: Merge PR #104 (Approved By: Human Code Owner)
```
Any auditor or regulator can inspect the commit log to see the rationale, constraints, plan, proof, and approvals.
