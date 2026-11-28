package com.sgsk.wealth.e2e.web.navigation;

import com.microsoft.playwright.Locator;
import com.microsoft.playwright.Page;
import com.microsoft.playwright.options.WaitForSelectorState;
import com.sgsk.wealth.e2e.core.context.TestContext;
import io.cucumber.spring.ScenarioScope;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.ScopedProxyMode;
import org.springframework.stereotype.Component;

@Component
@ScenarioScope(proxyMode = ScopedProxyMode.NO)
public class HeaderPage {
    public final Locator logoText;
    public final Locator viewToggleDashboardBtn;
    public final Locator viewToggleHoldingsBtn;
    public final Locator viewToggleAnalyticsBtn;
    public final Locator analyticsTabOverviewBtn;
    public final Locator analyticsTabAllocationBtn;
    public final Locator analyticsTabPerformanceBtn;
    public final Locator viewToggleTransactionsBtn;
    public final Locator viewToggleToolsBtn;
    public final Locator viewToggleDividendsBtn;
    public final Locator privacyToggleBtn;
    public final Locator userMenuBtn;
    public final Locator userMenuDropdown;
    public final Locator userMenuSettingsBtn;
    public final Locator userMenuLocalDataBtn;
    public final Locator userMenuSignInBtn;
    public final Locator userMenuSignOutBtn;
    public final Locator settingsModal;
    public final Locator currencyUsdBtn;
    public final Locator currencyThbBtn;
    public final Locator langEnBtn;
    public final Locator langThBtn;
    public final Locator settingsThemeDarkBtn;
    public final Locator settingsThemeLightBtn;
    public final Locator settingsThemeSystemBtn;
    public final Locator settingsCloseBtn;
    private final Page page;

    @Autowired
    public HeaderPage(TestContext testContext) {
        this(testContext.getPage());
    }

    public HeaderPage(Page page) {
        this.page = page;
        this.logoText = page.locator(".logo-text");
        this.viewToggleDashboardBtn = page.locator("#view-toggle-dashboard");
        this.viewToggleHoldingsBtn = page.locator("#view-toggle-holdings");
        this.viewToggleAnalyticsBtn = page.locator("#view-toggle-analytics");
        this.analyticsTabOverviewBtn = page.locator("#analytics-tab-overview");
        this.analyticsTabAllocationBtn = page.locator("#analytics-tab-allocation");
        this.analyticsTabPerformanceBtn = page.locator("#analytics-tab-performance");
        this.viewToggleTransactionsBtn = page.locator("#view-toggle-transactions");
        this.viewToggleToolsBtn = page.locator("#view-toggle-tools");
        this.viewToggleDividendsBtn = page.locator("#view-toggle-dividends");
        this.privacyToggleBtn = page.locator("#privacy-toggle-btn");
        this.userMenuBtn = page.locator("#user-menu-btn");
        this.userMenuDropdown = page.locator("#user-menu-dropdown");
        this.userMenuSettingsBtn = page.locator("#user-menu-settings-btn");
        this.userMenuLocalDataBtn = page.locator("#user-menu-local-data-btn");
        this.userMenuSignInBtn = page.locator("#user-menu-signin-btn");
        this.userMenuSignOutBtn = page.locator("#user-menu-signout-btn");
        this.settingsModal = page.locator("#user-settings-modal");
        this.currencyUsdBtn = page.locator("#currency-btn-usd");
        this.currencyThbBtn = page.locator("#currency-btn-thb");
        this.langEnBtn = page.locator("#lang-btn-en");
        this.langThBtn = page.locator("#lang-btn-th");
        this.settingsThemeDarkBtn = page.locator("#settings-theme-dark");
        this.settingsThemeLightBtn = page.locator("#settings-theme-light");
        this.settingsThemeSystemBtn = page.locator("#settings-theme-system");
        this.settingsCloseBtn = page.locator("#settings-close-btn");
    }

    public void selectDashboardView() {
        viewToggleDashboardBtn.click();
    }

    public void selectHoldingsView() {
        viewToggleHoldingsBtn.click();
    }

    public void selectAnalyticsView() {
        viewToggleAnalyticsBtn.click();
    }

    public void selectAllocationView() {
        viewToggleAnalyticsBtn.click();
        analyticsTabAllocationBtn.click();
    }

    public void selectPerformanceView() {
        viewToggleAnalyticsBtn.click();
        analyticsTabPerformanceBtn.click();
    }

    public void selectTransactionsView() {
        viewToggleTransactionsBtn.click();
    }

    public void selectToolsView() {
        viewToggleToolsBtn.click();
    }

    public void selectDividendsView() {
        viewToggleDividendsBtn.click();
    }

    public void selectView(String viewName) {
        switch (viewName.trim().toLowerCase(java.util.Locale.ROOT)) {
            case "dashboard" -> selectDashboardView();
            case "holdings" -> selectHoldingsView();
            case "analytics" -> selectAnalyticsView();
            case "allocation" -> selectAllocationView();
            case "performance" -> selectPerformanceView();
            case "dividends" -> selectDividendsView();
            case "transactions" -> selectTransactionsView();
            case "tools" -> selectToolsView();
            default -> throw new IllegalArgumentException("Unsupported workspace view: " + viewName);
        }
    }

    public void openUserMenu() {
        if (!userMenuDropdown.isVisible()) {
            userMenuBtn.click();
            userMenuDropdown.waitFor();
        }
    }

    public void openUserSettings() {
        if (!settingsModal.isVisible()) {
            openUserMenu();
            userMenuSettingsBtn.click();
            settingsModal.waitFor();
        }
    }

    public void closeUserSettings() {
        if (settingsModal.isVisible()) {
            settingsCloseBtn.click();
            settingsModal.waitFor(new Locator.WaitForOptions().setState(WaitForSelectorState.HIDDEN));
        }
    }

    public void switchToUSD() {
        currencyUsdBtn.click();
    }

    public void switchToTHB() {
        currencyThbBtn.click();
    }

    public void switchToEN() {
        langEnBtn.click();
    }

    public void switchToTH() {
        langThBtn.click();
    }

    public void setTheme(String targetTheme) {
        openUserSettings();
        if ("light".equalsIgnoreCase(targetTheme)) {
            settingsThemeLightBtn.click();
        } else {
            settingsThemeDarkBtn.click();
        }
        closeUserSettings();
    }

    public void toggleTheme() {
        String current = page.locator("html").getAttribute("data-theme");
        openUserSettings();
        if (current == null || "dark".equalsIgnoreCase(current)) {
            settingsThemeLightBtn.click();
        } else {
            settingsThemeDarkBtn.click();
        }
        closeUserSettings();
    }
}
