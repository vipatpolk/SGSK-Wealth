---
name: cucumber-bdd-best-practices
description: >-
  Authoritative engineering guide and operational standards for Behavior-Driven Development (BDD), Gherkin specification authoring, and Cucumber test automation. Covers the full BDD lifecycle (Discovery, Formulation, Automation), declarative vs. imperative Gherkin, scenario independence, step definition reusability, Data Tables, Scenario Outlines, Background vs. Hooks, multi-dimensional tagging taxonomy, Page Object Model integration (Playwright / REST Assured), flaky test mitigation, and automated Gherkin linting.
---

# Cucumber & BDD Best Practices: Enterprise Engineering Guide

This skill provides comprehensive operational instructions, Gherkin syntax rules, architectural guidelines, and linting tools for implementing Behavior-Driven Development (BDD) and Cucumber automation suites. It synthesizes standards from the official Cucumber documentation, enterprise QA methodologies, and modern end-to-end test architectures.

---

## 1. Quick Reference: The Core BDD Triad

BDD is a collaborative software development process that bridges the gap between business stakeholders, developers, and quality assurance engineers through continuous communication centered around concrete real-world examples.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        THE THREE BDD PRACTICES                         │
├─────────────────────┬──────────────────────────┬───────────────────────┤
│ 1. DISCOVERY        │ 2. FORMULATION           │ 3. AUTOMATION         │
│ "What it COULD do"  │ "What it SHOULD do"      │ "What it ACTUALLY does"│
├─────────────────────┼──────────────────────────┼───────────────────────┤
│ • Three Amigos      │ • Ubiquitous language    │ • Executable specs    │
│   (PO + Dev + QA)   │ • Gherkin syntax         │ • Step definitions    │
│ • Example Mapping   │ • Given / When / Then    │ • Guide-rails for TDD │
│ • Concrete scenarios│ • Living documentation   │ • Automated regression│
│ • Uncover edge cases│ • Business-readable      │ • Continuous feedback │
└─────────────────────┴──────────────────────────┴───────────────────────┘
```

---

## 2. The 10 Gold Rules of Gherkin Authoring

### Rule 1: Declarative over Imperative (Behavior over Button Clicks)
- **Do:** Express the *business intent* and *user goal* ("What" happens and "Why").
- **Don't:** Script UI mechanics, field clicks, keystrokes, or HTML selectors ("How" it happens).

| ❌ Anti-Pattern (Imperative / Brittle) | ✅ Recommended (Declarative / Resilient) |
| :--- | :--- |
| `Given I open browser at "http://localhost:4200"`<br>`And I type "admin" into input "#txtUser"`<br>`And I type "secret" into input "#txtPass"`<br>`And I click button with id "#btnSubmit"`<br>`Then I should see element ".dashboard-header"` | `Given I am logged in as an authenticated investor`<br>`When I view the portfolio dashboard`<br>`Then my asset allocation and holdings should be displayed` |

### Rule 2: Strict Atomicity & Scenario Independence
- Every scenario must be completely **self-contained**.
- **Zero test order dependency:** Scenarios must pass regardless of execution order and must be safe to run in parallel threads.
- Never rely on data or state created by a preceding scenario.

### Rule 3: Single Business Rule per Scenario
- Each scenario should test **one behavior or business requirement**.
- If a scenario requires more than 3-5 `When` or `Then` statements, it is testing multiple concepts and must be split.

### Rule 4: Descriptive, Value-Driven Scenario Titles
- Format scenario titles to communicate the business rule and condition:
  - `Scenario: [TC-ID]: [User capability or business rule] when [context/condition]`
  - Example: `Scenario: TC-DIV-03: Switching asset type filters YOC KPI card accurately without currency distortion`

### Rule 5: Keep Background Minimal and Universal
- `Background` runs before **every single scenario** in that feature file.
- **Strict criteria:** Put a step in `Background` *only* if it applies to 100% of the scenarios in the file.
- Keep background to 1-3 steps maximum.
- Do **not** use `Background` to set up deep scenario-specific data state.

### Rule 6: Avoid Conjunctive Steps (One Action per Step)
- Do not combine two distinct actions in one step using "and" inside the sentence:
  - ❌ `When I enter valid credentials and click submit`
  - ✅ `When I enter valid credentials`<br>`And I submit the login form`
- Splitting actions keeps step definitions modular, composable, and reusable across tests.

### Rule 7: Reusable, Parameterized Step Definitions
- Write steps with parameters (`{string}`, `{int}`, Cucumber expressions) rather than hardcoded domain entities.
- Maintain a consistent vocabulary and exact grammatical casing across the test suite:
  - Inconsistent casing (e.g., `When I click "Submit"` vs `When I click on "submit"`) leads to duplicate step definitions.
- Step definitions must **never** end with trailing punctuation marks (no periods `.` or commas `,`).

### Rule 8: Use Data Tables vs. Scenario Outlines Correctly
- **Data Table (Step-Level):** Use when a *single step* requires structured or tabular data (e.g., table assertions, query parameters, matrix payloads).
- **Scenario Outline + Examples (Scenario-Level):** Use when the *entire scenario workflow* is parameterized and evaluated against multiple combinations of inputs and expected outcomes.

### Rule 9: Maintain Domain Ubiquitous Language (No Technical Leaks)
- Business scenarios should not mention HTTP methods (`GET`, `POST`), status codes (`200 OK`, `500 Internal Error`), SQL queries, CSS classes, or internal identifiers.
- *Exception:* Dedicated lower-level API contract feature files (e.g., `01_auth_api.feature`) may explicitly verify status codes and HTTP headers when documenting developer-facing API contracts.

### Rule 10: Consistency in Perspective (First-Person vs. Third-Person)
- Pick one grammatical perspective for your project and maintain strict consistency:
  - **First-Person ("I"):** Natural for user-facing flows (`Given I open...`, `When I filter...`, `Then I should see...`). Standard across SGSK-Wealth UI tests.
  - **Third-Person ("The user"):** Objective tone (`Given the user navigates...`, `When the user submits...`).
- Never mix both perspectives in the same test suite or feature file.

---

## 3. Decision Matrices

### Matrix A: Background vs. `@Before` Hook vs. Scenario Step

| Need | Recommended Location | Rationale |
| :--- | :--- | :--- |
| **Browser initialization, Playwright context, viewport setup** | `@Before` Hook | Purely technical lifecycle; irrelevant to business readers of `.feature` files. |
| **Mock server route reset, WireMock stubs, DB transaction rollback** | `@Before` / `@After` Hook | Test harness plumbing; should remain completely invisible in Gherkin. |
| **Navigating to the base view or authenticating the session** | `Background` (if 100% of scenarios need it) | Establishes the shared business context for human readers. |
| **Specific portfolio balance, custom stock lots, distinct user roles** | Scenario `Given` Step | Specific to the individual scenario's test conditions. |

### Matrix B: Data Table vs. Scenario Outline

```
Do you want to run the ENTIRE scenario multiple times with different values?
       │
       ├─► YES ──► Use SCENARIO OUTLINE + EXAMPLES table
       │           (Parameterized scenario runs N times)
       │
       └─► NO  ──► Do you need to pass a structured list or key-value map to ONE step?
                     │
                     ├─► YES ──► Use DATA TABLE on that specific step
                     │
                     └─► NO  ──► Use inline step parameters: "AAPL", 150
```

---

## 4. Multi-Dimensional Tagging Taxonomy

Standardize tags across features and scenarios to control execution in Maven / CI/CD pipelines:

```gherkin
@ui @dividend @regression
Feature: Dividend Analytics & Yield on Cost (YOC)

  @smoke @TC-DIV-01
  Scenario: TC-DIV-01: Displays summary KPI cards including Yield on Cost
    ...

  @slow @wip
  Scenario: TC-DIV-04: Deep historical timeline reconstruction
    ...
```

### Tag Classification Scheme:

| Tag Category | Standard Prefixes / Tags | Purpose |
| :--- | :--- | :--- |
| **Layer** | `@ui`, `@api`, `@database` | Classifies the system boundary under test. |
| **Execution Tier** | `@smoke`, `@sanity`, `@regression` | Filters pipelines (Fast PR checks vs. Nightly regression). |
| **Feature / Module** | `@auth`, `@portfolio`, `@dividend`, `@holdings`, `@tools` | Slices tests by business domain. |
| **Lifecycle / State** | `@ready`, `@wip`, `@quarantine`, `@flaky` | Excludes broken or incomplete tests without deleting code. |
| **Performance** | `@fast`, `@slow` | Directs high-latency tests to dedicated parallel agents. |
| **Traceability** | `@TC-xxx`, `@JIRA-xxx` | Provides bidirectional mapping to user stories & issue trackers. |

---

## 5. Architectural Standards: 4-Layer Test Suite

To keep Cucumber suites clean, maintainable, and free of flaky failures, enforce a strict four-layer separation of concerns:

```
┌─────────────────────────────────────────────────────────────┐
│ Layer 1: Feature Files (.feature)                           │
│ • Pure Gherkin (Given, When, Then, And, But)               │
│ • Ubiquitous business domain language                       │
│ • Zero code, zero UI selectors, zero assertions logic       │
└──────────────────────────────┬──────────────────────────────┘
                               │ delegates to
┌──────────────────────────────▼──────────────────────────────┐
│ Layer 2: Step Definitions (*Steps.java)                     │
│ • Cucumber annotations (@Given, @When, @Then)               │
│ • Translates Gherkin parameters to strongly-typed calls    │
│ • Coordinates Page Objects and asserts domain outcomes      │
└──────────────────────────────┬──────────────────────────────┘
                               │ delegates to
┌──────────────────────────────▼──────────────────────────────┐
│ Layer 3: Automation Models (Page Objects / API Clients)     │
│ • Playwright Page classes / REST Assured request specs      │
│ • Locators, web interactions, wait strategies, API payloads │
│ • Contains NO Cucumber annotations                         │
└──────────────────────────────┬──────────────────────────────┘
                               │ shares state via
┌──────────────────────────────▼──────────────────────────────┐
│ Layer 4: Test Context & Fixture Lifecycle                   │
│ • TestContext (Spring Boot @ScenarioScope DI)               │
│ • TestHooks (@Before, @After, screenshot on failure)        │
│ • Spring singletons (PlaywrightManager, ServerManager, etc.)│
└─────────────────────────────────────────────────────────────┘
```

---

## 6. Gherkin Anti-Patterns & Refactoring Catalog

| Anti-Pattern | Symptom | Remediation |
| :--- | :--- | :--- |
| **The Click-Fest** | 10+ imperative steps clicking links, typing into fields, clicking checkboxes. | Consolidate into declarative intent: `When I complete the checkout with credit card`. |
| **Bloated Background** | 10 setup steps in `Background`, many not needed by every scenario. | Move scenario-specific setups into individual `Given` steps; keep Background $\le 3$ steps. |
| **The Dependent Chain** | Scenario B fails if Scenario A is skipped or fails. | Provide independent test data setups in Scenario B's `Given` step or API fixture. |
| **Leaky Locators** | XPath or CSS selectors written directly in Gherkin steps. | Encapsulate locators entirely inside Page Object classes; reference conceptual UI names. |
| **Conjunction Abuse** | Step says `When I log in and filter by Thai Stocks`. | Split into: `When I log in`<br>`And I filter by "Thai Stocks"`. |
| **Ghost Scenarios** | Scenarios with vague titles like `Scenario: Test 1` or `Scenario: Check button`. | Rename to express the business assertion: `Scenario: Reject withdrawal when balance is insufficient`. |
| **Punctuation Pollution** | Step definition pattern ends with period: `Given I log in.` | Remove trailing punctuation from both feature files and step annotations. |

---

## 7. Automated Gherkin Linting Tool

This skill includes an automated Python linter script located at:
`scripts/validate_gherkin.py`

### Usage:
Run from the repository root:
```bash
# Validate all feature files in e2e suite
py .agent/skills/cucumber-bdd-best-practices/scripts/validate_gherkin.py e2e/src/test/resources/features

# Validate a specific feature file
py .agent/skills/cucumber-bdd-best-practices/scripts/validate_gherkin.py e2e/src/test/resources/features/ui/09_dividend_analytics.feature
```

### Checks Performed by the Linter:
1. **Imperative UI Anti-Patterns:** Flags steps containing mechanical verbs (`click on button`, `type into input`, `select checkbox`, etc.).
2. **Conjunctive Steps:** Detects composite steps joining multiple actions with ` and ` or ` then `.
3. **Trailing Punctuation:** Checks for trailing periods or commas on steps.
4. **Empty or Vague Scenario Titles:** Flags unnamed scenarios or generic placeholders (`Test 1`).
5. **Background Bloat:** Warns when `Background` exceeds 4 steps or contains action/assertion steps (`When`/`Then`).
6. **Tagging Compliance:** Verifies that features have layer tags (`@ui`, `@api`) and scenarios have identifiers.
7. **Consistent Step Structure:** Ensures proper `Given` $\rightarrow$ `When` $\rightarrow$ `Then` progression.

---

## 8. Detailed Reference & Examples Navigation

- **Detailed BDD Lifecycle & 3 Amigos:** Read [`references/bdd-lifecycle-discovery-formulation.md`](file:///c:/dev/SGSK-Wealth/.agent/skills/cucumber-bdd-best-practices/references/bdd-lifecycle-discovery-formulation.md)
- **Comprehensive Anti-Patterns Guide:** Read [`references/gherkin-anti-patterns-guide.md`](file:///c:/dev/SGSK-Wealth/.agent/skills/cucumber-bdd-best-practices/references/gherkin-anti-patterns-guide.md)
- **Tagging Taxonomy & CI Strategy:** Read [`references/tagging-and-ci-execution.md`](file:///c:/dev/SGSK-Wealth/.agent/skills/cucumber-bdd-best-practices/references/tagging-and-ci-execution.md)
- **Good vs. Bad Real-World Examples:** Read [`examples/declarative-vs-imperative-examples.md`](file:///c:/dev/SGSK-Wealth/.agent/skills/cucumber-bdd-best-practices/examples/declarative-vs-imperative-examples.md)
- **Playwright & REST Assured Architecture:** Read [`examples/framework-integration-patterns.md`](file:///c:/dev/SGSK-Wealth/.agent/skills/cucumber-bdd-best-practices/examples/framework-integration-patterns.md)
