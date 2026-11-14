package com.sgsk.wealth.e2e.steps.ui;

import com.sgsk.wealth.e2e.pages.HoldingsPage;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;

import static com.microsoft.playwright.assertions.PlaywrightAssertions.assertThat;

public class HoldingsSteps {
    private final HoldingsPage holdingsPage;

    public HoldingsSteps(HoldingsPage holdingsPage) {
        this.holdingsPage = holdingsPage;
    }

    @When("I select the {string} asset tab")
    public void selectAssetTab(String tabName) {
        holdingsPage.selectTab(tabName);
    }

    @Then("the card for {string} should be visible")
    public void verifyCardVisible(String symbol) {
        assertThat(holdingsPage.getSymbolCard(symbol)).isVisible();
    }

    @When("I expand the symbol row for {string}")
    public void expandSymbolRow(String symbol) {
        holdingsPage.clickSymbolRow(symbol);
    }

    @Then("the lots drawer container should be visible")
    public void verifyLotsDrawerVisible() {
        assertThat(holdingsPage.expandedDrawer).isVisible();
    }

    @Then("the lots drawer should contain {string}")
    public void verifyLotsDrawerContains(String text) {
        assertThat(holdingsPage.expandedDrawer).containsText(text);
    }

    @When("I search holdings for {string}")
    public void searchHoldings(String term) {
        holdingsPage.searchSymbol(term);
    }

    @Then("the card for {string} should be hidden")
    public void verifyCardHidden(String symbol) {
        assertThat(holdingsPage.getSymbolCard(symbol)).isHidden();
    }

    @When("I sort market holdings by {string}")
    public void sortMarketHoldingsBy(String sortMetric) {
        holdingsPage.selectSortOption(sortMetric);
    }

    @Then("the first market holding card should be {string}")
    public void verifyFirstMarketHoldingCard(String expectedSymbol) {
        String expectedId = "card-" + expectedSymbol;
        assertThat(holdingsPage.symbolCards.first()).hasAttribute("id", expectedId);
    }
}
