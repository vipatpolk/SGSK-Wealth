package com.sgsk.wealth.e2e.web.analytics;

import com.microsoft.playwright.Locator;
import com.microsoft.playwright.Page;
import com.sgsk.wealth.e2e.core.context.TestContext;
import io.cucumber.datatable.DataTable;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;
import java.util.Map;

import static com.microsoft.playwright.assertions.PlaywrightAssertions.assertThat;

public class PerformanceSteps {
    private final TestContext context;
    private final PerformancePage performancePage;

    public PerformanceSteps(TestContext context, PerformancePage performancePage) {
        this.context = context;
        this.performancePage = performancePage;
    }

    private Page page() {
        return context.getPage();
    }

    @Then("the performance summary grid should render 5 KPI cards")
    public void verifyPerformanceSummaryGrid() {
        assertThat(performancePage.summaryGrid).isVisible();
        assertThat(performancePage.summaryCards).hasCount(5);
    }

    @When("I select the performance date preset {string}")
    public void selectDatePreset(String preset) {
        assertThat(performancePage.datePickerTrigger).isVisible();
        performancePage.selectDatePreset(preset);
    }

    @Then("the date range picker trigger should display {string}")
    public void verifyDatePickerTriggerText(String text) {
        assertThat(performancePage.datePickerTrigger).containsText(text);
    }

    @Then("the performance sections should contain {string} and {string}")
    public void verifyPerformanceSections(String section1, String section2) {
        assertThat(page().locator(".perf-chart-title").first()).containsText(section1);
        assertThat(page().locator(".perf-chart-title").nth(1)).containsText(section2);
    }

    @When("I search performance symbols for {string}")
    public void searchPerformanceSymbols(String query) {
        performancePage.searchSymbol(query);
    }

    @Then("the performance autocomplete dropdown should suggest {string}")
    public void verifyAutocompleteSuggestion(String name) {
        Locator dropdown = page().locator("#perf-autocomplete-dropdown");
        assertThat(dropdown).isVisible();
        assertThat(page().locator(".perf-autocomplete-item")).hasCount(1);
        assertThat(page().locator(".perf-autocomplete-item-name")).containsText(name);
    }

    @When("I filter performance by status {string}")
    public void filterPerformanceByStatus(String status) {
        assertThat(performancePage.statusSelect).isVisible();
        performancePage.filterByStatus(status);
    }

    @Then("the status select should have value {string}")
    public void verifyStatusSelectValue(String status) {
        assertThat(performancePage.statusSelect).hasValue(status);
    }

    @Then("the performance table should display localized asset names:")
    public void verifyPerformanceTableLocalizedNames(DataTable dataTable) {
        for (Map<String, String> row : dataTable.asMaps()) {
            String symbol = row.get("Symbol");
            String expectedName = row.get("ExpectedName");
            assertThat(performancePage.symbolTableRowName(symbol)).containsText(expectedName);
        }
    }

    @Then("the performance top movers should display localized asset names:")
    public void verifyPerformanceTopMoversLocalizedNames(DataTable dataTable) {
        for (Map<String, String> row : dataTable.asMaps()) {
            String symbol = row.get("Symbol");
            String expectedName = row.get("ExpectedName");
            assertThat(performancePage.topMoverRowName(symbol)).containsText(expectedName);
        }
    }

    @When("I search performance autocomplete for {string}")
    public void searchPerformanceAutocomplete(String query) {
        performancePage.openSearchAutocomplete(query);
    }

    @Then("the performance autocomplete should suggest {string} for {string}")
    public void verifyPerformanceAutocompleteSuggestion(String expectedName, String symbol) {
        assertThat(performancePage.autocompleteSuggestionName(symbol)).containsText(expectedName);
    }

    @When("I close the performance search autocomplete")
    public void closePerformanceAutocomplete() {
        performancePage.closeSearchAutocomplete();
    }
}
