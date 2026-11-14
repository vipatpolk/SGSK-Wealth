package com.sgsk.wealth.e2e.pages;

import com.microsoft.playwright.Download;
import com.microsoft.playwright.Locator;
import com.microsoft.playwright.Page;
import com.sgsk.wealth.e2e.context.TestContext;
import io.cucumber.spring.ScenarioScope;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.ScopedProxyMode;
import org.springframework.stereotype.Component;

@Component
@ScenarioScope(proxyMode = ScopedProxyMode.NO)
public class TransactionsPage {
    private final Page page;
    public final Locator container;
    public final Locator transactionRows;
    public final Locator exportCsvTriggerBtn;
    public final Locator exportAllBtn;
    public final Locator exportOpenBtn;
    public final Locator symbolSelectorBtn;
    public final Locator symbolDropdownMenu;
    public final Locator symbolHeroCard;
    public final Locator allSymbolsFeedBtn;

    @Autowired
    public TransactionsPage(TestContext testContext) {
        this(testContext.getPage());
    }

    public TransactionsPage(Page page) {
        this.page = page;
        this.container = page.locator("app-transaction-history");
        this.transactionRows = page.locator("app-transaction-history tbody tr, app-transaction-history .tx-row");
        this.exportCsvTriggerBtn = page.locator("#btn-export-csv-trigger");
        this.exportAllBtn = page.locator("#btn-export-all");
        this.exportOpenBtn = page.locator("#btn-export-scope-open");
        this.symbolSelectorBtn = page.locator("#symbol-selector-btn");
        this.symbolDropdownMenu = page.locator("#symbol-dropdown-menu");
        this.symbolHeroCard = page.locator("#symbol-hero-card");
        this.allSymbolsFeedBtn = page.locator("#btn-all-symbols-feed");
    }

    public Download exportAllTransactions() {
        exportCsvTriggerBtn.click();
        return page.waitForDownload(() -> {
            exportAllBtn.click();
        });
    }

    public Download exportOpenPositionsTransactions() {
        exportCsvTriggerBtn.click();
        exportOpenBtn.waitFor();
        exportOpenBtn.click();
        return page.waitForDownload(() -> {
            exportAllBtn.click();
        });
    }

    public void openSymbolDropdown() {
        symbolSelectorBtn.click();
        symbolDropdownMenu.waitFor();
    }

    public void selectSymbolFilter(String symbol) {
        openSymbolDropdown();
        page.locator("[id='dropdown-item-" + symbol + "']").click();
    }

    public void clearSymbolSelection() {
        allSymbolsFeedBtn.click();
    }
}
