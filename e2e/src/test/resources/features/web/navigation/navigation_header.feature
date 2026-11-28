@web @navigation @smoke
Feature: Global Navigation & Header Controls
  As a SGSK Wealth investor
  I want to switch views, currencies, and themes
  So that I can monitor my portfolio across different layouts and currencies

  Background:
    Given I open the SGSK Wealth application

  @smoke @TC-NAV-01
  Scenario: TC-NAV-01: Application lands on Dashboard view by default
    Then the Dashboard view should be visible

  @smoke @TC-NAV-02
  Scenario Outline: TC-NAV-02: Currency Toggle switches display currency from <InitialCurrency> to <TargetCurrency>
    Given the active currency is "<InitialCurrency>"
    When I switch currency to "<TargetCurrency>"
    Then the "<TargetCurrency>" currency button should be active

    Examples:
      | InitialCurrency | TargetCurrency |
      | THB             | USD            |
      | USD             | THB            |

  @TC-NAV-03
  Scenario Outline: TC-NAV-03: Theme Switcher toggles theme from <InitialTheme> to <ExpectedTheme>
    Given the application theme is "<InitialTheme>"
    When I toggle the theme
    Then the document theme attribute should be "<ExpectedTheme>"

    Examples:
      | InitialTheme | ExpectedTheme |
      | dark         | light         |
      | light        | dark          |

  @TC-NAV-04
  Scenario Outline: TC-NAV-04: Primary navigation routes to each workspace module
    When I navigate to the "<ViewName>" workspace view
    Then the "<ViewName>" workspace view should be visible

    Examples:
      | ViewName     |
      | Holdings     |
      | Analytics    |
      | Dividends    |
      | Transactions |
      | Tools        |
      | Dashboard    |

  @smoke @TC-NAV-05
  Scenario Outline: TC-NAV-05: Language Switcher toggles display language to <TargetLang>
    Given the active language is "<InitialLang>"
    When I switch language to "<TargetLang>"
    Then the "<TargetLang>" language button should be active
    And the document language attribute should be "<ExpectedAttr>"
    And the navigation dashboard button should display "<ExpectedNavText>"

    Examples:
      | InitialLang | TargetLang | ExpectedAttr | ExpectedNavText |
      | EN          | TH         | th           | ภาพรวม          |
      | TH          | EN         | en           | Dashboard       |

  @smoke @TC-NAV-06
  Scenario Outline: TC-NAV-06: Analytics sub-tab navigation routes to <ViewName> view
    When I navigate to the "<ViewName>" workspace view
    Then the "<ViewName>" workspace view should be visible

    Examples:
      | ViewName    |
      | Allocation  |
      | Performance |

  @smoke @TC-I18N-01
  Scenario Outline: TC-I18N-01: All workspace views render without raw dotted i18n keys in <Lang>
    When I switch language to "<Lang>"
    Then no untranslated i18n keys should appear across any workspace view

    Examples:
      | Lang |
      | EN   |
      | TH   |
