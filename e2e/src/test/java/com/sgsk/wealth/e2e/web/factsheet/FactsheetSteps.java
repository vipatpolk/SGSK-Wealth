package com.sgsk.wealth.e2e.web.factsheet;

import com.sgsk.wealth.e2e.web.dashboard.DashboardPage;
import com.sgsk.wealth.e2e.web.holdings.HoldingsPage;
import com.sgsk.wealth.e2e.web.holdings.PvdHoldingsPage;
import io.cucumber.java.en.Given;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;

import static com.microsoft.playwright.assertions.PlaywrightAssertions.assertThat;

public class FactsheetSteps {
    private final FactsheetModalPage factsheetModalPage;
    private final HoldingsPage holdingsPage;
    private final PvdHoldingsPage pvdHoldingsPage;
    private final DashboardPage dashboardPage;

    public FactsheetSteps(
            FactsheetModalPage factsheetModalPage,
            HoldingsPage holdingsPage,
            PvdHoldingsPage pvdHoldingsPage,
            DashboardPage dashboardPage) {
        this.factsheetModalPage = factsheetModalPage;
        this.holdingsPage = holdingsPage;
        this.pvdHoldingsPage = pvdHoldingsPage;
        this.dashboardPage = dashboardPage;
    }

    @Given("I have opened the fund fact sheet for {string} from {string} holdings")
    public void openFundFactsheetFromHoldingsTab(String symbol, String tabName) {
        holdingsPage.selectTab(tabName);
        openFundFactsheetFromHoldings(symbol);
    }

    @When("I open the fund fact sheet for {string} from holdings")
    public void openFundFactsheetFromHoldings(String symbol) {
        holdingsPage.openFactsheet(symbol);
        factsheetModalPage.modal().waitFor();
    }

    @Given("I have opened the fund fact sheet for PVD policy {string}")
    @When("I open the fund fact sheet for PVD policy {string}")
    public void openFundFactsheetFromPvdHoldings(String symbol) {
        pvdHoldingsPage.openFactsheet(symbol);
        factsheetModalPage.modal().waitFor();
    }

    @Given("I have opened the fund fact sheet for Dashboard PVD policy {string}")
    @When("I open the fund fact sheet for Dashboard PVD policy {string}")
    public void openFundFactsheetFromDashboardPvd(String symbol) {
        dashboardPage.openPvdFactsheet(symbol);
        factsheetModalPage.modal().waitFor();
    }

    @Then("the fund fact sheet modal should display {string} with risk {string}")
    public void verifyFactsheetModalTitleAndRisk(String expectedTitle, String expectedRisk) {
        assertThat(factsheetModalPage.modal()).isVisible();
        assertThat(factsheetModalPage.title()).containsText(expectedTitle);
        assertThat(factsheetModalPage.riskBadge()).hasText(expectedRisk);
    }

    @Then("the fund fact sheet modal should contain {string}")
    public void verifyFactsheetModalContains(String expectedText) {
        assertThat(factsheetModalPage.modal()).containsText(expectedText);
    }

    @Then("the fund fact sheet modal should display the official PDF link")
    public void verifyFactsheetModalPdfLinkVisible() {
        assertThat(factsheetModalPage.pdfButton()).isVisible();
        assertThat(factsheetModalPage.pdfButton()).hasAttribute("href", "https://sec.example/factsheet/k-usa.pdf");
    }

    @When("I close the fund fact sheet modal")
    public void closeFundFactsheetModal() {
        factsheetModalPage.close();
    }

    @Then("the fund fact sheet modal should be hidden")
    public void verifyFactsheetModalHidden() {
        assertThat(factsheetModalPage.modal()).isHidden();
    }

    @Then("the lots drawer for {string} should remain collapsed")
    public void verifyLotsDrawerCollapsed(String symbol) {
        assertThat(holdingsPage.lotsDrawerForSymbol(symbol)).hasCount(0);
    }
}
