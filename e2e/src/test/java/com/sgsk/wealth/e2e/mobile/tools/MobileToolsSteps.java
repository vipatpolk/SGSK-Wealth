package com.sgsk.wealth.e2e.mobile.tools;

import com.sgsk.wealth.e2e.mobile.common.MobileDriverBridge;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;

public class MobileToolsSteps {
    private final MobileDriverBridge driver;
    private final MobileToolsScreen toolsScreen;

    public MobileToolsSteps(MobileDriverBridge driver, MobileToolsScreen toolsScreen) {
        this.driver = driver;
        this.toolsScreen = toolsScreen;
    }

    @When("I select the {string} financial tool on mobile")
    public void selectMobileTool(String tool) {
        toolsScreen.selectToolTab(tool);
    }

    @When("I switch mobile average cost mode to {string}")
    public void switchMobileAvgCostMode(String mode) {
        toolsScreen.switchAvgCostMode(mode);
    }

    @When("I queue an order into the mobile simulation chain")
    public void queueMobileAvgCostOrder() {
        toolsScreen.queueAvgCostOrder();
    }

    @When("I simulate buying {double} shares at price {double} on mobile")
    public void simulateOrderOnMobile(double shares, double price) {
        toolsScreen.enterAvgCostSimulationValues(shares, price);
        toolsScreen.runAvgCostSimulation();
    }

    @When("I switch mobile rebalance mode to {string}")
    public void switchMobileRebalanceMode(String mode) {
        toolsScreen.switchRebalanceMode(mode);
    }

    @When("I adjust a mobile rebalance target weight")
    public void adjustMobileRebalanceWeight() {
        toolsScreen.incrementFirstRebalanceTarget();
    }

    @When("I set the mobile TVM calculation goal to {string}")
    public void setMobileTvmGoal(String goal) {
        toolsScreen.selectTvmSolveGoal(goal);
    }

    @When("I toggle the mobile TVM growth chart display mode")
    public void toggleMobileTvmChart() {
        toolsScreen.toggleTvmChartMode();
    }

    @When("I expand the mobile TVM accumulation schedule")
    public void expandMobileTvmSchedule() {
        toolsScreen.toggleTvmSchedule();
    }

    @Then("the mobile simulation result should be displayed")
    public void verifyMobileSimulationResultDisplayed() {
        driver.assertVisible("#mobile-sim-result");
    }

    @Then("the mobile simulation queue list should be displayed")
    public void verifyMobileSimulationQueueDisplayed() {
        driver.assertVisible("#mobile-avg-queue-list");
    }

    @Then("the mobile rebalance plan summary should be displayed")
    public void verifyMobileRebalanceResultDisplayed() {
        driver.assertVisible("#mobile-rebalance-result");
    }

    @Then("the mobile TVM projection summary should be displayed")
    public void verifyMobileTvmResultDisplayed() {
        driver.assertVisible("#mobile-tvm-result");
    }

    @Then("the mobile TVM schedule list should be displayed")
    public void verifyMobileTvmScheduleDisplayed() {
        driver.assertVisible("#mobile-tvm-schedule-list");
    }
}
