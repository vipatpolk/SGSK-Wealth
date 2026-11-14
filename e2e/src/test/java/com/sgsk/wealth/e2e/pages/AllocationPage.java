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
}
