package com.sgsk.wealth.e2e.api.tools;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sgsk.wealth.e2e.api.common.ApiClient;
import com.sgsk.wealth.e2e.core.context.TestContext;
import io.cucumber.datatable.DataTable;
import io.cucumber.java.en.Given;
import io.cucumber.java.en.When;
import org.junit.jupiter.api.Assertions;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

public class ToolsApiSteps {
    private final TestContext context;
    private final ApiClient apiClient;
    private final ObjectMapper mapper;

    public ToolsApiSteps(TestContext context, ApiClient apiClient, ObjectMapper mapper) {
        this.context = context;
        this.apiClient = apiClient;
        this.mapper = mapper;
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
        apiClient.postAuthorizedJson(endpoint, mapper.writeValueAsString(payload));
    }

    @When("I send a POST TVM request for mode {string} and compounding {string} in currency {string}")
    public void sendPostTvmRequest(String mode, String compounding, String currency) {
        String body = String.format(
                Locale.US,
                "{\"mode\":\"%s\",\"presentValue\":50000.0,\"payment\":1000.0,\"annualRatePct\":8.0,\"years\":10.0,\"compounding\":\"%s\",\"timing\":\"end\",\"targetFutureValue\":250000.0,\"currency\":\"%s\"}",
                mode,
                compounding,
                currency
        );
        apiClient.postAuthorizedJson("/portfolio/tools/tvm", body);
    }

    @When("I send a POST target cost solve request in currency {string} with target {double} at price {double}")
    public void sendPostSolveTargetRequest(String currency, double targetAvgCost, double purchasePrice) {
        String body = String.format(
                Locale.US,
                "{\"initialPosition\":{\"symbol\":\"AAPL\",\"shares\":100.0,\"avgCost\":200.0,\"marketPrice\":225.5,\"currency\":\"%s\"},\"targetAvgCost\":%.2f,\"purchasePrice\":%.2f,\"feePercent\":0.157,\"currency\":\"%s\"}",
                currency,
                targetAvgCost,
                purchasePrice,
                currency
        );
        apiClient.postAuthorizedJson("/portfolio/tools/solve-target", body);
    }

    @When("I send a POST rebalance request in mode {string} and currency {string}")
    public void sendPostRebalanceRequest(String mode, String currency) {
        String body = String.format(
                "{\"mode\":\"%s\",\"noSellSubMode\":\"min-inflow\",\"customCashDeposit\":0.0,\"targetAllocations\":{\"AAPL\":50.0,\"PTT.BK\":50.0},\"currency\":\"%s\"}",
                mode,
                currency
        );
        apiClient.postAuthorizedJson("/portfolio/tools/rebalance", body);
    }
}
