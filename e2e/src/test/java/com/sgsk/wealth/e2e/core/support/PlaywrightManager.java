package com.sgsk.wealth.e2e.core.support;

import com.microsoft.playwright.Browser;
import com.microsoft.playwright.BrowserContext;
import com.microsoft.playwright.BrowserType;
import com.microsoft.playwright.Playwright;
import com.sgsk.wealth.e2e.core.config.E2eProperties;
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

    public synchronized BrowserContext newMobileBrowserContext(String baseUrl) {
        return newMobileBrowserContext(baseUrl, "IOS");
    }

    public synchronized BrowserContext newMobileBrowserContext(String baseUrl, String platform) {
        if (playwright == null) {
            playwright = Playwright.create();
            boolean headless = properties.playwright().headless();
            browser = playwright.chromium().launch(new BrowserType.LaunchOptions().setHeadless(headless));
        }
        boolean isAndroid = "ANDROID".equalsIgnoreCase(platform);
        Browser.NewContextOptions options = new Browser.NewContextOptions()
                .setBaseURL(baseUrl)
                .setHasTouch(true)
                .setIsMobile(true);
        if (isAndroid) {
            options.setViewportSize(412, 915)
                    .setDeviceScaleFactor(2.625)
                    .setUserAgent("Mozilla/5.0 (Linux; Android 15; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36");
        } else {
            options.setViewportSize(390, 844)
                    .setDeviceScaleFactor(3.0)
                    .setUserAgent("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1");
        }
        return browser.newContext(options);
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
