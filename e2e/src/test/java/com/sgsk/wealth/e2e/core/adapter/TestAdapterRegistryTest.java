package com.sgsk.wealth.e2e.core.adapter;

import com.sgsk.wealth.e2e.core.config.E2eProperties;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;

class TestAdapterRegistryTest {

    private static TestAdapter stub(TestTarget target) {
        return new TestAdapter() {
            @Override
            public TestTarget target() {
                return target;
            }

            @Override
            public String resolvePortfolioSource() {
                return "local";
            }

            @Override
            public BigDecimal fetchUsdThbExchangeRate() {
                return new BigDecimal("35.00");
            }

            @Override
            public SimulationOutcome simulateBuyOrder(
                    BigDecimal initialShares,
                    BigDecimal initialAvgCost,
                    BigDecimal marketPrice,
                    BigDecimal buyShares,
                    BigDecimal buyPrice
            ) {
                return new SimulationOutcome(initialShares.add(buyShares), new BigDecimal("90"));
            }
        };
    }

    @Test
    void resolvesApiWebAndMobileTargetsViaSystemPropertyOrProperties() {
        E2eProperties props = new E2eProperties("web", null, null, null, null, null);
        TestAdapterRegistry registry = new TestAdapterRegistry(
                List.of(stub(TestTarget.API), stub(TestTarget.WEB), stub(TestTarget.MOBILE)),
                props
        );

        String previous = System.getProperty("test.target");
        try {
            System.clearProperty("test.target");
            Assertions.assertEquals(TestTarget.WEB, registry.activeAdapter().target());

            System.setProperty("test.target", "mobile");
            Assertions.assertEquals(TestTarget.MOBILE, registry.activeAdapter().target());

            System.setProperty("test.target", "api");
            Assertions.assertEquals(TestTarget.API, registry.activeAdapter().target());
        } finally {
            if (previous == null) {
                System.clearProperty("test.target");
            } else {
                System.setProperty("test.target", previous);
            }
        }
    }
}
