package com.sgsk.wealth.e2e.hooks;

import com.microsoft.playwright.BrowserContext;
import com.microsoft.playwright.Page;
import com.sgsk.wealth.e2e.config.E2eProperties;
import com.sgsk.wealth.e2e.context.TestContext;
import com.sgsk.wealth.e2e.context.TestContextHolder;
import com.sgsk.wealth.e2e.support.ApiRouteMocker;
import com.sgsk.wealth.e2e.support.AppiumManager;
import com.sgsk.wealth.e2e.support.PlaywrightManager;
import com.sgsk.wealth.e2e.support.ServerManager;
import io.appium.java_client.AppiumDriver;
import io.cucumber.java.After;
import io.cucumber.java.Before;
import io.cucumber.java.Scenario;
import io.qameta.allure.Allure;
import io.qameta.allure.restassured.AllureRestAssured;
import io.restassured.RestAssured;
import org.openqa.selenium.OutputType;

import java.io.ByteArrayInputStream;

public class TestHooks {
    private final TestContext testContext;
    private final PlaywrightManager playwrightManager;
    private final ServerManager serverManager;
    private final ApiRouteMocker apiRouteMocker;
    private final AppiumManager appiumManager;
    private final E2eProperties properties;

    public TestHooks(
            TestContext testContext,
            PlaywrightManager playwrightManager,
            ServerManager serverManager,
            ApiRouteMocker apiRouteMocker,
            AppiumManager appiumManager,
            E2eProperties properties
    ) {
        this.testContext = testContext;
        this.playwrightManager = playwrightManager;
        this.serverManager = serverManager;
        this.apiRouteMocker = apiRouteMocker;
        this.appiumManager = appiumManager;
        this.properties = properties;
    }

    @Before(order = 0)
    public void bindScenarioContext(Scenario scenario) {
        testContext.setScenarioTags(scenario.getSourceTagNames());
        TestContextHolder.set(testContext);
    }

    @After(order = 0)
    public void clearScenarioContext() {
        TestContextHolder.clear();
    }

    @Before("@ui")
    public void setupUiScenario() {
        serverManager.ensureBackendServer();
        String frontendUrl = serverManager.ensureFrontendServer();

        BrowserContext context = playwrightManager.newBrowserContext(frontendUrl);
        Page page = context.newPage();
        apiRouteMocker.mockPortfolioAPIs(page);

        testContext.setBrowserContext(context);
        testContext.setPage(page);
    }

    @After("@ui")
    public void tearDownUiScenario(Scenario scenario) {
        Page page = testContext.getPage();
        if (page != null) {
            if (scenario.isFailed()) {
                attachPlaywrightScreenshot(scenario, page);
            }
            page.close();
        }
        if (testContext.getBrowserContext() != null) {
            testContext.getBrowserContext().close();
        }
    }

    @Before("@mobile and not @ui")
    public void setupMobileScenario(Scenario scenario) {
        serverManager.ensureBackendServer();
        String resolvedPlatform = resolveMobilePlatform(scenario);
        testContext.setMobilePlatform(resolvedPlatform);

        if (appiumManager.isAppiumServerAvailable()) {
            AppiumDriver driver = appiumManager.createMobileDriver(resolvedPlatform);
            testContext.setAppiumDriver(driver);
            return;
        }

        if (!properties.mobile().fallbackToLocalWebview()) {
            throw new IllegalStateException(
                    "Appium server is not reachable at " + properties.mobile().appiumUrl()
                            + " and fallbackToLocalWebview is disabled."
            );
        }

        String mobileUrl = serverManager.ensureMobileServer();
        BrowserContext context = playwrightManager.newMobileBrowserContext(mobileUrl, resolvedPlatform);
        Page page = context.newPage();
        apiRouteMocker.mockPortfolioAPIs(page);

        testContext.setBrowserContext(context);
        testContext.setPage(page);
    }

    private String resolveMobilePlatform(Scenario scenario) {
        java.util.Collection<String> tags = scenario != null ? scenario.getSourceTagNames() : java.util.List.of();
        boolean hasAndroidTag = tags.contains("@android");
        boolean hasIosTag = tags.contains("@ios");
        if (hasAndroidTag && !hasIosTag) {
            return "ANDROID";
        }
        if (hasIosTag && !hasAndroidTag) {
            return "IOS";
        }
        String filterTags = System.getProperty("cucumber.filter.tags", "");
        if (filterTags.contains("@ios") && !filterTags.contains("@android")) {
            return "IOS";
        }
        if (filterTags.contains("@android") && !filterTags.contains("@ios")) {
            return "ANDROID";
        }
        return properties.mobile().platform();
    }

    @After("@mobile and not @ui")
    public void tearDownMobileScenario(Scenario scenario) {
        AppiumDriver appiumDriver = testContext.getAppiumDriver();
        if (appiumDriver != null) {
            if (scenario.isFailed()) {
                try {
                    byte[] screenshot = appiumDriver.getScreenshotAs(OutputType.BYTES);
                    scenario.attach(screenshot, "image/png", "Mobile Failure Screenshot");
                    Allure.attachment("Mobile Failure Screenshot", new ByteArrayInputStream(screenshot));
                } catch (Exception ignored) {
                }
            }
            appiumDriver.quit();
            testContext.setAppiumDriver(null);
            return;
        }

        Page page = testContext.getPage();
        if (page != null) {
            if (scenario.isFailed()) {
                attachPlaywrightScreenshot(scenario, page);
            }
            page.close();
        }
        if (testContext.getBrowserContext() != null) {
            testContext.getBrowserContext().close();
        }
    }

    @Before("@api")
    public void setupApiScenario() {
        String baseUrl = serverManager.ensureBackendServer();
        RestAssured.baseURI = baseUrl;
        RestAssured.replaceFiltersWith(new AllureRestAssured());
    }

    private void attachPlaywrightScreenshot(Scenario scenario, Page page) {
        try {
            byte[] screenshot = page.screenshot(new Page.ScreenshotOptions().setFullPage(true));
            scenario.attach(screenshot, "image/png", "Failure Screenshot");
            Allure.attachment("Failure Screenshot", new ByteArrayInputStream(screenshot));
        } catch (Exception ignored) {
        }
    }
}
