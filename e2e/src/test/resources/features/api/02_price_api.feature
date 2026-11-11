@api @price
Feature: Price & Market Data API Services
  As a portfolio tracking service
  I want to fetch foreign exchange rates and market price summaries
  So that multi-currency asset valuations can be computed

  @smoke @TC-API-PRC-01
  Scenario: TC-API-PRC-01: Fetch USD to THB exchange rate
    When I send a GET request to "/price/exchange-rate" with params:
      | from_currency | USD |
      | to_currency   | THB |
    Then the response status should be 200
    And the response time should be within 3000 ms
    And the response should contain a positive number property "rate"

  @smoke @TC-API-PRC-02
  Scenario: TC-API-PRC-02: Batch fetch market prices for portfolio symbols
    When I send a POST request to "/price/fetch-prices" with payload:
      """
      {
        "summaries": [
          { "symbol": "AAPL", "assetClass": "U.S. Stock", "currency": "USD" },
          { "symbol": "PTT.BK", "assetClass": "Thai Stock", "currency": "THB" }
        ]
      }
      """
    Then the response status should be 200
    And the response time should be within 5000 ms

  @TC-API-PRC-03
  Scenario: TC-API-PRC-03: Fetch mutual fund NAVs
    When I send a POST request to "/nav/fetch" with payload:
      """
      {
        "symbols": ["K-CHANGE.FUND"]
      }
      """
    Then the response status should be 200
