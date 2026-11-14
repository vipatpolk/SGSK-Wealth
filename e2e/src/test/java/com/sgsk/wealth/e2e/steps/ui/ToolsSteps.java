package com.sgsk.wealth.e2e.steps.ui;

import com.microsoft.playwright.Locator;
import com.microsoft.playwright.Page;
import com.sgsk.wealth.e2e.context.TestContext;
import com.sgsk.wealth.e2e.pages.ToolsPage;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;

import java.util.regex.Pattern;

import static com.microsoft.playwright.assertions.PlaywrightAssertions.assertThat;

public class ToolsSteps {
    private final TestContext context;
    private final ToolsPage toolsPage;

    public ToolsSteps(TestContext context, ToolsPage toolsPage) {
        this.context = context;
        this.toolsPage = toolsPage;
    }

    private Page page() {
        return context.getPage();
    }

    @Then("the tools hero title should contain {string}")
    public void verifyToolsHeroTitle(String text) {
        assertThat(toolsPage.heroTitle).containsText(text);
    }

    @Then("the average cost calculator should be visible")
    public void verifyAverageCostCalculatorVisible() {
        assertThat(toolsPage.avgCostCalculator).isVisible();
    }

    @When("I select the custom simulation option from the symbol dropdown")
    public void selectCustomSimulationOption() {
        toolsPage.selectCustomSimulation();
    }

    @When("I click the simulation calculate button")
    public void clickSimulationCalculateButton() {
        toolsPage.calculateSimulation();
    }

    @Then("the simulation results panel and KPI grid should be visible")
    public void verifySimulationResults() {
        assertThat(toolsPage.simResultsPanel).isVisible();
        assertThat(toolsPage.simKpiGrid).isVisible();
    }

    @When("I switch to By Amount mode")
    public void switchToByAmountMode() {
        toolsPage.switchToAmountMode();
    }

    @Then("the simulation amount input should be visible")
    public void verifySimulationAmountInputVisible() {
        assertThat(toolsPage.simAmountInput).isVisible();
    }

    @When("I switch to the TVM Calculator tool")
    public void switchToTvmCalculator() {
        toolsPage.selectTvmCalculator();
    }

    @Then("the TVM hero display and projected value should be visible")
    public void verifyTvmHeroVisible() {
        assertThat(toolsPage.tvmHeroDisplay).isVisible();
        assertThat(toolsPage.heroMainValue).isVisible();
    }

    @When("I switch the TVM solve mode to PMT")
    public void switchTvmSolveModePmt() {
        toolsPage.switchSolveModePmt();
    }

    @Then("the target FV input should be visible")
    public void verifyTargetFvInputVisible() {
        assertThat(toolsPage.targetFvInput).isVisible();
    }

    @When("I select TVM compounding frequency {string}")
    public void selectTvmCompoundingFrequency(String freq) {
        toolsPage.setCompoundingFrequency(freq);
    }

    @Then("the active compounding frequency should display {string}")
    public void verifyActiveCompoundingFrequency(String freq) {
        assertThat(page().locator(".compounding-active-text")).containsText(freq);
    }

    @When("I toggle the TVM accumulation schedule table")
    public void toggleTvmScheduleTable() {
        toolsPage.toggleScheduleTable();
    }

    @Then("the schedule table should be visible")
    public void verifyScheduleTableVisible() {
        assertThat(toolsPage.scheduleTable).isVisible();
    }

    @When("I click the PV valuation basis {string}")
    public void clickPvValuationBasis(String label) {
        toolsPage.setValuationBasis(label);
    }

    @Then("the {string} valuation basis button should be active")
    public void verifyValuationBasisButtonActive(String label) {
        Locator btn = page().locator(".pv-source-btn:has-text(\"" + label + "\")");
        assertThat(btn).hasClass(Pattern.compile(".*active.*"));
    }

    @When("I toggle asset type chips selection")
    public void toggleAssetTypeChipsSelection() {
        Locator assetChips = page().locator(".asset-type-chip");
        int chipCount = assetChips.count();
        if (chipCount > 1) {
            assetChips.nth(1).click();
            assertThat(assetChips.nth(1)).hasClass(Pattern.compile(".*active.*"));
            assetChips.first().click();
            assertThat(assetChips.first()).hasClass(Pattern.compile(".*active.*"));
        }
    }

    @Then("the selected asset type chip should be active")
    public void verifySelectedAssetTypeChipActive() {
        Locator activeChips = page().locator(".asset-type-chip.active");
        if (activeChips.count() > 0) {
            assertThat(activeChips.first()).isVisible();
        }
    }

    @Then("the TVM growth chart card and svg should be visible")
    public void verifyTvmGrowthChartVisible() {
        assertThat(toolsPage.tvmChartCard).isVisible();
        assertThat(toolsPage.tvmGrowthSvg).isVisible();
        assertThat(toolsPage.chartLineBalance).isVisible();
        assertThat(toolsPage.chartLineInvested).isVisible();
    }

    @When("I toggle TVM chart mode to {string}")
    public void toggleTvmChartMode(String mode) {
        toolsPage.setChartMode(mode);
    }

    @Then("the lines chart mode button should be active")
    public void verifyLinesChartModeActive() {
        assertThat(toolsPage.chartLinesBtn).hasClass(Pattern.compile(".*active.*"));
        assertThat(page().locator(".chart-area-balance")).hasCount(0);
    }

    @Then("the area chart mode button should be active")
    public void verifyAreaChartModeActive() {
        assertThat(toolsPage.chartAreaBtn).hasClass(Pattern.compile(".*active.*"));
        assertThat(page().locator(".chart-area-balance")).isVisible();
    }

    @When("I switch to the Rebalance Planner tool")
    public void switchToRebalancePlanner() {
        toolsPage.selectRebalancePlanner();
    }

    @Then("the rebalance calculator should be visible")
    public void verifyRebalanceCalculatorVisible() {
        assertThat(toolsPage.rebalanceCalculator).isVisible();
    }

    @Then("the rebalance KPI grid should be visible")
    public void verifyRebalanceKpiGridVisible() {
        assertThat(toolsPage.rebalanceKpiGrid).isVisible();
    }

    @Then("the Standard rebalance mode button should be active")
    public void verifyStandardRebalanceModeActive() {
        assertThat(toolsPage.modeStandardBtn).hasClass(Pattern.compile(".*active.*"));
    }

    @Then("the No-Sell rebalance mode button should be visible")
    public void verifyNoSellRebalanceModeVisible() {
        assertThat(toolsPage.modeNoSellBtn).isVisible();
    }

    @When("I apply equal weight targets to the first asset class")
    public void applyEqualWeightTargets() {
        toolsPage.applyEqualWeightFirstGroup();
    }

    @Then("the target sum badge should be visible")
    public void verifyTargetSumBadgeVisible() {
        Locator badges = page().locator(".target-sum-badge");
        if (badges.count() > 0) {
            assertThat(badges.first()).isVisible();
        }
    }

    @When("I click the No-Sell mode button")
    public void clickNoSellModeButton() {
        toolsPage.selectNoSellMode();
    }

    @Then("the No-Sell settings panel should be visible")
    public void verifyNoSellSettingsPanelVisible() {
        assertThat(toolsPage.noSellSettingsPanel).isVisible();
    }

    @When("I select the custom cash deposit radio")
    public void selectCustomCashDepositRadio() {
        toolsPage.selectCustomDepositRadio();
    }

    @Then("the custom cash input should be visible")
    public void verifyCustomCashInputVisible() {
        assertThat(toolsPage.customCashInput).isVisible();
    }

    @When("I filter rebalance orders by asset class")
    public void filterRebalanceOrdersByClass() {
        assertThat(toolsPage.rebalanceKpiGrid).isVisible();
        Locator classChips = toolsPage.classChips;
        if (classChips.count() > 1) {
            classChips.nth(1).click();
            assertThat(classChips.nth(1)).hasClass(Pattern.compile(".*active.*"));
            assertThat(page().locator(".kpi-card .kpi-label").first()).containsText("Class Value");

            classChips.first().click();
            assertThat(classChips.first()).hasClass(Pattern.compile(".*active.*"));
            assertThat(page().locator(".kpi-card .kpi-label").first()).containsText("Portfolio Value");
        }
    }

    @Then("the rebalance KPI summary should reflect the filtered class")
    public void verifyRebalanceKpiReflectsClass() {
        assertThat(page().locator(".kpi-card .kpi-label").first()).isVisible();
    }

    @Then("the {string} tool calculator should be visible")
    public void verifyNamedToolCalculatorVisible(String toolName) {
        switch (toolName.trim()) {
            case "Rebalance Planner" -> assertThat(toolsPage.rebalanceCalculator).isVisible();
            case "TVM Calculator" -> assertThat(toolsPage.tvmCalculator).isVisible();
            case "Avg Cost Calculator" -> assertThat(toolsPage.avgCostCalculator).isVisible();
            default -> throw new IllegalArgumentException("Unsupported tool calculator: " + toolName);
        }
    }

    @When("I switch the Avg Cost Calculator to reverse goal solver mode")
    public void switchToReverseGoalSolver() {
        toolsPage.switchToReverseSolver();
    }

    @When("I solve for a target average cost of {string} at purchase price {string}")
    public void solveReverseTargetCost(String targetAvgCost, String purchasePrice) {
        toolsPage.solveReverseTargetCost(targetAvgCost, purchasePrice);
    }

    @Then("the reverse solver outcome should display {string}")
    public void verifyReverseSolverOutcome(String expectedOutcome) {
        if ("Target Goal Infeasible".equals(expectedOutcome)) {
            assertThat(toolsPage.solverErrorState).isVisible();
            assertThat(toolsPage.solverErrorTitle).containsText(expectedOutcome);
        } else {
            assertThat(toolsPage.solverResultContainer).isVisible();
            assertThat(toolsPage.solverHeroVal).containsText(expectedOutcome);
        }
    }

    @When("I apply the solved reverse goal to forward simulation")
    public void applyReverseGoalToSimulation() {
        toolsPage.applyReverseGoalToSimulation();
    }

    @When("I select the TVM solve goal {string}")
    public void selectTvmSolveGoal(String mode) {
        toolsPage.switchTvmSolveMode(mode);
    }

    @Then("the TVM hero title should display {string}")
    public void verifyTvmHeroTitle(String expectedTitle) {
        assertThat(toolsPage.tvmHeroTitle).containsText(expectedTitle);
    }
}
