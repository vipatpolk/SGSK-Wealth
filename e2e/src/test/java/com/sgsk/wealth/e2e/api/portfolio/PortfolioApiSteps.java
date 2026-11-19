package com.sgsk.wealth.e2e.api.portfolio;

import com.sgsk.wealth.e2e.api.common.ApiClient;
import io.cucumber.java.en.When;

public class PortfolioApiSteps {
    private final ApiClient apiClient;

    public PortfolioApiSteps(ApiClient apiClient) {
        this.apiClient = apiClient;
    }

    @When("I send a POST allocation request in currency {string}")
    public void sendPostAllocationRequest(String currency) {
        String body = """
                {
                  "targetAllocation": {
                    "us-stock": 40.0,
                    "thai-stock": 30.0,
                    "crypto": 15.0,
                    "mutual-fund": 15.0,
                    "bond": 0.0
                  }
                }
                """;
        apiClient.postAuthorizedJson("/portfolio/allocation?currency=" + currency, body);
    }
}
