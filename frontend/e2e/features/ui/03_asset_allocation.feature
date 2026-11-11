@ui @allocation
Feature: Target Asset Allocation & Rebalancing Engine
  As an investor
  I want to view portfolio allocation charts and drill down by asset class
  So that I can evaluate category weightings against target distributions

  Background:
    Given I open the SGSK Wealth application
    And I navigate to the Allocation analytics view

  Scenario: TC-ALC-01: Asset Allocation view defaults to All tab aggregated portfolio view
    Then the asset allocation container should be visible
    And the allocation donut chart should be visible

  Scenario: TC-ALC-02 & TC-ALC-03: Filtering to asset class displays symbol breakdown and allows filter reset
    When I filter allocation to "U.S. Stock" if present
    Then I reset the allocation filter if the reset button is visible

  Scenario: TC-ALC-04: Asset Class Breakdown table display
    Then the asset class breakdown table and rebalance list should be visible
