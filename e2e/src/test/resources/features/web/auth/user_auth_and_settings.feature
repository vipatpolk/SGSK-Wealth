@web @auth
Feature: User Authentication, Top-Right User Menu, and Local Portfolio Workspace
  As an investor using SGSK Wealth
  I want to sign in or continue as a guest with local data and manage preferences from the user menu
  So that owner cloud sheets remain protected while guests can manage their own on-device portfolio

  @smoke @auth_fresh @guest @TC-WEB-AUTH-01
  Scenario: TC-WEB-AUTH-01: First-time visitor sees Sign-In screen
    Given I open the SGSK Wealth application
    Then the Sign-In authentication gate should be visible

  @smoke @auth_fresh @guest @TC-WEB-AUTH-02
  Scenario: TC-WEB-AUTH-02: Guest chooses local mode with zero cloud portfolio calls
    Given the Sign-In authentication gate is displayed
    When I choose to continue as guest for local data only
    Then the local portfolio workspace banner should be visible
    And no cloud portfolio requests should be sent during guest session

  @guest @TC-WEB-AUTH-03
  Scenario: TC-WEB-AUTH-03: Guest user loads sample portfolio locally and opens user settings
    Given I enter the local guest portfolio workspace
    When I load the local sample portfolio from the workspace bar
    And I open the top-right user menu settings dialog
    Then the local portfolio should display local positions
    And the Google sign-in option and local management menu should be accessible

  @smoke @TC-WEB-AUTH-04
  Scenario: TC-WEB-AUTH-04: Authorized owner always views cloud portfolio with local controls hidden
    Given I open the SGSK Wealth application
    When I inspect the top-right user menu
    Then the Dashboard view should be visible
    And the local portfolio workspace banner should not be visible
    And the local portfolio menu option should be hidden for owner mode

  @theme @TC-WEB-AUTH-05
  Scenario Outline: TC-WEB-AUTH-05: Theme preference persists "<mode>" mode across page reload
    Given I open the SGSK Wealth application
    When I select the "<mode>" theme in user settings
    And I reload the web application
    Then the active theme mode should be "<mode>"

    Examples:
      | mode   |
      | light  |
      | system |
      | dark   |
