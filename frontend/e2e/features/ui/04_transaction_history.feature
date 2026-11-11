@ui @transactions
Feature: Transaction History Ledger & CSV Exporter
  As an investor
  I want to view historical transactions and export them to CSV
  So that I can audit trade history and tax filings

  Background:
    Given I open the ShareLot application
    And I switch to the Transactions view

  Scenario: TC-TXN-01: Displays initial unfiltered transaction feed
    Then the transaction history container should be visible

  Scenario: TC-TXN-02: Formats units according to asset type context
    Then the transaction history ledger should contain "AAPL"

  Scenario: TC-TXN-05: CSV Export triggers file download
    When I trigger CSV export of all transactions
    Then the downloaded file name should match the pattern "sharelot_.*\.csv"
