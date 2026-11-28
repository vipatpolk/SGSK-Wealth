package com.sgsk.wealth.e2e.core.adapter;

import java.math.BigDecimal;

/**
 * Platform-independent outcome of an order simulation step.
 */
public record SimulationOutcome(
        BigDecimal simulatedShares,
        BigDecimal simulatedAverageCost
) {
}
