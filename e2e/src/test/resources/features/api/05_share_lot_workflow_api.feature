@api @sharelot @workflow
Feature: Share Lot Accounting & User Portfolio Workflow
  As an API client
  I want to fetch share lot sheets and execute portfolio pricing workflows
  So that end-to-end investment data is verified

  Scenario: Root service health check
    When I send a GET request to "/"
    Then the response status should be 200
    And the response JSON should contain:
      """
      {
        "message": "Welcome to SGSKBackend!"
      }
      """

  Scenario: Fetch share lot sheet for US Stock tab
    When I send a GET request to "/share-lot/sheet/us-stock"
    Then the response status should be 200
    And the response JSON should contain:
      """
      {
        "isClosed": false
      }
      """

  Scenario: Fetch share lot sheet with invalid tab ID returns error
    When I send a GET request to "/share-lot/sheet/non-existent-tab"
    Then the response status should be 200
    And the response JSON should contain:
      """
      {
        "error": "Invalid tab id: non-existent-tab"
      }
      """

  Scenario: Fetch all share lot sheets aggregated
    When I send a GET request to "/share-lot/sheets"
    Then the response status should be 200
    And the response should contain property "summaries"

  Scenario: Full user portfolio price fetch workflow
    When I send a GET request to "/"
    Then the response status should be 200
    When I send a GET request to "/share-lot/sheet/us-stock"
    Then the response status should be 200
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
