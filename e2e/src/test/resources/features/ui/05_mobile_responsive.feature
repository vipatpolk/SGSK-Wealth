@ui @mobile
Feature: Mobile Responsiveness & Touch Layouts
  As an investor on a mobile device
  I want responsive cards and native bottom navigation dock
  So that I have an optimized touch experience

  Background:
    Given I open the SGSK Wealth application on a mobile viewport

  @smoke @TC-MOB-01
  Scenario: TC-MOB-01: Mobile view renders native bottom navigation bar with active Dashboard tab
    Then the native bottom navigation bar should be visible
    And the bottom nav dashboard tab should be active

  @smoke @TC-MOB-02
  Scenario: TC-MOB-02: Mobile view renders responsive Rebalance Planner cards and touch mode toggle
    When I tap Tools on the bottom navigation bar
    And I select Rebalance Planner from the mobile tools dropdown
    Then the tools container should be visible
    And the rebalance calculator should be visible
    And the mobile rebalance mode toggle should be visible
    And the mobile symbol cards should be visible

  @TC-MOB-03
  Scenario Outline: TC-MOB-03: Native bottom navigation bar switches to <TabName> view cleanly
    When I tap "<TabName>" on the bottom navigation bar
    Then the bottom nav "<TabName>" tab should be active
    And the "<TabName>" workspace view should be visible

    Examples:
      | TabName   |
      | Holdings  |
      | Analytics |
      | Dividends |
