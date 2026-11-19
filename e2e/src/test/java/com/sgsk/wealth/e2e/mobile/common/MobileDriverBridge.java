package com.sgsk.wealth.e2e.mobile.common;

import com.microsoft.playwright.Locator;
import com.microsoft.playwright.Page;
import com.microsoft.playwright.options.WaitForSelectorState;
import com.sgsk.wealth.e2e.core.context.TestContext;
import com.sgsk.wealth.e2e.core.support.ApiRouteMocker;
import com.sgsk.wealth.e2e.core.support.AppiumManager;
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
public class MobileDriverBridge {
    public static final Duration WAIT_TIMEOUT = Duration.ofSeconds(15);

    private final TestContext context;
    private final ApiRouteMocker apiRouteMocker;
    private final AppiumManager appiumManager;

    @Autowired
    public MobileDriverBridge(
            TestContext context,
            ApiRouteMocker apiRouteMocker,
            AppiumManager appiumManager
    ) {
        this.context = context;
        this.apiRouteMocker = apiRouteMocker;
        this.appiumManager = appiumManager;
    }

    public boolean isAppiumActive() {
        return context.getAppiumDriver() != null;
    }

    public AppiumDriver appium() {
        return context.getAppiumDriver();
    }

    public Page webView() {
        return context.getPage();
    }

    public TestContext context() {
        return context;
    }

    public ApiRouteMocker apiRouteMocker() {
        return apiRouteMocker;
    }

    public AppiumManager appiumManager() {
        return appiumManager;
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

    public void tap(String selector) {
        waitForVisible(selector);
        if (isAppiumActive()) {
            WebDriverWait wait = new WebDriverWait(appium(), WAIT_TIMEOUT);
            wait.until(ExpectedConditions.elementToBeClickable(By.cssSelector(selector))).click();
            return;
        }
        webView().locator(selector).first().click();
    }

    public void tapFirst(String selector) {
        tap(selector);
    }

    public void fillInput(String selector, String value) {
        waitForVisible(selector);
        if (isAppiumActive()) {
            WebDriverWait wait = new WebDriverWait(appium(), WAIT_TIMEOUT);
            WebElement input = wait.until(ExpectedConditions.visibilityOfElementLocated(By.cssSelector(selector)));
            input.clear();
            input.sendKeys(value);
            return;
        }
        webView().locator(selector).first().fill(value);
    }

    public void fillSearchbar(String searchbarSelector, String text) {
        fillInput(searchbarSelector + " input", text);
    }

    public void waitForVisible(String selector) {
        if (isAppiumActive()) {
            WebDriverWait wait = new WebDriverWait(appium(), WAIT_TIMEOUT);
            wait.until(ExpectedConditions.visibilityOfElementLocated(By.cssSelector(selector)));
            return;
        }
        webView().locator(selector).first().waitFor(new Locator.WaitForOptions().setTimeout(15000));
    }

    public void waitForHidden(String selector) {
        if (!isAppiumActive()) {
            webView().locator(selector).waitFor(
                    new Locator.WaitForOptions().setState(WaitForSelectorState.HIDDEN).setTimeout(10000));
        }
    }

    public boolean isVisible(String selector) {
        if (isAppiumActive()) {
            return !appium().findElements(By.cssSelector(selector)).isEmpty()
                    && appium().findElement(By.cssSelector(selector)).isDisplayed();
        }
        return webView().locator(selector).first().isVisible();
    }

    public void assertVisible(String selector) {
        waitForVisible(selector);
        if (isAppiumActive()) {
            assertTrue(appium().findElement(By.cssSelector(selector)).isDisplayed(), "Expected visible: " + selector);
            return;
        }
        assertTrue(webView().locator(selector).first().isVisible(), "Expected visible: " + selector);
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

    public boolean hasClass(String selector, String cssClass) {
        waitForVisible(selector);
        String cls = isAppiumActive()
                ? appium().findElement(By.cssSelector(selector)).getAttribute("class")
                : webView().locator(selector).first().getAttribute("class");
        return cls != null && java.util.Arrays.asList(cls.trim().split("\\s+")).contains(cssClass);
    }

    public void assertNotPresent(String selector) {
        if (isAppiumActive()) {
            assertTrue(appium().findElements(By.cssSelector(selector)).isEmpty(),
                    "Expected element not present: " + selector);
            return;
        }
        assertTrue(webView().locator(selector).count() == 0,
                "Expected element not present: " + selector);
    }
}
