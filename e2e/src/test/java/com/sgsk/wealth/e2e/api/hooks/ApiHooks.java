package com.sgsk.wealth.e2e.api.hooks;

import com.sgsk.wealth.e2e.core.support.ServerManager;
import io.cucumber.java.Before;
import io.qameta.allure.restassured.AllureRestAssured;
import io.restassured.RestAssured;

public class ApiHooks {
    private final ServerManager serverManager;

    public ApiHooks(ServerManager serverManager) {
        this.serverManager = serverManager;
    }

    @Before("@api")
    public void setupApiScenario() {
        String baseUrl = serverManager.ensureBackendServer();
        RestAssured.baseURI = baseUrl;
        RestAssured.replaceFiltersWith(new AllureRestAssured());
    }
}
