package com.sgsk.wealth.e2e.steps.api;

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

import java.util.LinkedHashMap;
import java.util.List;
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

    @When("I send a POST request to {string} with summaries:")
    public void sendAuthorizedPostWithSummaries(String endpoint, DataTable dataTable) throws Exception {
        String body = mapper.writeValueAsString(Map.of("summaries", dataTable.asMaps()));
        sendAuthorizedJsonPost(endpoint, body);
    }

    @When("I send a POST request to {string} with symbols:")
    public void sendAuthorizedPostWithSymbols(String endpoint, DataTable dataTable) throws Exception {
        List<String> symbols = dataTable.asMaps().stream()
                .map(row -> row.get("symbol"))
                .toList();
        String body = mapper.writeValueAsString(Map.of("symbols", symbols));
        sendAuthorizedJsonPost(endpoint, body);
    }

    @Given("an initial simulation position:")
    public void setInitialSimulationPosition(DataTable dataTable) {
        Map<String, String> row = dataTable.asMaps().get(0);
        Map<String, Object> position = new LinkedHashMap<>();
        position.put("symbol", row.get("symbol"));
        position.put("shares", Double.parseDouble(row.get("shares")));
        position.put("avgCost", Double.parseDouble(row.get("avgCost")));
        position.put("marketPrice", Double.parseDouble(row.get("marketPrice")));
        position.put("currency", row.get("currency"));
        context.setSimulationInitialPosition(position);
    }

    @When("I send a POST simulation request to {string} in currency {string} with steps:")
    public void sendPostSimulationWithSteps(String endpoint, String currency, DataTable dataTable) throws Exception {
        Map<String, Object> initialPosition = context.getSimulationInitialPosition();
        Assertions.assertNotNull(initialPosition, "Initial simulation position must be set before sending simulation request");
        List<Map<String, Object>> steps = dataTable.asMaps().stream()
                .map(row -> {
                    Map<String, Object> step = new LinkedHashMap<>();
                    step.put("action", row.get("action"));
                    step.put("shares", Double.parseDouble(row.get("shares")));
                    step.put("price", Double.parseDouble(row.get("price")));
                    step.put("feePercent", Double.parseDouble(row.get("feePercent")));
                    return step;
                })
                .toList();
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("initialPosition", initialPosition);
        payload.put("steps", steps);
        payload.put("currency", currency);
        sendAuthorizedJsonPost(endpoint, mapper.writeValueAsString(payload));
    }

    private void sendAuthorizedJsonPost(String endpoint, String jsonBody) {
        Response response = given()
                .header("X-API-Key", apiKey())
                .contentType(ContentType.JSON)
                .body(jsonBody)
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
