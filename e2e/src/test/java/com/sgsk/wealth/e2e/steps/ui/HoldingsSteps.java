package com.sgsk.wealth.e2e.steps.ui;

import com.microsoft.playwright.Locator;
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

    @When("I select the {string} asset tab")
    public void selectAssetTab(String tabName) {
        new HoldingsPage(page()).selectTab(tabName);
    }

    @Then("the card for {string} should be visible")
    public void verifyCardVisible(String symbol) {
        Locator cardLocator = symbol.contains(".")
                ? page().locator("[id=\"card-" + symbol + "\"]")
                : page().locator("#card-" + symbol);
        assertThat(cardLocator).isVisible();
    }

    @When("I expand the symbol row for {string}")
    public void expandSymbolRow(String symbol) {
        new HoldingsPage(page()).clickSymbolRow(symbol);
    }

    @Then("the lots drawer container should be visible")
    public void verifyLotsDrawerVisible() {
        assertThat(page().locator(".lots-container")).isVisible();
    }

    @Then("the lots drawer should contain {string}")
    public void verifyLotsDrawerContains(String text) {
        assertThat(page().locator(".lots-container")).containsText(text);
    }

    @When("I search holdings for {string}")
    public void searchHoldings(String term) {
        new HoldingsPage(page()).searchSymbol(term);
    }
}
