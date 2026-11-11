package com.sgsk.wealth.e2e.support;

import java.io.File;
import java.io.IOException;
import java.net.HttpURLConnection;
import java.net.URI;
import java.net.URL;

public class ServerManager {
    private static MockBackendServer mockBackendServer;
    private static Process frontendProcess;
    private static String backendBaseUrl;
    private static String frontendBaseUrl = "http://127.0.0.1:4200";

    static {
        Runtime.getRuntime().addShutdownHook(new Thread(ServerManager::stopServers));
    }

    public static synchronized String ensureBackendServer() {
        if (backendBaseUrl != null && isHttpEndpointAvailable(backendBaseUrl)) {
            return backendBaseUrl;
        }

        String envBackend = System.getenv("E2E_BACKEND_URL");
        if (envBackend != null && !envBackend.isBlank()) {
            backendBaseUrl = envBackend;
            return backendBaseUrl;
        }

        // Check if real FastAPI is alive on port 8000
        if (isHttpEndpointAvailable("http://127.0.0.1:8000/")) {
            backendBaseUrl = "http://127.0.0.1:8000";
            return backendBaseUrl;
        }

        // Start mock backend server
        try {
            if (mockBackendServer != null) {
                mockBackendServer.stop();
            }
            mockBackendServer = new MockBackendServer();
            mockBackendServer.start(8000);
            backendBaseUrl = "http://127.0.0.1:" + mockBackendServer.getPort() + "/api/backend";
            return backendBaseUrl;
        } catch (IOException e) {
            throw new RuntimeException("Failed to start mock backend server", e);
        }
    }

    public static synchronized String ensureFrontendServer() {
        String envFrontend = System.getenv("E2E_BASE_URL");
        if (envFrontend != null && !envFrontend.isBlank()) {
            frontendBaseUrl = envFrontend;
            return frontendBaseUrl;
        }

        if (isHttpEndpointAvailable("http://127.0.0.1:4200") || isHttpEndpointAvailable("http://localhost:4200")) {
            return frontendBaseUrl;
        }

        // Attempt to start frontend Angular dev server
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

                // Poll until ready up to 60 seconds
                for (int i = 0; i < 60; i++) {
                    Thread.sleep(1000);
                    if (isHttpEndpointAvailable("http://127.0.0.1:4200") || isHttpEndpointAvailable("http://localhost:4200")) {
                        break;
                    }
                }
            } catch (Exception ignored) {
            }
        }

        return frontendBaseUrl;
    }

    public static boolean isHttpEndpointAvailable(String urlString) {
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

    public static synchronized void stopServers() {
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
