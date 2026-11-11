package com.sgsk.wealth.e2e.pages;

import com.microsoft.playwright.Download;
import com.microsoft.playwright.Locator;
import com.microsoft.playwright.Page;

public class TransactionsPage {
    private final Page page;
    public final Locator container;
    public final Locator transactionRows;
    public final Locator exportCsvTriggerBtn;
    public final Locator exportAllBtn;
    public final Locator exportOpenBtn;

    public TransactionsPage(Page page) {
        this.page = page;
        this.container = page.locator("app-transaction-history");
        this.transactionRows = page.locator("app-transaction-history tbody tr, app-transaction-history .tx-row");
        this.exportCsvTriggerBtn = page.locator("#btn-export-csv-trigger");
        this.exportAllBtn = page.locator("#btn-export-all");
        this.exportOpenBtn = page.locator("#btn-export-open");
    }

    public Download exportAllTransactions() {
        exportCsvTriggerBtn.click();
        return page.waitForDownload(() -> {
            exportAllBtn.click();
        });
    }
}
