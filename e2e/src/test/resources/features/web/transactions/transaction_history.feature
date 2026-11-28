@web @transactions
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
  Scenario: TC-TXN-03: Selecting a symbol opens the transaction hero summary card
    When I filter transactions to symbol "AAPL"
    Then the symbol hero card should be visible
    And the symbol hero card should display "AAPL"

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
  Scenario Outline: TC-TXN-06: Transaction ledger localizes asset names in <Language>
    When I switch language to "<Language>"
    Then the transaction ledger should display localized asset names:
      | Symbol | ExpectedName |
      | PTT.BK | <PttName>    |
      | K-USA  | <KusaName>   |
      | AAPL   | Apple Inc.   |
      | BTC    | Bitcoin      |

    Examples:
      | Language | PttName                    | KusaName                     |
      | TH       | บริษัท ปตท. จำกัด (มหาชน) | กองทุนเปิดเค ยูเอสเอ หุ้นทุน |
      | EN       | PTT Public Company Limited | Kasikorn US Equity Fund      |

  @TC-TXN-07
  Scenario Outline: TC-TXN-07: Transaction symbol selector dropdown localizes asset names in <Language>
    When I switch language to "<Language>"
    Then the transaction symbol selector should display localized asset names:
      | Symbol | ExpectedName |
      | PTT.BK | <PttName>    |
      | K-USA  | <KusaName>   |
      | AAPL   | Apple Inc.   |
      | BTC    | Bitcoin      |

    Examples:
      | Language | PttName                    | KusaName                     |
      | TH       | บริษัท ปตท. จำกัด (มหาชน) | กองทุนเปิดเค ยูเอสเอ หุ้นทุน |
      | EN       | PTT Public Company Limited | Kasikorn US Equity Fund      |

  @TC-TXN-08
  Scenario: TC-TXN-08: Resetting symbol filter hides the transaction hero summary card
    Given transactions are filtered to symbol "AAPL"
    When I reset transactions to all symbols
    Then the symbol hero card should be hidden

  @smoke @TC-TXN-09
  Scenario Outline: TC-TXN-09: Transaction hero subtitle localizes <Symbol> in <Language>
    When I switch language to "<Language>"
    And I focus transaction symbol "<Symbol>"
    Then the transaction hero card subtitle should be "<ExpectedName>"

    Examples:
      | Language | Symbol | ExpectedName                 |
      | TH       | PTT.BK | บริษัท ปตท. จำกัด (มหาชน)   |
      | TH       | K-USA  | กองทุนเปิดเค ยูเอสเอ หุ้นทุน |
      | TH       | AAPL   | Apple Inc.                   |
      | TH       | BTC    | Bitcoin                      |
      | EN       | PTT.BK | PTT Public Company Limited   |
      | EN       | K-USA  | Kasikorn US Equity Fund      |
      | EN       | AAPL   | Apple Inc.                   |
      | EN       | BTC    | Bitcoin                      |

  @TC-TXN-10
  Scenario: TC-TXN-10: Transaction ledger pagination updates page size cleanly
    When I change the transaction page size to "50"
    Then the transaction page size should be "50"

  @smoke @TC-TXN-11
  Scenario: TC-TXN-11: Transaction ledger and asset filter bar exclude Provident Fund snapshots
    Then the transaction asset filter bar should exclude "Provident Fund"
    And the transaction ledger should exclude "PVDSP500"
    And the transaction ledger should exclude "PVDMPINC"
