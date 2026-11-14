@ui @allocation
Feature: Target Asset Allocation & Rebalancing Engine
  As an investor
  I want to view portfolio allocation charts and drill down by asset class
  So that I can evaluate category weightings against target distributions

  Background:
    Given I open the SGSK Wealth application
    And I navigate to the Allocation analytics view

  @smoke @TC-ALC-01
  Scenario: TC-ALC-01: Asset Allocation view defaults to All tab aggregated portfolio view
    Then the asset allocation container should be visible
    And the allocation donut chart should be visible

  @TC-ALC-02
  Scenario: TC-ALC-02: Filtering to asset class displays symbol breakdown
    When I filter allocation to "U.S. Stock"
    Then the asset class breakdown table and rebalance list should be visible

  @TC-ALC-03
  Scenario: TC-ALC-03: Resetting allocation filter restores all asset classes
    Given I filter allocation to "U.S. Stock"
    When I reset the asset allocation filter
    Then the asset allocation container should be visible

  @TC-ALC-04
  Scenario: TC-ALC-04: Asset Class Breakdown table display
    Then the asset class breakdown table and rebalance list should be visible

  @TC-ALC-05
  Scenario: TC-ALC-05: Analytics Overview sub-tab displays executive KPI cards
    When I switch to the Analytics Overview sub-tab
    Then the analytics overview grid should display 5 KPI cards
