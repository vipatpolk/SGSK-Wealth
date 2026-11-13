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
        assertThat(transactionsPage.exportCsvTriggerBtn).isVisible();
        Download download = transactionsPage.exportAllTransactions();
        context.setDownloadedFileName(download.suggestedFilename());
    }

    @Then("the downloaded file name should match the pattern {string}")
    public void verifyDownloadedFileNamePattern(String patternStr) {
        String fileName = context.getDownloadedFileName();
        Assertions.assertNotNull(fileName, "Downloaded file name should not be null");
        Pattern pattern = Pattern.compile(patternStr, Pattern.CASE_INSENSITIVE);
        Assertions.assertTrue(pattern.matcher(fileName).find(), "File name '" + fileName + "' does not match pattern: " + patternStr);
    }
}
