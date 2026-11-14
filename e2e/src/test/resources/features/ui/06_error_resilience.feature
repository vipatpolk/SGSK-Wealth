@ui @resilience
Feature: API Failure & Error Resilience
  As an investor
  I want clear error feedback when the backend service experiences outages
  So that I know data could not be fetched and can retry

  @smoke @TC-ERR-01
  Scenario Outline: TC-ERR-01: Displays error state card when backend API fails
    Given the backend API returns error status <StatusCode>
    When I open the SGSK Wealth application without mocking
    Then the error state card should be visible with "Unable to load data"
    And the retry button should be visible

    Examples:
      | StatusCode |
      | 500        |
      | 502        |
      | 503        |

  @TC-ERR-02
  Scenario: TC-ERR-02: Retry button recovers portfolio data after backend API outage
    Given the backend API returns error status 503
    When I open the SGSK Wealth application without mocking
    Then the error state card should be visible with "Unable to load data"
    When the backend API recovers
    And I retry loading the portfolio
    Then the Dashboard view should be visible
