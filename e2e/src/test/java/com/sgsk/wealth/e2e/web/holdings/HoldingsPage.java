package com.sgsk.wealth.e2e.web.holdings;

import com.microsoft.playwright.Locator;
import com.microsoft.playwright.Page;
import com.microsoft.playwright.options.WaitForSelectorState;
import com.sgsk.wealth.e2e.core.context.TestContext;
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
        this.tabButtons = page.locator("#tab-bar button.tab-button");
        this.searchInput = page.locator("#holdings-search-input");
        this.symbolCards = page.locator(".symbol-card");
        this.summaryCards = page.locator("app-summary-card");
        this.expandedDrawer = page.locator(".lots-section");
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
            page.locator("#holdings-view").waitFor(new Locator.WaitForOptions().setState(WaitForSelectorState.VISIBLE));
        }
    }

    public void selectTab(String tabLabel) {
        navigateToHoldings();
        if (page.locator("#pvd-holdings-screen").isVisible()
                && !tabLabel.toLowerCase(java.util.Locale.ROOT).contains("provident")) {
            page.locator("#holdings-subtab-market").click();
            page.locator("#tab-bar").waitFor(new Locator.WaitForOptions().setState(WaitForSelectorState.VISIBLE));
        }
        Locator mobileDropdownBtn = page.locator("#tab-dropdown-btn");
        if (mobileDropdownBtn.isVisible()) {
            mobileDropdownBtn.click();
            page.locator(".tab-dropdown-menu button").filter(new Locator.FilterOptions().setHasText(tabLabel)).first().click();
        } else {
            tabButtons.filter(new Locator.FilterOptions().setHasText(tabLabel)).first().click();
        }
    }

    public void searchSymbol(String query) {
        navigateToHoldings();
        searchInput.fill(query);
    }

    public void clickSymbolRow(String symbol) {
        navigateToHoldings();
        page.locator("[id=\"toggle-" + symbol + "\"] .symbol-badge").first().click();
    }

    public void selectSortOption(String sortMetric) {
        navigateToHoldings();
        String field = switch (sortMetric.trim()) {
            case "Symbol" -> "symbol";
            case "Total Cost" -> "totalCost";
            case "Avg Cost" -> "avgCost";
            case "Holding Value" -> "value";
            case "P/L %" -> "pl";
            default -> throw new IllegalArgumentException("Unsupported market sort metric: " + sortMetric);
        };
        Locator pill = page.locator("#sort-" + field);
        pill.waitFor();
        String classes = pill.getAttribute("class");
        if (classes == null || !classes.contains("sort-pill-active")) {
            pill.click();
            com.microsoft.playwright.assertions.PlaywrightAssertions.assertThat(pill)
                    .hasClass(java.util.regex.Pattern.compile(".*sort-pill-active.*"));
        }
        boolean wantAsc = "symbol".equals(field);
        boolean isAsc = pill.locator(".sort-arrow-up").count() > 0;
        if (isAsc != wantAsc) {
            pill.click();
        }
        if (wantAsc) {
            com.microsoft.playwright.assertions.PlaywrightAssertions.assertThat(pill.locator(".sort-arrow-up")).isVisible();
        } else {
            com.microsoft.playwright.assertions.PlaywrightAssertions.assertThat(pill.locator(".sort-arrow-up")).hasCount(0);
        }
    }

    public String firstSymbolCardId() {
        symbolCards.first().waitFor();
        return symbolCards.first().getAttribute("id");
    }

    public void openSearchAutocomplete(String query) {
        Locator input = page.locator("#holdings-search-input").first();
        input.click();
        input.fill(query);
        page.locator("#search-autocomplete-dropdown").waitFor();
    }

    public void closeSearchAutocomplete() {
        Locator clearBtn = page.locator("#search-clear-btn");
        if (clearBtn.isVisible()) {
            clearBtn.click();
        }
        Locator backdrop = page.locator(".search-backdrop");
        if (backdrop.isVisible()) {
            backdrop.dispatchEvent("mousedown");
        }
        page.locator("#search-autocomplete-dropdown").waitFor(
                new Locator.WaitForOptions().setState(com.microsoft.playwright.options.WaitForSelectorState.HIDDEN));
    }

    public Locator searchAutocompleteItemName(String symbol) {
        return com.sgsk.wealth.e2e.core.support.LocatorUtils
                .filterBySymbolWord(page.locator("#search-autocomplete-dropdown .autocomplete-item"), symbol)
                .locator(".item-name");
    }

    public Locator symbolCardName(String symbol) {
        return getSymbolCard(symbol).locator(".symbol-name");
    }

    public Locator factsheetButton(String symbol) {
        return page.locator("[id=\"btn-factsheet-" + symbol + "\"]");
    }

    public void openFactsheet(String symbol) {
        Locator btn = factsheetButton(symbol);
        btn.waitFor();
        btn.click();
    }

    public Locator lotsDrawerForSymbol(String symbol) {
        return page.locator("[id=\"lots-" + symbol + "\"]");
    }
}
