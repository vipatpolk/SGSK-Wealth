package com.sgsk.wealth.e2e.pages.mobile;

import com.microsoft.playwright.Locator;
import com.microsoft.playwright.Page;
import com.sgsk.wealth.e2e.context.TestContext;
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
import static org.junit.jupiter.api.Assertions.assertTrue;

@Component
@ScenarioScope(proxyMode = ScopedProxyMode.NO)
public class IonicMobileScreen {
    private static final Duration WAIT_TIMEOUT = Duration.ofSeconds(15);
    private final TestContext context;

    @Autowired
    public IonicMobileScreen(TestContext context) {
        this.context = context;
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
        webView().navigate("/");
        waitForVisible("#mobile-header.hydrated");
        waitForVisible("#mobile-tab-bar.hydrated");
    }

    public void tapBottomTab(String tabName) {
        String id = switch (tabName.trim().toLowerCase(java.util.Locale.ROOT)) {
            case "dashboard" -> "#mobile-tab-dashboard";
            case "holdings" -> "#mobile-tab-holdings";
            case "analytics" -> "#mobile-tab-analytics";
            case "dividends" -> "#mobile-tab-dividends";
            case "tools" -> "#mobile-tab-tools";
            default -> throw new IllegalArgumentException("Unknown mobile tab: " + tabName);
        };
        tap(id);
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

    public void selectHoldingsMode(String mode) {
        String id = "pvd".equalsIgnoreCase(mode.trim()) ? "#mobile-segment-pvd" : "#mobile-segment-market";
        tap(id);
    }

    public void selectAssetChip(String assetTabId) {
        tap("#mobile-chip-" + assetTabId);
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

    public void selectAnalyticsSegment(String segment) {
        String id = switch (segment.trim().toLowerCase(java.util.Locale.ROOT)) {
            case "allocation" -> "#mobile-analytics-allocation";
            case "performance" -> "#mobile-analytics-performance";
            default -> "#mobile-analytics-overview";
        };
        tap(id);
    }

    public void selectToolTab(String tool) {
        String id = switch (tool.trim().toLowerCase(java.util.Locale.ROOT)) {
            case "rebalance", "rebalance planner" -> "#mobile-tool-rebalance";
            case "tvm", "tvm calculator" -> "#mobile-tool-tvm";
            default -> "#mobile-tool-avg-cost";
        };
        tap(id);
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
