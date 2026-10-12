@ui @resilience
Feature: API Failure & Error Resilience
  As an investor
  I want clear error feedback when the backend service experiences outages
  So that I know data could not be fetched and can retry

  Scenario: TC-ERR-01: Displays error state card when backend API fails
    Given the backend API returns error status 500
    When I open the ShareLot application without mocking
    Then the error state card should be visible with "Unable to load data"
    And the retry button should be visible
