@mobile @android @ios
Feature: Mobile Transaction History and Symbol Selector
  As a mobile investor
  I want to browse all historical trades, open a native symbol selector sheet, filter trade types, and toggle sort order
  So that I can audit cost basis progression on mobile

  Background:
    Given the SGSK Wealth mobile application is launched
    And I switch to the "Transactions" mobile tab

  Scenario: Viewing the unified All-Symbols transaction ledger on mobile
    Then the mobile transactions feed should be displayed

  Scenario: Selecting a holding from the native symbol selector sheet and clearing filter
    When I open the mobile transaction symbol selector
    And I pick "AAPL" from the mobile transaction symbol sheet
    Then the mobile transactions feed should be displayed
    And the mobile transactions view should show clear symbol action

  Scenario: Filtering transactions by trade type and toggling chronological sort order
    When I filter mobile transactions by type "buy"
    And I toggle mobile transaction sort order
    Then the mobile transactions feed should be displayed
