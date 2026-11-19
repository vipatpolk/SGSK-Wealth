package com.sgsk.wealth.e2e.mobile.transactions;

import com.sgsk.wealth.e2e.mobile.common.MobileDriverBridge;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;

public class MobileTransactionsSteps {
    private final MobileDriverBridge driver;
    private final MobileTransactionsScreen transactionsScreen;

    public MobileTransactionsSteps(MobileDriverBridge driver, MobileTransactionsScreen transactionsScreen) {
        this.driver = driver;
        this.transactionsScreen = transactionsScreen;
    }

    @When("I open the mobile transaction symbol selector")
    public void openMobileTransactionSymbolSelector() {
        transactionsScreen.openTransactionSymbolSelector();
    }

    @When("I pick {string} from the mobile transaction symbol sheet")
    public void selectSymbolInMobileTransactionSheet(String symbol) {
        transactionsScreen.selectTransactionSymbolFromSheet(symbol);
    }

    @When("I clear the selected mobile transaction symbol")
    public void clearMobileTransactionSymbol() {
        transactionsScreen.clearTransactionSymbolFilter();
    }

    @When("I filter mobile transactions by type {string}")
    public void filterMobileTransactionsByType(String type) {
        transactionsScreen.filterTransactionsByType(type);
    }

    @When("I toggle mobile transaction sort order")
    public void toggleMobileTransactionsSortOrder() {
        transactionsScreen.toggleTransactionsSortOrder();
    }

    @Then("the mobile transactions feed should be displayed")
    public void verifyMobileTransactionsFeedDisplayed() {
        driver.assertVisible("#mobile-tx-list");
    }

    @Then("the mobile transactions view should show clear symbol action")
    public void verifyMobileTransactionClearVisible() {
        driver.assertVisible("#mobile-tx-clear-sym");
    }
}
