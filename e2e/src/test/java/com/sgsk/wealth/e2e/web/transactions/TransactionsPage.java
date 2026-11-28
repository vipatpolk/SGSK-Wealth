package com.sgsk.wealth.e2e.web.transactions;

import com.microsoft.playwright.Download;
import com.microsoft.playwright.Locator;
import com.microsoft.playwright.Page;
import com.sgsk.wealth.e2e.core.context.TestContext;
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
        this.container = page.locator("#tx-history-container");
        this.transactionRows = page.locator("#tx-history-container tbody tr, #tx-history-container .tx-row");
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

    public void closeSymbolDropdown() {
        Locator backdrops = page.locator(".desktop-symbol-backdrop, .symbol-dropdown-backdrop");
        if (backdrops.count() > 0) {
            backdrops.first().dispatchEvent("click");
        }
        symbolDropdownMenu.waitFor(
                new Locator.WaitForOptions().setState(com.microsoft.playwright.options.WaitForSelectorState.HIDDEN));
    }

    public void selectSymbolFilter(String symbol) {
        openSymbolDropdown();
        page.locator("[id='dropdown-item-" + symbol + "']").click();
    }

    public void clearSymbolSelection() {
        allSymbolsFeedBtn.click();
    }

    public Locator dropdownItemName(String symbol) {
        return page.locator("[id='dropdown-item-" + symbol + "'] .dropdown-item-name");
    }

    public Locator heroSubtitle() {
        return page.locator("#symbol-hero-card .symbol-hero-subtitle");
    }

    public Locator ledgerRowAssetName(String symbol) {
        return com.sgsk.wealth.e2e.core.support.LocatorUtils
                .filterBySymbolWord(page.locator("#tx-table .tx-row"), symbol)
                .locator(".tx-symbol-name");
    }
}
