package com.sgsk.wealth.e2e.pages;

import com.microsoft.playwright.Locator;
import com.microsoft.playwright.Page;

public class AllocationPage {
    private final Page page;
    public final Locator donutChart;
    public final Locator resetFilterBtn;
    public final Locator classRows;

    public AllocationPage(Page page) {
        this.page = page;
        this.donutChart = page.locator("app-asset-allocation .donut-svg");
        this.resetFilterBtn = page.locator("button:has-text('All Asset Classes')");
        this.classRows = page.locator("app-asset-allocation tr");
    }

    public void clickClassRow(String className) {
        page.locator("app-asset-allocation tr:has-text(\"" + className + "\")").first().click();
    }

    public void resetClassFilter() {
        resetFilterBtn.click();
    }
}
