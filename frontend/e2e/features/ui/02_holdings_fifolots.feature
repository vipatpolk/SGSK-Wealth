@ui @holdings
Feature: Portfolio Holdings & FIFO Share Lot Accounting
  As an investor
  I want to filter holdings by asset category, expand FIFO lots, and search symbols
  So that I can analyze lot acquisition dates and individual cost bases

  Background:
    Given I open the ShareLot application

  Scenario: TC-HLD-01: Asset Tab Filtering displays symbols matching tab category
    When I select the "U.S. Stock" asset tab
    Then the card for "AAPL" should be visible
    When I select the "Thai Stock" asset tab
    Then the card for "PTT.BK" should be visible
    When I select the "Cryptocurrency" asset tab
    Then the card for "BTC" should be visible
    When I select the "Mutual Fund" asset tab
    Then the card for "K-USA" should be visible
    When I select the "Closed Position" asset tab
    Then the card for "NVDA" should be visible

  Scenario: TC-HLD-02: Expanding Symbol Row reveals FIFO share lot details
    When I select the "U.S. Stock" asset tab
    And I expand the symbol row for "AAPL"
    Then the lots drawer container should be visible
    And the lots drawer should contain "Jan 15, 2024"
    And the lots drawer should contain "Mar 10, 2024"

  Scenario: TC-HLD-03: Search Bar filters portfolio holdings by symbol or name
    When I search holdings for "Bitcoin"
    Then the card for "BTC" should be visible
