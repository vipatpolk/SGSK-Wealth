package com.sgsk.wealth.e2e.core.support;

import com.sgsk.wealth.e2e.core.config.E2eProperties;
import jakarta.annotation.PreDestroy;
import org.springframework.stereotype.Component;

import java.io.File;
import java.io.IOException;
import java.net.HttpURLConnection;
import java.net.URI;
import java.net.URL;

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
        if (isHttpEndpointAvailable(defaultBackendUrl + "/")) {
            backendBaseUrl = defaultBackendUrl;
            return backendBaseUrl;
        }

        try {
            if (mockBackendServer != null) {
                mockBackendServer.stop();
            }
            mockBackendServer = new MockBackendServer();
            mockBackendServer.start(properties.backend().port());
            backendBaseUrl = "http://127.0.0.1:" + mockBackendServer.getPort() + "/api/backend";
            return backendBaseUrl;
        } catch (IOException e) {
            throw new RuntimeException("Failed to start mock backend server", e);
        }
    }

    public synchronized String ensureFrontendServer() {
        frontendBaseUrl = properties.frontend().baseUrl();

        if (isHttpEndpointAvailable(frontendBaseUrl) || isHttpEndpointAvailable("http://localhost:4200")) {
            return frontendBaseUrl;
        }

        File webDir = resolveWorkspaceDir("web", "frontend");
        if (webDir != null) {
            frontendProcess = startAngularServer(webDir, "4200", frontendBaseUrl, "http://localhost:4200");
        }
        return frontendBaseUrl;
    }

    public synchronized String ensureMobileServer() {
        mobileBaseUrl = properties.mobile().baseUrl();

        if (isHttpEndpointAvailable(mobileBaseUrl) || isHttpEndpointAvailable("http://localhost:4201")) {
            return mobileBaseUrl;
        }

        File mobileDir = resolveWorkspaceDir("mobile");
        if (mobileDir != null) {
            mobileProcess = startAngularServer(mobileDir, "4201", mobileBaseUrl, "http://localhost:4201");
        }
        return mobileBaseUrl;
    }

    private File resolveWorkspaceDir(String... candidates) {
        for (String name : candidates) {
            File parentRelative = new File("../" + name);
            if (parentRelative.exists() && new File(parentRelative, "angular.json").exists()) {
                return parentRelative;
            }
            File direct = new File(name);
            if (direct.exists() && new File(direct, "angular.json").exists()) {
                return direct;
            }
        }
        return null;
    }

    private Process startAngularServer(File dir, String port, String primaryUrl, String fallbackUrl) {
        try {
            boolean isWindows = System.getProperty("os.name").toLowerCase().contains("win");
            ProcessBuilder pb = isWindows
                    ? new ProcessBuilder("cmd.exe", "/c", "npx", "ng", "serve", "--host", "127.0.0.1", "--port", port)
                    : new ProcessBuilder("npx", "ng", "serve", "--host", "127.0.0.1", "--port", port);
            pb.directory(dir);
            pb.redirectOutput(ProcessBuilder.Redirect.DISCARD);
            pb.redirectError(ProcessBuilder.Redirect.DISCARD);
            Process process = pb.start();

            for (int i = 0; i < 60; i++) {
                Thread.sleep(1000);
                if (isHttpEndpointAvailable(primaryUrl) || isHttpEndpointAvailable(fallbackUrl)) {
                    break;
                }
            }
            return process;
        } catch (Exception ignored) {
            return null;
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
