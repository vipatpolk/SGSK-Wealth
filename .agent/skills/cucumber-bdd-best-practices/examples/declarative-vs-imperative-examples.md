# Declarative vs. Imperative Gherkin Examples

This reference provides real-world comparisons between poor imperative scenarios and clean, resilient declarative scenarios, contextualized for wealth management, financial reporting, and REST API testing.

---

## 1. UI Scenario: Asset Filtering & Yield on Cost (YOC)

### ❌ Anti-Pattern: Imperative (Click-by-Click)
```gherkin
Feature: Dividend Yield

  Scenario: Filter Thai stocks
    Given I open browser and go to "http://localhost:4200"
    And I wait for the page to load
    When I click on the link "Dividends" in the top menu
    Then I should see the URL contains "/dividends"
    When I click on the dropdown with class ".asset-filter-select"
    And I click on the option with text "Thai Stocks"
    Then I wait 2 seconds
    And the element with id "kpi-card-yoc" should have text "7.43%"
    When I click on the dropdown with class ".asset-filter-select"
    And I click on the option with text "U.S. Stocks"
    Then the element with id "kpi-card-yoc" should have text "0.54%"
```

### ✅ Clean Declarative Gherkin
```gherkin
@ui @dividend
Feature: Dividend Analytics & Yield on Cost (YOC)
  As an investor
  I want to track dividend income and Yield on Cost
  So that I can evaluate passive cashflow generation

  Background:
    Given I open the SGSK Wealth application
    And I navigate to the Dividends view

  Scenario: TC-DIV-03: Switching asset type filters YOC KPI card accurately without currency distortion
    Then the Yield on Cost KPI card should show "7.50%"
    When I filter dividends to asset type "Thai Stocks"
    Then the Yield on Cost KPI card should show "7.43%"
    When I filter dividends to asset type "U.S. Stocks"
    Then the Yield on Cost KPI card should show "0.54%"
    When I filter dividends to asset type "All Assets"
    Then the Yield on Cost KPI card should show "7.50%"
```

---

## 2. Parameterized Scenario Outline: Dividend Withholding Tax Rules

### ❌ Anti-Pattern: Copy-Pasting 4 Separate Scenarios
```gherkin
Scenario: Thai stock withholding tax
  Given an investor has 100 shares in "PTT"
  When a dividend of 1000 THB is paid
  Then withholding tax should be 100 THB

Scenario: US stock with W8BEN
  Given an investor has 10 shares in "AAPL" with W-8BEN
  When a dividend of $100 is paid
  Then withholding tax should be $15

Scenario: US stock without W8BEN
  Given an investor has 10 shares in "AAPL" without W-8BEN
  When a dividend of $100 is paid
  Then withholding tax should be $30

Scenario: Thai BOI privileged stock
  Given an investor has 100 shares in "DELTA" under BOI
  When a dividend of 1000 THB is paid
  Then withholding tax should be 0 THB
```

### ✅ Clean Scenario Outline + Examples
```gherkin
@dividend @tax @calculation
Scenario Outline: TC-DIV-TAX-01: Calculate dividend withholding tax by tax jurisdiction and treaty status
  Given an investor holds shares in "<ticker>" in "<market>" market
  And the investor tax profile is "<tax_profile>"
  When a gross dividend of <gross_amount> is distributed
  Then the withholding tax rate applied should be <tax_rate>
  And the net dividend payout should be <net_amount>

  Examples:
    | ticker | market | tax_profile      | gross_amount | tax_rate | net_amount |
    | PTT    | SET    | Thai Standard    | 1000.00      | 10%      | 900.00     |
    | DELTA  | SET    | BOI Privileged   | 1000.00      | 0%       | 1000.00    |
    | AAPL   | US     | Treaty W-8BEN    | 100.00       | 15%      | 85.00      |
    | MSFT   | US     | Statutory NRA    | 100.00       | 30%      | 70.00      |
```

---

## 3. Data Table Example: Multi-Asset Portfolio Allocation Verification

### ✅ Clean Data Table at Step Level
```gherkin
@ui @allocation
Scenario: TC-ALLOC-01: Verifies target vs actual asset allocation weights
  Given I navigate to the Asset Allocation view
  Then the allocation breakdown table should reflect the following targets and values:
    | Asset Class   | Target Weight | Actual Weight | Status     |
    | Thai Equities | 40.00%        | 42.10%        | Overweight |
    | U.S. Equities | 35.00%        | 34.20%        | Balanced   |
    | Mutual Funds  | 15.00%        | 14.50%        | Balanced   |
    | Fixed Income  | 10.00%        | 9.20%         | Underweight|
```

---

## 4. API Contract Testing: Authentication & Security

### ✅ Clean Gherkin with Doc Strings & Query Params Table
```gherkin
@api @auth
Feature: Backend API Authentication & Security
  As an API client
  I want my API requests to be authenticated via X-API-Key
  So that unauthorized access to portfolio and financial data is prevented

  Scenario: Request without X-API-Key is rejected with 401 Unauthorized
    When I send an unauthorized GET request to "/share-lot/sheets"
    Then the response status should be 401
    And the response JSON should contain:
      """
      {
        "detail": "Invalid or missing API Key"
      }
      """

  Scenario: Authorized request with valid X-API-Key succeeds
    When I send a GET request to "/price/exchange-rate" with params:
      | from_currency | USD |
      | to_currency   | THB |
    Then the response status should be 200
    And the response should contain a positive number property "rate"
```
