@cross-platform @integration @tools @smoke
Feature: Cross-Platform Guest Mode & Order Simulation Parity
  As a guest investor
  I want local portfolio isolation and average-cost order simulation to behave identically across targets
  So that I receive consistent financial guidance on API, Web, and Mobile

  Scenario: Guest investor verifies local portfolio mode across targets
    Given an active cross-platform test target
    When the investor inspects the active portfolio data source
    Then the active portfolio source should be "local"

  Scenario: Guest investor verifies buy-order average cost simulation across targets
    Given an active cross-platform test target
    When the investor simulates buying 10 shares at 80 USD on an existing 10 shares at 100 USD
    Then the simulated total shares should equal "20"
    And the simulated average cost should equal "90"
