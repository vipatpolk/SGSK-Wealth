@mobile
Feature: Cross-Platform iOS, Android Mode Adaptation, and Mobile Error Resilience
  As a cross-platform mobile user
  I want adaptive Ionic iOS and Android Material layouts plus graceful API failure recovery
  So that SGSK Wealth feels native and resilient on both iOS and Android devices

  Background:
    Given the SGSK Wealth mobile application is launched

  @ios
  Scenario: iOS runtime renders Cupertino Ionic mode and iPhone touch viewport
    Then the mobile app should render with Ionic "ios" mode
    And the mobile viewport dimensions should match 390 by 844

  @ios
  Scenario: iOS native SEC factsheet sheet opens cleanly over holdings
    When I switch to the "Holdings" mobile tab
    And I filter mobile holdings by asset tab "mutual-fund"
    And I inspect the factsheet of a fund holding on mobile
    Then the mobile SEC factsheet modal should be visible

  @android
  Scenario: Android runtime renders Material Design Ionic mode and Pixel touch viewport
    Then the mobile app should render with Ionic "md" mode
    And the mobile viewport dimensions should match 412 by 915

  @android
  Scenario: Android native navigation handles SEC factsheet dismissal cleanly
    When I switch to the "Holdings" mobile tab
    And I filter mobile holdings by asset tab "mutual-fund"
    And I inspect the factsheet of a fund holding on mobile
    And I navigate back on Android from the mobile factsheet sheet
    Then the mobile SEC factsheet modal should be dismissed

  @android @ios
  Scenario: Mobile shell displays error resilience card on API failure
    When the mobile backend encounters an internal server failure
    Then the mobile error resilience banner should be visible

  @android @ios
  Scenario: Mobile shell recovers portfolio hero after retrying failed API
    When the mobile backend encounters an internal server failure
    And I recover the mobile API and refresh
    Then the mobile dashboard hero summary should be displayed
