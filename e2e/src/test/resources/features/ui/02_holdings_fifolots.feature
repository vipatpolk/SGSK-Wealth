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

  @smoke @TC-HLD-05
  Scenario: TC-HLD-05: Holdings cards localize Thai market names across TH and EN while keeping non-Thai assets in English
    When I select the "All" asset tab
    And I switch language to TH
    Then the holdings cards should display localized asset names:
      | Symbol | ExpectedName                 |
      | PTT.BK | บริษัท ปตท. จำกัด (มหาชน)   |
      | K-USA  | กองทุนเปิดเค ยูเอสเอ หุ้นทุน |
      | AAPL   | Apple Inc.                   |
      | BTC    | Bitcoin                      |
    When I switch language to EN
    Then the holdings cards should display localized asset names:
      | Symbol | ExpectedName               |
      | PTT.BK | PTT Public Company Limited |
      | K-USA  | Kasikorn US Equity Fund    |
      | AAPL   | Apple Inc.                 |
      | BTC    | Bitcoin                    |

  @TC-HLD-06
  Scenario: TC-HLD-06: Holdings search autocomplete displays localized asset suggestions across TH and EN
    When I select the "All" asset tab
    And I switch language to TH
    And I search holdings autocomplete for "PTT"
    Then the holdings search autocomplete should suggest "บริษัท ปตท. จำกัด (มหาชน)" for "PTT"
    When I close the holdings search autocomplete
    And I search holdings autocomplete for "K-USA"
    Then the holdings search autocomplete should suggest "กองทุนเปิดเค ยูเอสเอ หุ้นทุน" for "K-USA"
    When I close the holdings search autocomplete
    And I search holdings autocomplete for "AAPL"
    Then the holdings search autocomplete should suggest "Apple Inc." for "AAPL"
    When I close the holdings search autocomplete
    And I switch language to EN
    And I search holdings autocomplete for "PTT"
    Then the holdings search autocomplete should suggest "PTT Public Company Limited" for "PTT"
    When I close the holdings search autocomplete
    And I search holdings autocomplete for "K-USA"
    Then the holdings search autocomplete should suggest "Kasikorn US Equity Fund" for "K-USA"
    When I close the holdings search autocomplete
    And I search holdings autocomplete for "AAPL"
    Then the holdings search autocomplete should suggest "Apple Inc." for "AAPL"

  @smoke @TC-HLD-07
  Scenario: View Mutual Fund fact sheet modal in English and Thai from Holdings
    When I select the "All" asset tab
    And I open the fund fact sheet for "K-USA" from holdings
    Then the fund fact sheet modal should display "Kasikorn US Equity Fund" with risk "RS6"
    And the fund fact sheet modal should contain "S&P 500 Total Return Net"
    And the fund fact sheet modal should display the official PDF link
    When I close the fund fact sheet modal
    Then the fund fact sheet modal should be hidden
    And the lots drawer for "K-USA" should remain collapsed
    When I switch language to TH
    And I open the fund fact sheet for "K-USA" from holdings
    Then the fund fact sheet modal should display "กองทุนเปิดเค ยูเอสเอ หุ้นทุน" with risk "RS6"
    When I close the fund fact sheet modal
    Then the fund fact sheet modal should be hidden
