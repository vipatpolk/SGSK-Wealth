@api @sharelot @workflow
Feature: Share Lot Accounting & User Portfolio Workflow
  As a portfolio owner
  I want to fetch share lot sheets across asset classes and execute pricing workflows
  So that my holdings and cost basis are tracked across all accounts

  @smoke @TC-API-SL-01
  Scenario: TC-API-SL-01: Root service health check
    When I send a GET request to "/"
    Then the response status should be 200
    And the response JSON should contain:
      """
      {
        "message": "Welcome to SGSKBackend!"
      }
      """

  @TC-API-SL-02
  Scenario Outline: TC-API-SL-02: Fetch share lot sheet across asset class tabs
    When I send a GET request to "/share-lot/sheet/<tab_id>"
    Then the response status should be 200
    And the response property "isClosed" should equal "<is_closed>"
    And the response should contain property "summaries"
    And the response should contain property "totalCostByCurrency"
    And the response should contain property "totalSymbols"

    Examples:
      | tab_id          | is_closed |
      | us-stock        | false     |
      | thai-stock      | false     |
      | crypto          | false     |
      | mutual-fund     | false     |
      | provident-fund  | false     |
      | closed-position | true      |

  @TC-API-SL-03
  Scenario: TC-API-SL-03: Fetch share lot sheet with invalid tab ID returns error
    When I send a GET request to "/share-lot/sheet/non-existent-tab"
    Then the response status should be 200
    And the response JSON should contain:
      """
      {
        "error": "Invalid tab id: non-existent-tab"
      }
      """

  @smoke @TC-API-SL-04
  Scenario: TC-API-SL-04: Fetch all share lot sheets aggregated
    When I send a GET request to "/share-lot/sheets"
    Then the response status should be 200
    And the response should contain property "summaries"

  @workflow @TC-API-SL-05
  Scenario: TC-API-SL-05: Full user portfolio price fetch workflow
    Given the backend service root is available
    And the share lot sheet for "us-stock" is available
    When I send a POST request to "/price/fetch-prices" with payload:
      """
      {
        "summaries": [
          { "symbol": "AAPL", "assetClass": "U.S. Stock", "currency": "USD" },
          { "symbol": "PVDSP500", "assetClass": "Provident Fund", "currency": "THB" }
        ]
      }
      """
    Then the response status should be 200
    And the response should contain a positive number property "rate"
