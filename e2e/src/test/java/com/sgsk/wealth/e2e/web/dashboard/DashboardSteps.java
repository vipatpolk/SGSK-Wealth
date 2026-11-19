package com.sgsk.wealth.e2e.web.dashboard;

import io.cucumber.datatable.DataTable;
import io.cucumber.java.en.Given;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;
import java.util.Map;

import java.util.regex.Pattern;

import static com.microsoft.playwright.assertions.PlaywrightAssertions.assertThat;

public class DashboardSteps {
    private final DashboardPage dashboardPage;

    public DashboardSteps(DashboardPage dashboardPage) {
        this.dashboardPage = dashboardPage;
    }

    @Then("the Dashboard header navigation button should be active")
    public void verifyDashboardHeaderActive() {
        assertThat(dashboardPage.dashboardHeaderToggleBtn).hasClass(Pattern.compile(".*view-toggle-btn-active.*"));
    }

    @Then("the Executive Net Worth banner should be displayed")
    public void verifyNetWorthBannerDisplayed() {
        assertThat(dashboardPage.netWorthBanner).isVisible();
    }

    @Then("the 4 executive KPI cards should be visible")
    public void verifyKpiCardsVisible() {
        assertThat(dashboardPage.kpiInvested).isVisible();
        assertThat(dashboardPage.kpiUnrealized).isVisible();
        assertThat(dashboardPage.kpiRealized).isVisible();
        assertThat(dashboardPage.kpiDividends).isVisible();
    }

    @Given("the Dashboard allocation card and donut svg are visible")
    @Then("the Dashboard allocation card and donut svg should be visible")
    public void verifyDashboardAllocationCard() {
        assertThat(dashboardPage.allocationCard).isVisible();
        assertThat(dashboardPage.allocationDonutSvg).isVisible();
    }

    @When("I click the Dashboard go to allocation button")
    public void clickDashboardGoToAllocation() {
        dashboardPage.navigateToAllocation();
    }

    @Given("the Dashboard performance card is visible")
    @Then("the Dashboard performance card should be visible")
    public void verifyDashboardPerformanceCard() {
        assertThat(dashboardPage.performanceCard).isVisible();
    }

    @When("I click the Dashboard go to performance button")
    public void clickDashboardGoToPerformance() {
        dashboardPage.navigateToPerformance();
    }

    @Given("the Dashboard tools launchpad card is visible")
    @Then("the Dashboard tools launchpad card should be visible")
    public void verifyDashboardToolsCard() {
        assertThat(dashboardPage.toolsLaunchpadCard).isVisible();
    }

    @When("I click the Dashboard launch Rebalance Planner card")
    public void clickDashboardLaunchRebalancePlanner() {
        assertThat(dashboardPage.launchRebalancePlannerCard).isVisible();
        dashboardPage.launchRebalancePlanner();
    }

    @When("I launch {string} from the Dashboard launchpad")
    public void launchToolFromDashboard(String toolName) {
        assertThat(dashboardPage.toolsLaunchpadCard).isVisible();
        dashboardPage.launchTool(toolName);
    }

    @Given("the Dashboard retirement card displays {string}")
    @Then("the Dashboard retirement card should display {string}")
    public void verifyDashboardRetirementCardContains(String expectedText) {
        assertThat(dashboardPage.retirementCard).isVisible();
        assertThat(dashboardPage.retirementCard).containsText(expectedText);
    }

    @When("I navigate from the Dashboard retirement card to PVD Holdings")
    public void navigateFromDashboardToPvdHoldings() {
        dashboardPage.navigateToPvdHoldings();
    }

    @Then("the Dashboard top movers should display localized asset names:")
    public void verifyDashboardTopMoversLocalizedNames(DataTable dataTable) {
        for (Map<String, String> row : dataTable.asMaps()) {
            String symbol = row.get("Symbol");
            String expectedName = row.get("ExpectedName");
            assertThat(dashboardPage.moverNameBySymbol(symbol)).containsText(expectedName);
        }
    }

    @Then("the Dashboard retirement card should not display {string}")
    public void verifyDashboardRetirementCardDoesNotDisplay(String unexpectedText) {
        assertThat(dashboardPage.pvdPositionsMiniList()).not().containsText(unexpectedText);
    }
}
