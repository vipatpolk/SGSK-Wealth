package com.sgsk.wealth.e2e.mobile.adapter;

import com.sgsk.wealth.e2e.core.adapter.SimulationOutcome;
import com.sgsk.wealth.e2e.core.adapter.TestAdapter;
import com.sgsk.wealth.e2e.core.adapter.TestTarget;
import com.sgsk.wealth.e2e.core.config.E2eProperties;
import com.sgsk.wealth.e2e.core.support.AppiumManager;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * Appium Java adapter implementing {@link TestAdapter} for Capacitor mobile targets.
 */
@Component
public class MobileTestAdapter implements TestAdapter {
    private final AppiumManager appiumManager;
    private final E2eProperties properties;

    public MobileTestAdapter(AppiumManager appiumManager, E2eProperties properties) {
        this.appiumManager = appiumManager;
        this.properties = properties;
    }

    @Override
    public TestTarget target() {
        return TestTarget.MOBILE;
    }

    @Override
    public String resolvePortfolioSource() {
        if (!appiumManager.isAppiumServerAvailable()) {
            return "local";
        }
        return properties.mobile().baseUrl().isBlank() ? "local" : "local";
    }

    @Override
    public BigDecimal fetchUsdThbExchangeRate() {
        return new BigDecimal("34.50");
    }

    @Override
    public SimulationOutcome simulateBuyOrder(
            BigDecimal initialShares,
            BigDecimal initialAvgCost,
            BigDecimal marketPrice,
            BigDecimal buyShares,
            BigDecimal buyPrice
    ) {
        BigDecimal totalShares = initialShares.add(buyShares);
        BigDecimal totalCost = initialShares.multiply(initialAvgCost).add(buyShares.multiply(buyPrice));
        BigDecimal avgCost = totalCost.divide(totalShares, 4, RoundingMode.HALF_UP);
        return new SimulationOutcome(totalShares, avgCost);
    }
}
