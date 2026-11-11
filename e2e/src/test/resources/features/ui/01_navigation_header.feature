@ui @navigation @smoke
Feature: Global Navigation & Header Controls
  As a SGSK Wealth investor
  I want to switch views, currencies, and themes
  So that I can monitor my portfolio across different layouts and currencies

  Background:
    Given I open the SGSK Wealth application

  @smoke @TC-NAV-01
  Scenario: TC-NAV-01: View Mode Switcher navigates between primary views
    Then the Dashboard view should be visible
    When I switch to the Holdings view
    Then the asset tab bar should be visible
    When I switch to the Analytics view
    Then the analytics container should be visible
    When I switch to the Allocation sub-tab
    Then the asset allocation container should be visible
    When I switch to the Performance sub-tab
    Then the performance analytics container should be visible
    When I switch to the Transactions view
    Then the transaction history container should be visible
    When I switch back to the Dashboard view
    Then the Dashboard view should be visible

  @smoke @TC-NAV-02
  Scenario: TC-NAV-02: Currency Toggle switches display currency between USD and THB
    When I switch currency to USD
    Then the USD currency button should be active
    When I switch currency to THB
    Then the THB currency button should be active

  @TC-NAV-03
  Scenario: TC-NAV-03: Theme Switcher toggles dark and light theme state
    When I toggle the theme
    Then the document theme attribute should be "light"
    When I toggle the theme
    Then the document theme attribute should be "dark"
