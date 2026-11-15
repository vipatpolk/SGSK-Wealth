package com.sgsk.wealth.e2e.pages;

import com.microsoft.playwright.Locator;
import com.microsoft.playwright.Page;
import com.sgsk.wealth.e2e.context.TestContext;
import io.cucumber.spring.ScenarioScope;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.ScopedProxyMode;
import org.springframework.stereotype.Component;

@Component
@ScenarioScope(proxyMode = ScopedProxyMode.NO)
public class FactsheetModalPage {
    private final Page page;

    @Autowired
    public FactsheetModalPage(TestContext testContext) {
        this(testContext.getPage());
    }

    public FactsheetModalPage(Page page) {
        this.page = page;
    }

    public Locator modal() {
        return page.locator("#fund-factsheet-modal");
    }

    public Locator title() {
        return page.locator("#factsheet-fund-title");
    }

    public Locator riskBadge() {
        return page.locator("#factsheet-risk-badge");
    }

    public Locator pdfButton() {
        return page.locator("#btn-factsheet-pdf");
    }

    public Locator closeButton() {
        return page.locator("#btn-close-factsheet-modal");
    }

    public void close() {
        closeButton().click();
        modal().waitFor(
                new Locator.WaitForOptions().setState(com.microsoft.playwright.options.WaitForSelectorState.HIDDEN));
    }
}
