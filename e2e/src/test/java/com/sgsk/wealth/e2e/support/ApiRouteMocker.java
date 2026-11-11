package com.sgsk.wealth.e2e.support;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.microsoft.playwright.Page;
import com.microsoft.playwright.Route;

import java.io.InputStream;
import java.nio.charset.StandardCharsets;

public class ApiRouteMocker {
    private static final ObjectMapper mapper = new ObjectMapper();

    public static void mockPortfolioAPIs(Page page) {
        String sheetsAll = loadResource("/fixtures/sheets-all.json");
        String priceFetch = loadResource("/fixtures/price-fetch.json");
        String exchangeRate = loadResource("/fixtures/exchange-rate.json");

        // Mock /api/backend/share-lot/sheets
        page.route("**/api/backend/share-lot/sheets**", route -> {
            fulfillJson(route, 200, sheetsAll);
        });

        // Mock /api/backend/share-lot/sheet/*
        page.route("**/api/backend/share-lot/sheet/**", route -> {
            fulfillJson(route, 200, sheetsAll);
        });

        // Mock /api/backend/price/fetch-prices
        page.route("**/api/backend/price/fetch-prices**", route -> {
            fulfillJson(route, 200, priceFetch);
        });

        // Mock /api/backend/price/exchange-rate
        page.route("**/api/backend/price/exchange-rate**", route -> {
            fulfillJson(route, 200, exchangeRate);
        });

        // Mock /api/backend/portfolio/holdings
        page.route("**/api/backend/portfolio/holdings**", route -> {
            try {
                String url = route.request().url();
                String curr = url.contains("currency=USD") ? "USD" : "THB";
                double rate = 35.5;

                JsonNode sheetsNode = mapper.readTree(sheetsAll);
                JsonNode priceNode = mapper.readTree(priceFetch).path("prices");

                ObjectNode responseNode = mapper.createObjectNode();
                responseNode.put("currency", curr);
                responseNode.put("exchangeRate", rate);
                responseNode.put("tabId", "all");

                ArrayNode openPositions = mapper.createArrayNode();
                JsonNode summaries = sheetsNode.path("summaries");
                double openInvested = 0;
                double totalVal = 0;

                if (summaries.isArray()) {
                    for (JsonNode s : summaries) {
                        String sym = s.path("symbol").asText();
                        double totalShares = s.path("totalShares").asDouble();
                        double totalCost = s.path("totalCost").asDouble();
                        String originalCurrency = s.path("currency").asText();
                        double currentPrice = priceNode.path(sym).path("price").asDouble(s.path("averageCost").asDouble());

                        double priceConverted = currentPrice;
                        if ("USD".equals(originalCurrency) && "THB".equals(curr)) priceConverted *= rate;
                        if ("THB".equals(originalCurrency) && "USD".equals(curr)) priceConverted /= rate;

                        double costConverted = totalCost;
                        if ("USD".equals(originalCurrency) && "THB".equals(curr)) costConverted *= rate;
                        if ("THB".equals(originalCurrency) && "USD".equals(curr)) costConverted /= rate;

                        double valConverted = totalShares * priceConverted;
                        double unPL = valConverted - costConverted;
                        double unPLPct = costConverted > 0 ? (unPL / costConverted) * 100.0 : 0;

                        openInvested += costConverted;
                        totalVal += valConverted;

                        ObjectNode pos = mapper.createObjectNode();
                        pos.put("symbol", sym);
                        pos.put("displaySymbol", s.path("displaySymbol").asText(sym));
                        pos.put("name", s.path("name").asText());
                        pos.put("assetType", s.path("assetType").asText());
                        pos.put("assetTypeLabel", s.path("assetType").asText());
                        pos.put("totalShares", totalShares);
                        pos.put("totalCost", costConverted);
                        pos.put("averageCost", totalShares > 0 ? costConverted / totalShares : 0);
                        pos.put("currentPrice", priceConverted);
                        pos.put("holdingValue", valConverted);
                        pos.put("unrealizedPL", unPL);
                        pos.put("unrealizedPLPercent", unPLPct);
                        pos.put("currency", curr);
                        pos.put("originalCurrency", originalCurrency);
                        pos.put("hasPrice", true);

                        ArrayNode lots = mapper.createArrayNode();
                        for (JsonNode l : s.path("lots")) {
                            ObjectNode lotNode = l.deepCopy();
                            lotNode.put("currency", curr);
                            lots.add(lotNode);
                        }
                        pos.set("lots", lots);
                        openPositions.add(pos);
                    }
                }

                ArrayNode closedPositions = mapper.createArrayNode();
                JsonNode closed = sheetsNode.path("closedSummaries");
                if (closed.isArray()) {
                    for (JsonNode c : closed) {
                        closedPositions.add(c.deepCopy());
                    }
                }

                ObjectNode summaryNode = mapper.createObjectNode();
                summaryNode.put("totalInvested", openInvested);
                summaryNode.put("totalValue", totalVal);
                summaryNode.put("openInvested", openInvested);
                summaryNode.put("closedInvested", 0.0);
                summaryNode.put("totalUnrealizedPL", totalVal - openInvested);
                summaryNode.put("totalUnrealizedPLPercent", openInvested > 0 ? ((totalVal - openInvested) / openInvested) * 100 : 0);
                summaryNode.put("totalRealizedPL", 2500.0);
                summaryNode.put("totalRealizedPLPercent", 50.0);
                summaryNode.put("totalReturn", (totalVal - openInvested) + 2500.0);
                summaryNode.put("totalReturnPercent", 50.0);

                responseNode.set("summary", summaryNode);
                responseNode.set("openPositions", openPositions);
                responseNode.set("closedPositions", closedPositions);
                responseNode.set("transactionSummaries", sheetsNode.path("transactionSummaries"));
                responseNode.set("rawTransactions", sheetsNode.path("rawTransactions"));

                fulfillJson(route, 200, mapper.writeValueAsString(responseNode));
            } catch (Exception e) {
                fulfillJson(route, 200, "{\"currency\":\"THB\",\"openPositions\":[],\"closedPositions\":[]}");
            }
        });

        // Mock /api/backend/portfolio/performance
        page.route("**/api/backend/portfolio/performance**", route -> {
            String json = """
                {
                  "timeframe": "ALL",
                  "startDate": "",
                  "endDate": "",
                  "currency": "THB",
                  "exchangeRate": 35.0,
                  "summary": {
                    "totalInvested": 100000,
                    "totalValue": 120000,
                    "openInvested": 80000,
                    "closedInvested": 20000,
                    "totalUnrealizedPL": 40000,
                    "totalUnrealizedPLPercent": 50.0,
                    "totalRealizedPL": 5000,
                    "totalRealizedPLPercent": 25.0,
                    "totalReturn": 45000,
                    "totalReturnPercent": 45.0
                  },
                  "assetTypePerformance": [],
                  "topGainers": [],
                  "topLosers": [],
                  "symbolPerformance": [
                    {
                      "symbol": "AAPL",
                      "displaySymbol": "AAPL",
                      "name": "Apple Inc.",
                      "assetType": "us-stock",
                      "currency": "USD",
                      "totalCost": 9000.0,
                      "marketValue": 11250.0,
                      "unrealizedPL": 2250.0,
                      "unrealizedPLPercent": 25.0,
                      "realizedPL": 0.0,
                      "realizedPLPercent": 0.0,
                      "totalReturn": 2250.0,
                      "totalReturnPercent": 25.0,
                      "status": "open"
                    }
                  ],
                  "error": null
                }
                """;
            fulfillJson(route, 200, json);
        });

        // Mock /api/backend/portfolio/allocation
        page.route("**/api/backend/portfolio/allocation**", route -> {
            String json = """
                {
                  "currency": "THB",
                  "exchangeRate": 35.0,
                  "totalPortfolioValue": 100000,
                  "recommendations": [
                    {
                      "assetType": "us-stock",
                      "label": "U.S. Stock",
                      "currentValue": 40000,
                      "actualPercent": 40,
                      "targetPercent": 40,
                      "rebalanceAmount": 0,
                      "deviationPercent": 0,
                      "action": "BALANCED"
                    }
                  ],
                  "currencyExposure": {
                    "usd": 50000,
                    "thb": 50000,
                    "usdPercent": 50,
                    "thbPercent": 50
                  },
                  "holdingsConcentration": [],
                  "error": null
                }
                """;
            fulfillJson(route, 200, json);
        });

        // Mock /api/backend/portfolio/dividend
        page.route("**/api/backend/portfolio/dividend**", route -> {
            String json = """
                {
                  "currency": "THB",
                  "exchangeRate": 35.0,
                  "totalGrossDividends": 10000,
                  "totalNetDividends": 9000,
                  "totalWithholdingTax": 1000,
                  "effectiveTaxRate": 10.0,
                  "projectedAnnualDividends": 2950,
                  "portfolioDividendYield": 5.5,
                  "portfolioYieldOnCost": 7.5,
                  "annualDividends": [
                    {
                      "year": 2026,
                      "grossAmount": 6000,
                      "netAmount": 5400,
                      "withholdingTax": 600,
                      "byAssetType": { "thai-stock": 3000, "us-stock": 2400 },
                      "recordCount": 2,
                      "monthlyBreakdown": []
                    }
                  ],
                  "monthlyDividends": [
                    {
                      "yearMonth": "2026-03",
                      "year": 2026,
                      "month": 3,
                      "grossAmount": 6000,
                      "netAmount": 5400,
                      "withholdingTax": 600,
                      "byAssetType": { "thai-stock": 3000, "us-stock": 2400 },
                      "recordCount": 2
                    }
                  ],
                  "assetTypeSummaries": [
                    {
                      "assetType": "thai-stock",
                      "assetTypeLabel": "Thai Stock",
                      "totalGrossDividends": 7000,
                      "totalNetDividends": 6300,
                      "totalWithholdingTax": 700,
                      "percentageOfTotal": 70,
                      "symbolCount": 1,
                      "recordCount": 2,
                      "totalCostBasis": 35000,
                      "currentValue": 38000,
                      "projectedAnnualDividends": 2600,
                      "yieldOnCostPercent": 7.43,
                      "currentYieldPercent": 6.84
                    },
                    {
                      "assetType": "us-stock",
                      "assetTypeLabel": "U.S. Stock",
                      "totalGrossDividends": 3000,
                      "totalNetDividends": 2700,
                      "totalWithholdingTax": 300,
                      "percentageOfTotal": 30,
                      "symbolCount": 1,
                      "recordCount": 1,
                      "totalCostBasis": 65000,
                      "currentValue": 70000,
                      "projectedAnnualDividends": 350,
                      "yieldOnCostPercent": 0.54,
                      "currentYieldPercent": 0.50
                    }
                  ],
                  "symbolSummaries": [
                    {
                      "symbol": "PTT.BK",
                      "displaySymbol": "PTT",
                      "name": "PTT Public Company",
                      "assetType": "thai-stock",
                      "assetTypeLabel": "Thai Stock",
                      "currency": "THB",
                      "totalGrossDividends": 7000,
                      "totalNetDividends": 6300,
                      "totalWithholdingTax": 700,
                      "convertedNetDividends": 6300,
                      "convertedGrossDividends": 7000,
                      "convertedWithholdingTax": 700,
                      "dividendCount": 2,
                      "firstDividendDate": "2025-09-15",
                      "lastDividendDate": "2026-03-20",
                      "currentShares": 1000,
                      "currentCostBasis": 35000,
                      "currentValue": 38000,
                      "trailingAnnualDPS": 2.6,
                      "currentYieldPercent": 6.84,
                      "yieldOnCostPercent": 7.43,
                      "projectedAnnualIncome": 2600,
                      "recentDistributions": []
                    },
                    {
                      "symbol": "AAPL",
                      "displaySymbol": "AAPL",
                      "name": "Apple Inc.",
                      "assetType": "us-stock",
                      "assetTypeLabel": "U.S. Stock",
                      "currency": "USD",
                      "totalGrossDividends": 3000,
                      "totalNetDividends": 2700,
                      "totalWithholdingTax": 300,
                      "convertedNetDividends": 2700,
                      "convertedGrossDividends": 3000,
                      "convertedWithholdingTax": 300,
                      "dividendCount": 1,
                      "firstDividendDate": "2026-02-15",
                      "lastDividendDate": "2026-02-15",
                      "currentShares": 10,
                      "currentCostBasis": 65000,
                      "currentValue": 70000,
                      "trailingAnnualDPS": 1.0,
                      "currentYieldPercent": 0.50,
                      "yieldOnCostPercent": 0.54,
                      "projectedAnnualIncome": 350,
                      "recentDistributions": []
                    }
                  ],
                  "records": [
                    {
                      "id": "div-1",
                      "symbol": "PTT.BK",
                      "displaySymbol": "PTT",
                      "date": "2026-03-20",
                      "assetType": "thai-stock",
                      "assetTypeLabel": "Thai Stock",
                      "shares": 1000,
                      "dividendPerShare": 1.2,
                      "grossAmount": 1200,
                      "withholdingTax": 120,
                      "withholdingTaxRate": 10,
                      "netAmount": 1080,
                      "currency": "THB",
                      "convertedNetAmount": 1080,
                      "convertedGrossAmount": 1200,
                      "convertedWithholdingTax": 120
                    }
                  ],
                  "error": null
                }
                """;
            fulfillJson(route, 200, json);
        });

        // Mock /api/backend/portfolio/tools/**
        page.route("**/api/backend/portfolio/tools/**", route -> {
            fulfillJson(route, 200, "{\"success\":true,\"data\":{}}");
        });
    }

    public static void mockPortfolioAPIError(Page page, int statusCode) {
        page.route("**/api/backend/**", route -> {
            fulfillJson(route, statusCode, "{\"error\":\"Internal Server Error\"}");
        });
    }

    private static void fulfillJson(Route route, int status, String body) {
        route.fulfill(new Route.FulfillOptions()
                .setStatus(status)
                .setContentType("application/json")
                .setBody(body != null ? body : "{}"));
    }

    private static String loadResource(String path) {
        try (InputStream in = ApiRouteMocker.class.getResourceAsStream(path)) {
            if (in == null) return null;
            return new String(in.readAllBytes(), StandardCharsets.UTF_8);
        } catch (Exception e) {
            return null;
        }
    }
}
