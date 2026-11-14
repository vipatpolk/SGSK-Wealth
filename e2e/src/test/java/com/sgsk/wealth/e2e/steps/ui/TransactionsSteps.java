package com.sgsk.wealth.e2e.steps.ui;

import com.microsoft.playwright.Download;
import com.sgsk.wealth.e2e.context.TestContext;
import com.sgsk.wealth.e2e.pages.TransactionsPage;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;
import org.junit.jupiter.api.Assertions;

import java.util.regex.Pattern;

import static com.microsoft.playwright.assertions.PlaywrightAssertions.assertThat;

public class TransactionsSteps {
    private final TestContext context;
    private final TransactionsPage transactionsPage;

    public TransactionsSteps(TestContext context, TransactionsPage transactionsPage) {
        this.context = context;
        this.transactionsPage = transactionsPage;
    }

    @Then("the transaction history ledger should contain {string}")
    public void verifyTransactionLedgerContains(String text) {
        assertThat(transactionsPage.container).containsText(text);
    }

    @When("I trigger CSV export of all transactions")
    public void triggerCsvExport() {
        triggerCsvExportByScope("all");
    }

    @When("I trigger CSV export for {string} transactions")
    public void triggerCsvExportByScope(String scope) {
        assertThat(transactionsPage.exportCsvTriggerBtn).isVisible();
        Download download = "open".equalsIgnoreCase(scope.trim())
                ? transactionsPage.exportOpenPositionsTransactions()
                : transactionsPage.exportAllTransactions();
        context.setDownloadedFileName(download.suggestedFilename());
    }

    @When("I filter transactions to symbol {string}")
    public void filterTransactionsToSymbol(String symbol) {
        transactionsPage.selectSymbolFilter(symbol);
    }

    @When("I reset transactions to all symbols")
    public void resetTransactionsToAllSymbols() {
        transactionsPage.clearSymbolSelection();
    }

    @When("I browse the transaction symbol selector")
    public void browseTransactionSymbolSelector() {
        transactionsPage.openSymbolDropdown();
    }

    @Then("the symbol hero card should be visible")
    public void verifySymbolHeroCardVisible() {
        assertThat(transactionsPage.symbolHeroCard).isVisible();
    }

    @Then("the symbol hero card should be hidden")
    public void verifySymbolHeroCardHidden() {
        assertThat(transactionsPage.symbolHeroCard).isHidden();
    }

    @Then("the symbol hero card should display {string}")
    public void verifySymbolHeroCardDisplays(String text) {
        assertThat(transactionsPage.symbolHeroCard).isVisible();
        assertThat(transactionsPage.symbolHeroCard).containsText(text);
    }

    @Then("the symbol selector should list {string}")
    public void verifySymbolSelectorLists(String symbol) {
        assertThat(transactionsPage.symbolDropdownMenu).containsText(symbol);
    }

    @Then("the symbol selector should exclude {string}")
    public void verifySymbolSelectorExcludes(String symbol) {
        assertThat(transactionsPage.symbolDropdownMenu).not().containsText(symbol);
    }

    @Then("the downloaded file name should match the pattern {string}")
    public void verifyDownloadedFileNamePattern(String patternStr) {
        String fileName = context.getDownloadedFileName();
        Assertions.assertNotNull(fileName, "Downloaded file name should not be null");
        Pattern pattern = Pattern.compile(patternStr, Pattern.CASE_INSENSITIVE);
        Assertions.assertTrue(pattern.matcher(fileName).find(), "File name '" + fileName + "' does not match pattern: " + patternStr);
    }
}
