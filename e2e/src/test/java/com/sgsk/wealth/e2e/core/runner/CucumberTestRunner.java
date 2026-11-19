package com.sgsk.wealth.e2e.core.runner;

import org.junit.platform.suite.api.ConfigurationParameter;
import org.junit.platform.suite.api.IncludeEngines;
import org.junit.platform.suite.api.SelectPackages;
import org.junit.platform.suite.api.Suite;

import static io.cucumber.junit.platform.engine.Constants.GLUE_PROPERTY_NAME;
import static io.cucumber.junit.platform.engine.Constants.PLUGIN_PROPERTY_NAME;

@Suite
@IncludeEngines("cucumber")
@SelectPackages("features")
@ConfigurationParameter(key = GLUE_PROPERTY_NAME, value = "com.sgsk.wealth.e2e")
@ConfigurationParameter(
        key = PLUGIN_PROPERTY_NAME,
        value = "pretty, com.sgsk.wealth.e2e.core.hooks.AllureStepEvidencePlugin, io.qameta.allure.cucumber8jvm.AllureCucumber8Jvm"
)
public class CucumberTestRunner {
}
