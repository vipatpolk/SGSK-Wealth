package com.sgsk.wealth.e2e.web.analytics;

import com.microsoft.playwright.Locator;
import com.microsoft.playwright.Page;
import com.sgsk.wealth.e2e.core.context.TestContext;
import io.cucumber.datatable.DataTable;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;
import java.util.Map;

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
        Locator row = page().locator("#asset-allocation-pane tr:has-text(\"" + className + "\")");
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

    @Then("the symbol allocation breakdown for {string} should be visible")
    public void verifySymbolAllocationBreakdownForClass(String className) {
        assertThat(page().locator("#asset-allocation-pane .allocation-card-title:has-text(\"Symbol Allocation in " + className + "\")")).isVisible();
        assertThat(page().locator("#asset-allocation-pane .symbol-class-list")).isVisible();
    }

    @Then("the allocation currency exposure and concentration cards should be visible")
    public void verifyAllocationBottomRowVisible() {
        assertThat(page().locator("#allocation-currency-card")).isVisible();
        assertThat(page().locator("#allocation-concentration-card")).isVisible();
    }

    @Then("the allocation bottom row should be hidden")
    public void verifyAllocationBottomRowHidden() {
        assertThat(page().locator("#allocation-bottom-row")).isHidden();
    }

    @When("I switch to the Analytics Overview sub-tab")
    public void switchToOverviewSubTab() {
        allocationPage.selectOverviewSubTab();
    }

    @Then("the analytics overview grid should display {int} KPI cards")
    public void verifyOverviewKpiCards(int count) {
        assertThat(allocationPage.overviewKpiCards).hasCount(count);
    }

    @Then("the allocation class drill-down should display localized symbol names:")
    public void verifyAllocationClassDrillDownLocalizedNames(DataTable dataTable) {
        for (Map<String, String> row : dataTable.asMaps()) {
            String assetClass = row.get("AssetClass");
            String symbol = row.get("Symbol");
            String expectedName = row.get("ExpectedName");
            allocationPage.drillDownToAssetClass(assetClass);
            assertThat(allocationPage.symbolBreakdownName(symbol)).containsText(expectedName);
            allocationPage.resetDrillDownToAllClasses();
        }
    }
}
