@mobile @android @ios
Feature: Mobile Portfolio Holdings and Provident Fund Views
  As a mobile investor
  I want to browse Market Holdings, filter by asset class, inspect FIFO lots, and view Provident Funds
  So that I can track all positions from my phone

  Background:
    Given the SGSK Wealth mobile application is launched

  Scenario: Inspecting Market Holdings and expanding FIFO share lots
    When I switch to the "Holdings" mobile tab
    And I filter mobile holdings by asset tab "us-stock"
    And I expand the FIFO lots of the first mobile holding
    Then the mobile market holdings list should be displayed

  Scenario: Switching between Market Holdings and Provident Fund mode
    When I switch to the "Holdings" mobile tab
    And I switch mobile holdings mode to "pvd"
    Then the mobile provident fund holdings list should be displayed
