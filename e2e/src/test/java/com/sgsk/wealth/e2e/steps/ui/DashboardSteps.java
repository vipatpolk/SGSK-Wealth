package com.sgsk.wealth.e2e.steps.ui;

import com.microsoft.playwright.Page;
import com.sgsk.wealth.e2e.context.TestContext;
import com.sgsk.wealth.e2e.pages.DashboardPage;
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

    private DashboardPage dashboardPage() {
        return new DashboardPage(page());
    }

    @Then("the Dashboard header navigation button should be active")
    public void verifyDashboardHeaderActive() {
        assertThat(dashboardPage().dashboardHeaderToggleBtn).hasClass(Pattern.compile(".*view-toggle-btn-active.*"));
    }

    @Then("the Executive Net Worth banner should be displayed")
    public void verifyNetWorthBannerDisplayed() {
        assertThat(dashboardPage().netWorthBanner).isVisible();
    }

    @Then("the 4 executive KPI cards should be visible")
    public void verifyKpiCardsVisible() {
        DashboardPage dashPage = dashboardPage();
        assertThat(dashPage.kpiInvested).isVisible();
        assertThat(dashPage.kpiUnrealized).isVisible();
        assertThat(dashPage.kpiRealized).isVisible();
        assertThat(dashPage.kpiDividends).isVisible();
    }

    @Then("the Dashboard allocation card and donut svg should be visible")
    public void verifyDashboardAllocationCard() {
        DashboardPage dashPage = dashboardPage();
        assertThat(dashPage.allocationCard).isVisible();
        assertThat(dashPage.allocationDonutSvg).isVisible();
    }

    @When("I click the Dashboard go to allocation button")
    public void clickDashboardGoToAllocation() {
        dashboardPage().navigateToAllocation();
    }

    @Then("the Dashboard performance card should be visible")
    public void verifyDashboardPerformanceCard() {
        assertThat(dashboardPage().performanceCard).isVisible();
    }

    @When("I click the Dashboard go to performance button")
    public void clickDashboardGoToPerformance() {
        dashboardPage().navigateToPerformance();
    }

    @Then("the Dashboard tools launchpad card should be visible")
    public void verifyDashboardToolsCard() {
        assertThat(dashboardPage().toolsLaunchpadCard).isVisible();
    }

    @When("I click the Dashboard launch Rebalance Planner card")
    public void clickDashboardLaunchRebalancePlanner() {
        DashboardPage dashPage = dashboardPage();
        assertThat(dashPage.launchRebalancePlannerCard).isVisible();
        dashPage.launchRebalancePlanner();
    }
}
