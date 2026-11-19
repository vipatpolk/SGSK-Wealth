@mobile @android @ios
Feature: Mobile Financial Calculators and Tools
  As a mobile investor
  I want to simulate multi-step average cost orders, target solvers, rebalance plans, and TVM wealth projections
  So that I can plan portfolio moves on the go

  Background:
    Given the SGSK Wealth mobile application is launched
    And I switch to the "Tools" mobile tab

  Scenario: Simulating a buy order and queueing a multi-step simulation chain on Mobile
    When I simulate buying 15 shares at price 125 on mobile
    And I queue an order into the mobile simulation chain
    Then the mobile simulation result should be displayed
    And the mobile simulation queue list should be displayed

  Scenario: Switching Average Cost Calculator to Reverse Target Cost Solver mode
    When I switch mobile average cost mode to "reverse"
    Then the mobile simulation result should be displayed

  Scenario: Planning a No-Sell cash inflow rebalance and adjusting target weights on Mobile
    When I select the "Rebalance Planner" financial tool on mobile
    And I switch mobile rebalance mode to "no-sell"
    And I adjust a mobile rebalance target weight
    Then the mobile rebalance plan summary should be displayed

  Scenario: Solving Time Value of Money for PMT, toggling chart view, and expanding schedule
    When I select the "TVM" financial tool on mobile
    And I set the mobile TVM calculation goal to "PMT"
    And I toggle the mobile TVM growth chart display mode
    And I expand the mobile TVM accumulation schedule
    Then the mobile TVM projection summary should be displayed
    And the mobile TVM schedule list should be displayed
