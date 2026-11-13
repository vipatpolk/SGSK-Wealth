package com.sgsk.wealth.e2e.support;

import com.microsoft.playwright.Browser;
import com.microsoft.playwright.BrowserContext;
import com.microsoft.playwright.BrowserType;
import com.microsoft.playwright.Playwright;
import com.sgsk.wealth.e2e.config.E2eProperties;
import jakarta.annotation.PreDestroy;
import org.springframework.stereotype.Component;

@Component
public class PlaywrightManager {
    private final E2eProperties properties;
    private Playwright playwright;
    private Browser browser;

    public PlaywrightManager(E2eProperties properties) {
        this.properties = properties;
    }

    public synchronized BrowserContext newBrowserContext(String baseUrl) {
        if (playwright == null) {
            playwright = Playwright.create();
            boolean headless = properties.playwright().headless();
            browser = playwright.chromium().launch(new BrowserType.LaunchOptions().setHeadless(headless));
        }
        return browser.newContext(new Browser.NewContextOptions().setBaseURL(baseUrl));
    }

    @PreDestroy
    public synchronized void close() {
        if (browser != null) {
            browser.close();
            browser = null;
        }
        if (playwright != null) {
            playwright.close();
            playwright = null;
        }
    }
}
