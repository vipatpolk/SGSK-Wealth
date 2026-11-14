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
  Scenario Outline: TC-DIV-02: Displays asset type breakdown cards with accurate YOC indicators
    Then the dividend asset breakdown card for "<AssetCard>" should display YOC "<ExpectedYoc>"

    Examples:
      | AssetCard  | ExpectedYoc |
      | Thai Stock | 7.43%       |
      | U.S. Stock | 0.54%       |

  @smoke @TC-DIV-03
  Scenario Outline: TC-DIV-03: Switching asset type filters YOC KPI card accurately without currency distortion
    When I filter dividends to asset type "<AssetFilter>"
    Then the Yield on Cost KPI card should show "<ExpectedYoc>"

    Examples:
      | AssetFilter | ExpectedYoc |
      | All Assets  | 7.50%       |
      | Thai Stocks | 7.43%       |
      | U.S. Stocks | 0.54%       |

  @TC-DIV-04
  Scenario Outline: TC-DIV-04: Historical year filter pills update active state and Net Dividends KPI card
    When I select the dividend year filter "<YearFilter>"
    Then the "<YearFilter>" dividend year pill should be active
    And the Net Dividends KPI card should contain "<ExpectedAmount>"

    Examples:
      | YearFilter | ExpectedAmount |
      | 2026       | 1,080.00       |
      | All Time   | 1,080.00       |

  @TC-DIV-05
  Scenario: TC-DIV-05: Monthly Cashflow Timeline includes Bonds in legend and timeline segments
    Then the monthly cashflow timeline chart should be visible
    And the timeline legend should contain "U.S. Stocks", "Thai Stocks", "Mutual Funds", and "Bonds"
