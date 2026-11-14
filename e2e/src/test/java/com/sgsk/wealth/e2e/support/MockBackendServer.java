package com.sgsk.wealth.e2e.support;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
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
                    sendJsonResponse(exchange, 200, buildFilteredSheetResponse(fixture, tab));
                }
                return;
            }

            // Icon metadata & image endpoints
            if (path.startsWith("/icon/meta/")) {
                String symbol = path.substring("/icon/meta/".length());
                String assetType = extractQueryParam(query, "asset_type", resolveMockAssetType(symbol));
                ObjectNode meta = JSON.createObjectNode();
                meta.put("symbol", symbol);
                meta.put("asset_type", assetType);
                meta.put("clean_ticker", symbol.replace(".BK", ""));
                meta.put("monogram", symbol.length() >= 2 ? symbol.substring(0, 2).toUpperCase() : symbol.toUpperCase());
                meta.put("brand_color", "#38bdf8");
                meta.put("is_mutual_fund", "mutual-fund".equals(assetType));
                meta.put("icon_url", "/api/backend/icon/" + symbol + "?asset_type=" + assetType);
                sendJsonResponse(exchange, 200, JSON.writeValueAsString(meta));
                return;
            }

            if ("/icon".equals(path) || path.startsWith("/icon/")) {
                byte[] svg = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\"><circle cx=\"12\" cy=\"12\" r=\"10\" fill=\"#38bdf8\"/></svg>"
                        .getBytes(StandardCharsets.UTF_8);
                exchange.getResponseHeaders().set("Content-Type", "image/svg+xml");
                exchange.sendResponseHeaders(200, svg.length);
                try (OutputStream os = exchange.getResponseBody()) {
                    os.write(svg);
                }
                return;
            }

            // Price endpoints
            if ("/price/exchange-rate".equals(path)) {
                String from = extractQueryParam(query, "from_currency", "USD").toUpperCase();
                String to = extractQueryParam(query, "to_currency", "THB").toUpperCase();
                double rate = ("THB".equals(from) && "USD".equals(to)) ? 0.0282 : 35.5;
                sendJsonResponse(exchange, 200,
                        "{\"from_currency\":\"" + from + "\",\"to_currency\":\"" + to + "\",\"rate\":" + rate + "}");
                return;
            }

            if ("/price/fetch-prices".equals(path)) {
                String fixture = loadFixture("/fixtures/price-fetch.json");
                sendJsonResponse(exchange, 200, fixture != null ? fixture
                        : "{\"rate\":35.5,\"prices\":{\"AAPL\":{\"symbol\":\"AAPL\",\"name\":\"Apple Inc.\",\"price\":224.5,\"currency\":\"USD\"},\"PTT.BK\":{\"symbol\":\"PTT.BK\",\"name\":\"PTT Public Company Limited\",\"price\":34.0,\"currency\":\"THB\"}}}");
                return;
            }

            // NAV fetch
            if ("/nav/fetch".equals(path)) {
                sendJsonResponse(exchange, 200, "{\"K-CHANGE.FUND\":{\"nav\":12.34},\"K-USA\":{\"nav\":18.2}}");
                return;
            }

            // Portfolio holdings
            if ("/portfolio/holdings".equals(path)) {
                String tabId = extractQueryParam(query, "tab_id", "all");
                String currency = extractQueryParam(query, "currency", "THB");
                String fixture = loadFixture("/fixtures/sheets-all.json");
                sendJsonResponse(exchange, 200, buildHoldingsResponse(fixture, tabId, currency));
                return;
            }

            // Portfolio performance
            if ("/portfolio/performance".equals(path)) {
                String timeframe = extractQueryParam(query, "timeframe", "ALL");
                String currency = extractQueryParam(query, "currency", "THB");
                sendJsonResponse(exchange, 200,
                        "{\"timeframe\":\"" + timeframe + "\",\"currency\":\"" + currency + "\",\"exchangeRate\":35.5,\"summary\":{\"totalInvested\":100000,\"totalValue\":120000,\"totalReturn\":20000},\"metrics\":{},\"timeframes\":{},\"error\":null}");
                return;
            }

            // Portfolio allocation
            if ("/portfolio/allocation".equals(path)) {
                String body = readRequestBody(exchange);
                String currency = extractQueryParam(query, "currency",
                        extractJsonString(body, "currency", "THB"));
                sendJsonResponse(exchange, 200,
                        "{\"currency\":\"" + currency + "\",\"exchangeRate\":35.5,\"totalPortfolioValue\":100000,\"recommendations\":[{\"assetType\":\"us-stock\",\"label\":\"U.S. Stock\",\"currentValue\":40000,\"actualPercent\":40,\"targetPercent\":40,\"rebalanceAmount\":0,\"deviationPercent\":0,\"action\":\"BALANCED\"}],\"currencyExposure\":{\"usd\":50000,\"thb\":50000,\"usdPercent\":50,\"thbPercent\":50},\"holdingsConcentration\":[],\"error\":null}");
                return;
            }

            // Portfolio dividend
            if ("/portfolio/dividend".equals(path)) {
                String requestedCurrency = extractQueryParam(query, "currency", "THB");
                sendJsonResponse(exchange, 200,
                        "{\"currency\":\"" + requestedCurrency + "\",\"exchangeRate\":35.5,\"totalGrossDividends\":10000,\"totalNetDividends\":9000,\"totalWithholdingTax\":1000,\"portfolioYieldOnCost\":7.5,\"annualDividends\":[],\"assetTypeSummaries\":[],\"symbolSummaries\":[],\"records\":[],\"error\":null}");
                return;
            }

            // Portfolio tools TVM
            if ("/portfolio/tools/tvm".equals(path)) {
                String body = readRequestBody(exchange);
                String tvmMode = extractJsonString(body, "mode", "FV");
                String compounding = extractJsonString(body, "compounding",
                        extractJsonString(body, "compounding_frequency", "monthly"));
                String currency = extractJsonString(body, "currency", "USD");
                sendJsonResponse(exchange, 200,
                        "{\"mode\":\"" + tvmMode + "\",\"compounding\":\"" + compounding + "\",\"compounding_frequency\":\"" + compounding + "\",\"currency\":\"" + currency + "\",\"future_value\":200000.0,\"futureValue\":200000.0,\"presentValue\":50000.0,\"payment\":1000.0,\"annualRatePct\":8.0,\"years\":10.0,\"total_contributions\":160000.0,\"totalContributions\":160000.0,\"total_interest\":40000.0,\"totalInterestEarned\":40000.0,\"isValid\":true}");
                return;
            }

            // Portfolio tools simulate
            if ("/portfolio/tools/simulate".equals(path)) {
                String body = readRequestBody(exchange);
                String currency = extractJsonString(body, "currency", "USD");
                sendJsonResponse(exchange, 200,
                        "{\"currency\":\"" + currency + "\",\"new_shares\":15.0,\"new_avg_cost\":160.0,\"totalCapitalOutlay\":2500.0,\"totalFees\":3.75,\"initial\":{\"totalShares\":10.0,\"averageCost\":150.0,\"totalCost\":1500.0,\"marketPrice\":200.0,\"holdingValue\":2000.0,\"unrealizedPL\":500.0,\"unrealizedPLPercent\":33.33,\"realizedPL\":0.0},\"simulated\":{\"totalShares\":15.0,\"averageCost\":160.0,\"totalCost\":2400.0,\"marketPrice\":200.0,\"holdingValue\":3000.0,\"unrealizedPL\":600.0,\"unrealizedPLPercent\":25.0,\"realizedPL\":0.0},\"delta\":{\"shares\":5.0,\"sharesPercent\":50.0,\"averageCost\":10.0,\"averageCostPercent\":6.67,\"totalCost\":900.0,\"totalCostPercent\":60.0,\"holdingValue\":1000.0,\"holdingValuePercent\":50.0,\"unrealizedPL\":100.0,\"unrealizedPLPercent\":-8.33,\"breakevenDistanceInitial\":-25.0,\"breakevenDistanceSimulated\":-20.0,\"realizedPL\":0.0},\"steps\":[]}");
                return;
            }

            // Portfolio tools solve-target
            if ("/portfolio/tools/solve-target".equals(path)) {
                String body = readRequestBody(exchange);
                String currency = extractJsonString(body, "currency", "USD");
                sendJsonResponse(exchange, 200,
                        "{\"isValid\":true,\"is_feasible\":true,\"errorMessage\":\"\",\"requiredShares\":25.0,\"requiredCapital\":4500.0,\"feeAmount\":0.0,\"totalOutlay\":4500.0,\"achievedAvgCost\":195.0,\"newTotalShares\":125.0,\"newTotalCost\":24375.0,\"currency\":\"" + currency + "\"}");
                return;
            }

            // Portfolio tools rebalance
            if ("/portfolio/tools/rebalance".equals(path)) {
                String body = readRequestBody(exchange);
                String rebMode = extractJsonString(body, "mode", "standard");
                String currency = extractJsonString(body, "currency", "USD");
                sendJsonResponse(exchange, 200,
                        "{\"mode\":\"" + rebMode + "\",\"noSellSubMode\":\"min-inflow\",\"currency\":\"" + currency + "\",\"totalCurrentPortfolioValue\":100000.0,\"totalTargetPortfolioValue\":100000.0,\"cashContribution\":0.0,\"totalBuyAmount\":5000.0,\"totalSellAmount\":5000.0,\"netCashDifference\":0.0,\"groups\":[],\"orders\":[],\"isValid\":true}");
                return;
            }

            // Fallback 200
            sendJsonResponse(exchange, 200, "{\"success\":true}");
        }

        private static final ObjectMapper JSON = new ObjectMapper();

        private String buildFilteredSheetResponse(String fixture, String tab) {
            try {
                if (fixture == null) {
                    return "{\"tabId\":\"" + tab + "\",\"isClosed\":" + "closed-position".equals(tab)
                            + ",\"summaries\":[{\"symbol\":\"AAPL\"}],\"totalCostByCurrency\":{\"USD\":1000.0}}";
                }
                ObjectNode root = (ObjectNode) JSON.readTree(fixture);
                root.put("tabId", tab);
                if ("closed-position".equals(tab)) {
                    root.put("isClosed", true);
                    root.set("summaries", JSON.createArrayNode());
                } else if (!"all".equals(tab)) {
                    ArrayNode filtered = JSON.createArrayNode();
                    for (JsonNode item : root.path("summaries")) {
                        if (tab.equals(item.path("assetType").asText())) {
                            filtered.add(item);
                        }
                    }
                    root.set("summaries", filtered);
                }
                return JSON.writeValueAsString(root);
            } catch (Exception e) {
                return "{\"tabId\":\"" + tab + "\",\"summaries\":[],\"totalCostByCurrency\":{\"USD\":0.0}}";
            }
        }

        private String buildHoldingsResponse(String fixture, String tabId, String currency) {
            try {
                ObjectNode root = JSON.createObjectNode();
                root.put("currency", currency);
                root.put("exchangeRate", 35.5);
                root.put("tabId", tabId);
                ArrayNode openPositions = JSON.createArrayNode();
                ArrayNode closedPositions = JSON.createArrayNode();
                if (fixture != null) {
                    JsonNode sheet = JSON.readTree(fixture);
                    if (!"closed-position".equals(tabId)) {
                        for (JsonNode s : sheet.path("summaries")) {
                            if ("all".equals(tabId) || tabId.equals(s.path("assetType").asText())) {
                                openPositions.add(s);
                            }
                        }
                    }
                    if ("all".equals(tabId) || "closed-position".equals(tabId)) {
                        for (JsonNode c : sheet.path("closedSummaries")) {
                            closedPositions.add(c);
                        }
                    }
                }
                ObjectNode summary = JSON.createObjectNode();
                summary.put("totalInvested", 100000.0);
                summary.put("totalValue", 120000.0);
                root.set("summary", summary);
                root.set("openPositions", openPositions);
                root.set("closedPositions", closedPositions);
                root.set("holdings", openPositions);
                root.set("summaries", openPositions);
                root.putNull("error");
                return JSON.writeValueAsString(root);
            } catch (Exception e) {
                return "{\"currency\":\"" + currency + "\",\"tabId\":\"" + tabId + "\",\"exchangeRate\":35.5,\"summary\":{\"totalInvested\":100000,\"totalValue\":120000},\"holdings\":[],\"summaries\":[]}";
            }
        }

        private String resolveMockAssetType(String symbol) {
            if (symbol == null) return "us-stock";
            if (symbol.endsWith(".BK")) return "thai-stock";
            if ("BTC".equalsIgnoreCase(symbol) || "ETH".equalsIgnoreCase(symbol)) return "crypto";
            if (symbol.toUpperCase().startsWith("PVD")) return "provident-fund";
            if (symbol.toUpperCase().startsWith("K-")) return "mutual-fund";
            return "us-stock";
        }

        private String extractQueryParam(String query, String key, String defaultVal) {
            if (query == null || query.isEmpty()) return defaultVal;
            for (String pair : query.split("&")) {
                String[] kv = pair.split("=", 2);
                if (kv.length == 2 && key.equals(kv[0])) {
                    return kv[1];
                }
            }
            return defaultVal;
        }

        private String readRequestBody(HttpExchange exchange) throws IOException {
            try (InputStream is = exchange.getRequestBody()) {
                return new String(is.readAllBytes(), StandardCharsets.UTF_8);
            }
        }

        private String extractJsonString(String body, String key, String defaultVal) {
            if (body == null || body.isBlank()) return defaultVal;
            try {
                JsonNode node = JSON.readTree(body);
                JsonNode val = node.path(key);
                if (!val.isMissingNode() && !val.isNull()) {
                    String s = val.asText();
                    if (!s.isBlank()) return s;
                }
            } catch (Exception ignored) {
            }
            return defaultVal;
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
