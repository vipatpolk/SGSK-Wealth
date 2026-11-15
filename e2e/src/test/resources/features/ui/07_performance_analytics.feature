@ui @performance
Feature: Investment Performance & Analytics Engine
  As an investor
  I want summary return KPIs, timeframe presets, movers, and symbol autocomplete
  So that I can evaluate portfolio profitability across custom holding periods

  Background:
    Given I open the SGSK Wealth application
    And I switch to the Performance sub-tab

  @smoke @TC-PRF-01
  Scenario: TC-PRF-01: Performance view renders summary KPI cards
    Then the performance analytics container should be visible
    And the performance summary grid should render 5 KPI cards

  @smoke @TC-PRF-02
  Scenario Outline: TC-PRF-02: Date range preset buttons trigger timeframe updates
    When I select the performance date preset "<Preset>"
    Then the date range picker trigger should display "<TriggerText>"

    Examples:
      | Preset       | TriggerText  |
      | YTD          | YTD          |
      | Last 30 Days | Last 30 Days |
      | All Time     | All Dates    |

  @TC-PRF-03
  Scenario: TC-PRF-03: Asset Type Return and Top Movers sections render correctly
    Then the performance sections should contain "Asset Type Return" and "Top Movers"

  @TC-PRF-04
  Scenario: TC-PRF-04: Symbol search autocomplete dropdown provides instant suggestions
    When I search performance symbols for "AAP"
    Then the performance autocomplete dropdown should suggest "Apple"

  @TC-PRF-05
  Scenario Outline: TC-PRF-05: Status and Asset Type filters are accessible and selectable
    When I filter performance by status "<Status>"
    Then the status select should have value "<Status>"

    Examples:
      | Status |
      | open   |
      | closed |
      | all    |

  @smoke @TC-PRF-06
  Scenario: TC-PRF-06: Performance table and top movers localize Thai market names across TH and EN
    When I switch language to TH
    Then the performance table should display localized asset names:
      | Symbol | ExpectedName                 |
      | PTT.BK | บริษัท ปตท. จำกัด (มหาชน)   |
      | K-USA  | กองทุนเปิดเค ยูเอสเอ หุ้นทุน |
      | AAPL   | Apple Inc.                   |
      | BTC    | Bitcoin                      |
    And the performance top movers should display localized asset names:
      | Symbol | ExpectedName                 |
      | PTT.BK | บริษัท ปตท. จำกัด (มหาชน)   |
      | K-USA  | กองทุนเปิดเค ยูเอสเอ หุ้นทุน |
      | AAPL   | Apple Inc.                   |
      | BTC    | Bitcoin                      |
    When I switch language to EN
    Then the performance table should display localized asset names:
      | Symbol | ExpectedName               |
      | PTT.BK | PTT Public Company Limited |
      | K-USA  | Kasikorn US Equity Fund    |
      | AAPL   | Apple Inc.                 |
      | BTC    | Bitcoin                    |
    And the performance top movers should display localized asset names:
      | Symbol | ExpectedName               |
      | PTT.BK | PTT Public Company Limited |
      | K-USA  | Kasikorn US Equity Fund    |
      | AAPL   | Apple Inc.                 |
      | BTC    | Bitcoin                    |

  @TC-PRF-07
  Scenario: TC-PRF-07: Performance search autocomplete displays localized asset suggestions across TH and EN
    When I switch language to TH
    And I search performance autocomplete for "PTT"
    Then the performance autocomplete should suggest "บริษัท ปตท. จำกัด (มหาชน)" for "PTT"
    When I close the performance search autocomplete
    And I search performance autocomplete for "K-USA"
    Then the performance autocomplete should suggest "กองทุนเปิดเค ยูเอสเอ หุ้นทุน" for "K-USA"
    When I close the performance search autocomplete
    And I search performance autocomplete for "AAPL"
    Then the performance autocomplete should suggest "Apple Inc." for "AAPL"
    When I close the performance search autocomplete
    And I switch language to EN
    And I search performance autocomplete for "PTT"
    Then the performance autocomplete should suggest "PTT Public Company Limited" for "PTT"
    When I close the performance search autocomplete
    And I search performance autocomplete for "K-USA"
    Then the performance autocomplete should suggest "Kasikorn US Equity Fund" for "K-USA"
    When I close the performance search autocomplete
    And I search performance autocomplete for "AAPL"
    Then the performance autocomplete should suggest "Apple Inc." for "AAPL"
