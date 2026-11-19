package com.sgsk.wealth.e2e.mobile.platform;

import com.sgsk.wealth.e2e.mobile.common.MobileDriverBridge;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;

public class MobilePlatformSteps {
    private final MobileDriverBridge driver;
    private final MobilePlatformScreen platformScreen;

    public MobilePlatformSteps(MobileDriverBridge driver, MobilePlatformScreen platformScreen) {
        this.driver = driver;
        this.platformScreen = platformScreen;
    }

    @When("the mobile backend encounters an internal server failure")
    public void triggerMobileBackendFailure() {
        platformScreen.simulateOfflineApiFailure();
    }

    @When("I recover the mobile API and refresh")
    public void recoverMobileApiAndRefresh() {
        platformScreen.recoverApiAndRefresh();
    }

    @When("I navigate back on Android from the mobile factsheet sheet")
    public void navigateBackFromAndroidFactsheet() {
        platformScreen.pressAndroidHardwareBackIfNative();
    }

    @Then("the mobile app should render with Ionic {string} mode")
    public void verifyIonicModeClass(String modeClass) {
        platformScreen.assertIonicPlatformClass(modeClass);
    }

    @Then("the mobile viewport dimensions should match {int} by {int}")
    public void verifyMobileViewportDimensions(int width, int height) {
        platformScreen.assertMobileViewportDimensions(width, height);
    }

    @Then("the mobile error resilience banner should be visible")
    public void verifyMobileErrorCardVisible() {
        driver.assertVisible("#mobile-error-card");
    }
}
