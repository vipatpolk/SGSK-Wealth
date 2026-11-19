@mobile @android @ios
Feature: Mobile Portfolio Holdings, Provident Fund, and SEC Factsheets
  As a mobile investor
  I want to search, sort, inspect FIFO lots, view closed positions, review PVD analytics, and read fund factsheets
  So that I can monitor every asset class accurately on my phone

  Background:
    Given the SGSK Wealth mobile application is launched
    And I switch to the "Holdings" mobile tab

  Scenario: Inspecting Market Holdings, searching by ticker, and expanding FIFO share lots
    When I filter mobile holdings by asset tab "us-stock"
    And I filter mobile holdings by keyword "AAPL"
    And I expand the FIFO lots of the first mobile holding
    Then the mobile market holdings list should be displayed
    And the mobile holdings list should include "AAPL"

  Scenario: Sorting holdings and expanding all FIFO lot panels
    When I toggle the mobile holdings sort direction
    And I expand all mobile holding lot panels
    Then the mobile market holdings list should be displayed

  Scenario: Reviewing Closed Positions realized performance on mobile
    When I filter mobile holdings by asset tab "closed-position"
    Then the mobile closed positions list should be displayed

  Scenario: Switching to Provident Fund mode shows Executive PVD split bar and SEC risk spectrum
    When I switch mobile holdings mode to "pvd"
    Then the mobile provident fund holdings list should be displayed

  Scenario: Opening the SEC Fund Factsheet modal sheet for a Mutual Fund
    When I filter mobile holdings by asset tab "mutual-fund"
    And I inspect the factsheet of a fund holding on mobile
    Then the mobile SEC factsheet modal should be visible

  Scenario: Dismissing the SEC Fund Factsheet modal sheet restores holdings view
    When I filter mobile holdings by asset tab "mutual-fund"
    And I inspect the factsheet of a fund holding on mobile
    And I dismiss the mobile fund factsheet modal
    Then the mobile SEC factsheet modal should be dismissed
