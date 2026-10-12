@api @portfolio
Feature: Portfolio & Financial Analytics API Services
  As a portfolio tracking service
  I want to query portfolio holdings, performance analytics, and dividends
  So that users can monitor their investment accounts

  Scenario: Fetch portfolio holdings converted to THB
    When I send a GET request to "/portfolio/holdings" with params:
      | tab_id   | all |
      | currency | THB |
    Then the response status should be 200
    And the response time should be within 4000 ms

  Scenario: Fetch portfolio performance metrics for YTD timeframe
    When I send a GET request to "/portfolio/performance" with params:
      | timeframe | YTD |
      | currency  | THB |
    Then the response status should be 200
    And the response time should be within 3000 ms

  Scenario: Fetch dividend analytics ledger and YOC metrics
    When I send a GET request to "/portfolio/dividend" with params:
      | currency | THB |
      | tab_id   | all |
    Then the response status should be 200
    And the response time should be within 4000 ms
