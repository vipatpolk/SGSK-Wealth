@mobile @android @ios @dividend
Feature: Mobile Dividend Cashflow & Symbol Ledger
  As a mobile investor
  I want to inspect monthly dividend charts, filter payouts by asset class, and open symbol dividend ledgers
  So that I can monitor passive income from mobile

  Background:
    Given the SGSK Wealth mobile application is launched

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
