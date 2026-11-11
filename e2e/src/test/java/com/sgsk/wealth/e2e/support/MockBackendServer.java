package com.sgsk.wealth.e2e.support;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpServer;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;

public class MockBackendServer {
    public static final String VALID_API_KEY = "dev_secret_key_change_in_prod";
    private HttpServer server;
    private int port;

    public void start(int preferredPort) throws IOException {
        this.port = preferredPort;
        try {
            server = HttpServer.create(new InetSocketAddress(port), 0);
        } catch (IOException e) {
            this.port = preferredPort + 1;
            server = HttpServer.create(new InetSocketAddress(this.port), 0);
        }

        server.createContext("/", new UnifiedMockHandler());
        server.setExecutor(null);
        server.start();
    }

    public void stop() {
        if (server != null) {
            server.stop(0);
            server = null;
        }
    }

    public int getPort() {
        return port;
    }

    private static class UnifiedMockHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            String path = exchange.getRequestURI().getPath();
            String query = exchange.getRequestURI().getQuery();
            String method = exchange.getRequestMethod();

            // Strip optional /api/backend prefix
            if (path.startsWith("/api/backend")) {
                path = path.substring("/api/backend".length());
                if (path.isEmpty()) path = "/";
            }

            String apiKey = exchange.getRequestHeaders().getFirst("X-API-Key");
            if (apiKey == null) {
                apiKey = exchange.getRequestHeaders().getFirst("x-api-key");
            }

            // CORS headers
            exchange.getResponseHeaders().add("Access-Control-Allow-Origin", "*");
            exchange.getResponseHeaders().add("Access-Control-Allow-Headers", "*");
            exchange.getResponseHeaders().add("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
            exchange.getResponseHeaders().add("Content-Type", "application/json");

            if ("OPTIONS".equalsIgnoreCase(method)) {
                exchange.sendResponseHeaders(200, -1);
                return;
            }

            // Root endpoint (unauthenticated)
            if ("/".equals(path)) {
                sendJsonResponse(exchange, 200, "{\"message\":\"Welcome to SGSKBackend!\"}");
                return;
            }

            // Authentication verification
            boolean isAuthorized = VALID_API_KEY.equals(apiKey);
            if (!isAuthorized) {
                sendJsonResponse(exchange, 401, "{\"detail\":\"Invalid or missing API Key\"}");
                return;
            }

            // Share lot endpoints
            if ("/share-lot/sheets".equals(path)) {
                String fixture = loadFixture("/fixtures/sheets-all.json");
                sendJsonResponse(exchange, 200, fixture != null ? fixture : "{\"summaries\":[],\"totalCostByCurrency\":{\"USD\":1000.0}}");
                return;
            }

            if (path.startsWith("/share-lot/sheet/")) {
                String tab = path.substring("/share-lot/sheet/".length());
                if ("non-existent-tab".equals(tab)) {
                    sendJsonResponse(exchange, 200, "{\"error\":\"Invalid tab id: non-existent-tab\"}");
                } else {
                    String fixture = loadFixture("/fixtures/sheets-all.json");
                    sendJsonResponse(exchange, 200, fixture != null ? fixture : "{\"isClosed\":false,\"summaries\":[{\"symbol\":\"AAPL\"}],\"totalCostByCurrency\":{\"USD\":1000.0}}");
                }
                return;
            }

            // Price endpoints
            if ("/price/exchange-rate".equals(path)) {
                sendJsonResponse(exchange, 200, "{\"from_currency\":\"USD\",\"to_currency\":\"THB\",\"rate\":35.5}");
                return;
            }

            if ("/price/fetch-prices".equals(path)) {
                sendJsonResponse(exchange, 200, "{\"rate\":35.5,\"prices\":{\"AAPL\":{\"symbol\":\"AAPL\",\"name\":\"Apple Inc.\",\"price\":224.5,\"currency\":\"USD\"},\"PTT.BK\":{\"symbol\":\"PTT.BK\",\"name\":\"PTT Public Company Limited\",\"price\":34.0,\"currency\":\"THB\"}}}");
                return;
            }

            // NAV fetch
            if ("/nav/fetch".equals(path)) {
                sendJsonResponse(exchange, 200, "{\"K-CHANGE.FUND\":{\"nav\":12.34}}");
                return;
            }

            // Portfolio holdings
            if ("/portfolio/holdings".equals(path)) {
                sendJsonResponse(exchange, 200, "{\"currency\":\"THB\",\"exchangeRate\":35.0,\"summary\":{\"totalInvested\":100000,\"totalValue\":120000},\"holdings\":[],\"summaries\":[]}");
                return;
            }

            // Portfolio performance
            if ("/portfolio/performance".equals(path)) {
                sendJsonResponse(exchange, 200, "{\"timeframe\":\"YTD\",\"currency\":\"THB\",\"metrics\":{},\"timeframes\":{}}");
                return;
            }

            // Portfolio allocation
            if ("/portfolio/allocation".equals(path)) {
                sendJsonResponse(exchange, 200, "{\"totalPortfolioValue\":100000,\"recommendations\":[]}");
                return;
            }

            // Portfolio dividend
            if ("/portfolio/dividend".equals(path)) {
                String requestedCurrency = "THB";
                if (query != null && query.contains("currency=USD")) {
                    requestedCurrency = "USD";
                }
                sendJsonResponse(exchange, 200, "{\"currency\":\"" + requestedCurrency + "\",\"exchangeRate\":35.0,\"totalGrossDividends\":10000,\"totalNetDividends\":9000,\"totalWithholdingTax\":1000,\"portfolioYieldOnCost\":7.5,\"annualDividends\":[],\"assetTypeSummaries\":[],\"symbolSummaries\":[],\"records\":[]}");
                return;
            }

            // Portfolio tools TVM
            if ("/portfolio/tools/tvm".equals(path)) {
                sendJsonResponse(exchange, 200, "{\"mode\":\"FV\",\"future_value\":200000,\"total_contributions\":160000,\"total_interest\":40000}");
                return;
            }

            // Portfolio tools simulate
            if ("/portfolio/tools/simulate".equals(path)) {
                sendJsonResponse(exchange, 200, "{\"new_shares\":15,\"new_avg_cost\":160.0}");
                return;
            }

            // Fallback 200
            sendJsonResponse(exchange, 200, "{\"success\":true}");
        }

        private void sendJsonResponse(HttpExchange exchange, int statusCode, String responseJson) throws IOException {
            byte[] bytes = responseJson.getBytes(StandardCharsets.UTF_8);
            exchange.sendResponseHeaders(statusCode, bytes.length);
            try (OutputStream os = exchange.getResponseBody()) {
                os.write(bytes);
            }
        }

        private String loadFixture(String resourcePath) {
            try (InputStream in = getClass().getResourceAsStream(resourcePath)) {
                if (in == null) return null;
                return new String(in.readAllBytes(), StandardCharsets.UTF_8);
            } catch (Exception e) {
                return null;
            }
        }
    }
}
