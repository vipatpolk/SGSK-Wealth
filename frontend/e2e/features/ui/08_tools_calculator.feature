@ui @tools
Feature: Tools Hub & Investor Simulators
  As an investor
  I want to simulate average cost orders, calculate TVM compounding, and plan portfolio rebalancing
  So that I can model forward investment strategies

  Background:
    Given I open the SGSK Wealth application
    And I navigate to the Tools view

  Scenario: TC-TOOLS-01: Navigation to Tools tab and renders Avg Cost Calculator
    Then the tools container should be visible
    And the tools hero title should contain "Investor Tools & Simulators"
    And the average cost calculator should be visible

  Scenario: TC-TOOLS-02: Symbol selection and forward Buy simulation
    When I select the custom simulation option from the symbol dropdown
    And I click the simulation calculate button
    Then the simulation results panel and KPI grid should be visible

  Scenario: TC-TOOLS-03: Switching between Shares and Amount mode
    When I select the custom simulation option from the symbol dropdown
    And I switch to By Amount mode
    Then the simulation amount input should be visible

  Scenario: TC-TOOLS-04: Switch to TVM Calculator and calculate Future Value
    When I switch to the TVM Calculator tool
    Then the TVM hero display and projected value should be visible
    When I switch the TVM solve mode to PMT
    Then the target FV input should be visible
    When I select TVM compounding frequency "Quarterly"
    Then the active compounding frequency should display "Quarterly"
    When I toggle the TVM accumulation schedule table
    Then the schedule table should be visible

  Scenario: TC-TOOLS-05: TVM Calculator asset class multi-selection and valuation basis
    When I switch to the TVM Calculator tool
    And I click the PV valuation basis "Invested Cost"
    Then the "Invested Cost" valuation basis button should be active
    When I click the PV valuation basis "Market Value"
    Then the "Market Value" valuation basis button should be active
    And I test asset type chips selection if present

  Scenario: TC-TOOLS-06: TVM Calculator Year-by-Year Growth Chart and Area/Lines toggle
    When I switch to the TVM Calculator tool
    Then the TVM growth chart card and svg should be visible
    When I toggle TVM chart mode to "Lines"
    Then the lines chart mode button should be active
    When I toggle TVM chart mode to "Area"
    Then the area chart mode button should be active

  Scenario: TC-TOOLS-07: Switch to Rebalance Planner tool and render asset class groups
    When I switch to the Rebalance Planner tool
    Then the rebalance calculator should be visible
    And the rebalance KPI grid should be visible
    And the Standard rebalance mode button should be active
    And the No-Sell rebalance mode button should be visible

  Scenario: TC-TOOLS-08: Rebalance Planner quick actions and target adjustments
    When I switch to the Rebalance Planner tool
    Then I test Rebalance Planner equal weight actions if groups exist

  Scenario: TC-TOOLS-09: Rebalance Planner No-Sell mode and cash deposit calculation
    When I switch to the Rebalance Planner tool
    And I click the No-Sell mode button
    Then the No-Sell settings panel should be visible
    When I select the custom cash deposit radio
    Then the custom cash input should be visible

  Scenario: TC-TOOLS-10: Rebalance Planner filter refreshes KPI grid and orders checklist
    When I switch to the Rebalance Planner tool
    Then I test Rebalance Planner class chip filters if present
