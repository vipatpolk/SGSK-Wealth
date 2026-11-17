@mobile @android @ios @smoke
Feature: Mobile Application Shell and Tab Navigation
  As a mobile wealth investor
  I want native Ionic bottom-tab navigation and global header controls
  So that I can seamlessly switch views, currencies, languages, and privacy masking on iOS and Android

  Background:
    Given the SGSK Wealth mobile application is launched

  Scenario: Native Ionic shell displays bottom tabs and portfolio hero on launch
    Then the mobile bottom tab bar should be displayed
    And the mobile dashboard hero summary should be displayed

  Scenario: Mobile header switches display currency to USD
    When I switch the mobile display currency
    Then the mobile display currency should show "USD"

  Scenario: Mobile header switches application language to Thai
    When I switch the mobile application language
    Then the mobile application language should be "TH"

  Scenario: Mobile header enables privacy masking
    When I toggle mobile privacy mode
    Then mobile privacy masking should be active
