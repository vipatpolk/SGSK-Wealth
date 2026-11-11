package com.sgsk.wealth.e2e.pages;

import com.microsoft.playwright.Locator;
import com.microsoft.playwright.Page;

import java.util.regex.Pattern;

public class DividendPage {
    private final Page page;
    public final Locator summaryCards;
    public final Locator assetCards;
    public final Locator chartCard;
    public final Locator chartLegend;

    public DividendPage(Page page) {
        this.page = page;
        this.summaryCards = page.locator(".div-summary-card");
        this.assetCards = page.locator(".div-asset-card");
        this.chartCard = page.locator(".div-chart-card");
        this.chartLegend = page.locator(".div-chart-card .div-legend");
    }

    public Locator getYocSummaryCard() {
        return summaryCards.nth(2);
    }

    public Locator getYocSummaryValue() {
        return getYocSummaryCard().locator(".div-summary-value");
    }

    public Locator getAssetCardByName(String assetName) {
        Pattern pattern = Pattern.compile(assetName, Pattern.CASE_INSENSITIVE);
        return assetCards.filter(new Locator.FilterOptions().setHasText(pattern));
    }

    public void filterByAssetType(String assetType) {
        page.locator(".global-pill-btn", new Page.LocatorOptions().setHasText(assetType)).click();
    }
}
