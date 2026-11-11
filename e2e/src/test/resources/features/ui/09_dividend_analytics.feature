@ui @dividend
Feature: Dividend Analytics & Yield on Cost (YOC)
  As an investor
  I want to track dividend income, Yield on Cost (YOC), and monthly cashflow timelines
  So that I can evaluate passive cashflow generation

  Background:
    Given I open the SGSK Wealth application
    And I navigate to the Dividends view

  @smoke @TC-DIV-01
  Scenario: TC-DIV-01: Displays summary KPI cards including Yield on Cost (YOC)
    Then the dividend view should render 5 summary KPI cards
    And the Yield on Cost card should display "7.50%" and label "Yield on Cost (YOC)"

  @TC-DIV-02
  Scenario: TC-DIV-02: Displays asset type breakdown cards with accurate YOC indicators
    Then the dividend asset breakdown card for "Thai Stock" should display YOC "7.43%"
    And the dividend asset breakdown card for "U.S. Stock" should display YOC "0.54%"

  @smoke @TC-DIV-03
  Scenario: TC-DIV-03: Switching asset type filters YOC KPI card accurately without currency distortion
    Then the Yield on Cost KPI card should show "7.50%"
    When I filter dividends to asset type "Thai Stocks"
    Then the Yield on Cost KPI card should show "7.43%"
    When I filter dividends to asset type "U.S. Stocks"
    Then the Yield on Cost KPI card should show "0.54%"
    When I filter dividends to asset type "All Assets"
    Then the Yield on Cost KPI card should show "7.50%"

  @TC-DIV-05
  Scenario: TC-DIV-05: Monthly Cashflow Timeline includes Bonds in legend and timeline segments
    Then the monthly cashflow timeline chart should be visible
    And the timeline legend should contain "U.S. Stocks", "Thai Stocks", "Mutual Funds", and "Bonds"
