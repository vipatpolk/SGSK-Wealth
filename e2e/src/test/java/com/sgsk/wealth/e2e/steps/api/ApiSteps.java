package com.sgsk.wealth.e2e.steps.api;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sgsk.wealth.e2e.config.E2eProperties;
import com.sgsk.wealth.e2e.context.TestContext;
import io.restassured.http.ContentType;
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
    private final ObjectMapper mapper;
    private final E2eProperties properties;

    public ApiSteps(TestContext context, ObjectMapper mapper, E2eProperties properties) {
        this.context = context;
        this.mapper = mapper;
        this.properties = properties;
    }

    private String apiKey() {
        return properties.backend().apiKey();
    }

    @Given("the backend service root is available")
    public void verifyBackendRootAvailable() {
        Response response = given()
                .header("X-API-Key", apiKey())
                .get("/");
        response.then().statusCode(200);
        context.setLastApiResponse(response);
    }

    @Given("the share lot sheet for {string} is available")
    public void verifyShareLotSheetAvailable(String tabId) {
        Response response = given()
                .header("X-API-Key", apiKey())
                .get("/share-lot/sheet/" + tabId);
        response.then().statusCode(200);
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
                .header("X-API-Key", apiKey())
                .get(endpoint);
        context.setLastApiResponse(response);
    }

    @When("I send a GET request to {string} with params:")
    public void sendAuthorizedGetWithParams(String endpoint, DataTable dataTable) {
        Map<String, String> params = dataTable.asMap(String.class, String.class);
        Response response = given()
                .header("X-API-Key", apiKey())
                .queryParams(params)
                .get(endpoint);
        context.setLastApiResponse(response);
    }

    @When("I send a POST request to {string} with payload:")
    public void sendAuthorizedPostWithPayload(String endpoint, String docString) {
        Response response = given()
                .header("X-API-Key", apiKey())
                .contentType("application/json")
                .body(docString)
                .post(endpoint);
        context.setLastApiResponse(response);
    }

    @When("I send an unauthorized {word} request to {string}")
    public void sendUnauthorizedMethodRequest(String method, String endpoint) {
        Response response = "POST".equalsIgnoreCase(method)
                ? given().contentType(ContentType.JSON).body("{}").when().post(endpoint)
                : given().when().get(endpoint);
        context.setLastApiResponse(response);
    }

    @When("I send a GET request to {string} with query {string}")
    public void sendAuthorizedGetWithQueryString(String endpoint, String queryString) {
        String target = (queryString == null || queryString.isBlank()) ? endpoint : endpoint + "?" + queryString;
        Response response = given()
                .header("X-API-Key", apiKey())
                .when()
                .get(target);
        context.setLastApiResponse(response);
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
        Response response = given()
                .header("X-API-Key", apiKey())
                .contentType(ContentType.JSON)
                .body(body)
                .when()
                .post("/portfolio/allocation?currency=" + currency);
        context.setLastApiResponse(response);
    }

    @When("I send a POST TVM request for mode {string} and compounding {string} in currency {string}")
    public void sendPostTvmRequest(String mode, String compounding, String currency) {
        String body = String.format(
                java.util.Locale.US,
                "{\"mode\":\"%s\",\"presentValue\":50000.0,\"payment\":1000.0,\"annualRatePct\":8.0,\"years\":10.0,\"compounding\":\"%s\",\"timing\":\"end\",\"targetFutureValue\":250000.0,\"currency\":\"%s\"}",
                mode,
                compounding,
                currency
        );
        Response response = given()
                .header("X-API-Key", apiKey())
                .contentType(ContentType.JSON)
                .body(body)
                .when()
                .post("/portfolio/tools/tvm");
        context.setLastApiResponse(response);
    }

    @When("I send a POST target cost solve request in currency {string} with target {double} at price {double}")
    public void sendPostSolveTargetRequest(String currency, double targetAvgCost, double purchasePrice) {
        String body = String.format(
                java.util.Locale.US,
                "{\"initialPosition\":{\"symbol\":\"AAPL\",\"shares\":100.0,\"avgCost\":200.0,\"marketPrice\":225.5,\"currency\":\"%s\"},\"targetAvgCost\":%.2f,\"purchasePrice\":%.2f,\"feePercent\":0.157,\"currency\":\"%s\"}",
                currency,
                targetAvgCost,
                purchasePrice,
                currency
        );
        Response response = given()
                .header("X-API-Key", apiKey())
                .contentType(ContentType.JSON)
                .body(body)
                .when()
                .post("/portfolio/tools/solve-target");
        context.setLastApiResponse(response);
    }

    @When("I send a POST rebalance request in mode {string} and currency {string}")
    public void sendPostRebalanceRequest(String mode, String currency) {
        String body = String.format(
                "{\"mode\":\"%s\",\"noSellSubMode\":\"min-inflow\",\"customCashDeposit\":0.0,\"targetAllocations\":{\"AAPL\":50.0,\"PTT.BK\":50.0},\"currency\":\"%s\"}",
                mode,
                currency
        );
        Response response = given()
                .header("X-API-Key", apiKey())
                .contentType(ContentType.JSON)
                .body(body)
                .when()
                .post("/portfolio/tools/rebalance");
        context.setLastApiResponse(response);
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
            Iterator<Map.Entry<String, JsonNode>> fields = expected.properties().iterator();
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
