@ui @transactions
Feature: Transaction History Ledger & CSV Exporter
  As an investor
  I want to view historical transactions and export them to CSV
  So that I can audit trade history and tax filings

  Background:
    Given I open the SGSK Wealth application
    And I switch to the Transactions view

  @smoke @TC-TXN-01
  Scenario: TC-TXN-01: Displays initial unfiltered transaction feed
    Then the transaction history container should be visible

  @TC-TXN-02
  Scenario Outline: TC-TXN-02: Formats units according to asset type context
    When I filter transactions to symbol "<Symbol>"
    Then the symbol hero card should display "<Symbol>"
    And the symbol hero card should display "<UnitLabel>"

    Examples:
      | Symbol | UnitLabel |
      | AAPL   | shares    |
      | BTC    | coins     |
      | K-USA  | units     |

  @TC-TXN-03
  Scenario: TC-TXN-03: Selecting a symbol opens hero summary and returning restores all feed
    When I filter transactions to symbol "AAPL"
    Then the symbol hero card should be visible
    And the symbol hero card should display "AAPL"
    When I reset transactions to all symbols
    Then the symbol hero card should be hidden

  @TC-TXN-04
  Scenario: TC-TXN-04: Transaction symbol selector excludes Provident Fund policies
    When I browse the transaction symbol selector
    Then the symbol selector should list "AAPL"
    And the symbol selector should exclude "PVDSP500"
    And the symbol selector should exclude "PVDMPINC"

  @smoke @TC-TXN-05
  Scenario Outline: TC-TXN-05: CSV Export triggers file download for "<Scope>" scope
    When I trigger CSV export for "<Scope>" transactions
    Then the downloaded file name should match the pattern "(?:sgsk_wealth|sharelot)_.*\.csv"

    Examples:
      | Scope |
      | all   |
      | open  |

  @smoke @TC-TXN-06
  Scenario: TC-TXN-06: Transaction ledger and hero subtitle localize asset names across TH and EN
    When I switch language to TH
    Then the transaction ledger should display localized asset names:
      | Symbol | ExpectedName                 |
      | PTT.BK | บริษัท ปตท. จำกัด (มหาชน)   |
      | K-USA  | กองทุนเปิดเค ยูเอสเอ หุ้นทุน |
      | AAPL   | Apple Inc.                   |
      | BTC    | Bitcoin                      |
    When I focus transaction symbol "PTT.BK"
    Then the transaction hero card subtitle should be "บริษัท ปตท. จำกัด (มหาชน)"
    When I focus transaction symbol "K-USA"
    Then the transaction hero card subtitle should be "กองทุนเปิดเค ยูเอสเอ หุ้นทุน"
    When I focus transaction symbol "AAPL"
    Then the transaction hero card subtitle should be "Apple Inc."
    When I focus transaction symbol "BTC"
    Then the transaction hero card subtitle should be "Bitcoin"
    When I switch language to EN
    And I view all transactions in the unified ledger
    Then the transaction ledger should display localized asset names:
      | Symbol | ExpectedName               |
      | PTT.BK | PTT Public Company Limited |
      | K-USA  | Kasikorn US Equity Fund    |
      | AAPL   | Apple Inc.                 |
      | BTC    | Bitcoin                    |
    When I focus transaction symbol "PTT.BK"
    Then the transaction hero card subtitle should be "PTT Public Company Limited"
    When I focus transaction symbol "K-USA"
    Then the transaction hero card subtitle should be "Kasikorn US Equity Fund"

  @TC-TXN-07
  Scenario: TC-TXN-07: Transaction symbol selector dropdown localizes asset names across TH and EN
    When I switch language to TH
    Then the transaction symbol selector should display localized asset names:
      | Symbol | ExpectedName                 |
      | PTT.BK | บริษัท ปตท. จำกัด (มหาชน)   |
      | K-USA  | กองทุนเปิดเค ยูเอสเอ หุ้นทุน |
      | AAPL   | Apple Inc.                   |
      | BTC    | Bitcoin                      |
    When I switch language to EN
    Then the transaction symbol selector should display localized asset names:
      | Symbol | ExpectedName               |
      | PTT.BK | PTT Public Company Limited |
      | K-USA  | Kasikorn US Equity Fund    |
      | AAPL   | Apple Inc.                 |
      | BTC    | Bitcoin                    |
