# Tagging Taxonomy & CI/CD Execution Strategy

This reference specifies the standardized tagging taxonomy and execution strategies for running Cucumber test suites efficiently in local development, pre-commit checks, and CI/CD pipelines.

---

## 1. Multi-Dimensional Tag Taxonomy

Cucumber tags provide filtering, organization, and selective execution capabilities. To prevent tag clutter, follow this standardized taxonomy:

```
┌─────────────────┬────────────────────────────┬───────────────────────────────────────┐
│ CATEGORY        │ EXAMPLE TAGS               │ PURPOSE                               │
├─────────────────┼────────────────────────────┼───────────────────────────────────────┤
│ 1. System Layer │ @ui, @api, @integration    │ Target execution against stack layers │
│ 2. Pipeline Tier│ @smoke, @sanity, @regression│ Control test scope per CI trigger    │
│ 3. Feature Area │ @dividend, @holdings, @auth│ Run tests for changed microservices   │
│ 4. Lifecycle    │ @ready, @wip, @quarantine  │ Prevent unstable tests from failing CI│
│ 5. Performance  │ @fast, @slow               │ Isolate long-running scenarios        │
│ 6. Traceability │ @TC-DIV-01, @JIRA-1234     │ Traceability to issues & test cases   │
└─────────────────┴────────────────────────────┴───────────────────────────────────────┘
```

---

## 2. Tag Application Rules

### Feature-Level vs. Scenario-Level Tags
- **Feature-Level Tags:** Inherited automatically by every scenario in the file.
  - Apply the **System Layer** tag (`@ui` or `@api`) and the primary **Feature Area** tag (`@dividend`, `@auth`) at the `Feature:` level.
- **Scenario-Level Tags:** Specific to individual scenarios.
  - Apply execution tiers (`@smoke`), test case IDs (`@TC-DIV-01`), or lifecycle tags (`@wip`, `@slow`) on the `Scenario:` or `Scenario Outline:` line.

### Example:
```gherkin
@ui @dividend @regression
Feature: Dividend Analytics & Yield on Cost (YOC)
  As an investor
  I want to track dividend income and Yield on Cost
  So that I can evaluate passive cashflow generation

  Background:
    Given I open the SGSK Wealth application
    And I navigate to the Dividends view

  @smoke @TC-DIV-01
  Scenario: TC-DIV-01: Displays summary KPI cards including Yield on Cost (YOC)
    Then the dividend view should render 5 summary KPI cards
    And the Yield on Cost card should display "7.50%" and label "Yield on Cost (YOC)"

  @slow @wip @TC-DIV-04
  Scenario: TC-DIV-04: Deep historical timeline reconstruction across 10 years
    When I request timeline reconstruction for all historical lots
    Then the cashflow timeline should accurately reconcile past dividend payouts
```

---

## 3. Tag Expression Syntax & CLI Execution

Cucumber supports boolean logic in tag expressions: `not`, `and`, `or`, and parentheses `()`.

### Running with Maven / CLI:

```bash
# 1. Run all fast smoke tests (ideal for pre-push / quick verification)
mvn test -Dcucumber.filter.tags="@smoke and not @wip"

# 2. Run only API tests in CI pull requests
mvn test -Dcucumber.filter.tags="@api and not @slow"

# 3. Run full UI regression excluding quarantined / WIP tests
mvn test -Dcucumber.filter.tags="@ui and not @quarantine and not @wip"

# 4. Run tests for a specific business domain
mvn test -Dcucumber.filter.tags="@dividend"

# 5. Run a specific test case by ID
mvn test -Dcucumber.filter.tags="@TC-DIV-01"
```

---

## 4. JUnit 5 Platform Suite Configuration

In modern Cucumber-JVM (version 7+), configuration is controlled via `src/test/resources/junit-platform.properties` or test runner annotations.

### `junit-platform.properties` Example:
```properties
cucumber.publish.quiet=true
cucumber.plugin=pretty, html:target/cucumber-reports/cucumber.html, json:target/cucumber-reports/cucumber.json, io.qameta.allure.cucumber7jvm.AllureCucumber7Jvm
cucumber.glue=com.sgsk.wealth.e2e.steps, com.sgsk.wealth.e2e.hooks
cucumber.features=src/test/resources/features
cucumber.filter.tags=not @wip and not @quarantine
```

---

## 5. Parallel Execution & Thread Safety

Cucumber tests can execute concurrently across multiple worker threads to accelerate test suites. To avoid race conditions:

1. **State Isolation via Dependency Injection (PicoContainer):**
   - Step definition classes must inject a scoped `TestContext`.
   - Never use static variables to store state (e.g. `public static String authToken;` is a concurrency hazard).
2. **Independent Browser Contexts:**
   - In Playwright, create a fresh `BrowserContext` and `Page` per scenario in `@Before` hooks.
   - Close the context in `@After` hooks.
3. **Isolated Test Data / Mock Routing:**
   - Use unique identifiers or route interception per test thread to ensure tests do not overwrite shared records.

### Enabling Parallelism in `junit-platform.properties`:
```properties
cucumber.execution.parallel.enabled=true
cucumber.execution.parallel.mode.default=concurrent
cucumber.execution.parallel.mode.classes.default=concurrent
cucumber.execution.parallel.config.strategy=fixed
cucumber.execution.parallel.config.fixed.parallelism=4
```
