package com.sgsk.wealth.e2e.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "e2e")
public record E2eProperties(
        Frontend frontend,
        Backend backend,
        PlaywrightConfig playwright
) {
    public E2eProperties {
        frontend = frontend != null ? frontend : new Frontend("http://127.0.0.1:4200");
        backend = backend != null ? backend : new Backend("", "http://127.0.0.1:8000", 8000, "dev_secret_key_change_in_prod");
        playwright = playwright != null ? playwright : new PlaywrightConfig(true);
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
}
