@ui @mobile
Feature: Mobile Responsiveness & Touch Layouts
  As an investor on a mobile device
  I want responsive cards and native bottom navigation dock
  So that I have an optimized touch experience

  Background:
    Given I open the SGSK Wealth application on a mobile viewport

  Scenario: TC-MOB-01: Mobile view renders responsive cards and native bottom navigation bar
    Then the native bottom navigation bar should be visible
    When I tap Analytics on the bottom navigation bar
    Then the analytics container should be visible

  Scenario: TC-MOB-02: Mobile view renders responsive Rebalance Planner cards and touch mode toggle
    When I tap Tools on the bottom navigation bar
    Then the tools container should be visible
    When I select Rebalance Planner from the mobile tools dropdown
    Then the rebalance calculator should be visible
    And the mobile rebalance mode toggle should be visible
    And the mobile symbol cards should be visible

  Scenario: TC-MOB-03: Native bottom navigation bar highlights active tab and switches views smoothly
    Then the bottom nav dashboard tab should be active
    When I tap Holdings on the bottom navigation bar
    Then the bottom nav holdings tab should be active
    And the asset tab bar should be visible
    When I tap Analytics on the bottom navigation bar
    Then the bottom nav analytics tab should be active
    And the analytics container should be visible
    When I tap Dividends on the bottom navigation bar
    Then the bottom nav dividends tab should be active
    And the dividend container should be visible
