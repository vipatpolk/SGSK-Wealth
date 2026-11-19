package com.sgsk.wealth.e2e.mobile.navigation;

import com.sgsk.wealth.e2e.mobile.common.MobileDriverBridge;
import io.cucumber.spring.ScenarioScope;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.ScopedProxyMode;
import org.springframework.stereotype.Component;

import java.util.Locale;

@Component
@ScenarioScope(proxyMode = ScopedProxyMode.NO)
public class MobileShellScreen {
    private final MobileDriverBridge driver;

    @Autowired
    public MobileShellScreen(MobileDriverBridge driver) {
        this.driver = driver;
    }

    public void launchApp() {
        driver.launchApp();
    }

    public void tapBottomTab(String tabName) {
        String selector = switch (tabName.trim().toLowerCase(Locale.ROOT)) {
            case "dashboard" -> "[data-tab='dashboard']";
            case "holdings" -> "[data-tab='holdings']";
            case "analytics" -> "[data-tab='analytics']";
            case "dividends" -> "[data-tab='dividends']";
            case "transactions" -> "[data-tab='transactions']";
            case "tools" -> "[data-tab='tools']";
            default -> throw new IllegalArgumentException("Unknown mobile tab: " + tabName);
        };
        driver.tap(selector);
    }

    public void assertTabWorkspaceVisible(String tabName) {
        String selector = switch (tabName.trim().toLowerCase(Locale.ROOT)) {
            case "dashboard" -> "#mobile-dashboard-hero";
            case "holdings" -> "#mobile-holdings-hero";
            case "analytics" -> "#mobile-analytics-segment";
            case "dividends" -> "#mobile-dividends-hero";
            case "transactions" -> "#mobile-tx-list";
            case "tools" -> "#mobile-tools-segment";
            default -> throw new IllegalArgumentException("Unknown mobile tab workspace: " + tabName);
        };
        driver.assertVisible(selector);
    }

    public void openUserSettings() {
        driver.tap("#mobile-user-menu-btn");
        driver.waitForVisible("#mobile-settings-close-btn");
    }

    public void closeUserSettings() {
        driver.tap("#mobile-settings-close-btn");
        driver.waitForHidden("#mobile-settings-close-btn");
    }

    public void toggleCurrency() {
        openUserSettings();
        if (driver.hasClass("#mobile-settings-currency-thb", "active")) {
            driver.tap("#mobile-settings-currency-usd");
        } else {
            driver.tap("#mobile-settings-currency-thb");
        }
        closeUserSettings();
    }

    public void toggleLanguage() {
        openUserSettings();
        if (driver.hasClass("#mobile-settings-lang-en", "active")) {
            driver.tap("#mobile-settings-lang-th");
        } else {
            driver.tap("#mobile-settings-lang-en");
        }
        closeUserSettings();
    }

    public void togglePrivacyMode() {
        driver.tap("#mobile-privacy-toggle");
    }

    public void toggleTheme() {
        String current = driver.getHtmlAttribute("data-theme");
        openUserSettings();
        if ("dark".equalsIgnoreCase(current)) {
            driver.tap("#mobile-settings-theme-light");
        } else {
            driver.tap("#mobile-settings-theme-dark");
        }
        closeUserSettings();
    }

    public void tapRefresh() {
        driver.tap("#mobile-refresh-btn");
    }

    public void assertDashboardWidgetsVisible() {
        driver.assertVisible("#mobile-dashboard-hero");
        driver.assertVisible("#mobile-dashboard-allocation");
        driver.assertVisible("#mobile-dashboard-movers");
        driver.assertVisible("#mobile-dashboard-dividends");
        driver.assertVisible("#mobile-dashboard-pvd");
        driver.assertVisible("#mobile-dashboard-activity");
        driver.assertVisible("#mobile-dashboard-tools");
    }

    public void tapQuickAction(String target) {
        String selector = switch (target.trim().toLowerCase(Locale.ROOT)) {
            case "holdings" -> "#mobile-quick-holdings";
            case "pvd" -> "#mobile-quick-pvd";
            case "analytics" -> "#mobile-quick-analytics";
            case "dividends" -> "#mobile-quick-dividends";
            case "transactions" -> "#mobile-quick-transactions";
            case "tools" -> "#mobile-quick-tools";
            default -> throw new IllegalArgumentException("Unknown dashboard quick action: " + target);
        };
        driver.tap(selector);
    }
}
