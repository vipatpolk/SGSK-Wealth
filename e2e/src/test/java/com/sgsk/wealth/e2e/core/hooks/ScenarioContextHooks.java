package com.sgsk.wealth.e2e.core.hooks;

import com.sgsk.wealth.e2e.core.context.TestContext;
import com.sgsk.wealth.e2e.core.context.TestContextHolder;
import io.cucumber.java.After;
import io.cucumber.java.Before;
import io.cucumber.java.Scenario;

public class ScenarioContextHooks {
    private final TestContext testContext;

    public ScenarioContextHooks(TestContext testContext) {
        this.testContext = testContext;
    }

    @Before(order = 0)
    public void bindScenarioContext(Scenario scenario) {
        testContext.setScenarioTags(scenario.getSourceTagNames());
        TestContextHolder.set(testContext);
    }

    @After(order = 0)
    public void clearScenarioContext() {
        TestContextHolder.clear();
    }
}
