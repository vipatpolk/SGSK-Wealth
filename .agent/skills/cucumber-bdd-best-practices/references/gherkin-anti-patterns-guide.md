# Gherkin Anti-Patterns & Refactoring Guide

This reference provides a comprehensive catalog of the most prevalent Gherkin and Cucumber anti-patterns, explaining the root failure mode and illustrating exact before-and-after refactorings.

---

## 1. Anti-Pattern: The "Click-Fest" (Imperative UI Scripting)

### Root Problem
Treating Gherkin as a test automation programming language instead of a specification tool. The scenario describes mechanical browser clicks and field typing rather than user intent and business behavior. Any UI redesign breaks every scenario, even if the business logic is unchanged.

### ❌ Anti-Pattern Example
```gherkin
Scenario: Login to wealth application
  Given I open the browser at "http://localhost:4200"
  When I locate the input field with id "username-input"
  And I type "testuser@sgsk.com" into the element "username-input"
  And I locate the input field with id "password-input"
  And I type "Password123!" into the element "password-input"
  And I click on the button with class "btn-login-submit"
  Then I wait 3 seconds
  And I should see the element with class ".nav-user-profile"
  And the text in ".nav-user-profile" should equal "Welcome, testuser"
```

### ✅ Refactored Declarative Example
```gherkin
Scenario: TC-AUTH-01: Registered investor logs in with valid credentials
  Given I am on the login portal
  When I log in with valid investor credentials
  Then I should have access to my portfolio workspace
  And the navigation bar should welcome "testuser"
```
*Note:* The button clicks, form fills, and waits are encapsulated in Java Playwright Page Objects (`LoginPage.java`).

---

## 2. Anti-Pattern: The Bloated Background

### Root Problem
Dumping dozens of setup steps into `Background`. Remember: `Background` executes before **every single scenario** in the feature file. If a background step is only needed by 2 out of 5 scenarios, it wastes execution time and confuses readers.

### ❌ Anti-Pattern Example
```gherkin
Feature: Holdings & Portfolio Management

  Background:
    Given I start the application server
    And I connect to the mock database
    And I seed exchange rate of 35.0 THB/USD
    And I open the browser
    And I navigate to "/login"
    And I enter credentials "demo" / "secret"
    And I click submit
    And I navigate to "/holdings"
    And I wait for the FIFO calculation engine to complete
    And I create a stock lot with 100 shares of AAPL
    And I create a dividend payout of $2.50 per share

  Scenario: View holdings list
    # Doesn't need the dividend payout created in Background!

  Scenario: Delete a stock lot
    # Overwrites the stock lot created in Background!
```

### ✅ Refactored Example
```gherkin
Feature: Holdings & Portfolio Management

  Background:
    Given I open the SGSK Wealth application
    And I navigate to the Holdings view

  Scenario: TC-HOLD-01: Displays list of active portfolio holdings
    Then the holdings table should list all open equity positions

  Scenario: TC-HOLD-02: Dividend entitlement calculated for eligible lot
    Given an open lot of 100 shares of "AAPL" with ex-date in the future
    When a dividend payout of $2.50 per share is announced
    Then the projected dividend income should be $250.00
```
*Note:* Database seeding, server lifecycle, and tokens are shifted to `@Before` hooks or scenario-specific steps.

---

## 3. Anti-Pattern: The Dependent Chain (State Coupling)

### Root Problem
Scenario 2 depends on state created by Scenario 1. If Scenario 1 fails, Scenario 2 fails or flakes. Scenarios cannot be run in isolation or parallel.

### ❌ Anti-Pattern Example
```gherkin
Scenario: 01 Create a new portfolio transaction
  When I record a BUY transaction for 100 shares of "PTT" at 34.00 THB
  Then the transaction should be saved with ID "TX-1001"

Scenario: 02 Edit the created transaction
  # FAILS if Scenario 01 didn't run first!
  When I edit transaction "TX-1001" to quantity 150
  Then the transaction quantity should be 150

Scenario: 03 Delete the transaction
  # FAILS if run alone!
  When I delete transaction "TX-1001"
  Then the transaction should no longer appear in the table
```

### ✅ Refactored Example (Atomic & Independent)
```gherkin
Scenario: TC-TX-01: Create a new portfolio transaction
  When I record a BUY transaction for 100 shares of "PTT" at 34.00 THB
  Then the transaction should appear in the portfolio records with status "COMPLETED"

Scenario: TC-TX-02: Modify quantity of an existing transaction
  Given an existing transaction for 100 shares of "PTT"
  When I update the transaction quantity to 150 shares
  Then the transaction history should display 150 shares for "PTT"

Scenario: TC-TX-03: Remove a transaction from portfolio records
  Given an existing transaction for 100 shares of "PTT"
  When I delete the transaction
  Then "PTT" should no longer appear in the transaction log
```

---

## 4. Anti-Pattern: Conjunctive Steps (Compounding Actions)

### Root Problem
Combining multiple actions into a single step using the English word "and" inside the sentence text. This damages step reusability and creates brittle monolithic step definitions.

### ❌ Anti-Pattern Example
```gherkin
When I filter by asset type "Thai Stocks" and select sort by "Yield on Cost" and export to CSV
Then the report downloads and contains 15 records
```

### ✅ Refactored Example
```gherkin
When I filter dividends to asset type "Thai Stocks"
And I sort the table by "Yield on Cost" descending
And I request a CSV export of the report
Then the CSV export should complete successfully
And the exported dataset should contain 15 records
```

---

## 5. Anti-Pattern: Leaky Technical Jargon in Business Features

### Root Problem
Scenarios describe REST endpoints, SQL queries, JSON payloads, or HTTP response codes in features intended for business acceptance.

### ❌ Anti-Pattern Example (In a Business Feature)
```gherkin
Feature: Currency Conversion
  Scenario: Calculate currency rate
    When I execute HTTP GET request to "/api/v1/price/exchange-rate?from=USD&to=THB"
    Then I get HTTP status code 200 OK
    And the JSON response field "data.rate" has floating point value greater than 30.0
```

### ✅ Refactored Example
```gherkin
Feature: Currency Conversion
  Scenario: TC-FX-01: Convert portfolio value between USD and THB
    Given the current exchange rate for USD to THB is 35.50
    When I convert an asset value of $10,000 USD to THB
    Then the equivalent value should be 355,000 THB
```
*Exception Note:* Dedicated developer-facing API contract tests (e.g. `e2e/src/test/resources/features/api/02_price_api.feature`) may explicitly test status codes (`200`, `401`), but business workflows must focus on domain concepts.

---

## 6. Anti-Pattern: Trailing Punctuation Pollution

### Root Problem
Ending step text with periods `.`, commas `,`, or colons `:`. This creates mismatches when steps are reused or parsed by regular expressions in Cucumber.

### ❌ Anti-Pattern Example
```gherkin
Given I navigate to the dashboard.
When I click on "Refresh".
Then the balance should be updated.
```

### ✅ Refactored Example
```gherkin
Given I navigate to the dashboard
When I refresh the portfolio calculations
Then the balance should be updated
```

---

## 7. Anti-Pattern: Scenario Bloat and Feature Creep

### Symptoms
- 40+ scenarios in a single `.feature` file.
- Individual scenarios containing 20+ lines of steps.
- Testing every mathematical permutation in full UI browser automation instead of unit/integration tests.

### Remediation
- Apply the **Testing Pyramid**: Push boundary conditions, parsing edge cases, and arithmetic calculations down to unit tests (pytest / Karma / JUnit).
- Use Gherkin for **key end-to-end user journeys** and acceptance criteria.
- Split oversized `.feature` files by sub-domain (e.g., split `portfolio.feature` into `portfolio_summary.feature`, `fifo_allocation.feature`, and `dividend_yield.feature`).
