package com.sgsk.wealth.e2e.api.auth;

import com.sgsk.wealth.e2e.api.common.ApiClient;
import io.cucumber.java.en.When;

public class AuthApiSteps {
    private final ApiClient apiClient;

    public AuthApiSteps(ApiClient apiClient) {
        this.apiClient = apiClient;
    }

    @When("I send a request to {string} with custom header {string} value {string}")
    public void sendRequestWithCustomHeader(String endpoint, String headerName, String headerValue) {
        apiClient.getWithCustomHeader(endpoint, headerName, headerValue);
    }

    @When("I send an unauthorized {word} request to {string}")
    public void sendUnauthorizedMethodRequest(String method, String endpoint) {
        apiClient.sendUnauthorized(method, endpoint);
    }
}
