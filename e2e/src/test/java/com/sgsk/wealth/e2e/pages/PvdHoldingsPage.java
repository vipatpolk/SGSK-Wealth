package com.sgsk.wealth.e2e.pages;

import com.microsoft.playwright.Locator;
import com.microsoft.playwright.Page;
import com.sgsk.wealth.e2e.context.TestContext;
import io.cucumber.spring.ScenarioScope;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.ScopedProxyMode;
import org.springframework.stereotype.Component;

import java.util.List;

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
        String cls = btn.getAttribute("class");
        String text = btn.innerText();
        if (cls != null && cls.contains("active") && text.contains("↓")) {
            return;
        }
        btn.click();
        if (!btn.innerText().contains("↓")) {
            btn.click();
        }
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
}
