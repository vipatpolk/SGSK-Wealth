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
    Then the Dashboard allocation card and donut svg should be visible
    When I click the Dashboard go to allocation button
    Then the asset allocation container should be visible

  @TC-DASH-03
  Scenario: TC-DASH-03: Performance top movers card renders and navigates to performance view
    Then the Dashboard performance card should be visible
    When I click the Dashboard go to performance button
    Then the performance analytics container should be visible

  @smoke @TC-DASH-04
  Scenario Outline: TC-DASH-04: Financial Tools launchpad opens simulator directly in Tools view
    Then the Dashboard tools launchpad card should be visible
    When I launch "<ToolName>" from the Dashboard launchpad
    Then the tools container should be visible
    And the "<ToolName>" tool calculator should be visible

    Examples:
      | ToolName            |
      | Rebalance Planner   |
      | TVM Calculator      |
      | Avg Cost Calculator |

  @smoke @TC-DASH-05
  Scenario: TC-DASH-05: Currency switch converts Net Worth and KPI amounts
    Then the Executive Net Worth banner should be displayed
    When I switch currency to USD
    Then the USD currency button should be active
    When I switch currency to THB
    Then the THB currency button should be active

  @TC-DASH-06
  Scenario: TC-DASH-06: Privacy toggle hides monetary values on Dashboard
    Then the Executive Net Worth banner should be displayed
    When I toggle privacy mode
    Then the document privacy attribute should be "true"
    When I toggle privacy mode
    Then the document privacy attribute should be "false"

  @smoke @TC-DASH-07
  Scenario: TC-DASH-07: Provident Fund summary card renders master fund and navigates to PVD Holdings
    Then the Dashboard retirement card should display "Provident Fund (PVD)"
    And the Dashboard retirement card should display "ไทยพาณิชย์ มาสเตอร์ฟันด์"
    When I navigate from the Dashboard retirement card to PVD Holdings
    Then the PVD holdings screen should be visible
