package com.sgsk.wealth.e2e.pages;

import com.microsoft.playwright.Locator;
import com.microsoft.playwright.Page;

public class PerformancePage {
    private final Page page;
    public final Locator summaryGrid;
    public final Locator summaryCards;
    public final Locator searchInput;
    public final Locator statusSelect;
    public final Locator datePickerTrigger;
    public final Locator datePickerPopover;

    public PerformancePage(Page page) {
        this.page = page;
        this.summaryGrid = page.locator(".perf-summary-grid");
        this.summaryCards = page.locator(".perf-summary-card");
        this.searchInput = page.locator(".perf-search-input");
        this.statusSelect = page.locator(".perf-filter-select").nth(1);
        this.datePickerTrigger = page.locator("#datepicker-trigger-btn");
        this.datePickerPopover = page.locator(".datepicker-popover");
    }

    public void searchSymbol(String query) {
        searchInput.fill(query);
    }

    public void filterByStatus(String status) {
        statusSelect.selectOption(status);
    }

    public void selectDatePreset(String preset) {
        if (!datePickerPopover.isVisible()) {
            datePickerTrigger.click();
        }
        page.locator(".preset-item:has-text(\"" + preset + "\")").click();
    }
}
