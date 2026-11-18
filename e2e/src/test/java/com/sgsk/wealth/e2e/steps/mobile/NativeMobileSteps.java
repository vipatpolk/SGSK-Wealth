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

    @When("I toggle the mobile visual theme")
    public void toggleMobileTheme() {
        mobileScreen.toggleTheme();
    }

    @When("I trigger a manual refresh on mobile")
    public void triggerMobileRefresh() {
        mobileScreen.tapRefresh();
    }

    @When("I use the {string} quick action on the mobile dashboard")
    public void useMobileDashboardQuickAction(String target) {
        mobileScreen.tapQuickAction(target);
    }

    @When("I switch mobile holdings mode to {string}")
    public void switchHoldingsMode(String mode) {
        mobileScreen.selectHoldingsMode(mode);
    }

    @When("I filter mobile holdings by asset tab {string}")
    public void filterHoldingsByTab(String assetTabId) {
        mobileScreen.selectAssetChip(assetTabId);
    }

    @When("I filter mobile holdings by keyword {string}")
    public void filterMobileHoldingsByKeyword(String query) {
        mobileScreen.searchHoldings(query);
    }

    @When("I toggle the mobile holdings sort direction")
    public void toggleMobileHoldingsSortDirection() {
        mobileScreen.toggleHoldingsSortDirection();
    }

    @When("I expand all mobile holding lot panels")
    public void expandAllMobileHoldingLots() {
        mobileScreen.toggleExpandAllHoldingsLots();
    }

    @When("I expand the FIFO lots of the first mobile holding")
    public void expandFirstMobileHoldingLots() {
        mobileScreen.expandFirstSymbolLots();
    }

    @When("I inspect the factsheet of a fund holding on mobile")
    public void openMobileFundFactsheet() {
        mobileScreen.openFirstFactsheetModal();
    }

    @When("I dismiss the mobile fund factsheet modal")
    public void closeMobileFundFactsheet() {
        mobileScreen.closeFactsheetModal();
    }

    @When("I switch mobile analytics view to {string}")
    public void switchAnalyticsView(String segment) {
        mobileScreen.selectAnalyticsSegment(segment);
    }

    @When("I drill down into the {string} mobile allocation class")
    public void drillDownMobileAllocationClass(String assetClass) {
        mobileScreen.drillDownAllocationClass(assetClass);
    }

    @When("I reset the mobile allocation class drilldown")
    public void resetMobileAllocationDrilldown() {
        mobileScreen.resetAllocationDrilldown();
    }

    @When("I select the {string} timeframe in mobile performance")
    public void selectMobilePerformanceTimeframe(String timeframe) {
        mobileScreen.selectPerformanceTimeframe(timeframe);
    }

    @When("I filter mobile dividends by asset class {string}")
    public void filterMobileDividendsByAsset(String assetType) {
        mobileScreen.filterDividendsByAsset(assetType);
    }

    @When("I inspect the monthly dividend bar on mobile")
    public void inspectMobileDividendMonthBar() {
        mobileScreen.tapFirstDividendMonthBar();
    }

    @When("I open a symbol dividend ledger modal on mobile")
    public void openMobileSymbolDividendLedger() {
        mobileScreen.openFirstDividendSymbolLedger();
    }

    @When("I close the mobile dividend ledger modal")
    public void closeMobileSymbolDividendLedger() {
        mobileScreen.closeDividendSymbolLedger();
    }

    @When("I open the mobile transaction symbol selector")
    public void openMobileTransactionSymbolSelector() {
        mobileScreen.openTransactionSymbolSelector();
    }

    @When("I pick {string} from the mobile transaction symbol sheet")
    public void selectSymbolInMobileTransactionSheet(String symbol) {
        mobileScreen.selectTransactionSymbolFromSheet(symbol);
    }

    @When("I clear the selected mobile transaction symbol")
    public void clearMobileTransactionSymbol() {
        mobileScreen.clearTransactionSymbolFilter();
    }

    @When("I filter mobile transactions by type {string}")
    public void filterMobileTransactionsByType(String type) {
        mobileScreen.filterTransactionsByType(type);
    }

    @When("I toggle mobile transaction sort order")
    public void toggleMobileTransactionsSortOrder() {
        mobileScreen.toggleTransactionsSortOrder();
    }

    @When("I select the {string} financial tool on mobile")
    public void selectMobileTool(String tool) {
        mobileScreen.selectToolTab(tool);
    }

    @When("I switch mobile average cost mode to {string}")
    public void switchMobileAvgCostMode(String mode) {
        mobileScreen.switchAvgCostMode(mode);
    }

    @When("I queue an order into the mobile simulation chain")
    public void queueMobileAvgCostOrder() {
        mobileScreen.queueAvgCostOrder();
    }

    @When("I simulate buying {double} shares at price {double} on mobile")
    public void simulateOrderOnMobile(double shares, double price) {
        mobileScreen.enterAvgCostSimulationValues(shares, price);
        mobileScreen.runAvgCostSimulation();
    }

    @When("I switch mobile rebalance mode to {string}")
    public void switchMobileRebalanceMode(String mode) {
        mobileScreen.switchRebalanceMode(mode);
    }

    @When("I adjust a mobile rebalance target weight")
    public void adjustMobileRebalanceWeight() {
        mobileScreen.incrementFirstRebalanceTarget();
    }

    @When("I set the mobile TVM calculation goal to {string}")
    public void setMobileTvmGoal(String goal) {
        mobileScreen.selectTvmSolveGoal(goal);
    }

    @When("I toggle the mobile TVM growth chart display mode")
    public void toggleMobileTvmChart() {
        mobileScreen.toggleTvmChartMode();
    }

    @When("I expand the mobile TVM accumulation schedule")
    public void expandMobileTvmSchedule() {
        mobileScreen.toggleTvmSchedule();
    }

    @When("the mobile backend encounters an internal server failure")
    public void triggerMobileBackendFailure() {
        mobileScreen.simulateOfflineApiFailure();
    }

    @When("I recover the mobile API and refresh")
    public void recoverMobileApiAndRefresh() {
        mobileScreen.recoverApiAndRefresh();
    }

    @When("I navigate back on Android from the mobile factsheet sheet")
    public void navigateBackFromAndroidFactsheet() {
        mobileScreen.pressAndroidHardwareBackIfNative();
    }

    @Then("the mobile bottom tab bar should be displayed")
    public void verifyBottomTabBarDisplayed() {
        mobileScreen.assertVisible("#mobile-tab-bar");
    }

    @Then("the mobile dashboard hero summary should be displayed")
    public void verifyDashboardHeroDisplayed() {
        mobileScreen.assertVisible("#mobile-dashboard-hero");
    }

    @Then("the mobile dashboard overview sections should be displayed")
    public void verifyDashboardSectionsDisplayed() {
        mobileScreen.assertDashboardWidgetsVisible();
    }

    @Then("the mobile {string} workspace should be active")
    public void verifyMobileTabWorkspaceActive(String tabName) {
        mobileScreen.assertTabWorkspaceVisible(tabName);
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

    @Then("the mobile visual theme should be {string}")
    public void verifyMobileTheme(String expectedTheme) {
        assertEquals(expectedTheme, mobileScreen.getHtmlAttribute("data-theme"));
    }

    @Then("the mobile market holdings list should be displayed")
    public void verifyMobileHoldingsDisplayed() {
        mobileScreen.assertVisible("#mobile-position-cards");
    }

    @Then("the mobile holdings list should include {string}")
    public void verifyMobileHoldingsIncludeSymbol(String symbol) {
        mobileScreen.assertAnyHoldingContainsSymbol(symbol);
    }

    @Then("the mobile closed positions list should be displayed")
    public void verifyMobileClosedPositionsDisplayed() {
        mobileScreen.assertClosedPositionsVisible();
    }

    @Then("the mobile provident fund holdings list should be displayed")
    public void verifyMobilePvdDisplayed() {
        mobileScreen.assertPvdExecutiveSectionsVisible();
    }

    @Then("the mobile SEC factsheet modal should be visible")
    public void verifyMobileFactsheetVisible() {
        mobileScreen.assertVisible("#mobile-factsheet-close");
    }

    @Then("the mobile SEC factsheet modal should be dismissed")
    public void verifyMobileFactsheetDismissed() {
        mobileScreen.assertFactsheetClosed();
    }

    @Then("the mobile currency exposure card should be displayed")
    public void verifyMobileCurrencyExposureDisplayed() {
        mobileScreen.assertVisible("#mobile-currency-exposure");
    }

    @Then("the mobile allocation drilldown reset action should be visible")
    public void verifyMobileAllocationResetVisible() {
        mobileScreen.assertVisible("#mobile-alloc-reset-btn");
    }

    @Then("the mobile performance summary should be displayed")
    public void verifyMobilePerformanceDisplayed() {
        mobileScreen.assertVisible("#mobile-performance-summary");
    }

    @Then("the mobile dividends summary should be displayed")
    public void verifyMobileDividendsDisplayed() {
        mobileScreen.assertVisible("#mobile-dividends-hero");
    }

    @Then("the mobile monthly dividend chart and ledger should be displayed")
    public void verifyMobileDividendChartAndLedgerDisplayed() {
        mobileScreen.assertVisible("#mobile-div-monthly-chart");
        mobileScreen.assertVisible("#mobile-dividend-ledger");
    }

    @Then("the mobile dividend symbol ledger modal should be displayed")
    public void verifyMobileDividendSymbolModalDisplayed() {
        mobileScreen.assertVisible("#mobile-div-ledger-close");
    }

    @Then("the mobile transactions feed should be displayed")
    public void verifyMobileTransactionsFeedDisplayed() {
        mobileScreen.assertVisible("#mobile-tx-list");
    }

    @Then("the mobile transactions view should show clear symbol action")
    public void verifyMobileTransactionClearVisible() {
        mobileScreen.assertVisible("#mobile-tx-clear-sym");
    }

    @Then("the mobile simulation result should be displayed")
    public void verifyMobileSimulationResultDisplayed() {
        mobileScreen.assertVisible("#mobile-sim-result");
    }

    @Then("the mobile simulation queue list should be displayed")
    public void verifyMobileSimulationQueueDisplayed() {
        mobileScreen.assertVisible("#mobile-avg-queue-list");
    }

    @Then("the mobile rebalance plan summary should be displayed")
    public void verifyMobileRebalanceResultDisplayed() {
        mobileScreen.assertVisible("#mobile-rebalance-result");
    }

    @Then("the mobile TVM projection summary should be displayed")
    public void verifyMobileTvmResultDisplayed() {
        mobileScreen.assertVisible("#mobile-tvm-result");
    }

    @Then("the mobile TVM schedule list should be displayed")
    public void verifyMobileTvmScheduleDisplayed() {
        mobileScreen.assertVisible("#mobile-tvm-schedule-list");
    }

    @Then("the mobile app should render with Ionic {string} mode")
    public void verifyIonicModeClass(String modeClass) {
        mobileScreen.assertIonicPlatformClass(modeClass);
    }

    @Then("the mobile viewport dimensions should match {int} by {int}")
    public void verifyMobileViewportDimensions(int width, int height) {
        mobileScreen.assertMobileViewportDimensions(width, height);
    }

    @Then("the mobile error resilience banner should be visible")
    public void verifyMobileErrorCardVisible() {
        mobileScreen.assertVisible("#mobile-error-card");
    }
}
