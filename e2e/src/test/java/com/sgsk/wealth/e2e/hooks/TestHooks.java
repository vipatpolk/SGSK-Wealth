package com.sgsk.wealth.e2e.hooks;

import com.microsoft.playwright.BrowserContext;
import com.microsoft.playwright.Page;
import com.sgsk.wealth.e2e.config.E2eProperties;
import com.sgsk.wealth.e2e.context.TestContext;
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
    public void setupMobileScenario() {
        serverManager.ensureBackendServer();
        if (appiumManager.isAppiumServerAvailable()) {
            AppiumDriver driver = appiumManager.createMobileDriver();
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
        BrowserContext context = playwrightManager.newMobileBrowserContext(mobileUrl);
        Page page = context.newPage();
        apiRouteMocker.mockPortfolioAPIs(page);

        testContext.setBrowserContext(context);
        testContext.setPage(page);
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
