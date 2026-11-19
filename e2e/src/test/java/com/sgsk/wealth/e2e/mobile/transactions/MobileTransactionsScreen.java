package com.sgsk.wealth.e2e.mobile.transactions;

import com.sgsk.wealth.e2e.mobile.common.MobileDriverBridge;
import io.cucumber.spring.ScenarioScope;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.ScopedProxyMode;
import org.springframework.stereotype.Component;

import java.util.Locale;

@Component
@ScenarioScope(proxyMode = ScopedProxyMode.NO)
public class MobileTransactionsScreen {
    private final MobileDriverBridge driver;

    @Autowired
    public MobileTransactionsScreen(MobileDriverBridge driver) {
        this.driver = driver;
    }

    public void openTransactionSymbolSelector() {
        driver.tap("#mobile-tx-selector-btn");
        driver.waitForVisible("[data-tx-sheet-symbol]");
    }

    public void selectTransactionSymbolFromSheet(String symbol) {
        driver.tap("[data-tx-sheet-symbol='" + symbol + "']");
    }

    public void clearTransactionSymbolFilter() {
        driver.tap("#mobile-tx-clear-sym");
    }

    public void filterTransactionsByType(String type) {
        String id = switch (type.trim().toLowerCase(Locale.ROOT)) {
            case "buy" -> "#mobile-tx-type-buy";
            case "sell" -> "#mobile-tx-type-sell";
            case "exchange" -> "#mobile-tx-type-exchange";
            default -> "#mobile-tx-type-all";
        };
        driver.tap(id);
    }

    public void toggleTransactionsSortOrder() {
        driver.tap("#mobile-tx-sort-btn");
    }
}
