@api @auth
Feature: Backend API Authentication & Security
  As a platform security engineer
  I want all financial API endpoints to enforce API key authentication
  So that unauthorized access to portfolio and financial data is prevented

  @smoke @TC-API-AUTH-01
  Scenario Outline: TC-API-AUTH-01: Requests without X-API-Key are rejected with 401 Unauthorized
    When I send an unauthorized <method> request to "<endpoint>"
    Then the response status should be 401
    And the response property "detail" should equal "Invalid or missing API Key"

    Examples:
      | method | endpoint               |
      | GET    | /share-lot/sheets      |
      | GET    | /portfolio/holdings    |
      | GET    | /portfolio/performance |
      | GET    | /portfolio/dividend    |
      | GET    | /price/exchange-rate   |
      | POST   | /nav/fetch             |
      | POST   | /portfolio/tools/tvm   |

  @TC-API-AUTH-02
  Scenario: TC-API-AUTH-02: Portfolio allocation POST without X-API-Key is rejected with 401 Unauthorized
    When I send an unauthorized POST request to "/portfolio/allocation"
    Then the response status should be 401
    And the response property "detail" should equal "Invalid or missing API Key"

  @TC-API-AUTH-03
  Scenario Outline: TC-API-AUTH-03: Requests with invalid X-API-Key values are rejected with 401 Unauthorized
    When I send a request to "/price/exchange-rate" with custom header "X-API-Key" value "<api_key>"
    Then the response status should be 401
    And the response property "detail" should equal "Invalid or missing API Key"

    Examples:
      | api_key            |
      | invalid-key-xyz    |
      | expired-token-123  |
      | Bearer wrong-token |

  @smoke @TC-API-AUTH-04
  Scenario: TC-API-AUTH-04: Authorized request with valid X-API-Key succeeds
    When I send a GET request to "/price/exchange-rate" with query "from_currency=USD&to_currency=THB"
    Then the response status should be 200
    And the response should contain a positive number property "rate"
