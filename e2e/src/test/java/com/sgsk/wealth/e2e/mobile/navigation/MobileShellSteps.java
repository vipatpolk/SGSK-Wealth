package com.sgsk.wealth.e2e.mobile.navigation;

import com.sgsk.wealth.e2e.mobile.common.MobileDriverBridge;
import io.cucumber.java.en.Given;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;

import static org.junit.jupiter.api.Assertions.assertEquals;

public class MobileShellSteps {
    private final MobileDriverBridge driver;
    private final MobileShellScreen shellScreen;

    public MobileShellSteps(MobileDriverBridge driver, MobileShellScreen shellScreen) {
        this.driver = driver;
        this.shellScreen = shellScreen;
    }

    @Given("the SGSK Wealth mobile application is launched")
    public void launchMobileApp() {
        shellScreen.launchApp();
    }

    @When("I switch to the {string} mobile tab")
    public void switchMobileTab(String tabName) {
        shellScreen.tapBottomTab(tabName);
    }

    @When("I switch the mobile display currency")
    public void switchMobileCurrency() {
        shellScreen.toggleCurrency();
    }

    @When("I switch the mobile application language")
    public void switchMobileLanguage() {
        shellScreen.toggleLanguage();
    }

    @When("I toggle mobile privacy mode")
    public void toggleMobilePrivacy() {
        shellScreen.togglePrivacyMode();
    }

    @When("I toggle the mobile visual theme")
    public void toggleMobileTheme() {
        shellScreen.toggleTheme();
    }

    @When("I trigger a manual refresh on mobile")
    public void triggerMobileRefresh() {
        shellScreen.tapRefresh();
    }

    @When("I use the {string} quick action on the mobile dashboard")
    public void useMobileDashboardQuickAction(String target) {
        shellScreen.tapQuickAction(target);
    }

    @Then("the mobile bottom tab bar should be displayed")
    public void verifyBottomTabBarDisplayed() {
        driver.assertVisible("#mobile-tab-bar");
    }

    @Then("the mobile dashboard hero summary should be displayed")
    public void verifyDashboardHeroDisplayed() {
        driver.assertVisible("#mobile-dashboard-hero");
    }

    @Then("the mobile dashboard overview sections should be displayed")
    public void verifyDashboardSectionsDisplayed() {
        shellScreen.assertDashboardWidgetsVisible();
    }

    @Then("the mobile {string} workspace should be active")
    public void verifyMobileTabWorkspaceActive(String tabName) {
        shellScreen.assertTabWorkspaceVisible(tabName);
    }

    @Then("the mobile display currency should show {string}")
    public void verifyMobileCurrency(String expectedCurrency) {
        shellScreen.openUserSettings();
        String selector = "USD".equalsIgnoreCase(expectedCurrency.trim())
                ? "#mobile-settings-currency-usd"
                : "#mobile-settings-currency-thb";
        org.junit.jupiter.api.Assertions.assertTrue(
                driver.hasClass(selector, "active"),
                "Expected mobile currency " + expectedCurrency + " to be active"
        );
        shellScreen.closeUserSettings();
    }

    @Then("the mobile application language should be {string}")
    public void verifyMobileLanguage(String expectedLang) {
        shellScreen.openUserSettings();
        String selector = "EN".equalsIgnoreCase(expectedLang.trim())
                ? "#mobile-settings-lang-en"
                : "#mobile-settings-lang-th";
        org.junit.jupiter.api.Assertions.assertTrue(
                driver.hasClass(selector, "active"),
                "Expected mobile language " + expectedLang + " to be active"
        );
        shellScreen.closeUserSettings();
    }

    @Then("mobile privacy masking should be active")
    public void verifyPrivacyActive() {
        assertEquals("true", driver.getHtmlAttribute("data-privacy"));
    }

    @Then("the mobile visual theme should be {string}")
    public void verifyMobileTheme(String expectedTheme) {
        assertEquals(expectedTheme, driver.getHtmlAttribute("data-theme"));
    }
}
