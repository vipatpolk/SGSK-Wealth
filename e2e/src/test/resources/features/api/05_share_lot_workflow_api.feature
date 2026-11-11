@api @sharelot @workflow
Feature: Share Lot Accounting & User Portfolio Workflow
  As an API client
  I want to fetch share lot sheets and execute portfolio pricing workflows
  So that end-to-end investment data is verified

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
  Scenario: TC-API-SL-02: Fetch share lot sheet for US Stock tab
    When I send a GET request to "/share-lot/sheet/us-stock"
    Then the response status should be 200
    And the response JSON should contain:
      """
      {
        "isClosed": false
      }
      """

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
          { "symbol": "AAPL", "assetType": "us-stock" }
        ]
      }
      """
    Then the response status should be 200
    And the response should contain a positive number property "rate"
