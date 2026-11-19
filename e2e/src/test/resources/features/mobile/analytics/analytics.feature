@mobile @android @ios @analytics
Feature: Mobile Portfolio Analytics & Allocation Drilldown
  As a mobile investor
  I want to inspect portfolio performance timeframes and interactive allocation drilldowns
  So that I can evaluate asset exposure and returns on the go

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
