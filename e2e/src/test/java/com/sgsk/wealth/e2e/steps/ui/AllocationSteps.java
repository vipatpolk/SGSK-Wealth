package com.sgsk.wealth.e2e.steps.ui;

import com.microsoft.playwright.Locator;
import com.microsoft.playwright.Page;
import com.sgsk.wealth.e2e.context.TestContext;
import com.sgsk.wealth.e2e.pages.AllocationPage;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;

import static com.microsoft.playwright.assertions.PlaywrightAssertions.assertThat;

public class AllocationSteps {
    private final TestContext context;

    public AllocationSteps(TestContext context) {
        this.context = context;
    }

    private Page page() {
        return context.getPage();
    }

    private AllocationPage allocationPage() {
        return new AllocationPage(page());
    }

    @Then("the allocation donut chart should be visible")
    public void verifyDonutChartVisible() {
        assertThat(allocationPage().donutChart).isVisible();
    }

    @When("I filter allocation to {string}")
    public void filterAllocation(String className) {
        Locator row = page().locator("app-asset-allocation tr:has-text(\"" + className + "\")");
        if (row.isVisible()) {
            row.click();
        }
    }

    @When("I reset the asset allocation filter")
    public void resetAllocationFilter() {
        AllocationPage alloc = allocationPage();
        if (alloc.resetFilterBtn.isVisible()) {
            alloc.resetClassFilter();
        }
    }

    @Then("the asset class breakdown table and rebalance list should be visible")
    public void verifyBreakdownTableAndRebalanceList() {
        assertThat(page().locator(".allocation-card-title:has-text(\"Asset Class Breakdown\")")).isVisible();
        assertThat(page().locator(".rebalance-list")).isVisible();
    }
}
