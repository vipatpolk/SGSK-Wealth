@api @price
Feature: Price & Market Data API Services
  As a backend integration consumer
  I want to fetch foreign exchange rates, market prices, NAVs, and symbol icons
  So that multi-currency asset valuations and UI branding can be computed

  @smoke @TC-API-PRC-01
  Scenario Outline: TC-API-PRC-01: Fetch FX conversion rates between currency pairs
    When I send a GET request to "/price/exchange-rate" with query "from_currency=<from_currency>&to_currency=<to_currency>"
    Then the response status should be 200
    And the response time should be within 3000 ms
    And the response should contain a positive number property "rate"

    Examples:
      | from_currency | to_currency |
      | USD           | THB         |
      | THB           | USD         |

  @smoke @TC-API-PRC-02
  Scenario: TC-API-PRC-02: Batch fetch market prices for portfolio symbols
    When I send a POST request to "/price/fetch-prices" with payload:
      """
      {
        "summaries": [
          { "symbol": "AAPL", "assetClass": "U.S. Stock", "currency": "USD" },
          { "symbol": "PTT.BK", "assetClass": "Thai Stock", "currency": "THB" },
          { "symbol": "BTC", "assetClass": "Cryptocurrency", "currency": "USD" },
          { "symbol": "K-USA", "assetClass": "Mutual Fund", "currency": "THB" },
          { "symbol": "PVDSP500", "assetClass": "Provident Fund", "currency": "THB" }
        ]
      }
      """
    Then the response status should be 200
    And the response time should be within 5000 ms
    And the response should contain a positive number property "rate"
    And the response should contain property "prices"

  @TC-API-PRC-03
  Scenario: TC-API-PRC-03: Fetch mutual fund NAVs
    When I send a POST request to "/nav/fetch" with payload:
      """
      {
        "symbols": ["K-CHANGE.FUND", "K-USA"]
      }
      """
    Then the response status should be 200
    And the response time should be within 5000 ms

  @TC-API-PRC-04
  Scenario Outline: TC-API-PRC-04: Fetch symbol icon metadata across asset classes
    When I send a GET request to "/icon/meta/<symbol>" with query "asset_type=<asset_type>"
    Then the response status should be 200
    And the response property "symbol" should equal "<symbol>"
    And the response property "asset_type" should equal "<asset_type>"
    And the response should contain property "icon_url"
    And the response should contain property "brand_color"

    Examples:
      | symbol   | asset_type     |
      | AAPL     | us-stock       |
      | PTT.BK   | thai-stock     |
      | BTC      | crypto         |
      | K-USA    | mutual-fund    |
      | PVDSP500 | provident-fund |

  @TC-API-PRC-05
  Scenario: TC-API-PRC-05: Fetch symbol icon graphic response
    When I send a GET request to "/icon/AAPL"
    Then the response status should be 200
    And the response content type should contain "image/"
