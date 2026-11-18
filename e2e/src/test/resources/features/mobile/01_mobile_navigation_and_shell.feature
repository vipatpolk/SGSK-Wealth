@mobile @android @ios @smoke
Feature: Mobile Application Shell and Tab Navigation
  As a mobile wealth investor
  I want native Ionic bottom-tab navigation, dashboard overview cards, and global header controls
  So that I can seamlessly switch views, currencies, languages, themes, and privacy masking on iOS and Android

  Background:
    Given the SGSK Wealth mobile application is launched

  Scenario: Native Ionic shell displays bottom tabs and portfolio overview sections on launch
    Then the mobile bottom tab bar should be displayed
    And the mobile dashboard hero summary should be displayed
    And the mobile dashboard overview sections should be displayed

  Scenario: Mobile header switches display currency to USD
    When I switch the mobile display currency
    Then the mobile display currency should show "USD"

  Scenario: Mobile header switches application language to Thai
    When I switch the mobile application language
    Then the mobile application language should be "TH"

  Scenario: Mobile header enables privacy masking
    When I toggle mobile privacy mode
    Then mobile privacy masking should be active

  Scenario: Mobile header switches visual theme to light and triggers refresh
    When I toggle the mobile visual theme
    And I trigger a manual refresh on mobile
    Then the mobile visual theme should be "light"

  Scenario: Dashboard quick action navigates directly to Provident Fund holdings
    When I use the "pvd" quick action on the mobile dashboard
    Then the mobile provident fund holdings list should be displayed

  Scenario Outline: Bottom tab bar switches cleanly across all six workspaces
    When I switch to the "<TabName>" mobile tab
    Then the mobile bottom tab bar should be displayed
    And the mobile "<TabName>" workspace should be active

    Examples:
      | TabName      |
      | Holdings     |
      | Analytics    |
      | Dividends    |
      | Transactions |
      | Tools        |
      | Dashboard    |
