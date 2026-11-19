package com.sgsk.wealth.e2e.api.sharelot;

import com.sgsk.wealth.e2e.api.common.ApiClient;
import io.cucumber.java.en.Given;
import io.restassured.response.Response;

public class ShareLotApiSteps {
    private final ApiClient apiClient;

    public ShareLotApiSteps(ApiClient apiClient) {
        this.apiClient = apiClient;
    }

    @Given("the share lot sheet for {string} is available")
    public void verifyShareLotSheetAvailable(String tabId) {
        Response response = apiClient.getAuthorized("/share-lot/sheet/" + tabId);
        response.then().statusCode(200);
    }
}
