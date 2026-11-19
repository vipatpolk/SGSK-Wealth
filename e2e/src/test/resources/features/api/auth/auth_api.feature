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

  @smoke @TC-API-AUTH-05
  Scenario Outline: TC-API-AUTH-05: Cloud portfolio endpoints without Bearer JWT are rejected with 401
    When I send an API-key-only <method> request to "<endpoint>"
    Then the response status should be 401

    Examples:
      | method | endpoint                    |
      | GET    | /share-lot/sheets           |
      | GET    | /portfolio/holdings         |
      | GET    | /portfolio/performance      |
      | POST   | /portfolio/tools/rebalance  |

  @TC-API-AUTH-06
  Scenario Outline: TC-API-AUTH-06: Cloud portfolio endpoints deny non-owner authenticated users with 403
    When I send a <method> request to "<endpoint>" with API key and bearer token "mock-standard-jwt"
    Then the response status should be 403

    Examples:
      | method | endpoint                    |
      | GET    | /share-lot/sheets           |
      | GET    | /portfolio/holdings         |
      | POST   | /portfolio/tools/rebalance  |

  @smoke @TC-API-AUTH-07
  Scenario Outline: TC-API-AUTH-07: Auth identity endpoint resolves portfolio access source by user token
    When I send a GET request to "/auth/me" with API key and bearer token "<token>"
    Then the response status should be 200
    And the response property "canViewCloudPortfolio" should equal "<cloudAccess>"
    And the response property "portfolioSource" should equal "<source>"

    Examples:
      | token             | cloudAccess | source        |
      | mock-owner-jwt    | true        | google_sheets |
      | mock-standard-jwt | false       | local         |
