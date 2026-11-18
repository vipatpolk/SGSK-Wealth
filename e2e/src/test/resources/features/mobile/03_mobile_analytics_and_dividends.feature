@mobile @android @ios
Feature: Mobile Analytics and Dividend Income
  As a mobile investor
  I want to inspect portfolio performance timeframes, allocation drilldowns, monthly dividends, and holding ledgers
  So that I can evaluate returns and cash flow anywhere

  Background:
    Given the SGSK Wealth mobile application is launched

  Scenario: Reviewing Portfolio Performance summary and switching timeframes in Mobile Analytics
    When I switch to the "Analytics" mobile tab
    And I switch mobile analytics view to "performance"
    And I select the "1Y" timeframe in mobile performance
    Then the mobile performance summary should be displayed

  Scenario: Drilling down into US Stock allocation displays reset control
    When I switch to the "Analytics" mobile tab
    And I switch mobile analytics view to "allocation"
    And I drill down into the "us-stock" mobile allocation class
    Then the mobile allocation drilldown reset action should be visible

  Scenario: Resetting allocation drilldown restores currency exposure card
    When I switch to the "Analytics" mobile tab
    And I switch mobile analytics view to "allocation"
    And I drill down into the "us-stock" mobile allocation class
    And I reset the mobile allocation class drilldown
    Then the mobile currency exposure card should be displayed

  Scenario: Reviewing Net Dividends, monthly stacked chart, and filtering by asset class
    When I switch to the "Dividends" mobile tab
    And I filter mobile dividends by asset class "thai-stock"
    And I inspect the monthly dividend bar on mobile
    Then the mobile dividends summary should be displayed
    And the mobile monthly dividend chart and ledger should be displayed

  Scenario: Opening a symbol dividend ledger sheet modal on Mobile Dividends
    When I switch to the "Dividends" mobile tab
    And I open a symbol dividend ledger modal on mobile
    Then the mobile dividend symbol ledger modal should be displayed
