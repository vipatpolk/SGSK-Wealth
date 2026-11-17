package com.sgsk.wealth.e2e.support;

import com.sgsk.wealth.e2e.config.E2eProperties;
import io.appium.java_client.AppiumDriver;
import io.appium.java_client.android.AndroidDriver;
import io.appium.java_client.android.options.UiAutomator2Options;
import io.appium.java_client.ios.IOSDriver;
import io.appium.java_client.ios.options.XCUITestOptions;
import io.appium.java_client.remote.SupportsContextSwitching;
import org.springframework.stereotype.Component;

import java.net.HttpURLConnection;
import java.net.URI;
import java.net.URL;
import java.time.Duration;
import java.util.Set;

@Component
public class AppiumManager {
    private final E2eProperties properties;

    public AppiumManager(E2eProperties properties) {
        this.properties = properties;
    }

    public boolean isAppiumServerAvailable() {
        String appiumUrl = properties.mobile().appiumUrl();
        try {
            String statusEndpoint = appiumUrl.endsWith("/") ? appiumUrl + "status" : appiumUrl + "/status";
            URL url = URI.create(statusEndpoint).toURL();
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setConnectTimeout(1000);
            conn.setReadTimeout(1000);
            conn.setRequestMethod("GET");
            return conn.getResponseCode() == 200;
        } catch (Exception e) {
            return false;
        }
    }

    public AppiumDriver createMobileDriver() {
        E2eProperties.MobileConfig mobile = properties.mobile();
        try {
            URL serverUrl = URI.create(mobile.appiumUrl()).toURL();
            AppiumDriver driver;

            if ("IOS".equalsIgnoreCase(mobile.platform())) {
                XCUITestOptions options = new XCUITestOptions()
                        .setDeviceName(mobile.deviceName())
                        .setPlatformVersion(mobile.platformVersion())
                        .setAutoAcceptAlerts(true)
                        .setNewCommandTimeout(Duration.ofSeconds(120));
                if (!mobile.appPath().isBlank()) {
                    options.setApp(mobile.appPath());
                } else {
                    options.setBundleId(mobile.bundleId());
                }
                if (mobile.autoWebview()) {
                    options.setCapability("appium:autoWebview", true);
                }
                driver = new IOSDriver(serverUrl, options);
            } else {
                UiAutomator2Options options = new UiAutomator2Options()
                        .setDeviceName(mobile.deviceName())
                        .setPlatformVersion(mobile.platformVersion())
                        .setAutoGrantPermissions(true)
                        .setNewCommandTimeout(Duration.ofSeconds(120));
                if (!mobile.appPath().isBlank()) {
                    options.setApp(mobile.appPath());
                } else {
                    options.setAppPackage(mobile.appPackage());
                    options.setAppActivity(mobile.appActivity());
                }
                if (mobile.autoWebview()) {
                    options.setAutoWebview(true);
                }
                options.setCapability("appium:chromedriverAutodownload", true);
                driver = new AndroidDriver(serverUrl, options);
            }

            if (mobile.autoWebview()) {
                switchToCapacitorWebView(driver);
            }
            return driver;
        } catch (Exception e) {
            throw new RuntimeException("Failed to initialize AppiumDriver for platform " + mobile.platform(), e);
        }
    }

    public void switchToCapacitorWebView(AppiumDriver driver) {
        if (!(driver instanceof SupportsContextSwitching contextDriver)) {
            return;
        }
        Set<String> contexts = contextDriver.getContextHandles();
        for (String ctx : contexts) {
            if (ctx.contains("WEBVIEW")) {
                contextDriver.context(ctx);
                return;
            }
        }
    }
}
