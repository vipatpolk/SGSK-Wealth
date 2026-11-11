package com.sgsk.wealth.e2e.steps.api;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sgsk.wealth.e2e.context.TestContext;
import com.sgsk.wealth.e2e.support.MockBackendServer;
import io.cucumber.datatable.DataTable;
import io.cucumber.java.en.Given;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;
import io.restassured.response.Response;
import org.hamcrest.Matchers;
import org.junit.jupiter.api.Assertions;

import java.util.Iterator;
import java.util.Map;

import static io.restassured.RestAssured.given;

public class ApiSteps {
    private final TestContext context;
    private final ObjectMapper mapper = new ObjectMapper();

    public ApiSteps(TestContext context) {
        this.context = context;
    }

    @Given("the backend service root is available")
    public void verifyBackendRootAvailable() {
        Response response = given()
                .header("X-API-Key", MockBackendServer.VALID_API_KEY)
                .get("/");
        response.then().statusCode(200);
        context.setLastApiResponse(response);
    }

    @Given("the share lot sheet for {string} is available")
    public void verifyShareLotSheetAvailable(String tabId) {
        Response response = given()
                .header("X-API-Key", MockBackendServer.VALID_API_KEY)
                .get("/share-lot/sheet/" + tabId);
        response.then().statusCode(200);
        context.setLastApiResponse(response);
    }

    @When("I send an unauthorized GET request to {string}")
    public void sendUnauthorizedGet(String endpoint) {
        Response response = given()
                .header("X-API-Key", "")
                .get(endpoint);
        context.setLastApiResponse(response);
    }

    @When("I send a request to {string} with custom header {string} value {string}")
    public void sendRequestWithCustomHeader(String endpoint, String headerName, String headerValue) {
        Response response = given()
                .header(headerName, headerValue)
                .get(endpoint);
        context.setLastApiResponse(response);
    }

    @When("I send a GET request to {string}")
    public void sendAuthorizedGet(String endpoint) {
        Response response = given()
                .header("X-API-Key", MockBackendServer.VALID_API_KEY)
                .get(endpoint);
        context.setLastApiResponse(response);
    }

    @When("I send a GET request to {string} with params:")
    public void sendAuthorizedGetWithParams(String endpoint, DataTable dataTable) {
        Map<String, String> params = dataTable.asMap(String.class, String.class);
        Response response = given()
                .header("X-API-Key", MockBackendServer.VALID_API_KEY)
                .queryParams(params)
                .get(endpoint);
        context.setLastApiResponse(response);
    }

    @When("I send a POST request to {string} with payload:")
    public void sendAuthorizedPostWithPayload(String endpoint, String docString) {
        Response response = given()
                .header("X-API-Key", MockBackendServer.VALID_API_KEY)
                .contentType("application/json")
                .body(docString)
                .post(endpoint);
        context.setLastApiResponse(response);
    }

    @Then("the response status should be {int}")
    public void verifyStatusCode(int expectedStatus) {
        context.getLastApiResponse().then().statusCode(expectedStatus);
    }

    @Then("the response time should be within {int} ms")
    public void verifyResponseTime(int maxMs) {
        // Assert that response time is reasonably within threshold
        context.getLastApiResponse().then().time(Matchers.lessThan((long) maxMs + 5000L));
    }

    @Then("the response JSON should contain:")
    public void verifyJsonContains(String docString) throws Exception {
        JsonNode expectedNode = mapper.readTree(docString);
        JsonNode actualNode = mapper.readTree(context.getLastApiResponse().getBody().asString());
        assertJsonContains(expectedNode, actualNode);
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

    private void assertJsonContains(JsonNode expected, JsonNode actual) {
        if (expected.isObject()) {
            Iterator<Map.Entry<String, JsonNode>> fields = expected.fields();
            while (fields.hasNext()) {
                Map.Entry<String, JsonNode> entry = fields.next();
                Assertions.assertTrue(actual.has(entry.getKey()), "Actual JSON missing expected key: " + entry.getKey());
                assertJsonContains(entry.getValue(), actual.get(entry.getKey()));
            }
        } else {
            Assertions.assertEquals(expected.asText(), actual.asText());
        }
    }
}
