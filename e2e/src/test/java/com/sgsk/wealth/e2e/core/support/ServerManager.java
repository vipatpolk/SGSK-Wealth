package com.sgsk.wealth.e2e.core.support;

import com.sgsk.wealth.e2e.core.config.E2eProperties;
import jakarta.annotation.PreDestroy;
import org.springframework.stereotype.Component;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URI;
import java.net.URL;
import java.nio.charset.StandardCharsets;

@Component
public class ServerManager {
    private final E2eProperties properties;
    private MockBackendServer mockBackendServer;
    private Process frontendProcess;
    private Process mobileProcess;
    private String backendBaseUrl;
    private String frontendBaseUrl;
    private String mobileBaseUrl;

    public ServerManager(E2eProperties properties) {
        this.properties = properties;
        this.frontendBaseUrl = properties.frontend().baseUrl();
        this.mobileBaseUrl = properties.mobile().baseUrl();
        Runtime.getRuntime().addShutdownHook(new Thread(this::stopServers));
    }

    public synchronized String ensureBackendServer() {
        if (backendBaseUrl != null && isHttpEndpointAvailable(backendBaseUrl)) {
            return backendBaseUrl;
        }

        String configuredBackend = properties.backend().baseUrl();
        if (configuredBackend != null && !configuredBackend.isBlank()) {
            backendBaseUrl = configuredBackend;
            return backendBaseUrl;
        }

        String defaultBackendUrl = properties.backend().defaultUrl();
        if (isCompatibleBackendAvailable(defaultBackendUrl)) {
            backendBaseUrl = defaultBackendUrl;
            return backendBaseUrl;
        }

        try {
            if (mockBackendServer != null) {
                mockBackendServer.stop();
            }
            mockBackendServer = new MockBackendServer();
            mockBackendServer.start(properties.backend().port());
            backendBaseUrl = resolveBackendMockBaseUrl(mockBackendServer.getPort());
            return backendBaseUrl;
        } catch (IOException e) {
            throw new RuntimeException("Failed to start mock backend server", e);
        }
    }

    public synchronized String ensureFrontendServer() {
        frontendBaseUrl = properties.frontend().baseUrl();
        String fallbackUrl = alternateLoopbackUrl(frontendBaseUrl);

        if (isHttpEndpointAvailable(frontendBaseUrl)) {
            return frontendBaseUrl;
        }
        if (!fallbackUrl.equals(frontendBaseUrl) && isHttpEndpointAvailable(fallbackUrl)) {
            frontendBaseUrl = fallbackUrl;
            return frontendBaseUrl;
        }

        File webDir = resolveWorkspaceDir("apps/web", "web", "frontend");
        if (webDir != null) {
            frontendProcess = startWebServer(
                    webDir,
                    resolvePort(frontendBaseUrl, String.valueOf(4200)),
                    frontendBaseUrl,
                    fallbackUrl
            );
            if (!isHttpEndpointAvailable(frontendBaseUrl)
                    && !fallbackUrl.equals(frontendBaseUrl)
                    && isHttpEndpointAvailable(fallbackUrl)) {
                frontendBaseUrl = fallbackUrl;
            }
        }
        return frontendBaseUrl;
    }

    public synchronized String ensureMobileServer() {
        mobileBaseUrl = properties.mobile().baseUrl();
        String fallbackUrl = alternateLoopbackUrl(mobileBaseUrl);

        if (isHttpEndpointAvailable(mobileBaseUrl)) {
            return mobileBaseUrl;
        }
        if (!fallbackUrl.equals(mobileBaseUrl) && isHttpEndpointAvailable(fallbackUrl)) {
            mobileBaseUrl = fallbackUrl;
            return mobileBaseUrl;
        }

        return ensureFrontendServer();
    }

    private File resolveWorkspaceDir(String... candidates) {
        for (String name : candidates) {
            File parentRelative = new File("../" + name);
            if (parentRelative.exists() && (new File(parentRelative, "nuxt.config.ts").exists()
                    || new File(parentRelative, "package.json").exists()
                    || new File(parentRelative, "angular.json").exists())) {
                return parentRelative;
            }
            File direct = new File(name);
            if (direct.exists() && (new File(direct, "nuxt.config.ts").exists()
                    || new File(direct, "package.json").exists()
                    || new File(direct, "angular.json").exists())) {
                return direct;
            }
        }
        return null;
    }

    private Process startWebServer(File dir, String port, String primaryUrl, String fallbackUrl) {
        try {
            String host = resolveHost(primaryUrl, "127.0.0.1");
            boolean isWindows = System.getProperty("os.name").toLowerCase().contains("win");
            ProcessBuilder pb = isWindows
                    ? new ProcessBuilder("cmd.exe", "/c", "npm", "run", "dev", "--", "--host", host, "--port", port)
                    : new ProcessBuilder("npm", "run", "dev", "--", "--host", host, "--port", port);
            pb.directory(dir);
            pb.redirectOutput(ProcessBuilder.Redirect.DISCARD);
            pb.redirectError(ProcessBuilder.Redirect.DISCARD);
            Process process = pb.start();

            for (int i = 0; i < 60; i++) {
                Thread.sleep(1000);
                if (isHttpEndpointAvailable(primaryUrl)
                        || (!fallbackUrl.equals(primaryUrl) && isHttpEndpointAvailable(fallbackUrl))) {
                    break;
                }
            }
            return process;
        } catch (Exception ignored) {
            return null;
        }
    }

    private String resolveBackendMockBaseUrl(int port) {
        String defaultUrl = properties.backend().defaultUrl();
        try {
            URI uri = URI.create(defaultUrl);
            String scheme = (uri.getScheme() != null && !uri.getScheme().isBlank()) ? uri.getScheme() : "http";
            String host = (uri.getHost() != null && !uri.getHost().isBlank()) ? uri.getHost() : "127.0.0.1";
            return scheme + "://" + host + ":" + port + "/api/backend";
        } catch (Exception ignored) {
            return "http" + "://127.0.0.1:" + port + "/api/backend";
        }
    }

    private String resolveHost(String urlString, String fallbackHost) {
        try {
            String host = URI.create(urlString).getHost();
            return (host != null && !host.isBlank()) ? host : fallbackHost;
        } catch (Exception ignored) {
            return fallbackHost;
        }
    }

    private String resolvePort(String urlString, String fallbackPort) {
        try {
            URI uri = URI.create(urlString);
            if (uri.getPort() > 0) {
                return String.valueOf(uri.getPort());
            }
            if ("https".equalsIgnoreCase(uri.getScheme())) {
                return "443";
            }
            if ("http".equalsIgnoreCase(uri.getScheme())) {
                return "80";
            }
        } catch (Exception ignored) {
        }
        return fallbackPort;
    }

    private String alternateLoopbackUrl(String urlString) {
        try {
            URI uri = URI.create(urlString);
            String host = uri.getHost();
            String altHost = null;
            if ("127.0.0.1".equals(host)) {
                altHost = "localhost";
            } else if ("localhost".equalsIgnoreCase(host)) {
                altHost = "127.0.0.1";
            }
            if (altHost != null) {
                return new URI(
                        uri.getScheme(),
                        uri.getUserInfo(),
                        altHost,
                        uri.getPort(),
                        uri.getPath(),
                        uri.getQuery(),
                        uri.getFragment()
                ).toString();
            }
        } catch (Exception ignored) {
        }
        return urlString;
    }

    private String resolveOwnerBearerToken() {
        String prop = System.getProperty("e2e.auth.bearer");
        if (prop != null && !prop.isBlank()) {
            return prop.trim();
        }
        String env = System.getenv("E2E_AUTH_BEARER");
        return (env != null && !env.isBlank()) ? env.trim() : MockBackendServer.VALID_OWNER_TOKEN;
    }

    private boolean isCompatibleBackendAvailable(String baseUrl) {
        if (baseUrl == null || baseUrl.isBlank()) {
            return false;
        }
        HttpURLConnection conn = null;
        try {
            String normalizedBaseUrl = baseUrl.replaceAll("/+$", "");
            URL url = URI.create(normalizedBaseUrl + "/auth/me").toURL();
            conn = (HttpURLConnection) url.openConnection();
            conn.setConnectTimeout(800);
            conn.setReadTimeout(800);
            conn.setRequestMethod("GET");
            conn.setRequestProperty("X-API-Key", properties.backend().apiKey());
            conn.setRequestProperty("Authorization", "Bearer " + resolveOwnerBearerToken());
            if (conn.getResponseCode() != HttpURLConnection.HTTP_OK) {
                return false;
            }
            try (InputStream in = conn.getInputStream()) {
                String body = new String(in.readAllBytes(), StandardCharsets.UTF_8);
                return body.replaceAll("\\s+", "").contains("\"canViewCloudPortfolio\":true");
            }
        } catch (Exception e) {
            return false;
        } finally {
            if (conn != null) {
                conn.disconnect();
            }
        }
    }

    public boolean isHttpEndpointAvailable(String urlString) {
        try {
            URL url = URI.create(urlString).toURL();
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setConnectTimeout(800);
            conn.setReadTimeout(800);
            conn.setRequestMethod("GET");
            int responseCode = conn.getResponseCode();
            return responseCode > 0;
        } catch (Exception e) {
            return false;
        }
    }

    @PreDestroy
    public synchronized void stopServers() {
        if (mockBackendServer != null) {
            mockBackendServer.stop();
            mockBackendServer = null;
        }
        terminateProcess(frontendProcess);
        frontendProcess = null;
        terminateProcess(mobileProcess);
        mobileProcess = null;
    }

    private void terminateProcess(Process process) {
        if (process == null) return;
        try {
            boolean isWindows = System.getProperty("os.name").toLowerCase().contains("win");
            if (isWindows) {
                new ProcessBuilder("taskkill", "/pid", String.valueOf(process.pid()), "/T", "/F").start().waitFor();
            } else {
                process.destroyForcibly();
            }
        } catch (Exception ignored) {
        }
    }
}
