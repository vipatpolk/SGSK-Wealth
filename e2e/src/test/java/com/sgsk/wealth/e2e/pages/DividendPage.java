package com.sgsk.wealth.e2e.pages;

import com.microsoft.playwright.Locator;
import com.microsoft.playwright.Page;
import com.sgsk.wealth.e2e.context.TestContext;
import io.cucumber.spring.ScenarioScope;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.ScopedProxyMode;
import org.springframework.stereotype.Component;

import java.util.regex.Pattern;

@Component
@ScenarioScope(proxyMode = ScopedProxyMode.NO)
public class DividendPage {
    private final Page page;
    public final Locator summaryCards;
    public final Locator assetCards;
    public final Locator chartCard;
    public final Locator chartLegend;

    @Autowired
    public DividendPage(TestContext testContext) {
        this(testContext.getPage());
    }

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

    public Locator getNetDividendsCard() {
        return summaryCards.nth(0);
    }

    public Locator getYearPill(String yearLabel) {
        return page.locator(".year-pills .year-pill-btn", new Page.LocatorOptions().setHasText(yearLabel));
    }

    public void selectYearFilter(String yearLabel) {
        getYearPill(yearLabel).click();
    }
}
