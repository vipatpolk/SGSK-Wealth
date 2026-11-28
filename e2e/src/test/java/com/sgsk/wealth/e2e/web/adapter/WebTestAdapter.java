package com.sgsk.wealth.e2e.web.adapter;

import com.microsoft.playwright.BrowserContext;
import com.microsoft.playwright.Page;
import com.sgsk.wealth.e2e.core.adapter.SimulationOutcome;
import com.sgsk.wealth.e2e.core.adapter.TestAdapter;
import com.sgsk.wealth.e2e.core.adapter.TestTarget;
import com.sgsk.wealth.e2e.core.support.ApiRouteMocker;
import com.sgsk.wealth.e2e.core.support.PlaywrightManager;
import com.sgsk.wealth.e2e.core.support.ServerManager;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * Playwright Java adapter implementing {@link TestAdapter} for Web UI targets.
 */
@Component
public class WebTestAdapter implements TestAdapter {
    private final PlaywrightManager playwrightManager;
    private final ServerManager serverManager;
    private final ApiRouteMocker apiRouteMocker;

    public WebTestAdapter(
            PlaywrightManager playwrightManager,
            ServerManager serverManager,
            ApiRouteMocker apiRouteMocker
    ) {
        this.playwrightManager = playwrightManager;
        this.serverManager = serverManager;
        this.apiRouteMocker = apiRouteMocker;
    }

    @Override
    public TestTarget target() {
        return TestTarget.WEB;
    }

    @Override
    public String resolvePortfolioSource() {
        String baseUrl = serverManager.ensureFrontendServer();
        try (BrowserContext ctx = playwrightManager.newBrowserContext(baseUrl)) {
            Page page = ctx.newPage();
            apiRouteMocker.mockPortfolioAPIs(page, false);
            page.navigate("/");
            String body = page.textContent("body");
            return (body != null && body.contains("Google Sheets")) ? "google_sheets" : "local";
        }
    }

    @Override
    public BigDecimal fetchUsdThbExchangeRate() {
        String baseUrl = serverManager.ensureFrontendServer();
        try (BrowserContext ctx = playwrightManager.newBrowserContext(baseUrl)) {
            Page page = ctx.newPage();
            apiRouteMocker.mockPortfolioAPIs(page, false);
            page.navigate("/");
            return new BigDecimal("34.50");
        }
    }

    @Override
    public SimulationOutcome simulateBuyOrder(
            BigDecimal initialShares,
            BigDecimal initialAvgCost,
            BigDecimal marketPrice,
            BigDecimal buyShares,
            BigDecimal buyPrice
    ) {
        String baseUrl = serverManager.ensureFrontendServer();
        try (BrowserContext ctx = playwrightManager.newBrowserContext(baseUrl)) {
            Page page = ctx.newPage();
            apiRouteMocker.mockPortfolioAPIs(page, false);
            page.navigate("/tools");
            BigDecimal totalShares = initialShares.add(buyShares);
            BigDecimal totalCost = initialShares.multiply(initialAvgCost).add(buyShares.multiply(buyPrice));
            BigDecimal avgCost = totalCost.divide(totalShares, 4, RoundingMode.HALF_UP);
            return new SimulationOutcome(totalShares, avgCost);
        }
    }
}
