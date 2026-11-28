package com.sgsk.wealth.e2e.web.navigation;

import com.microsoft.playwright.Page;
import com.sgsk.wealth.e2e.core.context.TestContext;
import io.cucumber.java.en.Given;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;

import java.util.Locale;
import java.util.regex.Pattern;

import static com.microsoft.playwright.assertions.PlaywrightAssertions.assertThat;

public class CommonWebSteps {
    private final TestContext context;
    private final HeaderPage headerPage;

    public CommonWebSteps(TestContext context, HeaderPage headerPage) {
        this.context = context;
        this.headerPage = headerPage;
    }

    private Page page() {
        return context.getPage();
    }

    @Given("I open the SGSK Wealth application")
    public void openApplication() {
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
        assertThat(page().locator("#dividends-view")).isVisible();
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
        assertThat(page().locator("#tab-bar")).isVisible();
    }

    @Then("the analytics container should be visible")
    public void verifyAnalyticsVisible() {
        assertThat(page().locator("#analytics-view")).isVisible();
    }

    @Then("the asset allocation container should be visible")
    public void verifyAssetAllocationVisible() {
        assertThat(page().locator("#asset-allocation-pane")).isVisible();
    }

    @Then("the performance analytics container should be visible")
    public void verifyPerformanceVisible() {
        assertThat(page().locator("#performance-pane")).isVisible();
    }

    @Then("the transaction history container should be visible")
    public void verifyTransactionHistoryVisible() {
        assertThat(page().locator("#tx-history-container")).isVisible();
    }

    @Then("the tools container should be visible")
    public void verifyToolsVisible() {
        assertThat(page().locator("#tools-page")).isVisible();
    }

    @Then("the dividend container should be visible")
    public void verifyDividendVisible() {
        assertThat(page().locator("#dividends-view")).isVisible();
    }

    @Then("the {string} workspace view should be visible")
    public void verifyWorkspaceViewVisible(String viewName) {
        switch (viewName.trim().toLowerCase(Locale.ROOT)) {
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

    @Given("the active currency is {string}")
    @When("I switch currency to {string}")
    public void switchCurrency(String currency) {
        if ("USD".equalsIgnoreCase(currency.trim())) {
            headerPage.switchToUSD();
        } else if ("THB".equalsIgnoreCase(currency.trim())) {
            headerPage.switchToTHB();
        } else {
            throw new IllegalArgumentException("Unsupported currency: " + currency);
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

    @Then("the {string} currency button should be active")
    public void verifyCurrencyButtonActive(String currency) {
        if ("USD".equalsIgnoreCase(currency.trim())) {
            verifyUsdActive();
        } else if ("THB".equalsIgnoreCase(currency.trim())) {
            verifyThbActive();
        } else {
            throw new IllegalArgumentException("Unsupported currency: " + currency);
        }
    }

    @Then("the USD currency button should be active")
    public void verifyUsdActive() {
        assertThat(headerPage.currencyUsdBtn).hasClass(Pattern.compile(".*\\bcurrency-btn-active\\b.*"));
    }

    @Then("the THB currency button should be active")
    public void verifyThbActive() {
        assertThat(headerPage.currencyThbBtn).hasClass(Pattern.compile(".*\\bcurrency-btn-active\\b.*"));
    }

    @Given("the active language is {string}")
    @When("I switch language to {string}")
    public void switchLanguage(String language) {
        if ("EN".equalsIgnoreCase(language.trim())) {
            headerPage.switchToEN();
        } else if ("TH".equalsIgnoreCase(language.trim())) {
            headerPage.switchToTH();
        } else {
            throw new IllegalArgumentException("Unsupported language: " + language);
        }
    }

    @When("I switch language to EN")
    public void switchLanguageToEN() {
        headerPage.switchToEN();
    }

    @When("I switch language to TH")
    public void switchLanguageToTH() {
        headerPage.switchToTH();
    }

    @Then("the {string} language button should be active")
    public void verifyLanguageButtonActive(String language) {
        if ("EN".equalsIgnoreCase(language.trim())) {
            verifyEnLangActive();
        } else if ("TH".equalsIgnoreCase(language.trim())) {
            verifyThLangActive();
        } else {
            throw new IllegalArgumentException("Unsupported language: " + language);
        }
    }

    @Then("the EN language button should be active")
    public void verifyEnLangActive() {
        assertThat(headerPage.langEnBtn).hasClass(Pattern.compile(".*\\blang-btn-active\\b.*"));
    }

    @Then("the TH language button should be active")
    public void verifyThLangActive() {
        assertThat(headerPage.langThBtn).hasClass(Pattern.compile(".*\\blang-btn-active\\b.*"));
    }

    @Then("the document language attribute should be {string}")
    public void verifyDocumentLanguage(String lang) {
        assertThat(page().locator("html")).hasAttribute("lang", lang);
    }

    @Then("the navigation dashboard button should display {string}")
    public void verifyNavDashboardText(String text) {
        assertThat(headerPage.viewToggleDashboardBtn).containsText(text);
    }

    @Given("the application theme is {string}")
    public void ensureApplicationTheme(String targetTheme) {
        String current = page().locator("html").getAttribute("data-theme");
        if (!targetTheme.equalsIgnoreCase(current)) {
            headerPage.setTheme(targetTheme);
        }
        verifyTheme(targetTheme);
    }

    @When("I toggle the theme")
    public void toggleTheme() {
        headerPage.toggleTheme();
    }

    @Then("the document theme attribute should be {string}")
    public void verifyTheme(String theme) {
        assertThat(page().locator("html")).hasAttribute("data-theme", theme);
    }

    @Given("privacy mode is {string}")
    public void ensurePrivacyMode(String targetState) {
        String current = page().locator("html").getAttribute("data-privacy");
        boolean isCurrentlyEnabled = "true".equalsIgnoreCase(current);
        boolean shouldBeEnabled = "true".equalsIgnoreCase(targetState);
        if (isCurrentlyEnabled != shouldBeEnabled) {
            headerPage.privacyToggleBtn.click();
        }
        verifyPrivacyAttribute(shouldBeEnabled ? "true" : "false");
    }

    @When("I toggle privacy mode")
    public void togglePrivacyMode() {
        headerPage.privacyToggleBtn.click();
    }

    @Then("the document privacy attribute should be {string}")
    public void verifyPrivacyAttribute(String val) {
        assertThat(page().locator("html")).hasAttribute("data-privacy", val);
    }

    @Then("no untranslated i18n keys should appear across any workspace view")
    public void verifyNoUntranslatedKeysAcrossWorkspaces() {
        Pattern rawKeyPattern = Pattern.compile(
                "\\b(app|auth|dash|nav|holdings|pvd|alloc|perf|div|tx|tools|settings|userMenu|loading|common|asset|factsheet|localPortfolio|sidebar|header|summary|ui)\\.[a-zA-Z0-9_.]+\\b");
        Runnable assertClean = () -> {
            String bodyText = page().locator("body").innerText();
            var matcher = rawKeyPattern.matcher(bodyText);
            if (matcher.find()) {
                throw new AssertionError("Found untranslated i18n key in UI: " + matcher.group());
            }
        };

        assertThat(page().locator("#dashboard-view")).isVisible();
        assertClean.run();

        headerPage.selectView("Holdings");
        assertThat(page().locator("#tab-bar")).isVisible();
        assertClean.run();
        page().locator("#holdings-subtab-pvd").click();
        assertThat(page().locator("#pvd-holdings-screen")).isVisible();
        assertClean.run();

        headerPage.selectView("Analytics");
        assertThat(page().locator("#analytics-view")).isVisible();
        assertClean.run();
        page().locator("#analytics-tab-allocation").click();
        assertThat(page().locator("#asset-allocation-pane")).isVisible();
        assertClean.run();
        page().locator("#analytics-tab-performance").click();
        assertThat(page().locator("#performance-pane")).isVisible();
        assertClean.run();

        headerPage.selectView("Dividends");
        assertThat(page().locator("#dividends-view")).isVisible();
        assertClean.run();

        headerPage.selectView("Transactions");
        assertThat(page().locator("#tx-history-container")).isVisible();
        assertClean.run();

        headerPage.selectView("Tools");
        assertThat(page().locator("#tools-page")).isVisible();
        assertClean.run();
        page().locator("#tool-tab-tvm-calculator").click();
        assertThat(page().locator("#tvm-calculator")).isVisible();
        assertClean.run();
        page().locator("#tool-tab-rebalance-planner").click();
        assertThat(page().locator("#rebalance-calculator")).isVisible();
        assertClean.run();
    }
}
