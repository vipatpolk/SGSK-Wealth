package com.sgsk.wealth.e2e.mobile.analytics;

import com.sgsk.wealth.e2e.mobile.common.MobileDriverBridge;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;

public class MobileAnalyticsSteps {
    private final MobileDriverBridge driver;
    private final MobileAnalyticsScreen analyticsScreen;

    public MobileAnalyticsSteps(MobileDriverBridge driver, MobileAnalyticsScreen analyticsScreen) {
        this.driver = driver;
        this.analyticsScreen = analyticsScreen;
    }

    @When("I switch mobile analytics view to {string}")
    public void switchAnalyticsView(String segment) {
        analyticsScreen.selectAnalyticsSegment(segment);
    }

    @When("I drill down into the {string} mobile allocation class")
    public void drillDownMobileAllocationClass(String assetClass) {
        analyticsScreen.drillDownAllocationClass(assetClass);
    }

    @When("I reset the mobile allocation class drilldown")
    public void resetMobileAllocationDrilldown() {
        analyticsScreen.resetAllocationDrilldown();
    }

    @When("I select the {string} timeframe in mobile performance")
    public void selectMobilePerformanceTimeframe(String timeframe) {
        analyticsScreen.selectPerformanceTimeframe(timeframe);
    }

    @Then("the mobile currency exposure card should be displayed")
    public void verifyMobileCurrencyExposureDisplayed() {
        driver.assertVisible("#mobile-currency-exposure");
    }

    @Then("the mobile allocation drilldown reset action should be visible")
    public void verifyMobileAllocationResetVisible() {
        driver.assertVisible("#mobile-alloc-reset-btn");
    }

    @Then("the mobile performance summary should be displayed")
    public void verifyMobilePerformanceDisplayed() {
        driver.assertVisible("#mobile-performance-summary");
    }
}
