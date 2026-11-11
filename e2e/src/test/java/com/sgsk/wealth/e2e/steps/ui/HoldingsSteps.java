package com.sgsk.wealth.e2e.steps.ui;

import com.microsoft.playwright.Page;
import com.sgsk.wealth.e2e.context.TestContext;
import com.sgsk.wealth.e2e.pages.HoldingsPage;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;

import static com.microsoft.playwright.assertions.PlaywrightAssertions.assertThat;

public class HoldingsSteps {
    private final TestContext context;

    public HoldingsSteps(TestContext context) {
        this.context = context;
    }

    private Page page() {
        return context.getPage();
    }

    private HoldingsPage holdingsPage() {
        return new HoldingsPage(page());
    }

    @When("I select the {string} asset tab")
    public void selectAssetTab(String tabName) {
        holdingsPage().selectTab(tabName);
    }

    @Then("the card for {string} should be visible")
    public void verifyCardVisible(String symbol) {
        assertThat(holdingsPage().getSymbolCard(symbol)).isVisible();
    }

    @When("I expand the symbol row for {string}")
    public void expandSymbolRow(String symbol) {
        holdingsPage().clickSymbolRow(symbol);
    }

    @Then("the lots drawer container should be visible")
    public void verifyLotsDrawerVisible() {
        assertThat(holdingsPage().expandedDrawer).isVisible();
    }

    @Then("the lots drawer should contain {string}")
    public void verifyLotsDrawerContains(String text) {
        assertThat(holdingsPage().expandedDrawer).containsText(text);
    }

    @When("I search holdings for {string}")
    public void searchHoldings(String term) {
        holdingsPage().searchSymbol(term);
    }
}
