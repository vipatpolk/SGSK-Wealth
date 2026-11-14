package com.sgsk.wealth.e2e.steps.ui;

import com.microsoft.playwright.Page;
import com.sgsk.wealth.e2e.context.TestContext;
import com.sgsk.wealth.e2e.pages.HeaderPage;
import com.sgsk.wealth.e2e.support.ApiRouteMocker;
import io.cucumber.java.en.Given;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;

import java.util.regex.Pattern;

import static com.microsoft.playwright.assertions.PlaywrightAssertions.assertThat;

public class CommonUiSteps {
    private final TestContext context;
    private final HeaderPage headerPage;
    private final ApiRouteMocker apiRouteMocker;

    public CommonUiSteps(TestContext context, HeaderPage headerPage, ApiRouteMocker apiRouteMocker) {
        this.context = context;
        this.headerPage = headerPage;
        this.apiRouteMocker = apiRouteMocker;
    }

    private Page page() {
        return context.getPage();
    }

    @Given("I open the SGSK Wealth application")
    public void openApplication() {
        page().navigate("/");
    }

    @Given("the backend API returns error status {int}")
    public void setBackendApiError(int statusCode) {
        apiRouteMocker.mockPortfolioAPIError(page(), statusCode);
    }

    @When("I open the SGSK Wealth application without mocking")
    public void openApplicationWithoutMocking() {
        page().navigate("/");
    }

    @When("I switch to the Holdings view")
    public void switchToHoldingsView() {
        headerPage.selectHoldingsView();
    }

    @When("I switch to the Analytics view")
    public void switchToAnalyticsView() {
        headerPage.selectAnalyticsView();
    }

    @When("I switch to the Allocation sub-tab")
    @When("I navigate to the Allocation analytics view")
    public void switchToAllocationView() {
        headerPage.selectAllocationView();
    }

    @When("I switch to the Performance sub-tab")
    public void switchToPerformanceView() {
        headerPage.selectPerformanceView();
    }

    @When("I switch to the Transactions view")
    public void switchToTransactionsView() {
        headerPage.selectTransactionsView();
    }

    @When("I navigate to the Tools view")
    public void navigateToToolsView() {
        headerPage.selectToolsView();
    }

    @When("I navigate to the Dividends view")
    public void navigateToDividendsView() {
        headerPage.selectDividendsView();
        assertThat(page().locator("app-dividend")).isVisible();
    }

    @When("I navigate to the {string} workspace view")
    public void navigateToWorkspaceView(String viewName) {
        headerPage.selectView(viewName);
    }

    @When("I switch back to the Dashboard view")
    public void switchBackToDashboardView() {
        headerPage.selectDashboardView();
    }

    @Then("the Dashboard view should be visible")
    public void verifyDashboardViewVisible() {
        assertThat(page().locator("#dashboard-view")).isVisible();
    }

    @Then("the asset tab bar should be visible")
    public void verifyTabBarVisible() {
        assertThat(page().locator("app-tab-bar")).isVisible();
    }

    @Then("the analytics container should be visible")
    public void verifyAnalyticsVisible() {
        assertThat(page().locator("app-analytics")).isVisible();
    }

    @Then("the asset allocation container should be visible")
    public void verifyAssetAllocationVisible() {
        assertThat(page().locator("app-asset-allocation")).isVisible();
    }

    @Then("the performance analytics container should be visible")
    public void verifyPerformanceVisible() {
        assertThat(page().locator("app-performance")).isVisible();
    }

    @Then("the transaction history container should be visible")
    public void verifyTransactionHistoryVisible() {
        assertThat(page().locator("app-transaction-history")).isVisible();
    }

    @Then("the tools container should be visible")
    public void verifyToolsVisible() {
        assertThat(page().locator("app-tools")).isVisible();
    }

    @Then("the dividend container should be visible")
    public void verifyDividendVisible() {
        assertThat(page().locator("app-dividend")).isVisible();
    }

    @Then("the {string} workspace view should be visible")
    public void verifyWorkspaceViewVisible(String viewName) {
        switch (viewName.trim().toLowerCase(java.util.Locale.ROOT)) {
            case "dashboard" -> verifyDashboardViewVisible();
            case "holdings" -> verifyTabBarVisible();
            case "analytics" -> verifyAnalyticsVisible();
            case "allocation" -> verifyAssetAllocationVisible();
            case "performance" -> verifyPerformanceVisible();
            case "dividends" -> verifyDividendVisible();
            case "transactions" -> verifyTransactionHistoryVisible();
            case "tools" -> verifyToolsVisible();
            default -> throw new IllegalArgumentException("Unsupported workspace view assertion: " + viewName);
        }
    }

    @When("I switch currency to USD")
    public void switchCurrencyToUSD() {
        headerPage.switchToUSD();
    }

    @When("I switch currency to THB")
    public void switchCurrencyToTHB() {
        headerPage.switchToTHB();
    }

    @Then("the USD currency button should be active")
    public void verifyUsdActive() {
        assertThat(headerPage.currencyUsdBtn).hasClass(Pattern.compile(".*currency-btn-active.*"));
    }

    @Then("the THB currency button should be active")
    public void verifyThbActive() {
        assertThat(headerPage.currencyThbBtn).hasClass(Pattern.compile(".*currency-btn-active.*"));
    }

    @When("I toggle the theme")
    public void toggleTheme() {
        headerPage.toggleTheme();
    }

    @Then("the document theme attribute should be {string}")
    public void verifyTheme(String theme) {
        assertThat(page().locator("html")).hasAttribute("data-theme", theme);
    }

    @When("I toggle privacy mode")
    public void togglePrivacyMode() {
        headerPage.privacyToggleBtn.click();
    }

    @Then("the document privacy attribute should be {string}")
    public void verifyPrivacyAttribute(String val) {
        assertThat(page().locator("html")).hasAttribute("data-privacy", val);
    }

    @Then("the error state card should be visible with {string}")
    public void verifyErrorState(String text) {
        assertThat(page().locator("#error-state")).isVisible();
        assertThat(page().locator("#error-state")).containsText(text);
    }

    @Then("the retry button should be visible")
    public void verifyRetryBtn() {
        assertThat(page().locator("#retry-btn")).isVisible();
    }

    @When("the backend API recovers")
    public void recoverBackendApi() {
        apiRouteMocker.recoverPortfolioAPIs(page());
    }

    @When("I retry loading the portfolio")
    public void retryLoadingPortfolio() {
        page().locator("#retry-btn").click();
    }
}
