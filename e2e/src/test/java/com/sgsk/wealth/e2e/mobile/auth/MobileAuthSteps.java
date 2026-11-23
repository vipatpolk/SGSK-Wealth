package com.sgsk.wealth.e2e.mobile.auth;

import com.sgsk.wealth.e2e.mobile.common.MobileDriverBridge;
import com.sgsk.wealth.e2e.mobile.navigation.MobileShellScreen;
import io.cucumber.java.en.Given;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;

public class MobileAuthSteps {
    private final MobileDriverBridge driver;
    private final MobileShellScreen shellScreen;

    public MobileAuthSteps(MobileDriverBridge driver, MobileShellScreen shellScreen) {
        this.driver = driver;
        this.shellScreen = shellScreen;
    }

    @Given("the SGSK Wealth mobile application is opened fresh")
    public void openMobileFresh() {
        if (!driver.isAppiumActive()) {
            String mode = "ANDROID".equalsIgnoreCase(driver.context().getMobilePlatform()) ? "md" : "ios";
            driver.webView().navigate("/?ionic:mode=" + mode);
        }
        driver.waitForVisible("#mobile-auth-guest-btn");
    }

    @Given("I enter the local guest workspace on mobile")
    public void enterMobileGuestWorkspace() {
        openMobileFresh();
        continueAsGuestMobile();
    }

    @Then("the mobile authentication modal should be visible")
    public void verifyMobileAuthVisible() {
        driver.assertVisible("#mobile-auth-modal");
        driver.assertVisible("#mobile-auth-google-btn");
        driver.assertVisible("#mobile-auth-guest-btn");
    }

    @When("I continue as guest on mobile")
    public void continueAsGuestMobile() {
        driver.tap("#mobile-auth-guest-btn");
        driver.waitForVisible("#mobile-tab-bar");
    }

    @Then("the mobile local portfolio banner should be visible")
    public void verifyMobileLocalBannerVisible() {
        driver.assertVisible("#mobile-local-banner");
    }

    @Then("the mobile local portfolio banner should not be visible")
    public void verifyMobileLocalBannerHidden() {
        driver.assertNotPresent("#mobile-local-banner");
    }

    @When("I open the mobile local portfolio manager and load sample data")
    public void openMobileLocalManagerAndLoadSample() {
        driver.tap("#mobile-local-manage-btn");
        driver.waitForVisible("#mobile-local-tab-import");
        driver.tap("#mobile-local-tab-import");
        driver.tap("#mobile-local-load-sample-btn");
        driver.tap("#mobile-local-close-btn");
        driver.waitForHidden("#mobile-local-close-btn");
    }

    @Then("the mobile local portfolio banner should reflect sample holdings")
    public void verifyMobileLocalSampleLoaded() {
        driver.assertVisible("#mobile-local-banner");
    }

    @When("I open mobile user settings")
    public void openMobileSettings() {
        shellScreen.openUserSettings();
    }

    @Then("the mobile local management section should be hidden for owner mode")
    public void verifyMobileOwnerHidesLocalManage() {
        driver.assertNotPresent("#mobile-settings-manage-local-btn");
        driver.assertVisible("#mobile-settings-signout-btn");
        shellScreen.closeUserSettings();
    }

    @When("I select the {string} theme in mobile user settings")
    public void selectMobileThemeInSettings(String mode) {
        shellScreen.selectTheme(mode);
    }

    @When("I reload the mobile application")
    public void reloadMobileApplication() {
        if (!driver.isAppiumActive()) {
            driver.webView().reload();
            driver.waitForVisible("#mobile-tab-bar");
        }
    }

    @Then("the mobile active theme mode should be {string} with resolved theme {string}")
    public void verifyMobileThemeModeAndResolved(String expectedMode, String expectedResolved) {
        String actualMode = driver.getHtmlAttribute("data-theme-mode");
        String actualResolved = driver.getHtmlAttribute("data-theme");
        org.junit.jupiter.api.Assertions.assertEquals(expectedMode.toLowerCase(), actualMode);
        org.junit.jupiter.api.Assertions.assertEquals(expectedResolved.toLowerCase(), actualResolved);
    }

    @Then("the mobile active theme mode should be {string}")
    public void verifyMobileThemeMode(String expectedMode) {
        String mode = expectedMode.toLowerCase();
        String actualMode = driver.getHtmlAttribute("data-theme-mode");
        String actualResolved = driver.getHtmlAttribute("data-theme");
        org.junit.jupiter.api.Assertions.assertEquals(mode, actualMode);
        if ("light".equals(mode) || "dark".equals(mode)) {
            org.junit.jupiter.api.Assertions.assertEquals(mode, actualResolved);
        } else {
            org.junit.jupiter.api.Assertions.assertTrue(
                    "dark".equals(actualResolved) || "light".equals(actualResolved),
                    "Expected mobile resolved theme to be dark or light, got: " + actualResolved
            );
        }
    }
}
