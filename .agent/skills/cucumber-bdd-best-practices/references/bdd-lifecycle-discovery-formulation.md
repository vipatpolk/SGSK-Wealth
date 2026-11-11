# BDD Lifecycle: Discovery, Formulation, and Automation

This reference provides in-depth guidance on how Behavior-Driven Development functions across the software development lifecycle, synthesizing core principles from the official Cucumber documentation and enterprise agile testing practices.

---

## 1. The Three Essential BDD Practices

BDD is not merely a testing framework; it is an iterative collaborative methodology divided into three distinct phases:

```
                  ┌────────────────────────┐
                  │ 1. DISCOVERY WORKSHOP  │
                  │   ("What it could do") │
                  └───────────┬────────────┘
                              │ Concrete Examples & Rules
                              ▼
                  ┌────────────────────────┐
                  │ 2. FORMULATION (Gherkin│
                  │   ("What it should do")│
                  └───────────┬────────────┘
                              │ Executable Specification
                              ▼
                  ┌────────────────────────┐
                  │ 3. AUTOMATION (Cucumber│
                  │   ("What it does")     │
                  └────────────────────────┘
```

### Phase 1: Discovery ("What it could do")
The hardest part of software engineering is determining precisely *what* to build. In the Discovery phase, teams align on user requirements before code is written.

- **The "Three Amigos" Collaboration:**
  - **Product Owner / Business Analyst:** Brings the business goal, user motivation, and business rules ("Why" and "What").
  - **Developer:** Brings architectural feasibility, boundary constraints, and implementation options ("How").
  - **Quality Assurance Engineer:** Brings edge cases, error conditions, boundary data, and testability perspective ("What if?").
- **Example Mapping Technique:**
  - A 20-30 minute structured session using 4 color-coded index cards or digital sticky notes:
    - **Yellow (Story):** The user story being broken down.
    - **Blue (Rules):** The business rules and acceptance criteria governing the story.
    - **Green (Examples):** Concrete, real-world examples illustrating each rule.
    - **Red (Questions):** Unresolved questions, assumptions, or missing information requiring business input.
  - *Rule of thumb:* If a rule generates too many red cards, the story is not ready for sprint commitment. If it generates too many green cards, the story is too large and should be sliced into smaller increments.

### Phase 2: Formulation ("What it should do")
Once examples are agreed upon, they are structured into executable specifications using **Gherkin**.

- **Ubiquitous Language:**
  - Formulations must employ the exact problem-domain vocabulary shared between business experts and engineers (Domain-Driven Design).
  - Eliminate ambiguous developer slang or database column names in favor of domain concepts (e.g., use "Yield on Cost" rather than `div_yoc_f64_val`).
- **Human- and Machine-Readable:**
  - Written in structured natural language (`Feature`, `Scenario`, `Given`, `When`, `Then`).
  - Read by non-technical stakeholders to verify that developers are building the right thing.
  - Read by Cucumber to execute as automated regression suites.

### Phase 3: Automation ("What it actually does")
Formulated Gherkin files guide the development of production code:

- **Acceptance-Test Driven Development (ATDD):**
  1. The automated scenario is run and **fails** (Red) because the underlying feature code does not yet exist.
  2. Developers implement production code and unit tests until the Gherkin scenario **passes** (Green).
  3. The codebase is refactored (Refactor) while the Gherkin scenario guarantees acceptance criteria remain intact.
- **Living Documentation:**
  - Traditional documentation becomes stale the moment code changes.
  - Because Gherkin feature files are continuously validated against the live application in CI/CD, the test suite *is* the living specification.

---

## 2. Gherkin Structural Blueprint

A compliant `.feature` file follows standard Gherkin keywords:

```gherkin
@layer @domain @lifecycle
Feature: [Domain Feature Name]
  As a [Role]
  I want to [Perform an Action / Exercise a Capability]
  So that [Realize a Specific Business Value / Benefit]

  Background:
    Given [Universal Business Precondition 1]
    And [Universal Business Precondition 2]

  Scenario: [TC-ID]: [Descriptive Business Outcome under specific conditions]
    Given [Specific Initial State / Context]
    When [Trigger Action / Event Occurs]
    Then [Observable Outcome / Expected State Change]
    And [Additional Business Assertion]
    But [Negative Constraint Assertion]

  Scenario Outline: [TC-ID]: [Parameterized Rule Evaluation across Data Variations]
    Given [State with <variable_1>]
    When [Action with <variable_2>]
    Then [Expected Result is <expected_outcome>]

    Examples:
      | variable_1 | variable_2 | expected_outcome |
      | input_a    | input_b    | result_ab        |
      | input_c    | input_d    | result_cd        |
```

---

## 3. Given, When, Then Semantics & Boundaries

Maintaining a clear conceptual boundary between the three primary keywords is vital for readability and debuggability:

### 1. `Given` (Context / Precondition)
- Sets up the world **prior** to the action under test.
- Examples: User is authenticated, a portfolio contains 100 shares of PTT, an exchange rate of 34.50 THB/USD is registered in the database.
- *Anti-pattern:* Putting user actions or verifications in `Given`.

### 2. `When` (Action / Trigger Event)
- The single, explicit action that exercises the behavior being validated.
- Examples: User filters by Thai Stocks, user submits a dividend reinvestment order, API client sends a transaction creation payload.
- *Anti-pattern:* Multiple unrelated actions in a single scenario.

### 3. `Then` (Outcome / Assertion)
- The observable consequence of the action.
- Examples: The summary card renders YOC 7.43%, the transaction status becomes COMPLETED, the HTTP status is 200 with calculated totals.
- *Anti-pattern:* Performing further actions in a `Then` step.

### 4. `And` & `But` (Conjunctions)
- Extends the preceding `Given`, `When`, or `Then` clause for readability.
- `But` is particularly effective for negative assertions (e.g., `Then the balance is updated` `But no penalty fee is charged`).

---

## 4. BDD in Agile Sprints: Process Integration

```
Sprint Backlog
      │
      ├─► Story Refinement (3 Amigos)
      │     └─► Discovery & Example Mapping (Rules + Scenarios)
      │
      ├─► Sprint Execution (Day 1-2)
      │     └─► Formulation of .feature files (PR Review by QA/PO)
      │
      ├─► Dev & Test Automation (Day 3-8)
      │     ├─► Step Definitions + Page Objects / Mock stubs
      │     └─► Production code passes acceptance tests
      │
      └─► Sprint Review & CI Regression
            └─► Living Documentation Reports (Allure / Test Management)
```
