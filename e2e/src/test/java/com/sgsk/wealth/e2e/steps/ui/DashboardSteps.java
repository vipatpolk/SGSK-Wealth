package com.sgsk.wealth.e2e.steps.ui;

import com.microsoft.playwright.Locator;
import com.microsoft.playwright.Page;
import com.sgsk.wealth.e2e.context.TestContext;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;

import java.util.regex.Pattern;

import static com.microsoft.playwright.assertions.PlaywrightAssertions.assertThat;

public class DashboardSteps {
    private final TestContext context;

    public DashboardSteps(TestContext context) {
        this.context = context;
    }

    private Page page() {
        return context.getPage();
    }

    @Then("the Dashboard header navigation button should be active")
    public void verifyDashboardHeaderActive() {
        assertThat(page().locator("#view-toggle-dashboard")).hasClass(Pattern.compile(".*view-toggle-btn-active.*"));
    }

    @Then("the Executive Net Worth banner should be displayed")
    public void verifyNetWorthBannerDisplayed() {
        assertThat(page().locator("#dashboard-net-worth")).isVisible();
    }

    @Then("the 4 executive KPI cards should be visible")
    public void verifyKpiCardsVisible() {
        assertThat(page().locator("#kpi-invested")).isVisible();
        assertThat(page().locator("#kpi-unrealized")).isVisible();
        assertThat(page().locator("#kpi-realized")).isVisible();
        assertThat(page().locator("#kpi-dividends")).isVisible();
    }

    @Then("the Dashboard allocation card and donut svg should be visible")
    public void verifyDashboardAllocationCard() {
        Locator allocCard = page().locator("#dashboard-allocation-card");
        assertThat(allocCard).isVisible();
        assertThat(allocCard.locator(".donut-svg")).isVisible();
    }

    @When("I click the Dashboard go to allocation button")
    public void clickDashboardGoToAllocation() {
        page().locator("#btn-goto-allocation").click();
    }

    @Then("the Dashboard performance card should be visible")
    public void verifyDashboardPerformanceCard() {
        assertThat(page().locator("#dashboard-performance-card")).isVisible();
    }

    @When("I click the Dashboard go to performance button")
    public void clickDashboardGoToPerformance() {
        page().locator("#btn-goto-performance").click();
    }

    @Then("the Dashboard tools launchpad card should be visible")
    public void verifyDashboardToolsCard() {
        assertThat(page().locator("#dashboard-tools-card")).isVisible();
    }

    @When("I click the Dashboard launch Rebalance Planner card")
    public void clickDashboardLaunchRebalancePlanner() {
        Locator rebalanceCard = page().locator("#launch-rebalance-planner");
        assertThat(rebalanceCard).isVisible();
        rebalanceCard.click();
    }
}
