package com.sgsk.wealth.e2e.mobile.analytics;

import com.sgsk.wealth.e2e.mobile.common.MobileDriverBridge;
import io.cucumber.spring.ScenarioScope;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.ScopedProxyMode;
import org.springframework.stereotype.Component;

import java.util.Locale;

@Component
@ScenarioScope(proxyMode = ScopedProxyMode.NO)
public class MobileAnalyticsScreen {
    private final MobileDriverBridge driver;

    @Autowired
    public MobileAnalyticsScreen(MobileDriverBridge driver) {
        this.driver = driver;
    }

    public void selectAnalyticsSegment(String segment) {
        String id = switch (segment.trim().toLowerCase(Locale.ROOT)) {
            case "allocation" -> "#mobile-analytics-allocation";
            case "performance" -> "#mobile-analytics-performance";
            default -> "#mobile-analytics-overview";
        };
        driver.tap(id);
    }

    public void drillDownAllocationClass(String assetClass) {
        driver.tap("[data-alloc-class='" + assetClass + "']");
    }

    public void resetAllocationDrilldown() {
        driver.tap("#mobile-alloc-reset-btn");
    }

    public void selectPerformanceTimeframe(String timeframe) {
        driver.tap("[data-timeframe='" + timeframe.trim().toUpperCase(Locale.ROOT) + "']");
    }
}
