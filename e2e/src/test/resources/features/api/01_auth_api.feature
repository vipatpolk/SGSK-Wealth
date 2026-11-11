@api @auth
Feature: Backend API Authentication & Security
  As an API client
  I want my API requests to be authenticated via X-API-Key
  So that unauthorized access to portfolio and financial data is prevented

  @smoke @TC-API-AUTH-01
  Scenario: TC-API-AUTH-01: Request without X-API-Key is rejected with 401 Unauthorized
    When I send an unauthorized GET request to "/share-lot/sheets"
    Then the response status should be 401
    And the response JSON should contain:
      """
      {
        "detail": "Invalid or missing API Key"
      }
      """

  @TC-API-AUTH-02
  Scenario: TC-API-AUTH-02: Portfolio dividend request without X-API-Key is rejected with 401 Unauthorized
    When I send an unauthorized GET request to "/portfolio/dividend"
    Then the response status should be 401

  @TC-API-AUTH-03
  Scenario: TC-API-AUTH-03: Request with invalid X-API-Key is rejected with 401 Unauthorized
    When I send a request to "/price/exchange-rate" with custom header "X-API-Key" value "invalid-key-xyz"
    Then the response status should be 401

  @smoke @TC-API-AUTH-04
  Scenario: TC-API-AUTH-04: Authorized request with valid X-API-Key succeeds
    When I send a GET request to "/price/exchange-rate" with params:
      | from_currency | USD |
      | to_currency   | THB |
    Then the response status should be 200
    And the response should contain a positive number property "rate"
