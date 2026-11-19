package com.sgsk.wealth.e2e.mobile.hooks;

import com.microsoft.playwright.BrowserContext;
import com.microsoft.playwright.Page;
import com.sgsk.wealth.e2e.core.config.E2eProperties;
import com.sgsk.wealth.e2e.core.context.TestContext;
import com.sgsk.wealth.e2e.core.support.ApiRouteMocker;
import com.sgsk.wealth.e2e.core.support.AppiumManager;
import com.sgsk.wealth.e2e.core.support.PlaywrightManager;
import com.sgsk.wealth.e2e.core.support.ServerManager;
import io.appium.java_client.AppiumDriver;
import io.cucumber.java.After;
import io.cucumber.java.Before;
import io.cucumber.java.Scenario;
import io.qameta.allure.Allure;
import org.openqa.selenium.OutputType;

import java.io.ByteArrayInputStream;
import java.util.Collection;
import java.util.List;

public class MobileHooks {
    private final TestContext testContext;
    private final PlaywrightManager playwrightManager;
    private final ServerManager serverManager;
    private final ApiRouteMocker apiRouteMocker;
    private final AppiumManager appiumManager;
    private final E2eProperties properties;

    public MobileHooks(
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

    @Before("@mobile and not @web")
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
        Collection<String> tags = scenario != null ? scenario.getSourceTagNames() : List.of();
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

    @After("@mobile and not @web")
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

    private void attachPlaywrightScreenshot(Scenario scenario, Page page) {
        try {
            byte[] screenshot = page.screenshot(new Page.ScreenshotOptions().setFullPage(true));
            scenario.attach(screenshot, "image/png", "Failure Screenshot");
            Allure.attachment("Failure Screenshot", new ByteArrayInputStream(screenshot));
        } catch (Exception ignored) {
        }
    }
}
