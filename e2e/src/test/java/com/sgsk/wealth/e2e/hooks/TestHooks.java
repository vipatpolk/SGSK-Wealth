package com.sgsk.wealth.e2e.hooks;

import com.microsoft.playwright.Browser;
import com.microsoft.playwright.BrowserType;
import com.microsoft.playwright.Page;
import com.microsoft.playwright.Playwright;
import com.sgsk.wealth.e2e.context.TestContext;
import com.sgsk.wealth.e2e.support.ApiRouteMocker;
import com.sgsk.wealth.e2e.support.ServerManager;
import io.cucumber.java.After;
import io.cucumber.java.AfterAll;
import io.cucumber.java.Before;
import io.cucumber.java.BeforeAll;
import io.cucumber.java.Scenario;
import io.qameta.allure.Allure;
import io.qameta.allure.restassured.AllureRestAssured;
import io.restassured.RestAssured;

import java.io.ByteArrayInputStream;

public class TestHooks {
    private static Playwright playwright;
    private static Browser browser;
    private final TestContext testContext;

    public TestHooks(TestContext testContext) {
        this.testContext = testContext;
    }

    @BeforeAll
    public static void globalSetup() {
        ServerManager.ensureBackendServer();
    }

    @Before("@ui")
    public void setupUiScenario() {
        ServerManager.ensureFrontendServer();

        if (playwright == null) {
            playwright = Playwright.create();
            boolean headless = !"false".equalsIgnoreCase(System.getenv("HEADLESS"));
            browser = playwright.chromium().launch(new BrowserType.LaunchOptions().setHeadless(headless));
        }

        var context = browser.newContext(new Browser.NewContextOptions().setBaseURL(ServerManager.ensureFrontendServer()));
        Page page = context.newPage();
        ApiRouteMocker.mockPortfolioAPIs(page);

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
        String baseUrl = ServerManager.ensureBackendServer();
        RestAssured.baseURI = baseUrl;
        RestAssured.replaceFiltersWith(new AllureRestAssured());
    }

    @AfterAll
    public static void globalTeardown() {
        if (browser != null) {
            browser.close();
            browser = null;
        }
        if (playwright != null) {
            playwright.close();
            playwright = null;
        }
        ServerManager.stopServers();
    }
}
