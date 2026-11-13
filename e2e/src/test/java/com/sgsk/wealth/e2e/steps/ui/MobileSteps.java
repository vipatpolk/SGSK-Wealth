package com.sgsk.wealth.e2e.steps.ui;

import com.microsoft.playwright.Page;
import com.sgsk.wealth.e2e.context.TestContext;
import com.sgsk.wealth.e2e.pages.MobilePage;
import io.cucumber.java.en.Given;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;

import java.util.regex.Pattern;

import static com.microsoft.playwright.assertions.PlaywrightAssertions.assertThat;

public class MobileSteps {
    private final TestContext context;
    private final MobilePage mobilePage;

    public MobileSteps(TestContext context, MobilePage mobilePage) {
        this.context = context;
        this.mobilePage = mobilePage;
    }

    private Page page() {
        return context.getPage();
    }

    @Given("I open the SGSK Wealth application on a mobile viewport")
    public void openMobileViewport() {
        mobilePage.setMobileViewport();
        page().navigate("/");
    }

    @Then("the native bottom navigation bar should be visible")
    public void verifyBottomNavBarVisible() {
        assertThat(mobilePage.bottomNav).isVisible();
    }

    @When("I tap Analytics on the bottom navigation bar")
    public void tapAnalyticsOnBottomNav() {
        mobilePage.tapAnalytics();
    }

    @When("I tap Tools on the bottom navigation bar")
    public void tapToolsOnBottomNav() {
        mobilePage.tapTools();
    }

    @When("I select Rebalance Planner from the mobile tools dropdown")
    public void selectRebalancePlannerMobile() {
        assertThat(mobilePage.mobileToolsDropdownTrigger).isVisible();
        mobilePage.selectRebalancePlannerFromDropdown();
    }

    @Then("the mobile rebalance mode toggle should be visible")
    public void verifyMobileRebalanceModeToggle() {
        assertThat(mobilePage.rebalanceModeToggle).isVisible();
        assertThat(mobilePage.mobileModeText.first()).isVisible();
    }

    @Then("the mobile symbol cards should be visible")
    public void verifyMobileSymbolCards() {
        assertThat(mobilePage.mobileSymbolCardsList.first()).isVisible();
    }

    @Then("the bottom nav dashboard tab should be active")
    public void verifyBottomNavDashboardActive() {
        assertThat(mobilePage.bottomNavDashboard).hasClass(Pattern.compile(".*view-toggle-btn-active.*"));
    }

    @When("I tap Holdings on the bottom navigation bar")
    public void tapHoldingsOnBottomNav() {
        mobilePage.tapHoldings();
    }

    @Then("the bottom nav holdings tab should be active")
    public void verifyBottomNavHoldingsActive() {
        assertThat(mobilePage.bottomNavHoldings).hasClass(Pattern.compile(".*view-toggle-btn-active.*"));
        assertThat(mobilePage.bottomNavDashboard).not().hasClass(Pattern.compile(".*view-toggle-btn-active.*"));
    }

    @Then("the bottom nav analytics tab should be active")
    public void verifyBottomNavAnalyticsActive() {
        assertThat(mobilePage.bottomNavAnalytics).hasClass(Pattern.compile(".*view-toggle-btn-active.*"));
    }

    @When("I tap Dividends on the bottom navigation bar")
    public void tapDividendsOnBottomNav() {
        mobilePage.tapDividends();
    }

    @Then("the bottom nav dividends tab should be active")
    public void verifyBottomNavDividendsActive() {
        assertThat(mobilePage.bottomNavDividends).hasClass(Pattern.compile(".*view-toggle-btn-active.*"));
        assertThat(mobilePage.bottomNavAnalytics).not().hasClass(Pattern.compile(".*view-toggle-btn-active.*"));
    }
}
