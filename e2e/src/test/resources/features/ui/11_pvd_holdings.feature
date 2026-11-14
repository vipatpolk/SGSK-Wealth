@ui @holdings @pvd
Feature: Provident Fund (PVD) Holdings & SEC Metadata Analytics
  As a Thai provident fund investor
  I want a dedicated PVD holdings view with contribution breakdowns and SEC classification
  So that I can audit employee/employer pools, policy weights, and risk spectrum levels

  Background:
    Given I open the SGSK Wealth application
    And I switch to the Holdings view
    And I switch to the Provident Fund holdings view

  @smoke @TC-PVD-01
  Scenario: TC-PVD-01: Dedicated PVD screen renders hero KPIs, split bar, donut chart, and SEC risk spectrum
    Then the PVD holdings screen should be visible
    And the PVD executive hero card should display master fund "ไทยพาณิชย์ มาสเตอร์ฟันด์"
    And the PVD 4-segment composition split bar should be visible
    And the PVD policy allocation donut card should be visible
    And the SEC risk spectrum card should display "RS6" and all 8 risk levels

  @TC-PVD-02
  Scenario: TC-PVD-02: Mode toggle synchronizes Market Holdings and Provident Fund views
    When I switch to the Market Holdings sub-view
    Then the Market Holdings mode button should be active
    And the card for "AAPL" should be visible
    When I select the "Provident Fund" asset tab
    Then the PVD holdings screen should be visible
    And the Provident Fund mode button should be active

  @TC-PVD-03
  Scenario: TC-PVD-03: PVD sub-policy cards display SEC metadata badges, objectives, and contribution pools
    Then 2 PVD sub-policy results should be visible
    And the PVD policy card "PVDSP500" should display SEC metadata "RS6", "EQ-F", and "Track S&P 500 long-term growth"
    And the PVD policy card "PVDSP500" should display employee and employer pool breakdowns
    And the PVD policy card "PVDMPINC" should display SEC metadata "RS4", "FI-M", and "Preserve capital with steady fixed income yield"

  @TC-PVD-04
  Scenario Outline: TC-PVD-04: Search input filters PVD sub-policies by symbol, AIMC description, and risk code
    When I search PVD sub-policies for "<query>"
    Then <count> PVD sub-policy results should be visible
    And the PVD policy card "<expected_symbol>" should be visible

    Examples:
      | query        | count | expected_symbol |
      | PVDSP500     | 1     | PVDSP500        |
      | Fixed Income | 1     | PVDMPINC        |
      | RS6          | 1     | PVDSP500        |
      | มาสเตอร์      | 2     | PVDSP500        |

  @TC-PVD-05
  Scenario Outline: TC-PVD-05: Sorting PVD sub-policies reorders cards accurately
    When I sort PVD sub-policies descending by "<sort_label>"
    Then the first PVD policy card should be "<first_symbol>"

    Examples:
      | sort_label | first_symbol |
      | Value      | PVDSP500     |
      | Return     | PVDMPINC     |
      | Principal  | PVDSP500     |
      | Units      | PVDMPINC     |
      | Risk       | PVDSP500     |
