package com.sgsk.wealth.e2e.web.resilience;

import com.microsoft.playwright.Page;
import com.sgsk.wealth.e2e.core.context.TestContext;
import com.sgsk.wealth.e2e.core.support.ApiRouteMocker;
import io.cucumber.java.en.Given;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;

import static com.microsoft.playwright.assertions.PlaywrightAssertions.assertThat;

public class ResilienceSteps {
    private final TestContext context;
    private final ApiRouteMocker apiRouteMocker;

    public ResilienceSteps(TestContext context, ApiRouteMocker apiRouteMocker) {
        this.context = context;
        this.apiRouteMocker = apiRouteMocker;
    }

    private Page page() {
        return context.getPage();
    }

    @Given("the backend API returns error status {int}")
    public void setBackendApiError(int statusCode) {
        apiRouteMocker.mockPortfolioAPIError(page(), statusCode);
    }

    @Given("I see the error state after a {int} backend outage")
    public void openWithBackendOutageAndVerifyErrorState(int statusCode) {
        setBackendApiError(statusCode);
        openApplicationWithoutMocking();
        verifyErrorState("Unable to load data");
    }

    @When("I open the SGSK Wealth application without mocking")
    public void openApplicationWithoutMocking() {
        page().navigate("/");
    }

    @Then("the error state card should be visible with {string}")
    public void verifyErrorState(String text) {
        assertThat(page().locator("#error-state")).isVisible();
        assertThat(page().locator("#error-state")).containsText(text);
    }

    @Then("the retry button should be visible")
    public void verifyRetryBtn() {
        assertThat(page().locator("#retry-btn")).isVisible();
    }

    @When("the backend API recovers")
    public void recoverBackendApi() {
        apiRouteMocker.recoverPortfolioAPIs(page());
    }

    @When("I retry loading the portfolio")
    public void retryLoadingPortfolio() {
        page().locator("#retry-btn").click();
    }
}
