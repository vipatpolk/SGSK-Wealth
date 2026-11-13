package com.sgsk.wealth.e2e.pages;

import com.microsoft.playwright.Locator;
import com.microsoft.playwright.Page;
import com.sgsk.wealth.e2e.context.TestContext;
import io.cucumber.spring.ScenarioScope;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.ScopedProxyMode;
import org.springframework.stereotype.Component;

import java.util.regex.Pattern;

import static com.microsoft.playwright.assertions.PlaywrightAssertions.assertThat;

@Component
@ScenarioScope(proxyMode = ScopedProxyMode.NO)
public class ToolsPage {
    private final Page page;

    public final Locator toolsContainer;
    public final Locator heroTitle;
    public final Locator avgCostCalculator;
    public final Locator symbolSearchBox;
    public final Locator symbolDropdownMenu;
    public final Locator customOption;
    public final Locator calculateSimBtn;
    public final Locator simResultsPanel;
    public final Locator simKpiGrid;
    public final Locator modeAmountPill;
    public final Locator simAmountInput;

    // TVM
    public final Locator tvmCalculator;
    public final Locator tvmHeroDisplay;
    public final Locator heroMainValue;
    public final Locator modeSolvePmtBtn;
    public final Locator targetFvInput;
    public final Locator compoundingDropdownBtn;
    public final Locator compoundingMenu;
    public final Locator toggleScheduleBtn;
    public final Locator scheduleTable;
    public final Locator tvmChartCard;
    public final Locator tvmGrowthSvg;
    public final Locator chartLineBalance;
    public final Locator chartLineInvested;
    public final Locator chartLinesBtn;
    public final Locator chartAreaBtn;

    // Rebalance
    public final Locator rebalanceCalculator;
    public final Locator rebalanceKpiGrid;
    public final Locator modeStandardBtn;
    public final Locator modeNoSellBtn;
    public final Locator noSellSettingsPanel;
    public final Locator customDepositRadio;
    public final Locator customCashInput;
    public final Locator assetClassCards;
    public final Locator classChips;

    @Autowired
    public ToolsPage(TestContext testContext) {
        this(testContext.getPage());
    }

    public ToolsPage(Page page) {
        this.page = page;
        this.toolsContainer = page.locator("app-tools");
        this.heroTitle = page.locator(".tools-hero-title");
        this.avgCostCalculator = page.locator("app-avg-cost-calculator");
        this.symbolSearchBox = page.locator(".symbol-search-box");
        this.symbolDropdownMenu = page.locator(".symbol-dropdown-menu");
        this.customOption = page.locator(".dropdown-option-item.custom-option");
        this.calculateSimBtn = page.locator("#btn-calculate-simulation");
        this.simResultsPanel = page.locator(".right-panel");
        this.simKpiGrid = page.locator(".sim-kpi-grid");
        this.modeAmountPill = page.locator("#mode-amount-pill");
        this.simAmountInput = page.locator("#input-amount");

        // TVM
        this.tvmCalculator = page.locator("app-tvm-calculator");
        this.tvmHeroDisplay = page.locator(".tvm-hero-display");
        this.heroMainValue = page.locator(".hero-main-value");
        this.modeSolvePmtBtn = page.locator("#mode-solve-pmt");
        this.targetFvInput = page.locator("#input-target-fv");
        this.compoundingDropdownBtn = page.locator("#compounding-dropdown-btn");
        this.compoundingMenu = page.locator(".compounding-menu");
        this.toggleScheduleBtn = page.locator("#btn-toggle-tvm-schedule");
        this.scheduleTable = page.locator(".schedule-table");
        this.tvmChartCard = page.locator(".tvm-chart-card");
        this.tvmGrowthSvg = page.locator(".tvm-growth-svg");
        this.chartLineBalance = page.locator(".chart-line-balance");
        this.chartLineInvested = page.locator(".chart-line-invested");
        this.chartLinesBtn = page.locator(".chart-mode-btn:has-text(\"Lines\")");
        this.chartAreaBtn = page.locator(".chart-mode-btn:has-text(\"Area\")");

        // Rebalance
        this.rebalanceCalculator = page.locator("app-rebalance-calculator");
        this.rebalanceKpiGrid = page.locator(".rebalance-kpi-grid");
        this.modeStandardBtn = page.locator("#btn-mode-standard");
        this.modeNoSellBtn = page.locator("#btn-mode-nosell");
        this.noSellSettingsPanel = page.locator("#nosell-settings-panel");
        this.customDepositRadio = page.locator("#radio-custom-deposit");
        this.customCashInput = page.locator("#custom-cash-input");
        this.assetClassCards = page.locator(".asset-class-card");
        this.classChips = page.locator(".class-chip");
    }

    public void selectTvmCalculator() {
        assertThat(toolsContainer).isVisible();
        var viewport = page.viewportSize();
        boolean isDesktop = viewport == null || viewport.width >= 1024;

        if (isDesktop) {
            Locator desktopTab = page.locator("#tool-tab-tvm-calculator");
            assertThat(desktopTab).isVisible();
            desktopTab.click();
        } else {
            Locator mobileTrigger = page.locator("#tools-mobile-dropdown-trigger");
            assertThat(mobileTrigger).isVisible();
            mobileTrigger.click();
            Locator dropdownItem = page.locator("#tool-dropdown-tvm-calculator");
            assertThat(dropdownItem).isVisible();
            dropdownItem.click();
        }
        assertThat(tvmCalculator).isVisible();
    }

    public void selectRebalancePlanner() {
        assertThat(toolsContainer).isVisible();
        Locator desktopTab = page.locator("#tool-tab-rebalance-planner");
        if (desktopTab.isVisible()) {
            desktopTab.click();
        } else {
            Locator mobileTrigger = page.locator("#tools-mobile-dropdown-trigger");
            assertThat(mobileTrigger).isVisible();
            mobileTrigger.click();
            Locator dropdownItem = page.locator("#tool-dropdown-rebalance-planner");
            assertThat(dropdownItem).isVisible();
            dropdownItem.click();
        }
        assertThat(rebalanceCalculator).isVisible();
    }

    public void selectCustomSimulation() {
        symbolSearchBox.click();
        assertThat(symbolDropdownMenu).isVisible();
        customOption.click();
    }

    public void calculateSimulation() {
        assertThat(calculateSimBtn).isEnabled();
        calculateSimBtn.click();
    }

    public void switchToAmountMode() {
        modeAmountPill.click();
        assertThat(modeAmountPill).hasClass(Pattern.compile(".*active.*"));
    }

    public void switchSolveModePmt() {
        modeSolvePmtBtn.click();
        assertThat(modeSolvePmtBtn).hasClass(Pattern.compile(".*active.*"));
    }

    public void setCompoundingFrequency(String freq) {
        compoundingDropdownBtn.click();
        assertThat(compoundingMenu).isVisible();
        page.locator(".compounding-menu-item:has-text(\"" + freq + "\")").click();
    }

    public void toggleScheduleTable() {
        toggleScheduleBtn.click();
    }

    public void setValuationBasis(String basis) {
        Locator btn = page.locator(".pv-source-btn:has-text(\"" + basis + "\")");
        btn.click();
    }

    public void setChartMode(String mode) {
        page.locator(".chart-mode-btn:has-text(\"" + mode + "\")").click();
    }

    public void selectNoSellMode() {
        modeNoSellBtn.click();
        assertThat(modeNoSellBtn).hasClass(Pattern.compile(".*active.*"));
    }

    public void selectCustomDepositRadio() {
        customDepositRadio.click();
    }

    public void applyEqualWeightFirstGroup() {
        if (assetClassCards.count() > 0) {
            Locator firstGroup = assetClassCards.first();
            assertThat(firstGroup).isVisible();
            Locator equalWeightBtn = firstGroup.locator("button:has-text(\"Equal Weight\")");
            if (equalWeightBtn.isVisible()) {
                equalWeightBtn.click();
            }
        }
    }
}
