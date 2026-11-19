package com.sgsk.wealth.e2e.mobile.tools;

import com.sgsk.wealth.e2e.mobile.common.MobileDriverBridge;
import io.cucumber.spring.ScenarioScope;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.ScopedProxyMode;
import org.springframework.stereotype.Component;

import java.util.Locale;

@Component
@ScenarioScope(proxyMode = ScopedProxyMode.NO)
public class MobileToolsScreen {
    private final MobileDriverBridge driver;

    @Autowired
    public MobileToolsScreen(MobileDriverBridge driver) {
        this.driver = driver;
    }

    public void selectToolTab(String tool) {
        String id = switch (tool.trim().toLowerCase(Locale.ROOT)) {
            case "rebalance", "rebalance planner" -> "#mobile-tool-rebalance";
            case "tvm", "tvm calculator" -> "#mobile-tool-tvm";
            default -> "#mobile-tool-avg-cost";
        };
        driver.tap(id);
    }

    public void switchAvgCostMode(String mode) {
        String id = "reverse".equalsIgnoreCase(mode.trim()) ? "#mobile-avg-mode-reverse" : "#mobile-avg-mode-forward";
        driver.tap(id);
    }

    public void queueAvgCostOrder() {
        driver.tap("#mobile-avg-add-chain-btn");
    }

    public void enterAvgCostSimulationValues(double shares, double price) {
        driver.fillInput("#mobile-sim-shares input", String.valueOf(shares));
        driver.fillInput("#mobile-sim-price input", String.valueOf(price));
    }

    public void runAvgCostSimulation() {
        driver.tap("#mobile-sim-run-btn");
    }

    public void switchRebalanceMode(String mode) {
        String id = "no-sell".equalsIgnoreCase(mode.trim()) ? "#mobile-reb-mode-nosell" : "#mobile-reb-mode-standard";
        driver.tap(id);
    }

    public void incrementFirstRebalanceTarget() {
        driver.tapFirst(".reb-step-btn[data-step='inc-5']");
    }

    public void selectTvmSolveGoal(String goal) {
        driver.tap("[data-tvm-goal='" + goal.trim().toUpperCase(Locale.ROOT) + "']");
    }

    public void toggleTvmChartMode() {
        driver.tap("#mobile-tvm-chart-toggle");
    }

    public void toggleTvmSchedule() {
        driver.tap("#mobile-tvm-schedule-toggle");
    }
}
