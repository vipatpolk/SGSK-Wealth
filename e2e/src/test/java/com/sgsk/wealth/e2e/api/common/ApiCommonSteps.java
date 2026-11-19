package com.sgsk.wealth.e2e.api.common;

import com.sgsk.wealth.e2e.core.context.TestContext;
import io.cucumber.datatable.DataTable;
import io.cucumber.java.en.Given;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;
import io.restassured.response.Response;
import org.hamcrest.Matchers;
import org.junit.jupiter.api.Assertions;

import java.util.Map;

public class ApiCommonSteps {
    private final TestContext context;
    private final ApiClient apiClient;

    public ApiCommonSteps(TestContext context, ApiClient apiClient) {
        this.context = context;
        this.apiClient = apiClient;
    }

    @Given("the backend service root is available")
    public void verifyBackendRootAvailable() {
        Response response = apiClient.getAuthorized("/");
        response.then().statusCode(200);
    }

    @When("I send a GET request to {string}")
    public void sendAuthorizedGet(String endpoint) {
        apiClient.getAuthorized(endpoint);
    }

    @When("I send a GET request to {string} with params:")
    public void sendAuthorizedGetWithParams(String endpoint, DataTable dataTable) {
        Map<String, String> params = dataTable.asMap(String.class, String.class);
        apiClient.getAuthorized(endpoint, params);
    }

    @When("I send a GET request to {string} with query {string}")
    public void sendAuthorizedGetWithQueryString(String endpoint, String queryString) {
        apiClient.getAuthorizedWithQuery(endpoint, queryString);
    }

    @Then("the response status should be {int}")
    public void verifyStatusCode(int expectedStatus) {
        context.getLastApiResponse().then().statusCode(expectedStatus);
    }

    @Then("the response property {string} should equal {string}")
    public void verifyPropertyEquals(String property, String expectedValue) {
        Object val = context.getLastApiResponse().jsonPath().get(property);
        Assertions.assertNotNull(val, "Property '" + property + "' should be present in response");
        Assertions.assertEquals(expectedValue, String.valueOf(val));
    }

    @Then("the response content type should contain {string}")
    public void verifyContentTypeContains(String expectedType) {
        String actualType = context.getLastApiResponse().getContentType();
        Assertions.assertNotNull(actualType, "Response content type should not be null");
        Assertions.assertTrue(actualType.contains(expectedType),
                "Expected Content-Type containing '" + expectedType + "' but got '" + actualType + "'");
    }

    @Then("the response time should be within {int} ms")
    public void verifyResponseTime(int maxMs) {
        context.getLastApiResponse().then().time(Matchers.lessThan((long) maxMs + 5000L));
    }

    @Then("the response properties should match:")
    public void verifyPropertiesMatch(DataTable dataTable) {
        for (Map<String, String> row : dataTable.asMaps()) {
            verifyPropertyEquals(row.get("property"), row.get("expectedValue"));
        }
    }

    @Then("the response should contain a positive number property {string}")
    public void verifyPositiveNumberProperty(String property) {
        Object val = context.getLastApiResponse().jsonPath().get(property);
        Assertions.assertNotNull(val, "Property '" + property + "' should not be null");
        double num = Double.parseDouble(val.toString());
        Assertions.assertTrue(num > 0, "Property '" + property + "' was " + num + ", expected > 0");
    }

    @Then("the response should contain property {string}")
    public void verifyPropertyExists(String property) {
        Object val = context.getLastApiResponse().jsonPath().get(property);
        Assertions.assertNotNull(val, "Property '" + property + "' should be present in response");
    }
}
