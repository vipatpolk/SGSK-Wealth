@api @tools
Feature: Financial Simulators & Portfolio Tools API
  As a strategic investor
  I want to calculate TVM compounding, forward cost basis, target cost solving, and portfolio rebalances
  So that I can plan future financial decisions accurately

  @smoke @TC-API-TOOL-01
  Scenario Outline: TC-API-TOOL-01: TVM Calculator computes compounding modes across frequencies
    When I send a POST TVM request for mode "<mode>" and compounding "<compounding>" in currency "<currency>"
    Then the response status should be 200
    And the response time should be within 2000 ms
    And the response property "mode" should equal "<mode>"
    And the response property "compounding" should equal "<compounding>"
    And the response property "currency" should equal "<currency>"
    And the response should contain a positive number property "futureValue"

    Examples:
      | mode | compounding | currency |
      | FV   | monthly     | USD      |
      | PMT  | monthly     | USD      |
      | PV   | quarterly   | THB      |
      | N    | annually    | USD      |
      | RATE | annually    | THB      |

  @smoke @TC-API-TOOL-02
  Scenario: TC-API-TOOL-02: Average Cost Calculator forward buy simulation
    When I send a POST request to "/portfolio/tools/simulate" with payload:
      """
      {
        "initialPosition": {
          "symbol": "AAPL",
          "shares": 10.0,
          "avgCost": 150.0,
          "marketPrice": 200.0,
          "currency": "USD"
        },
        "steps": [
          {
            "action": "BUY",
            "shares": 5.0,
            "price": 180.0,
            "feePercent": 0.157
          }
        ],
        "currency": "USD"
      }
      """
    Then the response status should be 200
    And the response time should be within 2000 ms
    And the response property "currency" should equal "USD"
    And the response should contain property "initial"
    And the response should contain property "simulated"

  @TC-API-TOOL-03
  Scenario Outline: TC-API-TOOL-03: Target Average Cost Solver computes required purchase shares
    When I send a POST target cost solve request in currency "<currency>" with target <target> at price <price>
    Then the response status should be 200
    And the response time should be within 2000 ms
    And the response property "currency" should equal "<currency>"
    And the response should contain property "requiredShares"
    And the response should contain property "achievedAvgCost"

    Examples:
      | currency | target  | price   |
      | USD      | 195.0   | 180.0   |
      | THB      | 6500.0  | 6000.0  |

  @TC-API-TOOL-04
  Scenario Outline: TC-API-TOOL-04: Portfolio Rebalance Engine computes allocation adjustments
    When I send a POST rebalance request in mode "<mode>" and currency "<currency>"
    Then the response status should be 200
    And the response time should be within 2000 ms
    And the response property "mode" should equal "<mode>"
    And the response property "currency" should equal "<currency>"
    And the response should contain property "totalCurrentPortfolioValue"

    Examples:
      | mode     | currency |
      | standard | USD      |
      | no-sell  | THB      |
