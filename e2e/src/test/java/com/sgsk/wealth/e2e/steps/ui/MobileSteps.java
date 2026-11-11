package com.sgsk.wealth.e2e.steps.ui;

import com.microsoft.playwright.Locator;
import com.microsoft.playwright.Page;
import com.sgsk.wealth.e2e.context.TestContext;
import io.cucumber.java.en.Given;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;

import java.util.regex.Pattern;

import static com.microsoft.playwright.assertions.PlaywrightAssertions.assertThat;

public class MobileSteps {
    private final TestContext context;

    public MobileSteps(TestContext context) {
        this.context = context;
    }

    private Page page() {
        return context.getPage();
    }

    @Given("I open the SGSK Wealth application on a mobile viewport")
    public void openMobileViewport() {
        page().setViewportSize(390, 844);
        page().navigate("/");
    }

    @Then("the native bottom navigation bar should be visible")
    public void verifyBottomNavBarVisible() {
        assertThat(page().locator("#view-toggle")).isVisible();
    }

    @When("I tap Analytics on the bottom navigation bar")
    public void tapAnalyticsOnBottomNav() {
        page().locator("#view-toggle-analytics").click();
    }

    @When("I tap Tools on the bottom navigation bar")
    public void tapToolsOnBottomNav() {
        page().locator("#view-toggle-tools").click();
    }

    @When("I select Rebalance Planner from the mobile tools dropdown")
    public void selectRebalancePlannerMobile() {
        Locator trigger = page().locator("#tools-mobile-dropdown-trigger");
        assertThat(trigger).isVisible();
        trigger.click();
        page().locator("#tool-dropdown-rebalance-planner").click();
    }

    @Then("the mobile rebalance mode toggle should be visible")
    public void verifyMobileRebalanceModeToggle() {
        assertThat(page().locator(".rebalance-mode-toggle")).isVisible();
        assertThat(page().locator(".mode-text-mobile").first()).isVisible();
    }

    @Then("the mobile symbol cards should be visible")
    public void verifyMobileSymbolCards() {
        assertThat(page().locator(".mobile-symbol-cards-list").first()).isVisible();
    }

    @Then("the bottom nav dashboard tab should be active")
    public void verifyBottomNavDashboardActive() {
        assertThat(page().locator("#view-toggle-dashboard")).hasClass(Pattern.compile(".*view-toggle-btn-active.*"));
    }

    @When("I tap Holdings on the bottom navigation bar")
    public void tapHoldingsOnBottomNav() {
        page().locator("#view-toggle-holdings").click();
    }

    @Then("the bottom nav holdings tab should be active")
    public void verifyBottomNavHoldingsActive() {
        assertThat(page().locator("#view-toggle-holdings")).hasClass(Pattern.compile(".*view-toggle-btn-active.*"));
        assertThat(page().locator("#view-toggle-dashboard")).not().hasClass(Pattern.compile(".*view-toggle-btn-active.*"));
    }

    @Then("the bottom nav analytics tab should be active")
    public void verifyBottomNavAnalyticsActive() {
        assertThat(page().locator("#view-toggle-analytics")).hasClass(Pattern.compile(".*view-toggle-btn-active.*"));
    }

    @When("I tap Dividends on the bottom navigation bar")
    public void tapDividendsOnBottomNav() {
        page().locator("#view-toggle-dividends").click();
    }

    @Then("the bottom nav dividends tab should be active")
    public void verifyBottomNavDividendsActive() {
        assertThat(page().locator("#view-toggle-dividends")).hasClass(Pattern.compile(".*view-toggle-btn-active.*"));
        assertThat(page().locator("#view-toggle-analytics")).not().hasClass(Pattern.compile(".*view-toggle-btn-active.*"));
    }
}
