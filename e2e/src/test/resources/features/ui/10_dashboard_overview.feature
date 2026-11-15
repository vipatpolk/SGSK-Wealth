@ui @dashboard @smoke
Feature: Dashboard Landing Page & Executive Overview
  As an executive investor
  I want an executive dashboard landing page with net worth hero banner, donut snapshot, movers, and tools
  So that I have an immediate high-level summary of my investment portfolio

  Background:
    Given I open the SGSK Wealth application

  @smoke @TC-DASH-01
  Scenario: TC-DASH-01: Application lands on Dashboard by default with Executive Net Worth banner
    Then the Dashboard view should be visible
    And the Dashboard header navigation button should be active
    And the Executive Net Worth banner should be displayed
    And the 4 executive KPI cards should be visible

  @TC-DASH-02
  Scenario: TC-DASH-02: Asset Allocation donut chart is displayed with direct navigation
    Given the Dashboard allocation card and donut svg are visible
    When I click the Dashboard go to allocation button
    Then the asset allocation container should be visible

  @TC-DASH-03
  Scenario: TC-DASH-03: Performance top movers card renders and navigates to performance view
    Given the Dashboard performance card is visible
    When I click the Dashboard go to performance button
    Then the performance analytics container should be visible

  @smoke @TC-DASH-04
  Scenario Outline: TC-DASH-04: Financial Tools launchpad opens simulator directly in Tools view
    Given the Dashboard tools launchpad card is visible
    When I launch "<ToolName>" from the Dashboard launchpad
    Then the tools container should be visible
    And the "<ToolName>" tool calculator should be visible

    Examples:
      | ToolName            |
      | Rebalance Planner   |
      | TVM Calculator      |
      | Avg Cost Calculator |

  @smoke @TC-DASH-05
  Scenario Outline: TC-DASH-05: Currency switch converts Dashboard view from <InitialCurrency> to <TargetCurrency>
    Given the active currency is "<InitialCurrency>"
    When I switch currency to "<TargetCurrency>"
    Then the Executive Net Worth banner should be displayed
    And the "<TargetCurrency>" currency button should be active

    Examples:
      | InitialCurrency | TargetCurrency |
      | THB             | USD            |
      | USD             | THB            |

  @TC-DASH-06
  Scenario Outline: TC-DASH-06: Privacy toggle updates document privacy state to <ExpectedState>
    Given privacy mode is "<InitialState>"
    When I toggle privacy mode
    Then the Executive Net Worth banner should be displayed
    And the document privacy attribute should be "<ExpectedState>"

    Examples:
      | InitialState | ExpectedState |
      | false        | true          |
      | true         | false         |

  @smoke @TC-DASH-07
  Scenario: TC-DASH-07: Provident Fund summary card renders master fund and navigates to PVD Holdings
    Given the Dashboard retirement card displays "Provident Fund (PVD)"
    And the Dashboard retirement card displays "ไทยพาณิชย์ มาสเตอร์ฟันด์"
    When I navigate from the Dashboard retirement card to PVD Holdings
    Then the PVD holdings screen should be visible

  @smoke @TC-DASH-08
  Scenario Outline: TC-DASH-08: Dashboard top movers and PVD summary card localize asset names in <Language>
    When I switch language to "<Language>"
    Then the Dashboard top movers should display localized asset names:
      | Symbol | ExpectedName |
      | PTT.BK | <PttName>    |
      | K-USA  | <KusaName>   |
      | AAPL   | Apple Inc.   |
      | BTC    | Bitcoin      |
    And the Dashboard retirement card should display "นโยบายกองทุนรวมดัชนี S&P 500 THB"
    And the Dashboard retirement card should display "นโยบายกองทุนรวมผสม THB เฮดจ์"
    And the Dashboard retirement card should not display "SCB S&P 500 Index Policy"
    And the Dashboard retirement card should not display "SCB Fixed Income Plus Policy"

    Examples:
      | Language | PttName                    | KusaName                     |
      | TH       | บริษัท ปตท. จำกัด (มหาชน) | กองทุนเปิดเค ยูเอสเอ หุ้นทุน |
      | EN       | PTT Public Company Limited | Kasikorn US Equity Fund      |

  @TC-DASH-09
  Scenario: TC-DASH-09: Opening Provident Fund policy fact sheet modal from Dashboard retirement card
    When I open the fund fact sheet for Dashboard PVD policy "PVDSP500"
    Then the fund fact sheet modal should display "นโยบายกองทุนรวมดัชนี S&P 500 THB" with risk "RS6"

  @TC-DASH-10
  Scenario: TC-DASH-10: Closing Provident Fund policy fact sheet modal hides the modal
    Given I have opened the fund fact sheet for Dashboard PVD policy "PVDSP500"
    When I close the fund fact sheet modal
    Then the fund fact sheet modal should be hidden
