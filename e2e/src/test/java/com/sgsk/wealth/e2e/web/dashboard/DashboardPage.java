package com.sgsk.wealth.e2e.web.dashboard;

import com.microsoft.playwright.Locator;
import com.microsoft.playwright.Page;
import com.sgsk.wealth.e2e.core.context.TestContext;
import io.cucumber.spring.ScenarioScope;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.ScopedProxyMode;
import org.springframework.stereotype.Component;

@Component
@ScenarioScope(proxyMode = ScopedProxyMode.NO)
public class DashboardPage {
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
    public final Locator retirementCard;
    public final Locator gotoPvdBtn;
    public final Locator toolsLaunchpadCard;
    public final Locator launchRebalancePlannerCard;
    public final Locator launchTvmCalculatorCard;
    public final Locator launchAvgCostCalculatorCard;

    @Autowired
    public DashboardPage(TestContext testContext) {
        this(testContext.getPage());
    }

    public DashboardPage(Page page) {
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
        this.retirementCard = page.locator("#dashboard-retirement-card");
        this.gotoPvdBtn = page.locator("#btn-goto-pvd-holdings");
        this.toolsLaunchpadCard = page.locator("#dashboard-tools-card");
        this.launchRebalancePlannerCard = page.locator("#launch-rebalance-planner");
        this.launchTvmCalculatorCard = page.locator("#launch-tvm-calculator");
        this.launchAvgCostCalculatorCard = page.locator("#launch-avg-cost-calculator");
    }

    public void navigateToAllocation() {
        gotoAllocationBtn.click();
    }

    public void navigateToPerformance() {
        gotoPerformanceBtn.click();
    }

    public void navigateToPvdHoldings() {
        gotoPvdBtn.click();
    }

    public void launchRebalancePlanner() {
        launchRebalancePlannerCard.click();
    }

    public void launchTool(String toolName) {
        switch (toolName.trim()) {
            case "Rebalance Planner" -> launchRebalancePlanner();
            case "TVM Calculator" -> launchTvmCalculatorCard.click();
            case "Avg Cost Calculator" -> launchAvgCostCalculatorCard.click();
            default -> throw new IllegalArgumentException("Unsupported Dashboard launchpad tool: " + toolName);
        }
    }

    public Locator moverNameBySymbol(String symbol) {
        String normalized = symbol.replaceAll("\\.BK$", "");
        return dashboardView
                .locator(".mover-row:has(.mover-display-symbol:text-is(\"" + normalized + "\"))")
                .first()
                .locator(".mover-name");
    }

    public Locator pvdPositionsMiniList() {
        return retirementCard.locator(".pvd-positions-mini-list");
    }

    public Locator pvdFactsheetButton(String symbol) {
        return retirementCard.locator("#btn-dash-pvd-factsheet-" + symbol);
    }

    public void openPvdFactsheet(String symbol) {
        Locator btn = pvdFactsheetButton(symbol);
        btn.waitFor();
        btn.click();
    }
}
