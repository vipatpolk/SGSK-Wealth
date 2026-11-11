package com.sgsk.wealth.e2e.steps.ui;

import com.microsoft.playwright.Locator;
import com.microsoft.playwright.Page;
import com.sgsk.wealth.e2e.context.TestContext;
import com.sgsk.wealth.e2e.pages.PerformancePage;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;

import static com.microsoft.playwright.assertions.PlaywrightAssertions.assertThat;

public class PerformanceSteps {
    private final TestContext context;

    public PerformanceSteps(TestContext context) {
        this.context = context;
    }

    private Page page() {
        return context.getPage();
    }

    @Then("the performance summary grid should render 5 KPI cards")
    public void verifyPerformanceSummaryGrid() {
        PerformancePage perf = new PerformancePage(page());
        assertThat(perf.summaryGrid).isVisible();
        assertThat(perf.summaryCards).hasCount(5);
    }

    @When("I select the performance date preset {string}")
    public void selectDatePreset(String preset) {
        PerformancePage perf = new PerformancePage(page());
        assertThat(perf.datePickerTrigger).isVisible();
        perf.selectDatePreset(preset);
    }

    @Then("the date range picker trigger should display {string}")
    public void verifyDatePickerTriggerText(String text) {
        PerformancePage perf = new PerformancePage(page());
        assertThat(perf.datePickerTrigger).containsText(text);
    }

    @Then("the performance sections should contain {string} and {string}")
    public void verifyPerformanceSections(String section1, String section2) {
        assertThat(page().locator(".perf-chart-title").first()).containsText(section1);
        assertThat(page().locator(".perf-chart-title").nth(1)).containsText(section2);
    }

    @When("I search performance symbols for {string}")
    public void searchPerformanceSymbols(String query) {
        PerformancePage perf = new PerformancePage(page());
        perf.searchSymbol(query);
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
        PerformancePage perf = new PerformancePage(page());
        assertThat(perf.statusSelect).isVisible();
        perf.filterByStatus(status);
    }

    @Then("the status select should have value {string}")
    public void verifyStatusSelectValue(String status) {
        PerformancePage perf = new PerformancePage(page());
        assertThat(perf.statusSelect).hasValue(status);
    }
}
