@api @portfolio
Feature: Portfolio & Financial Analytics API Services
  As an API consumer
  I want to query portfolio holdings, performance analytics, allocations, and dividends
  So that clients display consistent real-time valuations across asset classes

  @smoke @TC-API-PORT-01
  Scenario Outline: TC-API-PORT-01: Fetch portfolio holdings across asset tabs and currencies
    When I send a GET request to "/portfolio/holdings" with query "tab_id=<tab_id>&currency=<currency>"
    Then the response status should be 200
    And the response time should be within 4000 ms
    And the response property "tabId" should equal "<tab_id>"
    And the response property "currency" should equal "<currency>"
    And the response should contain property "summary"

    Examples:
      | tab_id          | currency |
      | all             | THB      |
      | all             | USD      |
      | us-stock        | USD      |
      | thai-stock      | THB      |
      | crypto          | USD      |
      | mutual-fund     | THB      |
      | provident-fund  | THB      |
      | closed-position | THB      |

  @smoke @TC-API-PORT-02
  Scenario Outline: TC-API-PORT-02: Fetch portfolio performance analytics across timeframes and currencies
    When I send a GET request to "/portfolio/performance" with query "timeframe=<timeframe>&currency=<currency>"
    Then the response status should be 200
    And the response time should be within 3000 ms
    And the response property "timeframe" should equal "<timeframe>"
    And the response property "currency" should equal "<currency>"
    And the response should contain property "summary"

    Examples:
      | timeframe | currency |
      | YTD       | THB      |
      | 1M        | THB      |
      | 3M        | USD      |
      | 6M        | THB      |
      | 1Y        | USD      |
      | ALL       | THB      |

  @smoke @TC-API-PORT-03
  Scenario Outline: TC-API-PORT-03: Fetch dividend analytics ledger across currencies
    When I send a GET request to "/portfolio/dividend" with query "currency=<currency>"
    Then the response status should be 200
    And the response time should be within 4000 ms
    And the response property "currency" should equal "<currency>"
    And the response should contain property "totalGrossDividends"
    And the response should contain property "totalNetDividends"
    And the response should contain property "portfolioYieldOnCost"

    Examples:
      | currency |
      | THB      |
      | USD      |

  @TC-API-PORT-04
  Scenario: TC-API-PORT-04: Fetch dividend analytics in USD with tax summary fields
    When I send a GET request to "/portfolio/dividend" with query "currency=USD"
    Then the response status should be 200
    And the response property "currency" should equal "USD"
    And the response should contain property "totalWithholdingTax"
    And the response should contain property "annualDividends"
    And the response should contain property "symbolSummaries"

  @TC-API-PORT-05
  Scenario Outline: TC-API-PORT-05: Calculate portfolio asset allocation and rebalancing targets
    When I send a POST allocation request in currency "<currency>"
    Then the response status should be 200
    And the response time should be within 3000 ms
    And the response property "currency" should equal "<currency>"
    And the response should contain a positive number property "totalPortfolioValue"
    And the response should contain property "recommendations"
    And the response should contain property "currencyExposure"

    Examples:
      | currency |
      | THB      |
      | USD      |
