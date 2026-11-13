package com.sgsk.wealth.e2e.support;

import com.sgsk.wealth.e2e.config.E2eProperties;
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
    private String backendBaseUrl;
    private String frontendBaseUrl;

    public ServerManager(E2eProperties properties) {
        this.properties = properties;
        this.frontendBaseUrl = properties.frontend().baseUrl();
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

        File frontendDir = new File("../frontend");
        if (!frontendDir.exists()) {
            frontendDir = new File("frontend");
        }

        if (frontendDir.exists()) {
            try {
                boolean isWindows = System.getProperty("os.name").toLowerCase().contains("win");
                ProcessBuilder pb;
                if (isWindows) {
                    pb = new ProcessBuilder("cmd.exe", "/c", "npx", "ng", "serve", "--host", "127.0.0.1", "--port", "4200");
                } else {
                    pb = new ProcessBuilder("npx", "ng", "serve", "--host", "127.0.0.1", "--port", "4200");
                }
                pb.directory(frontendDir);
                pb.redirectOutput(ProcessBuilder.Redirect.DISCARD);
                pb.redirectError(ProcessBuilder.Redirect.DISCARD);
                frontendProcess = pb.start();

                for (int i = 0; i < 60; i++) {
                    Thread.sleep(1000);
                    if (isHttpEndpointAvailable(frontendBaseUrl) || isHttpEndpointAvailable("http://localhost:4200")) {
                        break;
                    }
                }
            } catch (Exception ignored) {
            }
        }

        return frontendBaseUrl;
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
        if (frontendProcess != null) {
            try {
                boolean isWindows = System.getProperty("os.name").toLowerCase().contains("win");
                if (isWindows) {
                    new ProcessBuilder("taskkill", "/pid", String.valueOf(frontendProcess.pid()), "/T", "/F").start().waitFor();
                } else {
                    frontendProcess.destroyForcibly();
                }
            } catch (Exception ignored) {
            }
            frontendProcess = null;
        }
    }
}
