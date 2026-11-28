package com.sgsk.wealth.e2e.core.steps;

import com.sgsk.wealth.e2e.core.adapter.SimulationOutcome;
import com.sgsk.wealth.e2e.core.adapter.TestAdapter;
import com.sgsk.wealth.e2e.core.adapter.TestAdapterRegistry;
import io.cucumber.java.en.Given;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;
import org.junit.jupiter.api.Assertions;
import org.springframework.beans.factory.annotation.Autowired;

import java.math.BigDecimal;

public class CrossPlatformSteps {
    private final TestAdapterRegistry registry;
    private TestAdapter activeAdapter;
    private String portfolioSource;
    private SimulationOutcome simulationOutcome;

    @Autowired
    public CrossPlatformSteps(TestAdapterRegistry registry) {
        this.registry = registry;
    }

    @Given("an active cross-platform test target")
    public void anActiveCrossPlatformTestTarget() {
        this.activeAdapter = registry.activeAdapter();
        Assertions.assertNotNull(this.activeAdapter);
    }

    @When("the investor inspects the active portfolio data source")
    public void theInvestorInspectsTheActivePortfolioDataSource() {
        this.portfolioSource = activeAdapter.resolvePortfolioSource();
    }

    @Then("the active portfolio source should be {string}")
    public void theActivePortfolioSourceShouldBe(String expectedSource) {
        Assertions.assertEquals(expectedSource, portfolioSource);
    }

    @When("the investor simulates buying {int} shares at {int} USD on an existing {int} shares at {int} USD")
    public void theInvestorSimulatesBuyingShares(
            int buyShares,
            int buyPrice,
            int initialShares,
            int initialAvgCost
    ) {
        this.simulationOutcome = activeAdapter.simulateBuyOrder(
                BigDecimal.valueOf(initialShares),
                BigDecimal.valueOf(initialAvgCost),
                BigDecimal.valueOf(initialAvgCost),
                BigDecimal.valueOf(buyShares),
                BigDecimal.valueOf(buyPrice)
        );
    }

    @Then("the simulated total shares should equal {string}")
    public void theSimulatedTotalSharesShouldEqual(String expectedShares) {
        Assertions.assertEquals(
                0,
                simulationOutcome.simulatedShares().compareTo(new BigDecimal(expectedShares)),
                () -> "Expected shares " + expectedShares + " but got " + simulationOutcome.simulatedShares()
        );
    }

    @Then("the simulated average cost should equal {string}")
    public void theSimulatedAverageCostShouldEqual(String expectedAvgCost) {
        Assertions.assertEquals(
                0,
                simulationOutcome.simulatedAverageCost().compareTo(new BigDecimal(expectedAvgCost)),
                () -> "Expected avg cost " + expectedAvgCost + " but got " + simulationOutcome.simulatedAverageCost()
        );
    }
}
