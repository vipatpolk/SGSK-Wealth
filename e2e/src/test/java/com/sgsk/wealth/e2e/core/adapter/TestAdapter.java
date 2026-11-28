package com.sgsk.wealth.e2e.core.adapter;

import java.math.BigDecimal;

/**
 * Shared business-level contract executed by API, Web, and Mobile BDD adapters.
 */
public interface TestAdapter {

    TestTarget target();

    String resolvePortfolioSource();

    BigDecimal fetchUsdThbExchangeRate();

    SimulationOutcome simulateBuyOrder(
            BigDecimal initialShares,
            BigDecimal initialAvgCost,
            BigDecimal marketPrice,
            BigDecimal buyShares,
            BigDecimal buyPrice
    );
}
