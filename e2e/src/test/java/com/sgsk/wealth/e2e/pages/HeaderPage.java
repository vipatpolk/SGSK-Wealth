package com.sgsk.wealth.e2e.pages;

import com.microsoft.playwright.Locator;
import com.microsoft.playwright.Page;
import com.sgsk.wealth.e2e.context.TestContext;
import io.cucumber.spring.ScenarioScope;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.ScopedProxyMode;
import org.springframework.stereotype.Component;

@Component
@ScenarioScope(proxyMode = ScopedProxyMode.NO)
public class HeaderPage {
    private final Page page;
    public final Locator logoText;
    public final Locator viewToggleDashboardBtn;
    public final Locator viewToggleHoldingsBtn;
    public final Locator viewToggleAnalyticsBtn;
    public final Locator analyticsTabOverviewBtn;
    public final Locator analyticsTabAllocationBtn;
    public final Locator analyticsTabPerformanceBtn;
    public final Locator viewToggleTransactionsBtn;
    public final Locator viewToggleToolsBtn;
    public final Locator currencyUsdBtn;
    public final Locator currencyThbBtn;
    public final Locator themeToggleBtn;
    public final Locator privacyToggleBtn;

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
        this.currencyUsdBtn = page.locator("#currency-usd");
        this.currencyThbBtn = page.locator("#currency-thb");
        this.themeToggleBtn = page.locator("#theme-toggle-btn");
        this.privacyToggleBtn = page.locator("#privacy-toggle-btn");
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

    public void switchToUSD() {
        currencyUsdBtn.click();
    }

    public void switchToTHB() {
        currencyThbBtn.click();
    }

    public void toggleTheme() {
        themeToggleBtn.click();
    }
}
