package com.sgsk.wealth.e2e.pages.mobile;

import com.microsoft.playwright.Locator;
import com.microsoft.playwright.Page;
import com.sgsk.wealth.e2e.context.TestContext;
import com.sgsk.wealth.e2e.support.ApiRouteMocker;
import com.sgsk.wealth.e2e.support.AppiumManager;
import io.appium.java_client.AppiumDriver;
import io.cucumber.spring.ScenarioScope;
import org.openqa.selenium.By;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.ScopedProxyMode;
import org.springframework.stereotype.Component;

import java.time.Duration;

import static com.microsoft.playwright.assertions.PlaywrightAssertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

@Component
@ScenarioScope(proxyMode = ScopedProxyMode.NO)
public class IonicMobileScreen {
    private static final Duration WAIT_TIMEOUT = Duration.ofSeconds(15);
    private final TestContext context;
    private final ApiRouteMocker apiRouteMocker;
    private final AppiumManager appiumManager;

    @Autowired
    public IonicMobileScreen(
            TestContext context,
            ApiRouteMocker apiRouteMocker,
            AppiumManager appiumManager
    ) {
        this.context = context;
        this.apiRouteMocker = apiRouteMocker;
        this.appiumManager = appiumManager;
    }

    private boolean isAppiumActive() {
        return context.getAppiumDriver() != null;
    }

    private AppiumDriver appium() {
        return context.getAppiumDriver();
    }

    private Page webView() {
        return context.getPage();
    }

    public void launchApp() {
        if (isAppiumActive()) {
            waitForVisible("#mobile-tab-bar");
            return;
        }
        String mode = "ANDROID".equalsIgnoreCase(context.getMobilePlatform()) ? "md" : "ios";
        webView().navigate("/?ionic:mode=" + mode);
        waitForVisible("#mobile-header.hydrated");
        waitForVisible("#mobile-tab-bar.hydrated");
    }

    public void tapBottomTab(String tabName) {
        String selector = switch (tabName.trim().toLowerCase(java.util.Locale.ROOT)) {
            case "dashboard" -> "[data-tab='dashboard']";
            case "holdings" -> "[data-tab='holdings']";
            case "analytics" -> "[data-tab='analytics']";
            case "dividends" -> "[data-tab='dividends']";
            case "transactions" -> "[data-tab='transactions']";
            case "tools" -> "[data-tab='tools']";
            default -> throw new IllegalArgumentException("Unknown mobile tab: " + tabName);
        };
        tap(selector);
    }

    public void assertTabWorkspaceVisible(String tabName) {
        String selector = switch (tabName.trim().toLowerCase(java.util.Locale.ROOT)) {
            case "dashboard" -> "#mobile-dashboard-hero";
            case "holdings" -> "#mobile-holdings-hero";
            case "analytics" -> "#mobile-analytics-segment";
            case "dividends" -> "#mobile-dividends-hero";
            case "transactions" -> "#mobile-tx-list";
            case "tools" -> "#mobile-tools-segment";
            default -> throw new IllegalArgumentException("Unknown mobile tab workspace: " + tabName);
        };
        assertVisible(selector);
    }

    public void toggleCurrency() {
        tap("#mobile-currency-toggle");
    }

    public void toggleLanguage() {
        tap("#mobile-lang-toggle");
    }

    public void togglePrivacyMode() {
        tap("#mobile-privacy-toggle");
    }

    public void toggleTheme() {
        tap("#mobile-theme-toggle");
    }

    public void tapRefresh() {
        tap("#mobile-refresh-btn");
    }

    public void assertDashboardWidgetsVisible() {
        assertVisible("#mobile-dashboard-hero");
        assertVisible("#mobile-dashboard-allocation");
        assertVisible("#mobile-dashboard-movers");
        assertVisible("#mobile-dashboard-dividends");
        assertVisible("#mobile-dashboard-pvd");
        assertVisible("#mobile-dashboard-activity");
        assertVisible("#mobile-dashboard-tools");
    }

    public void tapQuickAction(String target) {
        String selector = switch (target.trim().toLowerCase(java.util.Locale.ROOT)) {
            case "holdings" -> "#mobile-quick-holdings";
            case "pvd" -> "#mobile-quick-pvd";
            case "analytics" -> "#mobile-quick-analytics";
            case "dividends" -> "#mobile-quick-dividends";
            case "transactions" -> "#mobile-quick-transactions";
            case "tools" -> "#mobile-quick-tools";
            default -> throw new IllegalArgumentException("Unknown dashboard quick action: " + target);
        };
        tap(selector);
    }

    public void selectHoldingsMode(String mode) {
        String id = "pvd".equalsIgnoreCase(mode.trim()) ? "#mobile-segment-pvd" : "#mobile-segment-market";
        tap(id);
    }

    public void selectAssetChip(String assetTabId) {
        tap("#mobile-chip-" + assetTabId);
    }

    public void searchHoldings(String query) {
        fillSearchbar("#mobile-holdings-search", query);
    }

    public void toggleHoldingsSortDirection() {
        tap("#mobile-holdings-sort-dir");
    }

    public void toggleExpandAllHoldingsLots() {
        tap("#mobile-holdings-expand-all");
    }

    public void expandFirstSymbolLots() {
        if (isAppiumActive()) {
            WebDriverWait wait = new WebDriverWait(appium(), WAIT_TIMEOUT);
            WebElement btn = wait.until(ExpectedConditions.elementToBeClickable(By.cssSelector("[data-symbol-lots]")));
            btn.click();
            return;
        }
        webView().locator("[data-symbol-lots]").first().click();
    }

    public void assertAnyHoldingContainsSymbol(String symbol) {
        assertTextContains("#mobile-position-cards", symbol);
    }

    public void assertClosedPositionsVisible() {
        assertVisible("#mobile-closed-list");
    }

    public void assertPvdExecutiveSectionsVisible() {
        assertVisible("#mobile-pvd-list");
        assertVisible("#mobile-pvd-split-bar");
        assertVisible("#mobile-pvd-risk-spectrum");
    }

    public void openFirstFactsheetModal() {
        if (isAppiumActive()) {
            WebDriverWait wait = new WebDriverWait(appium(), WAIT_TIMEOUT);
            wait.until(ExpectedConditions.elementToBeClickable(By.cssSelector("[data-factsheet-symbol]"))).click();
        } else {
            webView().locator("[data-factsheet-symbol]").first().click();
        }
        waitForVisible("#mobile-factsheet-close");
    }

    public void closeFactsheetModal() {
        tap("#mobile-factsheet-close");
        if (!isAppiumActive()) {
            webView().locator("#mobile-factsheet-close").waitFor(
                    new Locator.WaitForOptions().setState(com.microsoft.playwright.options.WaitForSelectorState.HIDDEN).setTimeout(10000));
        }
    }

    public void assertFactsheetClosed() {
        if (isAppiumActive()) {
            assertTrue(appium().findElements(By.cssSelector("#mobile-factsheet-close")).isEmpty()
                    || !appium().findElement(By.cssSelector("#mobile-factsheet-close")).isDisplayed());
        } else {
            assertFalse(webView().locator("#mobile-factsheet-close").isVisible());
        }
    }

    public void selectAnalyticsSegment(String segment) {
        String id = switch (segment.trim().toLowerCase(java.util.Locale.ROOT)) {
            case "allocation" -> "#mobile-analytics-allocation";
            case "performance" -> "#mobile-analytics-performance";
            default -> "#mobile-analytics-overview";
        };
        tap(id);
    }

    public void drillDownAllocationClass(String assetClass) {
        tap("[data-alloc-class='" + assetClass + "']");
    }

    public void resetAllocationDrilldown() {
        tap("#mobile-alloc-reset-btn");
    }

    public void selectPerformanceTimeframe(String timeframe) {
        tap("[data-timeframe='" + timeframe.trim().toUpperCase(java.util.Locale.ROOT) + "']");
    }

    public void filterDividendsByAsset(String assetType) {
        tap("[data-div-asset='" + assetType + "']");
    }

    public void tapFirstDividendMonthBar() {
        if (isAppiumActive()) {
            WebDriverWait wait = new WebDriverWait(appium(), WAIT_TIMEOUT);
            wait.until(ExpectedConditions.elementToBeClickable(By.cssSelector("#mobile-div-monthly-chart .div-bar-col"))).click();
            return;
        }
        webView().locator("#mobile-div-monthly-chart .div-bar-col").first().click();
    }

    public void openFirstDividendSymbolLedger() {
        if (isAppiumActive()) {
            WebDriverWait wait = new WebDriverWait(appium(), WAIT_TIMEOUT);
            wait.until(ExpectedConditions.elementToBeClickable(By.cssSelector("[data-div-ledger-symbol]"))).click();
        } else {
            webView().locator("[data-div-ledger-symbol]").first().click();
        }
        waitForVisible("#mobile-div-ledger-close");
    }

    public void closeDividendSymbolLedger() {
        tap("#mobile-div-ledger-close");
    }

    public void openTransactionSymbolSelector() {
        tap("#mobile-tx-selector-btn");
        waitForVisible("[data-tx-sheet-symbol]");
    }

    public void selectTransactionSymbolFromSheet(String symbol) {
        tap("[data-tx-sheet-symbol='" + symbol + "']");
    }

    public void clearTransactionSymbolFilter() {
        tap("#mobile-tx-clear-sym");
    }

    public void filterTransactionsByType(String type) {
        String id = switch (type.trim().toLowerCase(java.util.Locale.ROOT)) {
            case "buy" -> "#mobile-tx-type-buy";
            case "sell" -> "#mobile-tx-type-sell";
            case "exchange" -> "#mobile-tx-type-exchange";
            default -> "#mobile-tx-type-all";
        };
        tap(id);
    }

    public void toggleTransactionsSortOrder() {
        tap("#mobile-tx-sort-btn");
    }

    public void selectToolTab(String tool) {
        String id = switch (tool.trim().toLowerCase(java.util.Locale.ROOT)) {
            case "rebalance", "rebalance planner" -> "#mobile-tool-rebalance";
            case "tvm", "tvm calculator" -> "#mobile-tool-tvm";
            default -> "#mobile-tool-avg-cost";
        };
        tap(id);
    }

    public void switchAvgCostMode(String mode) {
        String id = "reverse".equalsIgnoreCase(mode.trim()) ? "#mobile-avg-mode-reverse" : "#mobile-avg-mode-forward";
        tap(id);
    }

    public void queueAvgCostOrder() {
        tap("#mobile-avg-add-chain-btn");
    }

    public void enterAvgCostSimulationValues(double shares, double price) {
        if (isAppiumActive()) {
            WebDriverWait wait = new WebDriverWait(appium(), WAIT_TIMEOUT);
            WebElement sharesInput = wait.until(ExpectedConditions.visibilityOfElementLocated(By.cssSelector("#mobile-sim-shares input")));
            sharesInput.clear();
            sharesInput.sendKeys(String.valueOf(shares));
            WebElement priceInput = appium().findElement(By.cssSelector("#mobile-sim-price input"));
            priceInput.clear();
            priceInput.sendKeys(String.valueOf(price));
            return;
        }
        webView().locator("#mobile-sim-shares input").fill(String.valueOf(shares));
        webView().locator("#mobile-sim-price input").fill(String.valueOf(price));
    }

    public void runAvgCostSimulation() {
        tap("#mobile-sim-run-btn");
    }

    public void switchRebalanceMode(String mode) {
        String id = "no-sell".equalsIgnoreCase(mode.trim()) ? "#mobile-reb-mode-nosell" : "#mobile-reb-mode-standard";
        tap(id);
    }

    public void incrementFirstRebalanceTarget() {
        if (isAppiumActive()) {
            WebDriverWait wait = new WebDriverWait(appium(), WAIT_TIMEOUT);
            wait.until(ExpectedConditions.elementToBeClickable(By.cssSelector(".reb-step-btn[data-step='inc-5']"))).click();
            return;
        }
        webView().locator(".reb-step-btn[data-step='inc-5']").first().click();
    }

    public void selectTvmSolveGoal(String goal) {
        tap("[data-tvm-goal='" + goal.trim().toUpperCase(java.util.Locale.ROOT) + "']");
    }

    public void toggleTvmChartMode() {
        tap("#mobile-tvm-chart-toggle");
    }

    public void toggleTvmSchedule() {
        tap("#mobile-tvm-schedule-toggle");
    }

    public void simulateOfflineApiFailure() {
        if (isAppiumActive()) {
            return;
        }
        apiRouteMocker.mockPortfolioAPIError(webView(), 500);
        webView().navigate("/?ionic:mode=md");
        waitForVisible("#mobile-error-card");
    }

    public void recoverApiAndRefresh() {
        if (isAppiumActive()) {
            tapRefresh();
            return;
        }
        apiRouteMocker.recoverPortfolioAPIs(webView());
        tapRefresh();
    }

    public void assertIonicPlatformClass(String expectedClass) {
        String classes = getHtmlAttribute("class");
        assertTrue(classes != null && classes.contains(expectedClass),
                "Expected html class to contain '" + expectedClass + "', got: " + classes);
    }

    public void assertMobileViewportDimensions(int expectedWidth, int expectedHeight) {
        if (isAppiumActive()) {
            return;
        }
        int width = ((Number) webView().evaluate("() => window.innerWidth")).intValue();
        int height = ((Number) webView().evaluate("() => window.innerHeight")).intValue();
        assertEquals(expectedWidth, width, "Expected mobile viewport width " + expectedWidth);
        assertEquals(expectedHeight, height, "Expected mobile viewport height " + expectedHeight);
    }

    public void pressAndroidHardwareBackIfNative() {
        if (isAppiumActive()) {
            appiumManager.pressAndroidBack(appium());
        } else if (webView().locator("#mobile-factsheet-close").isVisible()) {
            closeFactsheetModal();
        }
    }

    public void assertVisible(String selector) {
        waitForVisible(selector);
        if (isAppiumActive()) {
            assertTrue(appium().findElement(By.cssSelector(selector)).isDisplayed(), "Expected visible: " + selector);
        } else {
            assertTrue(webView().locator(selector).first().isVisible(), "Expected visible: " + selector);
        }
    }

    public void assertTextContains(String selector, String expected) {
        waitForVisible(selector);
        if (isAppiumActive()) {
            WebDriverWait wait = new WebDriverWait(appium(), WAIT_TIMEOUT);
            wait.until(ExpectedConditions.textToBePresentInElementLocated(By.cssSelector(selector), expected));
            return;
        }
        assertThat(webView().locator(selector).first()).containsText(expected);
    }

    public String getText(String selector) {
        waitForVisible(selector);
        if (isAppiumActive()) {
            return appium().findElement(By.cssSelector(selector)).getText();
        }
        return webView().locator(selector).first().innerText();
    }

    public String getHtmlAttribute(String attribute) {
        if (isAppiumActive()) {
            return appium().findElement(By.tagName("html")).getAttribute(attribute);
        }
        return webView().locator("html").getAttribute(attribute);
    }

    private void fillSearchbar(String searchbarSelector, String text) {
        String inputSelector = searchbarSelector + " input";
        waitForVisible(inputSelector);
        if (isAppiumActive()) {
            WebDriverWait wait = new WebDriverWait(appium(), WAIT_TIMEOUT);
            WebElement input = wait.until(ExpectedConditions.visibilityOfElementLocated(By.cssSelector(inputSelector)));
            input.clear();
            input.sendKeys(text);
            return;
        }
        webView().locator(inputSelector).first().fill(text);
    }

    private void tap(String selector) {
        waitForVisible(selector);
        if (isAppiumActive()) {
            WebDriverWait wait = new WebDriverWait(appium(), WAIT_TIMEOUT);
            wait.until(ExpectedConditions.elementToBeClickable(By.cssSelector(selector))).click();
        } else {
            Locator loc = webView().locator(selector).first();
            loc.click();
        }
    }

    private void waitForVisible(String selector) {
        if (isAppiumActive()) {
            WebDriverWait wait = new WebDriverWait(appium(), WAIT_TIMEOUT);
            wait.until(ExpectedConditions.visibilityOfElementLocated(By.cssSelector(selector)));
        } else {
            webView().locator(selector).first().waitFor(new Locator.WaitForOptions().setTimeout(15000));
        }
    }
}
