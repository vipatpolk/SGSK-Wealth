package com.sgsk.wealth.e2e.steps.ui;

import com.microsoft.playwright.Locator;
import com.microsoft.playwright.Page;
import com.sgsk.wealth.e2e.context.TestContext;
import com.sgsk.wealth.e2e.pages.DividendPage;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;

import static com.microsoft.playwright.assertions.PlaywrightAssertions.assertThat;

public class DividendSteps {
    private final TestContext context;

    public DividendSteps(TestContext context) {
        this.context = context;
    }

    private Page page() {
        return context.getPage();
    }

    private DividendPage dividendPage() {
        return new DividendPage(page());
    }

    @Then("the dividend view should render 5 summary KPI cards")
    public void verifySummaryCardsCount() {
        assertThat(dividendPage().summaryCards).hasCount(5);
    }

    @Then("the Yield on Cost card should display {string} and label {string}")
    public void verifyYocCard(String value, String label) {
        Locator yocCard = dividendPage().getYocSummaryCard();
        assertThat(yocCard.locator(".div-summary-label")).containsText(label);
        assertThat(yocCard.locator(".div-summary-value")).containsText(value);
        assertThat(yocCard.locator(".div-summary-sub")).containsText("Market Yield");
    }

    @Then("the dividend asset breakdown card for {string} should display YOC {string}")
    public void verifyAssetCardYoc(String assetName, String expectedYoc) {
        DividendPage divPage = dividendPage();
        assertThat(divPage.assetCards.first()).isVisible();

        Locator card = divPage.getAssetCardByName(assetName);
        assertThat(card).isVisible();
        assertThat(card.locator(".asset-card-metrics")).containsText("YOC:");
        assertThat(card.locator(".asset-card-metrics")).containsText(expectedYoc);
    }

    @Then("the Yield on Cost KPI card should show {string}")
    public void verifyYocKpiValue(String expectedVal) {
        assertThat(dividendPage().getYocSummaryValue()).containsText(expectedVal);
    }

    @When("I filter dividends to asset type {string}")
    public void filterDividends(String assetType) {
        dividendPage().filterByAssetType(assetType);
    }

    @Then("the monthly cashflow timeline chart should be visible")
    public void verifyTimelineChartVisible() {
        assertThat(dividendPage().chartCard).isVisible();
    }

    @Then("the timeline legend should contain {string}, {string}, {string}, and {string}")
    public void verifyTimelineLegend(String leg1, String leg2, String leg3, String leg4) {
        Locator legend = dividendPage().chartLegend;
        assertThat(legend).containsText(leg1);
        assertThat(legend).containsText(leg2);
        assertThat(legend).containsText(leg3);
        assertThat(legend).containsText(leg4);
    }
}
