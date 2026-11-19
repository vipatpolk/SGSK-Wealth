package com.sgsk.wealth.e2e.mobile.platform;

import com.sgsk.wealth.e2e.mobile.common.MobileDriverBridge;
import com.sgsk.wealth.e2e.mobile.holdings.MobileHoldingsScreen;
import com.sgsk.wealth.e2e.mobile.navigation.MobileShellScreen;
import io.cucumber.spring.ScenarioScope;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.ScopedProxyMode;
import org.springframework.stereotype.Component;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

@Component
@ScenarioScope(proxyMode = ScopedProxyMode.NO)
public class MobilePlatformScreen {
    private final MobileDriverBridge driver;
    private final MobileShellScreen shellScreen;
    private final MobileHoldingsScreen holdingsScreen;

    @Autowired
    public MobilePlatformScreen(
            MobileDriverBridge driver,
            MobileShellScreen shellScreen,
            MobileHoldingsScreen holdingsScreen
    ) {
        this.driver = driver;
        this.shellScreen = shellScreen;
        this.holdingsScreen = holdingsScreen;
    }

    public void simulateOfflineApiFailure() {
        if (driver.isAppiumActive()) {
            return;
        }
        driver.apiRouteMocker().mockPortfolioAPIError(driver.webView(), 500);
        driver.webView().navigate("/?ionic:mode=md");
        driver.waitForVisible("#mobile-error-card");
    }

    public void recoverApiAndRefresh() {
        if (driver.isAppiumActive()) {
            shellScreen.tapRefresh();
            return;
        }
        driver.apiRouteMocker().recoverPortfolioAPIs(driver.webView());
        shellScreen.tapRefresh();
    }

    public void assertIonicPlatformClass(String expectedClass) {
        String classes = driver.getHtmlAttribute("class");
        assertTrue(classes != null && classes.contains(expectedClass),
                "Expected html class to contain '" + expectedClass + "', got: " + classes);
    }

    public void assertMobileViewportDimensions(int expectedWidth, int expectedHeight) {
        if (driver.isAppiumActive()) {
            return;
        }
        int width = ((Number) driver.webView().evaluate("() => window.innerWidth")).intValue();
        int height = ((Number) driver.webView().evaluate("() => window.innerHeight")).intValue();
        assertEquals(expectedWidth, width, "Expected mobile viewport width " + expectedWidth);
        assertEquals(expectedHeight, height, "Expected mobile viewport height " + expectedHeight);
    }

    public void pressAndroidHardwareBackIfNative() {
        if (driver.isAppiumActive()) {
            driver.appiumManager().pressAndroidBack(driver.appium());
        } else if (driver.isVisible("#mobile-factsheet-close")) {
            holdingsScreen.closeFactsheetModal();
        }
    }
}
