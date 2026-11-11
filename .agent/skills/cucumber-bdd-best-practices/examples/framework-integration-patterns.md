# Cucumber Framework Integration Patterns (Java / Playwright / REST Assured)

This reference outlines the architectural patterns and code templates for integrating Cucumber-JVM with modern test automation libraries (Playwright for UI, REST Assured for API, PicoContainer for state, and Allure for reporting).

---

## 1. Page Object Model (POM) + Cucumber Step Definition

### Layer 1: Feature Step (Declarative)
```gherkin
When I filter dividends to asset type "Thai Stocks"
Then the Yield on Cost KPI card should show "7.43%"
```

### Layer 2: Step Definition (`DividendSteps.java`)
The step definition is concise and delegates all web interactions to the Page Object:
```java
package com.sgsk.wealth.e2e.steps.ui;

import com.sgsk.wealth.e2e.context.TestContext;
import com.sgsk.wealth.e2e.pages.DividendPage;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;
import static org.junit.jupiter.api.Assertions.assertEquals;

public class DividendSteps {
    private final DividendPage dividendPage;

    public DividendSteps(TestContext context) {
        this.dividendPage = new DividendPage(context.getPage());
    }

    @When("I filter dividends to asset type {string}")
    public void filterDividendsToAssetType(String assetType) {
        dividendPage.selectAssetTypeFilter(assetType);
    }

    @Then("the Yield on Cost KPI card should show {string}")
    public void verifyYieldOnCostKpi(String expectedYoc) {
        String actualYoc = dividendPage.getYieldOnCostValue();
        assertEquals(expectedYoc, actualYoc, "YOC KPI card mismatch!");
    }
}
```

### Layer 3: Page Object (`DividendPage.java`)
The Page Object encapsulates Playwright locators and waits:
```java
package com.sgsk.wealth.e2e.pages;

import com.microsoft.playwright.Locator;
import com.microsoft.playwright.Page;

public class DividendPage {
    private final Page page;
    private final Locator assetFilterDropdown;
    private final Locator yocCardValue;

    public DividendPage(Page page) {
        this.page = page;
        this.assetFilterDropdown = page.locator("[data-testid='dividend-asset-filter']");
        this.yocCardValue = page.locator("[data-testid='kpi-yoc-value']");
    }

    public void selectAssetTypeFilter(String assetType) {
        assetFilterDropdown.click();
        page.locator("mat-option", new Page.LocatorOptions().setHasText(assetType)).click();
        page.waitForLoadState();
    }

    public String getYieldOnCostValue() {
        yocCardValue.waitFor();
        return yocCardValue.innerText().trim();
    }
}
```

---

## 2. Shared State Management via PicoContainer (`TestContext.java`)

To ensure thread safety in parallel test runs, use PicoContainer for dependency injection:

```java
package com.sgsk.wealth.e2e.context;

import com.microsoft.playwright.Browser;
import com.microsoft.playwright.BrowserContext;
import com.microsoft.playwright.Page;
import io.restassured.response.Response;
import java.util.HashMap;
import java.util.Map;

public class TestContext {
    private Browser browser;
    private BrowserContext browserContext;
    private Page page;
    private Response lastApiResponse;
    private final Map<String, Object> scenarioState = new HashMap<>();

    public Page getPage() { return page; }
    public void setPage(Page page) { this.page = page; }

    public Response getLastApiResponse() { return lastApiResponse; }
    public void setLastApiResponse(Response resp) { this.lastApiResponse = resp; }

    public void set(String key, Object val) { scenarioState.put(key, val); }
    public Object get(String key) { return scenarioState.get(key); }
}
```

---

## 3. Test Fixture Lifecycle & Allure Failure Capture (`TestHooks.java`)

Hooks manage technical setup and teardown without cluttering feature files:

```java
package com.sgsk.wealth.e2e.hooks;

import com.microsoft.playwright.*;
import com.sgsk.wealth.e2e.context.TestContext;
import io.cucumber.java.After;
import io.cucumber.java.Before;
import io.cucumber.java.Scenario;
import io.qameta.allure.Allure;
import java.io.ByteArrayInputStream;

public class TestHooks {
    private final TestContext context;
    private static Playwright playwright;
    private static Browser browser;

    public TestHooks(TestContext context) {
        this.context = context;
    }

    @Before("@ui")
    public void setupBrowser() {
        if (playwright == null) {
            playwright = Playwright.create();
            browser = playwright.chromium().launch(new BrowserType.LaunchOptions().setHeadless(true));
        }
        BrowserContext browserCtx = browser.newContext();
        Page page = browserCtx.newPage();
        context.setPage(page);
    }

    @After("@ui")
    public void tearDown(Scenario scenario) {
        Page page = context.getPage();
        if (page != null) {
            if (scenario.isFailed()) {
                byte[] screenshot = page.screenshot(new Page.ScreenshotOptions().setFullPage(true));
                Allure.addAttachment("Failure Screenshot - " + scenario.getName(), 
                                     new ByteArrayInputStream(screenshot));
            }
            page.context().close();
        }
    }
}
```
