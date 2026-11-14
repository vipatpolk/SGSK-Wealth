package com.sgsk.wealth.e2e.steps.ui;

import com.microsoft.playwright.Locator;
import com.sgsk.wealth.e2e.pages.PvdHoldingsPage;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;
import org.junit.jupiter.api.Assertions;

import java.util.List;

import static com.microsoft.playwright.assertions.PlaywrightAssertions.assertThat;

public class PvdHoldingsSteps {
    private final PvdHoldingsPage pvdHoldingsPage;

    public PvdHoldingsSteps(PvdHoldingsPage pvdHoldingsPage) {
        this.pvdHoldingsPage = pvdHoldingsPage;
    }

    @When("I switch to the Provident Fund holdings view")
    public void switchToPvdHoldingsView() {
        pvdHoldingsPage.switchToPvdMode();
    }

    @When("I switch to the Market Holdings sub-view")
    public void switchToMarketHoldingsSubView() {
        pvdHoldingsPage.switchToMarketMode();
    }

    @Then("the PVD holdings screen should be visible")
    public void verifyPvdHoldingsScreenVisible() {
        assertThat(pvdHoldingsPage.pvdScreen()).isVisible();
    }

    @Then("the PVD executive hero card should display master fund {string}")
    public void verifyPvdHeroMasterFund(String fundName) {
        assertThat(pvdHoldingsPage.heroCard()).isVisible();
        assertThat(pvdHoldingsPage.heroCard()).containsText(fundName);
    }

    @Then("the PVD 4-segment composition split bar should be visible")
    public void verifyPvdSplitBarVisible() {
        assertThat(pvdHoldingsPage.overallSplitBar()).isVisible();
    }

    @Then("the PVD policy allocation donut card should be visible")
    public void verifyPvdPolicyAllocationDonutVisible() {
        assertThat(pvdHoldingsPage.policyAllocationCard()).isVisible();
    }

    @Then("the SEC risk spectrum card should display {string} and all {int} risk levels")
    public void verifySecRiskSpectrumCard(String riskCode, int levels) {
        assertThat(pvdHoldingsPage.riskSummaryCard()).isVisible();
        assertThat(pvdHoldingsPage.riskSummaryCard()).containsText(riskCode);
        Assertions.assertEquals(levels, pvdHoldingsPage.riskSpectrumScale().count());
    }

    @Then("the Market Holdings mode button should be active")
    public void verifyMarketModeActive() {
        assertThat(pvdHoldingsPage.marketSubtabBtn()).hasAttribute("aria-selected", "true");
    }

    @Then("the Provident Fund mode button should be active")
    public void verifyPvdModeActive() {
        assertThat(pvdHoldingsPage.pvdSubtabBtn()).hasAttribute("aria-selected", "true");
    }

    @Then("{int} PVD sub-policy results should be visible")
    public void verifyPvdSubPolicyCount(int expectedCount) {
        if (expectedCount > 0) {
            pvdHoldingsPage.policyCards().first().waitFor();
        }
        Assertions.assertEquals(expectedCount, pvdHoldingsPage.visiblePolicyCount());
    }

    @Then("the PVD policy card {string} should display SEC metadata {string}, {string}, and {string}")
    public void verifyPvdCardSecMetadata(String symbol, String riskCode, String aimcType, String objective) {
        Locator card = pvdHoldingsPage.policyCard(symbol);
        assertThat(card).isVisible();
        assertThat(card).containsText(riskCode);
        assertThat(card).containsText(aimcType);
        assertThat(card).containsText(objective);
    }

    @Then("the PVD policy card {string} should display employee and employer pool breakdowns")
    public void verifyPvdCardPoolsBreakdown(String symbol) {
        Locator card = pvdHoldingsPage.policyCard(symbol);
        assertThat(card.locator(".pvd-pool-box.emp")).isVisible();
        assertThat(card.locator(".pvd-pool-box.emp")).containsText("Employee");
        assertThat(card.locator(".pvd-pool-box.empr")).isVisible();
        assertThat(card.locator(".pvd-pool-box.empr")).containsText("Employer");
    }

    @When("I search PVD sub-policies for {string}")
    public void searchPvdSubPolicies(String query) {
        pvdHoldingsPage.searchPolicies(query);
    }

    @Then("the PVD policy card {string} should be visible")
    public void verifyPvdPolicyCardVisible(String symbol) {
        assertThat(pvdHoldingsPage.policyCard(symbol)).isVisible();
    }

    @When("I sort PVD sub-policies descending by {string}")
    public void sortPvdSubPoliciesDescending(String sortLabel) {
        pvdHoldingsPage.sortDescending(sortLabel);
    }

    @Then("the first PVD policy card should be {string}")
    public void verifyFirstPvdPolicyCard(String symbol) {
        List<String> ids = pvdHoldingsPage.visiblePolicyIds();
        Assertions.assertFalse(ids.isEmpty(), "Expected at least one PVD policy card");
        Assertions.assertEquals("pvd-policy-" + symbol, ids.get(0));
    }
}
