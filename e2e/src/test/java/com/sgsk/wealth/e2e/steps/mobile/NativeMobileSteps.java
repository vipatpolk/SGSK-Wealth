package com.sgsk.wealth.e2e.steps.mobile;

import com.sgsk.wealth.e2e.pages.mobile.IonicMobileScreen;
import io.cucumber.java.en.Given;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;

import static org.junit.jupiter.api.Assertions.assertEquals;

public class NativeMobileSteps {
    private final IonicMobileScreen mobileScreen;

    public NativeMobileSteps(IonicMobileScreen mobileScreen) {
        this.mobileScreen = mobileScreen;
    }

    @Given("the SGSK Wealth mobile application is launched")
    public void launchMobileApp() {
        mobileScreen.launchApp();
    }

    @When("I switch to the {string} mobile tab")
    public void switchMobileTab(String tabName) {
        mobileScreen.tapBottomTab(tabName);
    }

    @When("I switch the mobile display currency")
    public void switchMobileCurrency() {
        mobileScreen.toggleCurrency();
    }

    @When("I switch the mobile application language")
    public void switchMobileLanguage() {
        mobileScreen.toggleLanguage();
    }

    @When("I toggle mobile privacy mode")
    public void toggleMobilePrivacy() {
        mobileScreen.togglePrivacyMode();
    }

    @When("I switch mobile holdings mode to {string}")
    public void switchHoldingsMode(String mode) {
        mobileScreen.selectHoldingsMode(mode);
    }

    @When("I filter mobile holdings by asset tab {string}")
    public void filterHoldingsByTab(String assetTabId) {
        mobileScreen.selectAssetChip(assetTabId);
    }

    @When("I expand the FIFO lots of the first mobile holding")
    public void expandFirstMobileHoldingLots() {
        mobileScreen.expandFirstSymbolLots();
    }

    @When("I switch mobile analytics view to {string}")
    public void switchAnalyticsView(String segment) {
        mobileScreen.selectAnalyticsSegment(segment);
    }

    @When("I select the {string} financial tool on mobile")
    public void selectMobileTool(String tool) {
        mobileScreen.selectToolTab(tool);
    }

    @When("I simulate buying {double} shares at price {double} on mobile")
    public void simulateOrderOnMobile(double shares, double price) {
        mobileScreen.enterAvgCostSimulationValues(shares, price);
        mobileScreen.runAvgCostSimulation();
    }

    @Then("the mobile bottom tab bar should be displayed")
    public void verifyBottomTabBarDisplayed() {
        mobileScreen.assertVisible("#mobile-tab-bar");
    }

    @Then("the mobile dashboard hero summary should be displayed")
    public void verifyDashboardHeroDisplayed() {
        mobileScreen.assertVisible("#mobile-dashboard-hero");
    }

    @Then("the mobile display currency should show {string}")
    public void verifyMobileCurrency(String expectedCurrency) {
        mobileScreen.assertTextContains("#mobile-currency-toggle", expectedCurrency);
    }

    @Then("the mobile application language should be {string}")
    public void verifyMobileLanguage(String expectedLang) {
        mobileScreen.assertTextContains("#mobile-lang-toggle", expectedLang);
    }

    @Then("mobile privacy masking should be active")
    public void verifyPrivacyActive() {
        assertEquals("true", mobileScreen.getHtmlAttribute("data-privacy"));
    }

    @Then("the mobile market holdings list should be displayed")
    public void verifyMobileHoldingsDisplayed() {
        mobileScreen.assertVisible("#mobile-position-cards");
    }

    @Then("the mobile provident fund holdings list should be displayed")
    public void verifyMobilePvdDisplayed() {
        mobileScreen.assertVisible("#mobile-pvd-list");
    }

    @Then("the mobile currency exposure card should be displayed")
    public void verifyMobileCurrencyExposureDisplayed() {
        mobileScreen.assertVisible("#mobile-currency-exposure");
    }

    @Then("the mobile performance summary should be displayed")
    public void verifyMobilePerformanceDisplayed() {
        mobileScreen.assertVisible("#mobile-performance-summary");
    }

    @Then("the mobile dividends summary should be displayed")
    public void verifyMobileDividendsDisplayed() {
        mobileScreen.assertVisible("#mobile-dividends-hero");
    }

    @Then("the mobile simulation result should be displayed")
    public void verifyMobileSimulationResultDisplayed() {
        mobileScreen.assertVisible("#mobile-sim-result");
    }

    @Then("the mobile rebalance plan summary should be displayed")
    public void verifyMobileRebalanceResultDisplayed() {
        mobileScreen.assertVisible("#mobile-rebalance-result");
    }

    @Then("the mobile TVM projection summary should be displayed")
    public void verifyMobileTvmResultDisplayed() {
        mobileScreen.assertVisible("#mobile-tvm-result");
    }
}
