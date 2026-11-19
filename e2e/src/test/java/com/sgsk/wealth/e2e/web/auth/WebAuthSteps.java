package com.sgsk.wealth.e2e.web.auth;

import com.microsoft.playwright.Page;
import com.sgsk.wealth.e2e.core.context.TestContext;
import com.sgsk.wealth.e2e.web.navigation.HeaderPage;
import io.cucumber.java.en.Given;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;
import org.junit.jupiter.api.Assertions;

import java.util.ArrayList;
import java.util.List;

import static com.microsoft.playwright.assertions.PlaywrightAssertions.assertThat;

public class WebAuthSteps {
    private final TestContext context;
    private final HeaderPage headerPage;
    private final List<String> cloudCallsObserved = new ArrayList<>();

    public WebAuthSteps(TestContext context, HeaderPage headerPage) {
        this.context = context;
        this.headerPage = headerPage;
    }

    private Page page() {
        return context.getPage();
    }

    @Given("the Sign-In authentication gate is displayed")
    public void givenAuthGateDisplayed() {
        cloudCallsObserved.clear();
        page().onRequest(req -> {
            String u = req.url();
            if (u.contains("/portfolio/holdings") || u.contains("/portfolio/dividend") || u.contains("/share-lot/")) {
                cloudCallsObserved.add(u);
            }
        });
        page().navigate("/");
        verifyAuthGateVisible();
    }

    @Given("I enter the local guest portfolio workspace")
    public void givenEnterLocalGuestWorkspace() {
        page().navigate("/");
        chooseContinueAsGuest();
    }

    @Then("the Sign-In authentication gate should be visible")
    public void verifyAuthGateVisible() {
        assertThat(page().locator("#auth-screen")).isVisible();
        assertThat(page().locator("#auth-google-btn")).isVisible();
        assertThat(page().locator("#auth-guest-btn")).isVisible();
    }

    @When("I choose to continue as guest for local data only")
    public void chooseContinueAsGuest() {
        page().locator("#auth-guest-btn").click();
        assertThat(page().locator("#auth-screen")).isHidden();
    }

    @Then("the local portfolio workspace banner should be visible")
    public void verifyLocalBannerVisible() {
        assertThat(page().locator("#local-workspace-bar")).isVisible();
    }

    @Then("the local portfolio workspace banner should not be visible")
    public void verifyLocalBannerHidden() {
        Assertions.assertEquals(0, page().locator("#local-workspace-bar").count());
    }

    @Then("no cloud portfolio requests should be sent during guest session")
    public void verifyNoCloudCallsSent() {
        Assertions.assertTrue(cloudCallsObserved.isEmpty(),
                "Expected zero cloud portfolio calls in guest mode, but saw: " + cloudCallsObserved);
    }

    @When("I load the local sample portfolio from the workspace bar")
    public void loadLocalSamplePortfolio() {
        page().locator("#local-bar-sample-btn").click();
    }

    @Then("the local portfolio should display local positions")
    public void verifyLocalPortfolioHasPositions() {
        Assertions.assertTrue(headerPage.settingsModal.isVisible());
        headerPage.closeUserSettings();
        assertThat(page().locator("#dashboard-view")).isVisible();
    }

    @When("I open the top-right user menu settings dialog")
    public void openTopRightUserMenuSettings() {
        headerPage.openUserMenu();
        Assertions.assertTrue(headerPage.userMenuLocalDataBtn.isVisible());
        Assertions.assertTrue(headerPage.userMenuSignInBtn.isVisible());
        headerPage.userMenuSettingsBtn.click();
        assertThat(headerPage.settingsModal).isVisible();
    }

    @Then("the Google sign-in option and local management menu should be accessible")
    public void verifySettingsControlsAccessible() {
        headerPage.openUserSettings();
        assertThat(page().locator("#settings-currency-thb")).isVisible();
        assertThat(page().locator("#settings-currency-usd")).isVisible();
        assertThat(page().locator("#settings-lang-en")).isVisible();
        assertThat(page().locator("#settings-lang-th")).isVisible();
        assertThat(page().locator("#settings-theme-dark")).isVisible();
        assertThat(page().locator("#settings-theme-light")).isVisible();
        assertThat(page().locator("#settings-signin-btn")).isVisible();
        headerPage.closeUserSettings();
    }

    @When("I inspect the top-right user menu")
    public void inspectTopRightUserMenu() {
        headerPage.openUserMenu();
    }

    @Then("the local portfolio menu option should be hidden for owner mode")
    public void verifyOwnerMenuHidesLocalOption() {
        Assertions.assertEquals(0, headerPage.userMenuLocalDataBtn.count());
        assertThat(headerPage.userMenuSignOutBtn).isVisible();
    }
}
