@ui @holdings
Feature: Portfolio Holdings & FIFO Share Lot Accounting
  As an investor
  I want to filter holdings by asset category, expand FIFO lots, and search symbols
  So that I can analyze lot acquisition dates and individual cost bases

  Background:
    Given I open the SGSK Wealth application

  @smoke @TC-HLD-01
  Scenario Outline: TC-HLD-01: Asset Tab Filtering displays symbols matching tab category
    When I select the "<AssetTab>" asset tab
    Then the card for "<ExpectedSymbol>" should be visible

    Examples:
      | AssetTab        | ExpectedSymbol |
      | U.S. Stock      | AAPL           |
      | Thai Stock      | PTT.BK         |
      | Cryptocurrency  | BTC            |
      | Mutual Fund     | K-USA          |
      | Closed Position | NVDA           |

  @smoke @TC-HLD-02
  Scenario: TC-HLD-02: Expanding Symbol Row reveals FIFO share lot details
    When I select the "U.S. Stock" asset tab
    And I expand the symbol row for "AAPL"
    Then the lots drawer container should be visible
    And the lots drawer should contain "Jan 15, 2024"
    And the lots drawer should contain "Mar 10, 2024"

  @TC-HLD-03
  Scenario Outline: TC-HLD-03: Search Bar filters portfolio holdings by symbol or name
    When I select the "All" asset tab
    And I search holdings for "<Query>"
    Then the card for "<VisibleSymbol>" should be visible
    And the card for "<HiddenSymbol>" should be hidden

    Examples:
      | Query   | VisibleSymbol | HiddenSymbol |
      | Bitcoin | BTC           | AAPL         |
      | Apple   | AAPL          | BTC          |
      | PTT     | PTT.BK        | AAPL         |

  @TC-HLD-04
  Scenario Outline: TC-HLD-04: Sorting market holdings reorders symbol cards by selected metric
    When I select the "All" asset tab
    And I sort market holdings by "<SortMetric>"
    Then the first market holding card should be "<FirstSymbol>"

    Examples:
      | SortMetric    | FirstSymbol |
      | Holding Value | BTC         |
      | P/L %         | BTC         |
      | Total Cost    | BTC         |
      | Avg Cost      | BTC         |
      | Symbol        | AAPL        |
