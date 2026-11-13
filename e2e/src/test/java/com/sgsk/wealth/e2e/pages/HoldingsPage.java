package com.sgsk.wealth.e2e.pages;

import com.microsoft.playwright.Locator;
import com.microsoft.playwright.Page;
import com.microsoft.playwright.options.WaitForSelectorState;
import com.sgsk.wealth.e2e.context.TestContext;
import io.cucumber.spring.ScenarioScope;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.ScopedProxyMode;
import org.springframework.stereotype.Component;

@Component
@ScenarioScope(proxyMode = ScopedProxyMode.NO)
public class HoldingsPage {
    private final Page page;
    public final Locator tabButtons;
    public final Locator searchInput;
    public final Locator symbolCards;
    public final Locator summaryCards;
    public final Locator expandedDrawer;
    public final Locator loader;
    public final Locator errorState;
    public final Locator retryBtn;

    @Autowired
    public HoldingsPage(TestContext testContext) {
        this(testContext.getPage());
    }

    public HoldingsPage(Page page) {
        this.page = page;
        this.tabButtons = page.locator("app-tab-bar button.tab-button");
        this.searchInput = page.locator("app-search-bar input");
        this.symbolCards = page.locator(".symbol-card");
        this.summaryCards = page.locator("app-summary-card");
        this.expandedDrawer = page.locator(".lots-container");
        this.loader = page.locator("#loading-state");
        this.errorState = page.locator("#error-state");
        this.retryBtn = page.locator("#retry-btn");
    }

    public Locator getSymbolCard(String symbol) {
        return symbol.contains(".")
                ? page.locator("[id=\"card-" + symbol + "\"]")
                : page.locator("#card-" + symbol);
    }

    public void navigateToHoldings() {
        Locator holdingsBtn = page.locator("#view-toggle-holdings");
        String classAttr = holdingsBtn.getAttribute("class");
        if (classAttr == null || !classAttr.contains("view-toggle-btn-active")) {
            holdingsBtn.click();
            page.locator("app-tab-bar").waitFor(new Locator.WaitForOptions().setState(WaitForSelectorState.VISIBLE));
        }
    }

    public void selectTab(String tabLabel) {
        navigateToHoldings();
        var viewport = page.viewportSize();
        boolean isDesktop = viewport == null || viewport.width >= 768;
        if (isDesktop) {
            tabButtons.filter(new Locator.FilterOptions().setHasText(tabLabel)).first().click();
        } else {
            Locator mobileDropdownBtn = page.locator("#tab-dropdown-btn");
            mobileDropdownBtn.click();
            page.locator(".tab-dropdown-menu button").filter(new Locator.FilterOptions().setHasText(tabLabel)).first().click();
        }
    }

    public void searchSymbol(String query) {
        navigateToHoldings();
        searchInput.fill(query);
    }

    public void clickSymbolRow(String symbol) {
        navigateToHoldings();
        page.locator("#toggle-" + symbol).click();
    }
}
