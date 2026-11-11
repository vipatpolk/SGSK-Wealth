package com.sgsk.wealth.e2e.pages;

import com.microsoft.playwright.Locator;
import com.microsoft.playwright.Page;

public class DashboardPage {
    private final Page page;
    public final Locator dashboardView;
    public final Locator dashboardHeaderToggleBtn;
    public final Locator netWorthBanner;
    public final Locator kpiInvested;
    public final Locator kpiUnrealized;
    public final Locator kpiRealized;
    public final Locator kpiDividends;
    public final Locator allocationCard;
    public final Locator allocationDonutSvg;
    public final Locator gotoAllocationBtn;
    public final Locator performanceCard;
    public final Locator gotoPerformanceBtn;
    public final Locator toolsLaunchpadCard;
    public final Locator launchRebalancePlannerCard;

    public DashboardPage(Page page) {
        this.page = page;
        this.dashboardView = page.locator("#dashboard-view");
        this.dashboardHeaderToggleBtn = page.locator("#view-toggle-dashboard");
        this.netWorthBanner = page.locator("#dashboard-net-worth");
        this.kpiInvested = page.locator("#kpi-invested");
        this.kpiUnrealized = page.locator("#kpi-unrealized");
        this.kpiRealized = page.locator("#kpi-realized");
        this.kpiDividends = page.locator("#kpi-dividends");
        this.allocationCard = page.locator("#dashboard-allocation-card");
        this.allocationDonutSvg = allocationCard.locator(".donut-svg");
        this.gotoAllocationBtn = page.locator("#btn-goto-allocation");
        this.performanceCard = page.locator("#dashboard-performance-card");
        this.gotoPerformanceBtn = page.locator("#btn-goto-performance");
        this.toolsLaunchpadCard = page.locator("#dashboard-tools-card");
        this.launchRebalancePlannerCard = page.locator("#launch-rebalance-planner");
    }

    public void navigateToAllocation() {
        gotoAllocationBtn.click();
    }

    public void navigateToPerformance() {
        gotoPerformanceBtn.click();
    }

    public void launchRebalancePlanner() {
        launchRebalancePlannerCard.click();
    }
}
