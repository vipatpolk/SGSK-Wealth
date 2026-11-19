package com.sgsk.wealth.e2e.api.price;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sgsk.wealth.e2e.api.common.ApiClient;
import io.cucumber.datatable.DataTable;
import io.cucumber.java.en.When;

import java.util.List;
import java.util.Map;

public class PriceApiSteps {
    private final ApiClient apiClient;
    private final ObjectMapper mapper;

    public PriceApiSteps(ApiClient apiClient, ObjectMapper mapper) {
        this.apiClient = apiClient;
        this.mapper = mapper;
    }

    @When("I send a POST request to {string} with summaries:")
    public void sendAuthorizedPostWithSummaries(String endpoint, DataTable dataTable) throws Exception {
        String body = mapper.writeValueAsString(Map.of("summaries", dataTable.asMaps()));
        apiClient.postAuthorizedJson(endpoint, body);
    }

    @When("I send a POST request to {string} with symbols:")
    public void sendAuthorizedPostWithSymbols(String endpoint, DataTable dataTable) throws Exception {
        List<String> symbols = dataTable.asMaps().stream()
                .map(row -> row.get("symbol"))
                .toList();
        String body = mapper.writeValueAsString(Map.of("symbols", symbols));
        apiClient.postAuthorizedJson(endpoint, body);
    }
}
