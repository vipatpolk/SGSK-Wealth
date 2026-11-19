package com.sgsk.wealth.e2e.web.analytics;

import com.microsoft.playwright.Locator;
import com.microsoft.playwright.Page;
import com.sgsk.wealth.e2e.core.context.TestContext;
import io.cucumber.spring.ScenarioScope;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.ScopedProxyMode;
import org.springframework.stereotype.Component;

@Component
@ScenarioScope(proxyMode = ScopedProxyMode.NO)
public class AllocationPage {
    private final Page page;
    public final Locator donutChart;
    public final Locator resetFilterBtn;
    public final Locator classRows;
    public final Locator overviewTabBtn;
    public final Locator overviewKpiCards;

    @Autowired
    public AllocationPage(TestContext testContext) {
        this(testContext.getPage());
    }

    public AllocationPage(Page page) {
        this.page = page;
        this.donutChart = page.locator("app-asset-allocation .donut-svg");
        this.resetFilterBtn = page.locator("button:has-text('All Asset Classes')");
        this.classRows = page.locator("app-asset-allocation tr");
        this.overviewTabBtn = page.locator("#analytics-tab-overview");
        this.overviewKpiCards = page.locator(".overview-kpi-grid .overview-kpi-card");
    }

    public void clickClassRow(String className) {
        page.locator("app-asset-allocation tr:has-text(\"" + className + "\")").first().click();
    }

    public void resetClassFilter() {
        resetFilterBtn.click();
    }

    public void selectOverviewSubTab() {
        overviewTabBtn.click();
    }

    public void drillDownToAssetClass(String className) {
        page.locator("app-asset-allocation .clickable-class-row")
                .filter(new Locator.FilterOptions().setHasText(className))
                .first()
                .click();
        page.locator("app-asset-allocation .symbol-class-list").waitFor();
    }

    public void resetDrillDownToAllClasses() {
        page.locator("app-asset-allocation button.back-class-btn").click();
        page.locator("app-asset-allocation .rebalance-list").waitFor();
    }

    public Locator symbolBreakdownName(String symbol) {
        return com.sgsk.wealth.e2e.core.support.LocatorUtils
                .filterBySymbolWord(page.locator("app-asset-allocation .symbol-class-item"), symbol)
                .locator(".symbol-full-name");
    }
}
