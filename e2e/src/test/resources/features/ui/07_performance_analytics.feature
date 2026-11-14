@ui @performance
Feature: Investment Performance & Analytics Engine
  As an investor
  I want summary return KPIs, timeframe presets, movers, and symbol autocomplete
  So that I can evaluate portfolio profitability across custom holding periods

  Background:
    Given I open the SGSK Wealth application
    And I switch to the Performance sub-tab

  @smoke @TC-PRF-01
  Scenario: TC-PRF-01: Performance view renders summary KPI cards
    Then the performance analytics container should be visible
    And the performance summary grid should render 5 KPI cards

  @smoke @TC-PRF-02
  Scenario Outline: TC-PRF-02: Date range preset buttons trigger timeframe updates
    When I select the performance date preset "<Preset>"
    Then the date range picker trigger should display "<TriggerText>"

    Examples:
      | Preset       | TriggerText  |
      | YTD          | YTD          |
      | Last 30 Days | Last 30 Days |
      | All Time     | All Dates    |

  @TC-PRF-03
  Scenario: TC-PRF-03: Asset Type Return and Top Movers sections render correctly
    Then the performance sections should contain "Asset Type Return" and "Top Movers"

  @TC-PRF-04
  Scenario: TC-PRF-04: Symbol search autocomplete dropdown provides instant suggestions
    When I search performance symbols for "AAP"
    Then the performance autocomplete dropdown should suggest "Apple"

  @TC-PRF-05
  Scenario Outline: TC-PRF-05: Status and Asset Type filters are accessible and selectable
    When I filter performance by status "<Status>"
    Then the status select should have value "<Status>"

    Examples:
      | Status |
      | open   |
      | closed |
      | all    |
