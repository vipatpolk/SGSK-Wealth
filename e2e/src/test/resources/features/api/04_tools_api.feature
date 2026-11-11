@api @tools
Feature: Financial Simulators & Portfolio Tools API
  As an investor
  I want to calculate TVM wealth compounding, forward cost basis, and portfolio rebalances
  So that I can plan future financial decisions accurately

  @smoke @TC-API-TOOL-01
  Scenario: TC-API-TOOL-01: TVM Calculator calculates future value (FV)
    When I send a POST request to "/portfolio/tools/tvm" with payload:
      """
      {
        "mode": "FV",
        "principal": 100000,
        "annual_rate_pct": 8.0,
        "compounding_frequency": "MONTHLY",
        "contribution_amount": 5000,
        "contribution_timing": "END",
        "years": 10
      }
      """
    Then the response status should be 200
    And the response time should be within 2000 ms
    And the response JSON should contain:
      """
      {
        "mode": "FV"
      }
      """

  @smoke @TC-API-TOOL-02
  Scenario: TC-API-TOOL-02: Average Cost Calculator forward buy simulation
    When I send a POST request to "/portfolio/tools/simulate" with payload:
      """
      {
        "symbol": "AAPL",
        "currency": "USD",
        "current_shares": 10,
        "current_avg_cost": 150.0,
        "current_market_price": 200.0,
        "orders": [
          { "order_type": "BUY", "shares": 5, "price": 180.0, "fee_pct": 0.1 }
        ]
      }
      """
    Then the response status should be 200
    And the response time should be within 2000 ms
