@web @tools
Feature: Tools Hub & Investor Simulators
  As an investor
  I want to simulate average cost orders, calculate TVM compounding, and plan portfolio rebalancing
  So that I can model forward investment strategies

  Background:
    Given I open the SGSK Wealth application
    And I navigate to the Tools view

  @smoke @TC-TOOLS-01
  Scenario: TC-TOOLS-01: Navigation to Tools tab and renders Avg Cost Calculator
    Then the tools container should be visible
    And the tools hero title should contain "Investor Tools & Simulators"
    And the average cost calculator should be visible

  @TC-TOOLS-02
  Scenario: TC-TOOLS-02: Symbol selection and forward Buy simulation
    When I select the custom simulation option from the symbol dropdown
    And I click the simulation calculate button
    Then the simulation results panel and KPI grid should be visible

  @TC-TOOLS-03
  Scenario: TC-TOOLS-03: Switching between Shares and Amount mode
    When I select the custom simulation option from the symbol dropdown
    And I switch to By Amount mode
    Then the simulation amount input should be visible

  @smoke @TC-TOOLS-04
  Scenario: TC-TOOLS-04: Switching to TVM Calculator displays projected future value hero
    When I switch to the TVM Calculator tool
    Then the TVM hero display and projected value should be visible

  @TC-TOOLS-05
  Scenario Outline: TC-TOOLS-05: TVM Calculator switches PV valuation basis to <Basis>
    Given I am using the TVM Calculator tool
    When I click the PV valuation basis "<Basis>"
    Then the "<Basis>" valuation basis button should be active

    Examples:
      | Basis         |
      | Invested Cost |
      | Market Value  |

  @TC-TOOLS-06
  Scenario: TC-TOOLS-06: TVM Calculator renders Year-by-Year growth chart
    When I switch to the TVM Calculator tool
    Then the TVM growth chart card and svg should be visible

  @smoke @TC-TOOLS-07
  Scenario: TC-TOOLS-07: Switch to Rebalance Planner tool and render asset class groups
    When I switch to the Rebalance Planner tool
    Then the rebalance calculator should be visible
    And the rebalance KPI grid should be visible
    And the Standard rebalance mode button should be active
    And the No-Sell rebalance mode button should be visible

  @TC-TOOLS-08
  Scenario: TC-TOOLS-08: Rebalance Planner quick actions and target adjustments
    When I switch to the Rebalance Planner tool
    And I apply equal weight targets to the first asset class
    Then the target sum badge should be visible

  @TC-TOOLS-09
  Scenario: TC-TOOLS-09: Rebalance Planner No-Sell mode and cash deposit calculation
    When I switch to the Rebalance Planner tool
    And I click the No-Sell mode button
    And I select the custom cash deposit radio
    Then the No-Sell settings panel should be visible
    And the custom cash input should be visible

  @TC-TOOLS-10
  Scenario: TC-TOOLS-10: Rebalance Planner filter refreshes KPI grid and orders checklist
    When I switch to the Rebalance Planner tool
    And I filter rebalance orders by asset class
    Then the rebalance KPI summary should reflect the filtered class

  @TC-TOOLS-11
  Scenario Outline: TC-TOOLS-11: Target Cost Solver evaluates feasible and infeasible average cost goals
    When I select the custom simulation option from the symbol dropdown
    And I switch the Avg Cost Calculator to reverse goal solver mode
    And I solve for a target average cost of "<TargetAvgCost>" at purchase price "<PurchasePrice>"
    Then the reverse solver outcome should display "<ExpectedOutcome>"

    Examples:
      | TargetAvgCost | PurchasePrice | ExpectedOutcome        |
      | 145           | 130           | 33.33                  |
      | 120           | 130           | Target Goal Infeasible |

  @TC-TOOLS-12
  Scenario: TC-TOOLS-12: Solved reverse target goal applies required shares to forward simulation
    When I select the custom simulation option from the symbol dropdown
    And I switch the Avg Cost Calculator to reverse goal solver mode
    And I solve for a target average cost of "145" at purchase price "130"
    And I apply the solved reverse goal to forward simulation
    Then the simulation results panel and KPI grid should be visible

  @TC-TOOLS-13
  Scenario Outline: TC-TOOLS-13: TVM Calculator switches solve goals cleanly across all modes
    When I switch to the TVM Calculator tool
    And I select the TVM solve goal "<SolveMode>"
    Then the TVM hero title should display "<ExpectedTitle>"

    Examples:
      | SolveMode | ExpectedTitle             |
      | FV        | Projected Future Value    |
      | PMT       | Required Periodic Payment |
      | PV        | Required Starting Capital |
      | N         | Required Horizon          |
      | RATE      | Required Annual Rate      |

  @smoke @TC-TOOLS-14
  Scenario Outline: TC-TOOLS-14: Average Cost Calculator dropdown localizes asset names in <Language>
    When I switch language to "<Language>"
    Then the average cost calculator dropdown should display localized asset names:
      | Symbol | ExpectedName |
      | PTT.BK | <PttName>    |
      | K-USA  | <KusaName>   |
      | AAPL   | Apple Inc.   |
      | BTC    | Bitcoin      |

    Examples:
      | Language | PttName                    | KusaName                     |
      | TH       | บริษัท ปตท. จำกัด (มหาชน) | กองทุนเปิดเค ยูเอสเอ หุ้นทุน |
      | EN       | PTT Public Company Limited | Kasikorn US Equity Fund      |

  @TC-TOOLS-15
  Scenario Outline: TC-TOOLS-15: Rebalance Planner table localizes asset names in <Language>
    Given I am using the Rebalance Planner tool
    When I switch language to "<Language>"
    Then the rebalance planner table should display localized asset names:
      | Symbol | ExpectedName |
      | PTT.BK | <PttName>    |
      | K-USA  | <KusaName>   |
      | AAPL   | Apple Inc.   |
      | BTC    | Bitcoin      |

    Examples:
      | Language | PttName                    | KusaName                     |
      | TH       | บริษัท ปตท. จำกัด (มหาชน) | กองทุนเปิดเค ยูเอสเอ หุ้นทุน |
      | EN       | PTT Public Company Limited | Kasikorn US Equity Fund      |

  @smoke @TC-TOOLS-16
  Scenario: TC-TOOLS-16: Switching TVM solve mode to PMT displays target FV input
    Given I am using the TVM Calculator tool
    When I switch the TVM solve mode to PMT
    Then the target FV input should be visible

  @smoke @TC-TOOLS-17
  Scenario: TC-TOOLS-17: Selecting TVM compounding frequency updates active compounding display
    Given I am using the TVM Calculator tool
    When I select TVM compounding frequency "Quarterly"
    Then the active compounding frequency should display "Quarterly"

  @smoke @TC-TOOLS-18
  Scenario: TC-TOOLS-18: Toggling TVM accumulation schedule displays schedule table
    Given I am using the TVM Calculator tool
    When I toggle the TVM accumulation schedule table
    Then the schedule table should be visible

  @TC-TOOLS-19
  Scenario: TC-TOOLS-19: TVM Calculator toggles asset type chips selection
    Given I am using the TVM Calculator tool
    When I toggle asset type chips selection
    Then the selected asset type chip should be active

  @TC-TOOLS-20
  Scenario Outline: TC-TOOLS-20: TVM Calculator toggles growth chart mode to <Mode>
    Given I am using the TVM Calculator tool
    When I toggle TVM chart mode to "<Mode>"
    Then the "<Mode>" chart mode button should be active

    Examples:
      | Mode  |
      | Lines |
      | Area  |

  @smoke @TC-TOOLS-21
  Scenario Outline: TC-TOOLS-21: Average Cost Calculator badge localizes <Symbol> in <Language>
    When I switch language to "<Language>"
    And I select portfolio symbol "<Symbol>" in the average cost calculator
    Then the average cost calculator selected badge should display "<ExpectedName>"

    Examples:
      | Language | Symbol | ExpectedName                 |
      | TH       | PTT.BK | บริษัท ปตท. จำกัด (มหาชน)   |
      | TH       | K-USA  | กองทุนเปิดเค ยูเอสเอ หุ้นทุน |
      | TH       | AAPL   | Apple Inc.                   |
      | TH       | BTC    | Bitcoin                      |
      | EN       | PTT.BK | PTT Public Company Limited   |
      | EN       | K-USA  | Kasikorn US Equity Fund      |

  @TC-TOOLS-22
  Scenario: TC-TOOLS-22: Average Cost Calculator renders comparison table and cost shift bar
    When I select the custom simulation option from the symbol dropdown
    Then the average cost comparison table and cost shift bar should be visible

  @TC-TOOLS-23
  Scenario: TC-TOOLS-23: TVM Calculator renders capital composition bar and 6 KPI cards
    When I switch to the TVM Calculator tool
    Then the TVM capital composition bar and 6 KPI cards should be visible

  @TC-TOOLS-24
  Scenario: TC-TOOLS-24: Rebalance Planner renders trade execution plan checklist
    When I switch to the Rebalance Planner tool
    Then the rebalance execution plan checklist should be visible
