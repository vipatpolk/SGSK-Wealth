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
    private final AllocationPage allocationPage;

    public AllocationSteps(TestContext context, AllocationPage allocationPage) {
        this.context = context;
        this.allocationPage = allocationPage;
    }

    private Page page() {
        return context.getPage();
    }

    @Then("the allocation donut chart should be visible")
    public void verifyDonutChartVisible() {
        assertThat(allocationPage.donutChart).isVisible();
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
        if (allocationPage.resetFilterBtn.isVisible()) {
            allocationPage.resetClassFilter();
        }
    }

    @Then("the asset class breakdown table and rebalance list should be visible")
    public void verifyBreakdownTableAndRebalanceList() {
        assertThat(page().locator(".allocation-card-title:has-text(\"Asset Class Breakdown\")")).isVisible();
        assertThat(page().locator(".rebalance-list")).isVisible();
    }

    @When("I switch to the Analytics Overview sub-tab")
    public void switchToOverviewSubTab() {
        allocationPage.selectOverviewSubTab();
    }

    @Then("the analytics overview grid should display {int} KPI cards")
    public void verifyOverviewKpiCards(int count) {
        assertThat(allocationPage.overviewKpiCards).hasCount(count);
    }
}
