package com.sgsk.wealth.e2e.web.navigation;

import com.microsoft.playwright.Page;
import com.sgsk.wealth.e2e.core.context.TestContext;
import io.cucumber.java.en.Given;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;

import java.util.Locale;
import java.util.regex.Pattern;

import static com.microsoft.playwright.assertions.PlaywrightAssertions.assertThat;

public class ResponsiveLayoutSteps {
    private final TestContext context;
    private final ResponsiveLayoutPage responsiveLayoutPage;

    public ResponsiveLayoutSteps(TestContext context, ResponsiveLayoutPage responsiveLayoutPage) {
        this.context = context;
        this.responsiveLayoutPage = responsiveLayoutPage;
    }

    private Page page() {
        return context.getPage();
    }

    @Given("I open the SGSK Wealth application on a mobile viewport")
    public void openMobileViewport() {
        responsiveLayoutPage.setMobileViewport();
        page().navigate("/");
    }

    @Then("the native bottom navigation bar should be visible")
    public void verifyBottomNavBarVisible() {
        assertThat(responsiveLayoutPage.bottomNav).isVisible();
    }

    @When("I tap Analytics on the bottom navigation bar")
    public void tapAnalyticsOnBottomNav() {
        responsiveLayoutPage.tapAnalytics();
    }

    @When("I tap Tools on the bottom navigation bar")
    public void tapToolsOnBottomNav() {
        responsiveLayoutPage.tapTools();
    }

    @When("I select Rebalance Planner from the mobile tools dropdown")
    public void selectRebalancePlannerMobile() {
        assertThat(responsiveLayoutPage.mobileToolsDropdownTrigger).isVisible();
        responsiveLayoutPage.selectRebalancePlannerFromDropdown();
    }

    @Then("the mobile rebalance mode toggle should be visible")
    public void verifyMobileRebalanceModeToggle() {
        assertThat(responsiveLayoutPage.rebalanceModeToggle).isVisible();
        assertThat(responsiveLayoutPage.mobileModeText.first()).isVisible();
    }

    @Then("the mobile symbol cards should be visible")
    public void verifyMobileSymbolCards() {
        assertThat(responsiveLayoutPage.mobileSymbolCardsList.first()).isVisible();
    }

    @Then("the bottom nav dashboard tab should be active")
    public void verifyBottomNavDashboardActive() {
        assertThat(responsiveLayoutPage.bottomNavDashboard).hasClass(Pattern.compile(".*view-toggle-btn-active.*"));
    }

    @When("I tap Holdings on the bottom navigation bar")
    public void tapHoldingsOnBottomNav() {
        responsiveLayoutPage.tapHoldings();
    }

    @Then("the bottom nav holdings tab should be active")
    public void verifyBottomNavHoldingsActive() {
        assertThat(responsiveLayoutPage.bottomNavHoldings).hasClass(Pattern.compile(".*view-toggle-btn-active.*"));
        assertThat(responsiveLayoutPage.bottomNavDashboard).not().hasClass(Pattern.compile(".*view-toggle-btn-active.*"));
    }

    @Then("the bottom nav analytics tab should be active")
    public void verifyBottomNavAnalyticsActive() {
        assertThat(responsiveLayoutPage.bottomNavAnalytics).hasClass(Pattern.compile(".*view-toggle-btn-active.*"));
    }

    @When("I tap Dividends on the bottom navigation bar")
    public void tapDividendsOnBottomNav() {
        responsiveLayoutPage.tapDividends();
    }

    @When("I tap {string} on the bottom navigation bar")
    public void tapTabOnBottomNav(String tabName) {
        switch (tabName.trim().toLowerCase(Locale.ROOT)) {
            case "dashboard" -> responsiveLayoutPage.bottomNavDashboard.click();
            case "holdings" -> responsiveLayoutPage.tapHoldings();
            case "analytics" -> responsiveLayoutPage.tapAnalytics();
            case "dividends" -> responsiveLayoutPage.tapDividends();
            case "tools" -> responsiveLayoutPage.tapTools();
            default -> throw new IllegalArgumentException("Unsupported bottom navigation tab: " + tabName);
        }
    }

    @Then("the bottom nav {string} tab should be active")
    public void verifyBottomNavTabActive(String tabName) {
        switch (tabName.trim().toLowerCase(Locale.ROOT)) {
            case "dashboard" -> verifyBottomNavDashboardActive();
            case "holdings" -> verifyBottomNavHoldingsActive();
            case "analytics" -> verifyBottomNavAnalyticsActive();
            case "dividends" -> verifyBottomNavDividendsActive();
            case "tools" -> assertThat(responsiveLayoutPage.bottomNavTools).hasClass(Pattern.compile(".*view-toggle-btn-active.*"));
            default -> throw new IllegalArgumentException("Unsupported bottom navigation tab: " + tabName);
        }
    }

    @Then("the bottom nav dividends tab should be active")
    public void verifyBottomNavDividendsActive() {
        assertThat(responsiveLayoutPage.bottomNavDividends).hasClass(Pattern.compile(".*view-toggle-btn-active.*"));
        assertThat(responsiveLayoutPage.bottomNavAnalytics).not().hasClass(Pattern.compile(".*view-toggle-btn-active.*"));
    }
}
