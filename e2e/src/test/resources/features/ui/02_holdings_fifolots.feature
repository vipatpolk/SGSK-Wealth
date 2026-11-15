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
  Scenario Outline: TC-HLD-05: Holdings cards localize market names in <Language>
    When I select the "All" asset tab
    And I switch language to "<Language>"
    Then the holdings cards should display localized asset names:
      | Symbol | ExpectedName |
      | PTT.BK | <PttName>    |
      | K-USA  | <KusaName>   |
      | AAPL   | Apple Inc.   |
      | BTC    | Bitcoin      |

    Examples:
      | Language | PttName                    | KusaName                     |
      | TH       | บริษัท ปตท. จำกัด (มหาชน) | กองทุนเปิดเค ยูเอสเอ หุ้นทุน |
      | EN       | PTT Public Company Limited | Kasikorn US Equity Fund      |

  @TC-HLD-06
  Scenario Outline: TC-HLD-06: Holdings search autocomplete suggests localized <Symbol> in <Language>
    When I select the "All" asset tab
    And I switch language to "<Language>"
    And I search holdings autocomplete for "<Query>"
    Then the holdings search autocomplete should suggest "<ExpectedName>" for "<Symbol>"

    Examples:
      | Language | Query | Symbol | ExpectedName                 |
      | TH       | PTT   | PTT    | บริษัท ปตท. จำกัด (มหาชน)   |
      | TH       | K-USA | K-USA  | กองทุนเปิดเค ยูเอสเอ หุ้นทุน |
      | TH       | AAPL  | AAPL   | Apple Inc.                   |
      | EN       | PTT   | PTT    | PTT Public Company Limited   |
      | EN       | K-USA | K-USA  | Kasikorn US Equity Fund      |
      | EN       | AAPL  | AAPL   | Apple Inc.                   |

  @smoke @TC-HLD-07
  Scenario Outline: TC-HLD-07: Mutual Fund fact sheet modal displays localized details in <Language>
    When I select the "All" asset tab
    And I switch language to "<Language>"
    And I open the fund fact sheet for "K-USA" from holdings
    Then the fund fact sheet modal should display "<ExpectedTitle>" with risk "RS6"
    And the fund fact sheet modal should contain "S&P 500 Total Return Net"
    And the fund fact sheet modal should display the official PDF link

    Examples:
      | Language | ExpectedTitle                |
      | EN       | Kasikorn US Equity Fund      |
      | TH       | กองทุนเปิดเค ยูเอสเอ หุ้นทุน |

  @smoke @TC-HLD-08
  Scenario: TC-HLD-08: Closing Mutual Fund fact sheet modal hides modal without expanding lots drawer
    Given I have opened the fund fact sheet for "K-USA" from "All" holdings
    When I close the fund fact sheet modal
    Then the fund fact sheet modal should be hidden
    And the lots drawer for "K-USA" should remain collapsed
