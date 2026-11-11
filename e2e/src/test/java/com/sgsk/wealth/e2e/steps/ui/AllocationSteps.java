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

    @Then("the allocation donut chart should be visible")
    public void verifyDonutChartVisible() {
        AllocationPage allocation = new AllocationPage(page());
        assertThat(allocation.donutChart).isVisible();
    }

    @When("I filter allocation to {string} if present")
    public void filterAllocation(String className) {
        Locator row = page().locator("app-asset-allocation tr:has-text(\"" + className + "\")");
        if (row.isVisible()) {
            row.click();
        }
    }

    @Then("I reset the allocation filter if the reset button is visible")
    public void resetAllocationFilter() {
        Locator resetButton = page().locator("button:has-text(\"All Asset Classes\")");
        if (resetButton.isVisible()) {
            resetButton.click();
        }
    }

    @Then("the asset class breakdown table and rebalance list should be visible")
    public void verifyBreakdownTableAndRebalanceList() {
        assertThat(page().locator(".allocation-card-title:has-text(\"Asset Class Breakdown\")")).isVisible();
        assertThat(page().locator(".rebalance-list")).isVisible();
    }
}
