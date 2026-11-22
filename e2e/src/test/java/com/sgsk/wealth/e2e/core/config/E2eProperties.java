package com.sgsk.wealth.e2e.core.config;

import java.net.URI;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "e2e")
public record E2eProperties(
        Frontend frontend,
        Backend backend,
        PlaywrightConfig playwright,
        SupabaseConfig supabase,
        MobileConfig mobile
) {
    public E2eProperties {
        frontend = frontend != null ? frontend : new Frontend("http://127.0.0.1:4200");
        backend = backend != null ? backend : new Backend("", "http://127.0.0.1:8000", 8000, "dev_secret_key_change_in_prod");
        playwright = playwright != null ? playwright : new PlaywrightConfig(true);
        supabase = supabase != null ? supabase : new SupabaseConfig("https://jjdnxifgpbdvntfwhyzz.supabase.co");
        mobile = mobile != null ? mobile : new MobileConfig(
                "http://127.0.0.1:4723",
                "ANDROID",
                "Pixel_8_API_35",
                "15",
                "",
                "com.sgsk.wealth.mobile",
                ".MainActivity",
                "com.sgsk.wealth.mobile",
                "http://127.0.0.1:4201",
                true,
                true
        );
    }

    public record Frontend(String baseUrl) {
        public Frontend {
            if (baseUrl == null || baseUrl.isBlank()) {
                baseUrl = "http://127.0.0.1:4200";
            }
        }
    }

    public record Backend(String baseUrl, String defaultUrl, int port, String apiKey) {
        public Backend {
            if (baseUrl == null) {
                baseUrl = "";
            }
            if (defaultUrl == null || defaultUrl.isBlank()) {
                defaultUrl = "http://127.0.0.1:8000";
            }
            if (port <= 0) {
                port = 8000;
            }
            if (apiKey == null || apiKey.isBlank()) {
                apiKey = "dev_secret_key_change_in_prod";
            }
        }
    }

    public record PlaywrightConfig(boolean headless) {
    }

    public record SupabaseConfig(String url) {
        public SupabaseConfig {
            if (url == null || url.isBlank()) {
                url = "https://jjdnxifgpbdvntfwhyzz.supabase.co";
            }
        }

        public String normalizedUrl() {
            return url.trim().replaceAll("/+$", "");
        }

        public String routeGlob() {
            return normalizedUrl() + "/**";
        }

        public String projectRef() {
            String host = URI.create(normalizedUrl()).getHost();
            if (host == null || host.isBlank()) {
                return "";
            }
            int dot = host.indexOf('.');
            return dot > 0 ? host.substring(0, dot) : host;
        }
    }

    public record MobileConfig(
            String appiumUrl,
            String platform,
            String deviceName,
            String platformVersion,
            String appPath,
            String appPackage,
            String appActivity,
            String bundleId,
            String baseUrl,
            boolean autoWebview,
            boolean fallbackToLocalWebview
    ) {
        public MobileConfig {
            if (appiumUrl == null || appiumUrl.isBlank()) appiumUrl = "http://127.0.0.1:4723";
            if (platform == null || platform.isBlank()) platform = "ANDROID";
            if (deviceName == null || deviceName.isBlank()) deviceName = "Pixel_8_API_35";
            if (platformVersion == null || platformVersion.isBlank()) platformVersion = "15";
            if (appPath == null) appPath = "";
            if (appPackage == null || appPackage.isBlank()) appPackage = "com.sgsk.wealth.mobile";
            if (appActivity == null || appActivity.isBlank()) appActivity = ".MainActivity";
            if (bundleId == null || bundleId.isBlank()) bundleId = "com.sgsk.wealth.mobile";
            if (baseUrl == null || baseUrl.isBlank()) baseUrl = "http://127.0.0.1:4201";
        }
    }
}
