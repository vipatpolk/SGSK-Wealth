package com.sgsk.wealth.e2e.web.holdings;

import com.microsoft.playwright.Locator;
import com.microsoft.playwright.Page;
import com.sgsk.wealth.e2e.core.context.TestContext;
import io.cucumber.spring.ScenarioScope;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.ScopedProxyMode;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.regex.Pattern;

import static com.microsoft.playwright.assertions.PlaywrightAssertions.assertThat;

@Component
@ScenarioScope(proxyMode = ScopedProxyMode.NO)
public class PvdHoldingsPage {
    private final Page page;

    @Autowired
    public PvdHoldingsPage(TestContext testContext) {
        this(testContext.getPage());
    }

    public PvdHoldingsPage(Page page) {
        this.page = page;
    }

    public Locator screenHeader() {
        return page.locator("#holdings-screen-header");
    }

    public Locator modeToggle() {
        return page.locator("#holdings-screen-toggle");
    }

    public Locator marketSubtabBtn() {
        return page.locator("#holdings-subtab-market");
    }

    public Locator pvdSubtabBtn() {
        return page.locator("#holdings-subtab-pvd");
    }

    public Locator pvdTabBarBtn() {
        return page.locator("#tab-provident-fund");
    }

    public Locator pvdScreen() {
        return page.locator("#pvd-holdings-screen");
    }

    public Locator heroCard() {
        return page.locator("#pvd-hero-card");
    }

    public Locator overallSplitBar() {
        return page.locator("#pvd-overall-split-bar");
    }

    public Locator policyAllocationCard() {
        return page.locator("#pvd-policy-allocation-card");
    }

    public Locator riskSummaryCard() {
        return page.locator("#pvd-risk-summary-card");
    }

    public Locator policiesSection() {
        return page.locator("#pvd-policies-section");
    }

    public Locator searchInput() {
        return page.locator("#pvd-search-input");
    }

    public Locator sortButton(String label) {
        return page.locator(".pvd-sort-btn", new Page.LocatorOptions().setHasText(label));
    }

    public Locator policyCards() {
        return page.locator(".pvd-policy-card");
    }

    public Locator policyCard(String symbol) {
        return page.locator("#pvd-policy-" + symbol);
    }

    public Locator policyName(String symbol) {
        return policyCard(symbol).locator(".pvd-policy-name");
    }

    public Locator policyDonutLegendName(String symbol) {
        return com.sgsk.wealth.e2e.core.support.LocatorUtils
                .filterBySymbolWord(page.locator("#pvd-policy-allocation-card .pvd-alloc-row"), symbol)
                .locator(".pvd-alloc-name");
    }

    public Locator riskSpectrumScale() {
        return page.locator(".pvd-rs-scale .pvd-rs-step");
    }

    public void switchToPvdMode() {
        pvdSubtabBtn().click();
        pvdScreen().waitFor();
    }

    public void switchToMarketMode() {
        marketSubtabBtn().click();
    }

    public void searchPolicies(String query) {
        searchInput().fill(query);
    }

    public void clearSearch() {
        Locator clearBtn = page.locator(".pvd-search-clear");
        if (clearBtn.isVisible()) {
            clearBtn.click();
        } else {
            searchInput().fill("");
        }
    }

    public void sortBy(String label) {
        sortButton(label).click();
    }

    public void sortDescending(String label) {
        Locator btn = sortButton(label);
        assertThat(btn).isVisible();
        String cls = btn.getAttribute("class");
        String dir = btn.getAttribute("data-sort-dir");
        if (cls != null && cls.contains("active") && "desc".equals(dir)) {
            return;
        }
        btn.click();
        assertThat(btn).hasAttribute("data-sort-dir", Pattern.compile("^(asc|desc)$"));
        if ("asc".equals(btn.getAttribute("data-sort-dir"))) {
            btn.click();
        }
        assertThat(btn).hasAttribute("data-sort-dir", "desc");
    }

    public int visiblePolicyCount() {
        return policyCards().count();
    }

    public List<String> visiblePolicyIds() {
        return policyCards().all().stream()
                .map(card -> card.getAttribute("id"))
                .toList();
    }

    public boolean isPvdModeActive() {
        String cls = pvdSubtabBtn().getAttribute("class");
        return cls != null && cls.contains("active");
    }

    public boolean isMarketModeActive() {
        String cls = marketSubtabBtn().getAttribute("class");
        return cls != null && cls.contains("active");
    }

    public Locator factsheetButton(String symbol) {
        return page.locator("#btn-pvd-factsheet-" + symbol);
    }

    public void openFactsheet(String symbol) {
        Locator btn = factsheetButton(symbol);
        btn.waitFor();
        btn.click();
    }
}
