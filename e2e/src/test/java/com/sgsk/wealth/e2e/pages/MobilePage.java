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
public class MobilePage {
    private final Page page;
    public final Locator bottomNav;
    public final Locator bottomNavDashboard;
    public final Locator bottomNavHoldings;
    public final Locator bottomNavAnalytics;
    public final Locator bottomNavDividends;
    public final Locator bottomNavTools;
    public final Locator mobileToolsDropdownTrigger;
    public final Locator toolDropdownRebalance;
    public final Locator rebalanceModeToggle;
    public final Locator mobileModeText;
    public final Locator mobileSymbolCardsList;

    @Autowired
    public MobilePage(TestContext testContext) {
        this(testContext.getPage());
    }

    public MobilePage(Page page) {
        this.page = page;
        this.bottomNav = page.locator("#view-toggle");
        this.bottomNavDashboard = page.locator("#view-toggle-dashboard");
        this.bottomNavHoldings = page.locator("#view-toggle-holdings");
        this.bottomNavAnalytics = page.locator("#view-toggle-analytics");
        this.bottomNavDividends = page.locator("#view-toggle-dividends");
        this.bottomNavTools = page.locator("#view-toggle-tools");
        this.mobileToolsDropdownTrigger = page.locator("#tools-mobile-dropdown-trigger");
        this.toolDropdownRebalance = page.locator("#tool-dropdown-rebalance-planner");
        this.rebalanceModeToggle = page.locator(".rebalance-mode-toggle");
        this.mobileModeText = page.locator(".mode-text-mobile");
        this.mobileSymbolCardsList = page.locator(".mobile-symbol-cards-list");
    }

    public void setMobileViewport() {
        page.setViewportSize(390, 844);
    }

    public void tapAnalytics() {
        bottomNavAnalytics.click();
    }

    public void tapHoldings() {
        bottomNavHoldings.click();
    }

    public void tapDividends() {
        bottomNavDividends.click();
    }

    public void tapTools() {
        bottomNavTools.click();
    }

    public void selectRebalancePlannerFromDropdown() {
        mobileToolsDropdownTrigger.click();
        toolDropdownRebalance.click();
    }
}
