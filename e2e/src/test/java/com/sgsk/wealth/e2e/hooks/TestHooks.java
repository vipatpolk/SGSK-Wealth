package com.sgsk.wealth.e2e.hooks;

import com.microsoft.playwright.BrowserContext;
import com.microsoft.playwright.Page;
import com.sgsk.wealth.e2e.context.TestContext;
import com.sgsk.wealth.e2e.support.ApiRouteMocker;
import com.sgsk.wealth.e2e.support.PlaywrightManager;
import com.sgsk.wealth.e2e.support.ServerManager;
import io.cucumber.java.After;
import io.cucumber.java.Before;
import io.cucumber.java.Scenario;
import io.qameta.allure.Allure;
import io.qameta.allure.restassured.AllureRestAssured;
import io.restassured.RestAssured;

import java.io.ByteArrayInputStream;

public class TestHooks {
    private final TestContext testContext;
    private final PlaywrightManager playwrightManager;
    private final ServerManager serverManager;
    private final ApiRouteMocker apiRouteMocker;

    public TestHooks(
            TestContext testContext,
            PlaywrightManager playwrightManager,
            ServerManager serverManager,
            ApiRouteMocker apiRouteMocker
    ) {
        this.testContext = testContext;
        this.playwrightManager = playwrightManager;
        this.serverManager = serverManager;
        this.apiRouteMocker = apiRouteMocker;
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
                try {
                    byte[] screenshot = page.screenshot(new Page.ScreenshotOptions().setFullPage(true));
                    scenario.attach(screenshot, "image/png", "Failure Screenshot");
                    Allure.attachment("Failure Screenshot", new ByteArrayInputStream(screenshot));
                } catch (Exception ignored) {
                }
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
}
