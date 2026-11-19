package com.sgsk.wealth.e2e.mobile.holdings;

import com.sgsk.wealth.e2e.mobile.common.MobileDriverBridge;
import io.cucumber.spring.ScenarioScope;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.ScopedProxyMode;
import org.springframework.stereotype.Component;

import static org.junit.jupiter.api.Assertions.assertFalse;

@Component
@ScenarioScope(proxyMode = ScopedProxyMode.NO)
public class MobileHoldingsScreen {
    private final MobileDriverBridge driver;

    @Autowired
    public MobileHoldingsScreen(MobileDriverBridge driver) {
        this.driver = driver;
    }

    public void selectHoldingsMode(String mode) {
        String id = "pvd".equalsIgnoreCase(mode.trim()) ? "#mobile-segment-pvd" : "#mobile-segment-market";
        driver.tap(id);
    }

    public void selectAssetChip(String assetTabId) {
        driver.tap("#mobile-chip-" + assetTabId);
    }

    public void searchHoldings(String query) {
        driver.fillSearchbar("#mobile-holdings-search", query);
    }

    public void toggleHoldingsSortDirection() {
        driver.tap("#mobile-holdings-sort-dir");
    }

    public void toggleExpandAllHoldingsLots() {
        driver.tap("#mobile-holdings-expand-all");
    }

    public void expandFirstSymbolLots() {
        driver.tapFirst("[data-symbol-lots]");
    }

    public void assertAnyHoldingContainsSymbol(String symbol) {
        driver.assertTextContains("#mobile-position-cards", symbol);
    }

    public void assertClosedPositionsVisible() {
        driver.assertVisible("#mobile-closed-list");
    }

    public void assertPvdExecutiveSectionsVisible() {
        driver.assertVisible("#mobile-pvd-list");
        driver.assertVisible("#mobile-pvd-split-bar");
        driver.assertVisible("#mobile-pvd-risk-spectrum");
    }

    public void openFirstFactsheetModal() {
        driver.tapFirst("[data-factsheet-symbol]");
        driver.waitForVisible("#mobile-factsheet-close");
    }

    public void closeFactsheetModal() {
        driver.tap("#mobile-factsheet-close");
        driver.waitForHidden("#mobile-factsheet-close");
    }

    public void assertFactsheetClosed() {
        assertFalse(driver.isVisible("#mobile-factsheet-close"), "Expected mobile factsheet modal to be closed");
    }
}
