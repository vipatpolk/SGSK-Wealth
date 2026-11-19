package com.sgsk.wealth.e2e.mobile.holdings;

import com.sgsk.wealth.e2e.mobile.common.MobileDriverBridge;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;

public class MobileHoldingsSteps {
    private final MobileDriverBridge driver;
    private final MobileHoldingsScreen holdingsScreen;

    public MobileHoldingsSteps(MobileDriverBridge driver, MobileHoldingsScreen holdingsScreen) {
        this.driver = driver;
        this.holdingsScreen = holdingsScreen;
    }

    @When("I switch mobile holdings mode to {string}")
    public void switchHoldingsMode(String mode) {
        holdingsScreen.selectHoldingsMode(mode);
    }

    @When("I filter mobile holdings by asset tab {string}")
    public void filterHoldingsByTab(String assetTabId) {
        holdingsScreen.selectAssetChip(assetTabId);
    }

    @When("I filter mobile holdings by keyword {string}")
    public void filterMobileHoldingsByKeyword(String query) {
        holdingsScreen.searchHoldings(query);
    }

    @When("I toggle the mobile holdings sort direction")
    public void toggleMobileHoldingsSortDirection() {
        holdingsScreen.toggleHoldingsSortDirection();
    }

    @When("I expand all mobile holding lot panels")
    public void expandAllMobileHoldingLots() {
        holdingsScreen.toggleExpandAllHoldingsLots();
    }

    @When("I expand the FIFO lots of the first mobile holding")
    public void expandFirstMobileHoldingLots() {
        holdingsScreen.expandFirstSymbolLots();
    }

    @When("I inspect the factsheet of a fund holding on mobile")
    public void openMobileFundFactsheet() {
        holdingsScreen.openFirstFactsheetModal();
    }

    @When("I dismiss the mobile fund factsheet modal")
    public void closeMobileFundFactsheet() {
        holdingsScreen.closeFactsheetModal();
    }

    @Then("the mobile market holdings list should be displayed")
    public void verifyMobileHoldingsDisplayed() {
        driver.assertVisible("#mobile-position-cards");
    }

    @Then("the mobile holdings list should include {string}")
    public void verifyMobileHoldingsIncludeSymbol(String symbol) {
        holdingsScreen.assertAnyHoldingContainsSymbol(symbol);
    }

    @Then("the mobile closed positions list should be displayed")
    public void verifyMobileClosedPositionsDisplayed() {
        holdingsScreen.assertClosedPositionsVisible();
    }

    @Then("the mobile provident fund holdings list should be displayed")
    public void verifyMobilePvdDisplayed() {
        holdingsScreen.assertPvdExecutiveSectionsVisible();
    }

    @Then("the mobile SEC factsheet modal should be visible")
    public void verifyMobileFactsheetVisible() {
        driver.assertVisible("#mobile-factsheet-close");
    }

    @Then("the mobile SEC factsheet modal should be dismissed")
    public void verifyMobileFactsheetDismissed() {
        holdingsScreen.assertFactsheetClosed();
    }
}
