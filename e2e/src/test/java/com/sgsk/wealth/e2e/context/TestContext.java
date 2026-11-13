package com.sgsk.wealth.e2e.context;

import com.microsoft.playwright.BrowserContext;
import com.microsoft.playwright.Page;
import io.cucumber.spring.ScenarioScope;
import io.restassured.response.Response;
import org.springframework.stereotype.Component;

@Component
@ScenarioScope
public class TestContext {
    private BrowserContext browserContext;
    private Page page;
    private Response lastApiResponse;
    private String downloadedFileName;

    public BrowserContext getBrowserContext() {
        return browserContext;
    }

    public void setBrowserContext(BrowserContext browserContext) {
        this.browserContext = browserContext;
    }

    public Page getPage() {
        return page;
    }

    public void setPage(Page page) {
        this.page = page;
    }

    public Response getLastApiResponse() {
        return lastApiResponse;
    }

    public void setLastApiResponse(Response lastApiResponse) {
        this.lastApiResponse = lastApiResponse;
    }

    public String getDownloadedFileName() {
        return downloadedFileName;
    }

    public void setDownloadedFileName(String downloadedFileName) {
        this.downloadedFileName = downloadedFileName;
    }
}
