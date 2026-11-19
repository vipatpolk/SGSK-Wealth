package com.sgsk.wealth.e2e.mobile.dividends;

import com.sgsk.wealth.e2e.mobile.common.MobileDriverBridge;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;

public class MobileDividendsSteps {
    private final MobileDriverBridge driver;
    private final MobileDividendsScreen dividendsScreen;

    public MobileDividendsSteps(MobileDriverBridge driver, MobileDividendsScreen dividendsScreen) {
        this.driver = driver;
        this.dividendsScreen = dividendsScreen;
    }

    @When("I filter mobile dividends by asset class {string}")
    public void filterMobileDividendsByAsset(String assetType) {
        dividendsScreen.filterDividendsByAsset(assetType);
    }

    @When("I inspect the monthly dividend bar on mobile")
    public void inspectMobileDividendMonthBar() {
        dividendsScreen.tapFirstDividendMonthBar();
    }

    @When("I open a symbol dividend ledger modal on mobile")
    public void openMobileSymbolDividendLedger() {
        dividendsScreen.openFirstDividendSymbolLedger();
    }

    @When("I close the mobile dividend ledger modal")
    public void closeMobileSymbolDividendLedger() {
        dividendsScreen.closeDividendSymbolLedger();
    }

    @Then("the mobile dividends summary should be displayed")
    public void verifyMobileDividendsDisplayed() {
        driver.assertVisible("#mobile-dividends-hero");
    }

    @Then("the mobile monthly dividend chart and ledger should be displayed")
    public void verifyMobileDividendChartAndLedgerDisplayed() {
        driver.assertVisible("#mobile-div-monthly-chart");
        driver.assertVisible("#mobile-dividend-ledger");
    }

    @Then("the mobile dividend symbol ledger modal should be displayed")
    public void verifyMobileDividendSymbolModalDisplayed() {
        driver.assertVisible("#mobile-div-ledger-close");
    }
}
