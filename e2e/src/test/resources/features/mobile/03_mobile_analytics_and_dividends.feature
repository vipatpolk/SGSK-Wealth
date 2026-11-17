@mobile @android @ios
Feature: Mobile Analytics and Dividend Income
  As a mobile investor
  I want to inspect portfolio performance, allocation rebalancing, and dividend income on mobile
  So that I can evaluate returns and cash flow anywhere

  Background:
    Given the SGSK Wealth mobile application is launched

  Scenario: Reviewing Portfolio Performance in Mobile Analytics
    When I switch to the "Analytics" mobile tab
    Then the mobile performance summary should be displayed

  Scenario: Reviewing Currency Exposure and Allocation in Mobile Analytics
    When I switch to the "Analytics" mobile tab
    And I switch mobile analytics view to "allocation"
    Then the mobile currency exposure card should be displayed

  Scenario: Reviewing Net Dividends and Withholding Tax on Mobile
    When I switch to the "Dividends" mobile tab
    Then the mobile dividends summary should be displayed
