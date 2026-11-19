package com.sgsk.wealth.e2e.web.hooks;

import com.microsoft.playwright.BrowserContext;
import com.microsoft.playwright.Page;
import com.sgsk.wealth.e2e.core.context.TestContext;
import com.sgsk.wealth.e2e.core.support.ApiRouteMocker;
import com.sgsk.wealth.e2e.core.support.PlaywrightManager;
import com.sgsk.wealth.e2e.core.support.ServerManager;
import io.cucumber.java.After;
import io.cucumber.java.Before;
import io.cucumber.java.Scenario;
import io.qameta.allure.Allure;

import java.io.ByteArrayInputStream;

public class WebHooks {
    private final TestContext testContext;
    private final PlaywrightManager playwrightManager;
    private final ServerManager serverManager;
    private final ApiRouteMocker apiRouteMocker;

    public WebHooks(
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

    @Before("@web")
    public void setupWebScenario() {
        serverManager.ensureBackendServer();
        String frontendUrl = serverManager.ensureFrontendServer();

        BrowserContext context = playwrightManager.newBrowserContext(frontendUrl);
        Page page = context.newPage();
        apiRouteMocker.mockPortfolioAPIs(page);

        testContext.setBrowserContext(context);
        testContext.setPage(page);
    }

    @After("@web")
    public void tearDownWebScenario(Scenario scenario) {
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
