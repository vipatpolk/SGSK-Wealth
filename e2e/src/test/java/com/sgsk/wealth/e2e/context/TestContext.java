package com.sgsk.wealth.e2e.context;

import com.microsoft.playwright.BrowserContext;
import com.microsoft.playwright.Page;
import io.appium.java_client.AppiumDriver;
import io.cucumber.spring.ScenarioScope;
import io.restassured.response.Response;
import org.springframework.stereotype.Component;

import java.util.Collection;
import java.util.LinkedHashSet;
import java.util.Map;
import java.util.Set;

@Component
@ScenarioScope
public class TestContext {
    private BrowserContext browserContext;
    private Page page;
    private AppiumDriver appiumDriver;
    private Response lastApiResponse;
    private String downloadedFileName;
    private String mobilePlatform = "ANDROID";
    private Set<String> scenarioTags = Set.of();
    private Map<String, Object> simulationInitialPosition;

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

    public AppiumDriver getAppiumDriver() {
        return appiumDriver;
    }

    public void setAppiumDriver(AppiumDriver appiumDriver) {
        this.appiumDriver = appiumDriver;
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

    public String getMobilePlatform() {
        return mobilePlatform;
    }

    public void setMobilePlatform(String mobilePlatform) {
        this.mobilePlatform = mobilePlatform != null ? mobilePlatform : "ANDROID";
    }

    public Set<String> getScenarioTags() {
        return scenarioTags;
    }

    public void setScenarioTags(Collection<String> scenarioTags) {
        this.scenarioTags = scenarioTags != null ? Set.copyOf(new LinkedHashSet<>(scenarioTags)) : Set.of();
    }

    public Map<String, Object> getSimulationInitialPosition() {
        return simulationInitialPosition;
    }

    public void setSimulationInitialPosition(Map<String, Object> simulationInitialPosition) {
        this.simulationInitialPosition = simulationInitialPosition;
    }
}
