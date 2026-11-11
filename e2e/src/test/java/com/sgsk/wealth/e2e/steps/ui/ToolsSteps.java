package com.sgsk.wealth.e2e.steps.ui;

import com.microsoft.playwright.Locator;
import com.microsoft.playwright.Page;
import com.sgsk.wealth.e2e.context.TestContext;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;

import java.util.regex.Pattern;

import static com.microsoft.playwright.assertions.PlaywrightAssertions.assertThat;

public class ToolsSteps {
    private final TestContext context;

    public ToolsSteps(TestContext context) {
        this.context = context;
    }

    private Page page() {
        return context.getPage();
    }

    private void selectTvmCalculator() {
        assertThat(page().locator("app-tools")).isVisible();
        var viewport = page().viewportSize();
        boolean isDesktop = viewport == null || viewport.width >= 1024;

        if (isDesktop) {
            Locator desktopTab = page().locator("#tool-tab-tvm-calculator");
            assertThat(desktopTab).isVisible();
            desktopTab.click();
        } else {
            Locator mobileTrigger = page().locator("#tools-mobile-dropdown-trigger");
            assertThat(mobileTrigger).isVisible();
            mobileTrigger.click();
            Locator dropdownItem = page().locator("#tool-dropdown-tvm-calculator");
            assertThat(dropdownItem).isVisible();
            dropdownItem.click();
        }
        assertThat(page().locator("app-tvm-calculator")).isVisible();
    }

    private void selectRebalancePlanner() {
        assertThat(page().locator("app-tools")).isVisible();
        Locator desktopTab = page().locator("#tool-tab-rebalance-planner");
        if (desktopTab.isVisible()) {
            desktopTab.click();
        } else {
            Locator mobileTrigger = page().locator("#tools-mobile-dropdown-trigger");
            assertThat(mobileTrigger).isVisible();
            mobileTrigger.click();
            Locator dropdownItem = page().locator("#tool-dropdown-rebalance-planner");
            assertThat(dropdownItem).isVisible();
            dropdownItem.click();
        }
        assertThat(page().locator("app-rebalance-calculator")).isVisible();
    }

    @Then("the tools hero title should contain {string}")
    public void verifyToolsHeroTitle(String text) {
        assertThat(page().locator(".tools-hero-title")).containsText(text);
    }

    @Then("the average cost calculator should be visible")
    public void verifyAverageCostCalculatorVisible() {
        assertThat(page().locator("app-avg-cost-calculator")).isVisible();
    }

    @When("I select the custom simulation option from the symbol dropdown")
    public void selectCustomSimulationOption() {
        page().locator(".symbol-search-box").click();
        assertThat(page().locator(".symbol-dropdown-menu")).isVisible();
        Locator customOption = page().locator(".dropdown-option-item.custom-option");
        customOption.click();
    }

    @When("I click the simulation calculate button")
    public void clickSimulationCalculateButton() {
        Locator calcBtn = page().locator("#btn-calculate-simulation");
        assertThat(calcBtn).isEnabled();
        calcBtn.click();
    }

    @Then("the simulation results panel and KPI grid should be visible")
    public void verifySimulationResultsPanel() {
        assertThat(page().locator(".right-panel")).isVisible();
        assertThat(page().locator(".sim-kpi-grid")).isVisible();
    }

    @When("I switch to By Amount mode")
    public void switchToByAmountMode() {
        Locator amountModeBtn = page().locator("#mode-amount-pill");
        amountModeBtn.click();
        assertThat(amountModeBtn).hasClass(Pattern.compile(".*active.*"));
    }

    @Then("the simulation amount input should be visible")
    public void verifySimulationAmountInput() {
        assertThat(page().locator("#input-amount")).isVisible();
    }

    @When("I switch to the TVM Calculator tool")
    public void switchToTvmCalculator() {
        selectTvmCalculator();
    }

    @Then("the TVM hero display and projected value should be visible")
    public void verifyTvmHeroDisplay() {
        assertThat(page().locator(".tvm-hero-display")).isVisible();
        assertThat(page().locator(".hero-main-value")).isVisible();
    }

    @When("I switch the TVM solve mode to PMT")
    public void switchTvmSolveModeToPmt() {
        Locator solvePmtBtn = page().locator("#mode-solve-pmt");
        solvePmtBtn.click();
        assertThat(solvePmtBtn).hasClass(Pattern.compile(".*active.*"));
    }

    @Then("the target FV input should be visible")
    public void verifyTargetFvInput() {
        assertThat(page().locator("#input-target-fv")).isVisible();
    }

    @When("I select TVM compounding frequency {string}")
    public void selectTvmCompoundingFrequency(String freq) {
        page().locator("#compounding-dropdown-btn").click();
        assertThat(page().locator(".compounding-menu")).isVisible();
        page().locator(".compounding-menu-item:has-text(\"" + freq + "\")").click();
    }

    @Then("the active compounding frequency should display {string}")
    public void verifyActiveCompoundingFrequency(String freq) {
        assertThat(page().locator(".compounding-active-text")).containsText(freq);
    }

    @When("I toggle the TVM accumulation schedule table")
    public void toggleTvmScheduleTable() {
        page().locator("#btn-toggle-tvm-schedule").click();
    }

    @Then("the schedule table should be visible")
    public void verifyScheduleTableVisible() {
        assertThat(page().locator(".schedule-table")).isVisible();
    }

    @When("I click the PV valuation basis {string}")
    public void clickPvValuationBasis(String label) {
        page().locator(".pv-source-btn:has-text(\"" + label + "\")").click();
    }

    @Then("the {string} valuation basis button should be active")
    public void verifyValuationBasisButtonActive(String label) {
        Locator btn = page().locator(".pv-source-btn:has-text(\"" + label + "\")");
        assertThat(btn).hasClass(Pattern.compile(".*active.*"));
    }

    @Then("I test asset type chips selection if present")
    public void testAssetTypeChipsSelection() {
        Locator assetChips = page().locator(".asset-type-chip");
        int chipCount = assetChips.count();
        if (chipCount > 1) {
            assetChips.nth(1).click();
            assertThat(assetChips.nth(1)).hasClass(Pattern.compile(".*active.*"));
            assetChips.first().click();
            assertThat(assetChips.first()).hasClass(Pattern.compile(".*active.*"));
        }
    }

    @Then("the TVM growth chart card and svg should be visible")
    public void verifyTvmGrowthChartVisible() {
        assertThat(page().locator(".tvm-chart-card")).isVisible();
        assertThat(page().locator(".tvm-growth-svg")).isVisible();
        assertThat(page().locator(".chart-line-balance")).isVisible();
        assertThat(page().locator(".chart-line-invested")).isVisible();
    }

    @When("I toggle TVM chart mode to {string}")
    public void toggleTvmChartMode(String mode) {
        page().locator(".chart-mode-btn:has-text(\"" + mode + "\")").click();
    }

    @Then("the lines chart mode button should be active")
    public void verifyLinesChartModeActive() {
        Locator linesBtn = page().locator(".chart-mode-btn:has-text(\"Lines\")");
        assertThat(linesBtn).hasClass(Pattern.compile(".*active.*"));
        assertThat(page().locator(".chart-area-balance")).hasCount(0);
    }

    @Then("the area chart mode button should be active")
    public void verifyAreaChartModeActive() {
        Locator areaBtn = page().locator(".chart-mode-btn:has-text(\"Area\")");
        assertThat(areaBtn).hasClass(Pattern.compile(".*active.*"));
        assertThat(page().locator(".chart-area-balance")).isVisible();
    }

    @When("I switch to the Rebalance Planner tool")
    public void switchToRebalancePlanner() {
        selectRebalancePlanner();
    }

    @Then("the rebalance calculator should be visible")
    public void verifyRebalanceCalculatorVisible() {
        assertThat(page().locator("app-rebalance-calculator")).isVisible();
    }

    @Then("the rebalance KPI grid should be visible")
    public void verifyRebalanceKpiGridVisible() {
        assertThat(page().locator(".rebalance-kpi-grid")).isVisible();
    }

    @Then("the Standard rebalance mode button should be active")
    public void verifyStandardRebalanceModeActive() {
        assertThat(page().locator("#btn-mode-standard")).hasClass(Pattern.compile(".*active.*"));
    }

    @Then("the No-Sell rebalance mode button should be visible")
    public void verifyNoSellRebalanceModeVisible() {
        assertThat(page().locator("#btn-mode-nosell")).isVisible();
    }

    @Then("I test Rebalance Planner equal weight actions if groups exist")
    public void testRebalanceEqualWeight() {
        Locator groups = page().locator(".asset-class-card");
        if (groups.count() > 0) {
            Locator firstGroup = groups.first();
            assertThat(firstGroup).isVisible();
            Locator equalWeightBtn = firstGroup.locator("button:has-text(\"Equal Weight\")");
            if (equalWeightBtn.isVisible()) {
                equalWeightBtn.click();
            }
            assertThat(firstGroup.locator(".target-sum-badge")).isVisible();
        }
    }

    @When("I click the No-Sell mode button")
    public void clickNoSellModeButton() {
        Locator noSellBtn = page().locator("#btn-mode-nosell");
        noSellBtn.click();
        assertThat(noSellBtn).hasClass(Pattern.compile(".*active.*"));
    }

    @Then("the No-Sell settings panel should be visible")
    public void verifyNoSellSettingsPanelVisible() {
        assertThat(page().locator("#nosell-settings-panel")).isVisible();
    }

    @When("I select the custom cash deposit radio")
    public void selectCustomCashDepositRadio() {
        page().locator("#radio-custom-deposit").click();
    }

    @Then("the custom cash input should be visible")
    public void verifyCustomCashInputVisible() {
        assertThat(page().locator("#custom-cash-input")).isVisible();
    }

    @Then("I test Rebalance Planner class chip filters if present")
    public void testRebalanceClassChips() {
        assertThat(page().locator(".rebalance-kpi-grid")).isVisible();
        Locator classChips = page().locator(".class-chip");
        if (classChips.count() > 1) {
            classChips.nth(1).click();
            assertThat(classChips.nth(1)).hasClass(Pattern.compile(".*active.*"));
            assertThat(page().locator(".kpi-card .kpi-label").first()).containsText("Class Value");

            classChips.first().click();
            assertThat(classChips.first()).hasClass(Pattern.compile(".*active.*"));
            assertThat(page().locator(".kpi-card .kpi-label").first()).containsText("Portfolio Value");
        }
    }
}
