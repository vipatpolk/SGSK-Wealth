package com.sgsk.wealth.e2e.api.adapter;

import com.sgsk.wealth.e2e.api.common.ApiClient;
import com.sgsk.wealth.e2e.core.adapter.SimulationOutcome;
import com.sgsk.wealth.e2e.core.adapter.TestAdapter;
import com.sgsk.wealth.e2e.core.adapter.TestTarget;
import io.restassured.response.Response;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

/**
 * Rest Assured adapter implementing {@link TestAdapter} against the Rust API.
 */
@Component
public class ApiTestAdapter implements TestAdapter {
    private final ObjectProvider<ApiClient> apiClientProvider;

    public ApiTestAdapter(ObjectProvider<ApiClient> apiClientProvider) {
        this.apiClientProvider = apiClientProvider;
    }

    @Override
    public TestTarget target() {
        return TestTarget.API;
    }

    @Override
    public String resolvePortfolioSource() {
        Response res = apiClientProvider.getObject().sendApiKeyOnly("GET", "/auth/me");
        if (res.statusCode() != 200) {
            throw new IllegalStateException("Expected 200 from /auth/me, got " + res.statusCode());
        }
        return res.jsonPath().getString("portfolioSource");
    }

    @Override
    public BigDecimal fetchUsdThbExchangeRate() {
        Response res = apiClientProvider.getObject().sendApiKeyOnly("GET", "/price/exchange-rate?from_currency=USD&to_currency=THB");
        if (res.statusCode() != 200) {
            throw new IllegalStateException("Expected 200 from /price/exchange-rate, got " + res.statusCode());
        }
        return new BigDecimal(res.jsonPath().getString("rate"));
    }

    @Override
    public SimulationOutcome simulateBuyOrder(
            BigDecimal initialShares,
            BigDecimal initialAvgCost,
            BigDecimal marketPrice,
            BigDecimal buyShares,
            BigDecimal buyPrice
    ) {
        String payload = """
                {
                  "initialPosition": {
                    "shares": "%s",
                    "avgCost": "%s",
                    "marketPrice": "%s",
                    "currency": "USD"
                  },
                  "steps": [
                    {
                      "action": "BUY",
                      "shares": "%s",
                      "price": "%s",
                      "feePercent": "0"
                    }
                  ],
                  "taxFeePercent": "0"
                }
                """.formatted(initialShares, initialAvgCost, marketPrice, buyShares, buyPrice);

        Response res = apiClientProvider.getObject().postAuthorizedJson("/portfolio/tools/simulate", payload);
        if (res.statusCode() != 200) {
            throw new IllegalStateException("Expected 200 from /portfolio/tools/simulate, got " + res.statusCode());
        }
        BigDecimal shares = new BigDecimal(res.jsonPath().getString("simulated.totalShares"));
        BigDecimal avgCost = new BigDecimal(res.jsonPath().getString("simulated.averageCost"));
        return new SimulationOutcome(shares, avgCost);
    }
}
