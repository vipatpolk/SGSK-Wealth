package com.sgsk.wealth.e2e.core.hooks;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.microsoft.playwright.Page;
import com.sgsk.wealth.e2e.core.context.TestContext;
import com.sgsk.wealth.e2e.core.context.TestContextHolder;
import io.appium.java_client.AppiumDriver;
import io.cucumber.plugin.ConcurrentEventListener;
import io.cucumber.plugin.event.EventPublisher;
import io.cucumber.plugin.event.PickleStepTestStep;
import io.cucumber.plugin.event.Status;
import io.cucumber.plugin.event.TestStepFinished;
import io.qameta.allure.Allure;
import io.qameta.allure.AllureExternalKey;
import io.qameta.allure.AttachmentOptions;
import io.qameta.allure.cucumber8jvm.AllureCucumber8Jvm;
import io.restassured.http.Header;
import io.restassured.response.Response;
import org.openqa.selenium.OutputType;

import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;

/**
 * Cucumber plugin registered before {@code AllureCucumber8Jvm} so every executed Gherkin step
 * directly receives its own screenshot (Web / Mobile) or API response payload in the Allure report.
 */
public class AllureStepEvidencePlugin implements ConcurrentEventListener {
    private static final ObjectMapper JSON = new ObjectMapper().enable(SerializationFeature.INDENT_OUTPUT);
    private static final AttachmentOptions PNG_OPTIONS = AttachmentOptions.withFileExtension(".png");
    private static final AttachmentOptions JSON_OPTIONS = AttachmentOptions.withFileExtension(".json");

    @Override
    public void setEventPublisher(EventPublisher publisher) {
        publisher.registerHandlerFor(TestStepFinished.class, this::onTestStepFinished);
    }

    private void onTestStepFinished(TestStepFinished event) {
        if (!(event.getTestStep() instanceof PickleStepTestStep pickleStep)) {
            return;
        }
        Status status = event.getResult().getStatus();
        if (status == Status.SKIPPED || status == Status.UNDEFINED || status == Status.UNUSED) {
            return;
        }

        TestContext ctx = TestContextHolder.get();
        if (ctx == null) {
            return;
        }

        AllureExternalKey stepKey = AllureExternalKey.of(
                AllureCucumber8Jvm.class, "step", pickleStep.getId().toString());
        Set<String> tags = ctx.getScenarioTags();
        if (tags.contains("@mobile") && !tags.contains("@web")) {
            attachMobileStepScreenshot(stepKey, ctx);
        } else if (tags.contains("@web")) {
            attachPlaywrightScreenshot(stepKey, ctx.getPage(), "Web Step Screenshot");
        } else if (tags.contains("@api")) {
            attachApiStepResult(stepKey, ctx);
        } else if (ctx.getPage() != null) {
            attachPlaywrightScreenshot(stepKey, ctx.getPage(), "Web Step Screenshot");
        } else if (ctx.getLastApiResponse() != null) {
            attachApiStepResult(stepKey, ctx);
        }
    }

    private void attachMobileStepScreenshot(AllureExternalKey stepKey, TestContext ctx) {
        String platform = ctx.getMobilePlatform() != null ? ctx.getMobilePlatform().toUpperCase() : "MOBILE";
        AppiumDriver appiumDriver = ctx.getAppiumDriver();
        if (appiumDriver != null) {
            try {
                byte[] screenshot = appiumDriver.getScreenshotAs(OutputType.BYTES);
                attachPng(stepKey, "Mobile Step Screenshot (" + platform + " Appium)", screenshot);
            } catch (Exception ignored) {
            }
            return;
        }

        attachPlaywrightScreenshot(stepKey, ctx.getPage(), "Mobile Step Screenshot (" + platform + ")");
    }

    private void attachPlaywrightScreenshot(AllureExternalKey stepKey, Page page, String name) {
        if (page == null || page.isClosed()) {
            return;
        }
        try {
            byte[] screenshot = page.screenshot(new Page.ScreenshotOptions().setFullPage(true));
            attachPng(stepKey, name, screenshot);
        } catch (Exception ignored) {
        }
    }

    private void attachApiStepResult(AllureExternalKey stepKey, TestContext ctx) {
        Response response = ctx.getLastApiResponse();
        try {
            if (response != null) {
                Map<String, Object> payload = new LinkedHashMap<>();
                payload.put("statusCode", response.getStatusCode());
                payload.put("statusLine", response.getStatusLine());
                payload.put("responseTimeMs", response.getTime());

                Map<String, String> headers = new LinkedHashMap<>();
                for (Header h : response.getHeaders()) {
                    String name = h.getName();
                    boolean sensitive = "x-api-key".equalsIgnoreCase(name)
                            || "authorization".equalsIgnoreCase(name)
                            || "set-cookie".equalsIgnoreCase(name);
                    headers.put(name, sensitive ? "***" : h.getValue());
                }
                payload.put("headers", headers);

                String rawBody = response.getBody() != null ? response.getBody().asString() : "";
                if (!rawBody.isBlank()) {
                    try {
                        JsonNode parsed = JSON.readTree(rawBody);
                        payload.put("body", parsed);
                    } catch (Exception nonJson) {
                        payload.put("body", rawBody);
                    }
                } else {
                    payload.put("body", "");
                }

                attachJson(stepKey, "API Response (HTTP " + response.getStatusCode() + ")", JSON.writeValueAsString(payload));
                return;
            }

            if (ctx.getSimulationInitialPosition() != null) {
                attachJson(stepKey, "API Step Input State", JSON.writeValueAsString(ctx.getSimulationInitialPosition()));
            }
        } catch (Exception ignored) {
        }
    }

    private void attachPng(AllureExternalKey stepKey, String name, byte[] bytes) {
        Allure.getLifecycle().addAttachment(stepKey, name, "image/png", new ByteArrayInputStream(bytes), PNG_OPTIONS);
    }

    private void attachJson(AllureExternalKey stepKey, String name, String json) {
        Allure.getLifecycle().addAttachment(
                stepKey,
                name,
                "application/json",
                new ByteArrayInputStream(json.getBytes(StandardCharsets.UTF_8)),
                JSON_OPTIONS
        );
    }
}
