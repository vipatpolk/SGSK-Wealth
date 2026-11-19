package com.sgsk.wealth.e2e.mobile.dividends;

import com.sgsk.wealth.e2e.mobile.common.MobileDriverBridge;
import io.cucumber.spring.ScenarioScope;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.ScopedProxyMode;
import org.springframework.stereotype.Component;

@Component
@ScenarioScope(proxyMode = ScopedProxyMode.NO)
public class MobileDividendsScreen {
    private final MobileDriverBridge driver;

    @Autowired
    public MobileDividendsScreen(MobileDriverBridge driver) {
        this.driver = driver;
    }

    public void filterDividendsByAsset(String assetType) {
        driver.tap("[data-div-asset='" + assetType + "']");
    }

    public void tapFirstDividendMonthBar() {
        driver.tapFirst("#mobile-div-monthly-chart .div-bar-col");
    }

    public void openFirstDividendSymbolLedger() {
        driver.tapFirst("[data-div-ledger-symbol]");
        driver.waitForVisible("#mobile-div-ledger-close");
    }

    public void closeDividendSymbolLedger() {
        driver.tap("#mobile-div-ledger-close");
    }
}
