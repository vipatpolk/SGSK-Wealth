package com.sgsk.wealth.e2e.steps.ui;

import com.microsoft.playwright.Locator;
import com.microsoft.playwright.Page;
import com.sgsk.wealth.e2e.context.TestContext;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;

import java.util.regex.Pattern;

import static com.microsoft.playwright.assertions.PlaywrightAssertions.assertThat;

public class DividendSteps {
    private final TestContext context;

    public DividendSteps(TestContext context) {
        this.context = context;
    }

    private Page page() {
        return context.getPage();
    }

    @Then("the dividend view should render 5 summary KPI cards")
    public void verifySummaryCardsCount() {
        assertThat(page().locator(".div-summary-card")).hasCount(5);
    }

    @Then("the Yield on Cost card should display {string} and label {string}")
    public void verifyYocCard(String value, String label) {
        Locator yocCard = page().locator(".div-summary-card").nth(2);
        assertThat(yocCard.locator(".div-summary-label")).containsText(label);
        assertThat(yocCard.locator(".div-summary-value")).containsText(value);
        assertThat(yocCard.locator(".div-summary-sub")).containsText("Market Yield");
    }

    @Then("the dividend asset breakdown card for {string} should display YOC {string}")
    public void verifyAssetCardYoc(String assetName, String expectedYoc) {
        Locator assetCards = page().locator(".div-asset-card");
        assertThat(assetCards.first()).isVisible();

        Pattern pattern = Pattern.compile(assetName, Pattern.CASE_INSENSITIVE);
        Locator card = assetCards.filter(new Locator.FilterOptions().setHasText(pattern));
        assertThat(card).isVisible();
        assertThat(card.locator(".asset-card-metrics")).containsText("YOC:");
        assertThat(card.locator(".asset-card-metrics")).containsText(expectedYoc);
    }

    @Then("the Yield on Cost KPI card should show {string}")
    public void verifyYocKpiValue(String expectedVal) {
        Locator yocCardValue = page().locator(".div-summary-card").nth(2).locator(".div-summary-value");
        assertThat(yocCardValue).containsText(expectedVal);
    }

    @When("I filter dividends to asset type {string}")
    public void filterDividends(String assetType) {
        page().locator(".global-pill-btn", new Page.LocatorOptions().setHasText(assetType)).click();
    }

    @Then("the monthly cashflow timeline chart should be visible")
    public void verifyTimelineChartVisible() {
        assertThat(page().locator(".div-chart-card")).isVisible();
    }

    @Then("the timeline legend should contain {string}, {string}, {string}, and {string}")
    public void verifyTimelineLegend(String leg1, String leg2, String leg3, String leg4) {
        Locator legend = page().locator(".div-chart-card .div-legend");
        assertThat(legend).containsText(leg1);
        assertThat(legend).containsText(leg2);
        assertThat(legend).containsText(leg3);
        assertThat(legend).containsText(leg4);
    }
}
