@mobile @android @ios @auth
Feature: Mobile Authentication, User Settings Sheet, and Local Portfolio Workspace
  As a mobile investor using SGSK Wealth on iOS or Android
  I want to sign in or use local guest storage and configure app preferences in User Settings
  So that my local portfolio works offline from cloud sheets and owner mode always shows cloud sheets

  @smoke @auth_fresh @guest @TC-MOB-AUTH-01
  Scenario: TC-MOB-AUTH-01: First-visit mobile user sees Auth modal
    Given the SGSK Wealth mobile application is opened fresh
    Then the mobile authentication modal should be visible

  @smoke @auth_fresh @guest @TC-MOB-AUTH-02
  Scenario: TC-MOB-AUTH-02: First-visit mobile user continues into local guest mode
    Given the SGSK Wealth mobile application is opened fresh
    When I continue as guest on mobile
    Then the mobile local portfolio banner should be visible

  @guest @TC-MOB-AUTH-03
  Scenario: TC-MOB-AUTH-03: Mobile guest opens local portfolio manager and loads sample data
    Given I enter the local guest workspace on mobile
    When I open the mobile local portfolio manager and load sample data
    Then the mobile local portfolio banner should reflect sample holdings

  @smoke @TC-MOB-AUTH-04
  Scenario: TC-MOB-AUTH-04: Mobile owner session hides local portfolio manager from settings
    Given the SGSK Wealth mobile application is launched
    When I open mobile user settings
    Then the mobile local management section should be hidden for owner mode
    And the mobile local portfolio banner should not be visible
