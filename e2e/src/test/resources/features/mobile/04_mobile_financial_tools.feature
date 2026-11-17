@mobile @android @ios
Feature: Mobile Financial Calculators and Tools
  As a mobile investor
  I want to simulate average cost orders, rebalance plans, and TVM projections on mobile
  So that I can plan investments on the go

  Background:
    Given the SGSK Wealth mobile application is launched

  Scenario: Simulating a buy order in the Mobile Avg Cost Calculator
    When I switch to the "Tools" mobile tab
    And I simulate buying 15 shares at price 125 on mobile
    Then the mobile simulation result should be displayed

  Scenario: Opening the Rebalance Planner on Mobile
    When I switch to the "Tools" mobile tab
    And I select the "Rebalance Planner" financial tool on mobile
    Then the mobile rebalance plan summary should be displayed

  Scenario: Opening the TVM Compound Calculator on Mobile
    When I switch to the "Tools" mobile tab
    And I select the "TVM" financial tool on mobile
    Then the mobile TVM projection summary should be displayed
