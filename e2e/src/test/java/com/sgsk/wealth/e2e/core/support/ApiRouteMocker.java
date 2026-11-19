package com.sgsk.wealth.e2e.core.support;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.microsoft.playwright.Page;
import com.microsoft.playwright.Route;
import org.springframework.stereotype.Component;

import java.io.InputStream;
import java.nio.charset.StandardCharsets;

@Component
public class ApiRouteMocker {
    private final ObjectMapper mapper;

    public ApiRouteMocker(ObjectMapper mapper) {
        this.mapper = mapper;
    }

    public void mockPortfolioAPIs(Page page) {
        mockPortfolioAPIs(page, true);
    }

    public void mockPortfolioAPIs(Page page, boolean seedOwnerSession) {
        mockSupabaseAndAuthAPIs(page, seedOwnerSession);

        String sheetsAll = loadResource("/fixtures/sheets-all.json");
        String priceFetch = loadResource("/fixtures/price-fetch.json");
        String exchangeRate = loadResource("/fixtures/exchange-rate.json");

        // Mock /api/backend/auth/me
        page.route("**/api/backend/auth/me**", route -> {
            String auth = route.request().headers().getOrDefault("authorization", "");
            if (auth.contains("mock-standard-jwt")) {
                fulfillJson(route, 200,
                        "{\"authenticated\":true,\"userId\":\"std-1\",\"email\":\"user@example.com\",\"role\":\"user\",\"providers\":[\"email\"],\"canViewCloudPortfolio\":false,\"portfolioSource\":\"local\"}");
            } else if (auth.contains("Bearer ")) {
                fulfillJson(route, 200,
                        "{\"authenticated\":true,\"userId\":\"owner-1\",\"email\":\"vipatpolk@gmail.com\",\"role\":\"owner\",\"providers\":[\"email\",\"google\"],\"canViewCloudPortfolio\":true,\"portfolioSource\":\"google_sheets\"}");
            } else {
                fulfillJson(route, 200,
                        "{\"authenticated\":false,\"userId\":null,\"email\":null,\"role\":\"anonymous\",\"providers\":[],\"canViewCloudPortfolio\":false,\"portfolioSource\":\"local\"}");
            }
        });

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
                String tabId = extractQueryParam(url, "tab_id", "all");
                double rate = 35.5;

                JsonNode sheetsNode = mapper.readTree(sheetsAll);
                JsonNode priceNode = mapper.readTree(priceFetch).path("prices");

                ObjectNode responseNode = mapper.createObjectNode();
                responseNode.put("currency", curr);
                responseNode.put("exchangeRate", rate);
                responseNode.put("tabId", tabId);

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
                        String stockName = s.path("name").asText("");
                        if (stockName.isEmpty()) {
                            stockName = priceNode.path(sym).path("name").asText(s.path("policyName").asText(""));
                        }
                        pos.put("name", stockName);
                        String nameTh = s.path("nameTh").asText("");
                        if (nameTh.isEmpty()) {
                            nameTh = priceNode.path(sym).path("nameTh").asText("");
                        }
                        if (!nameTh.isEmpty()) {
                            pos.put("nameTh", nameTh);
                        }
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

                        double convFactor = originalCurrency.equals(curr)
                                ? 1.0
                                : ("THB".equals(curr) ? rate : 1.0 / rate);
                        for (String numField : new String[]{"employeeShares", "employerShares"}) {
                            if (s.has(numField)) {
                                pos.put(numField, s.path(numField).asDouble());
                            }
                        }
                        for (String moneyField : new String[]{
                                "employeeContribution", "employeeEarnings",
                                "employerMatching", "employerEarnings"
                        }) {
                            if (s.has(moneyField)) {
                                pos.put(moneyField, Math.round(s.path(moneyField).asDouble() * convFactor * 100.0) / 100.0);
                            }
                        }
                        for (String strField : new String[]{
                                "pvdFundName", "policyName", "aimcType",
                                "aimcDescription", "riskLevel", "objective"
                        }) {
                            if (s.has(strField)) {
                                pos.put(strField, s.path(strField).asText());
                            }
                        }

                        ArrayNode lots = mapper.createArrayNode();
                        for (JsonNode l : s.path("lots")) {
                            ObjectNode lotNode = l.deepCopy();
                            lotNode.put("currency", curr);
                            lots.add(lotNode);
                        }
                        pos.set("lots", lots);
                        if ("all".equals(tabId)
                                || (!"closed-position".equals(tabId)
                                && pos.path("assetType").asText().equals(tabId))) {
                            openPositions.add(pos);
                        }
                    }
                }

                ArrayNode closedPositions = mapper.createArrayNode();
                JsonNode closed = sheetsNode.path("closedSummaries");
                if (closed.isArray()) {
                    for (JsonNode c : closed) {
                        ObjectNode closedNode = (ObjectNode) c.deepCopy();
                        if (!closedNode.hasNonNull("assetTypeLabel")) {
                            closedNode.put("assetTypeLabel", closedNode.path("assetType").asText());
                        }
                        closedPositions.add(closedNode);
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
                      "investedCost": 319500.0,
                      "currentValue": 400262.5,
                      "unrealizedPL": 80762.5,
                      "unrealizedPLPercent": 25.28,
                      "realizedPL": 0.0,
                      "realizedPLPercent": 0.0,
                      "totalReturn": 80762.5,
                      "totalReturnAmount": 80762.5,
                      "totalReturnPercent": 25.28,
                      "status": "OPEN"
                    },
                    {
                      "symbol": "BTC",
                      "displaySymbol": "BTC",
                      "name": "Bitcoin",
                      "assetType": "crypto",
                      "currency": "USD",
                      "investedCost": 1136000.0,
                      "currentValue": 1686250.0,
                      "unrealizedPL": 550250.0,
                      "unrealizedPLPercent": 48.44,
                      "realizedPL": 0.0,
                      "realizedPLPercent": 0.0,
                      "totalReturn": 550250.0,
                      "totalReturnAmount": 550250.0,
                      "totalReturnPercent": 48.44,
                      "status": "OPEN"
                    },
                    {
                      "symbol": "K-USA",
                      "displaySymbol": "K-USA",
                      "name": "Kasikorn US Equity Fund",
                      "nameTh": "กองทุนเปิดเค ยูเอสเอ หุ้นทุน",
                      "assetType": "mutual-fund",
                      "currency": "THB",
                      "investedCost": 7500.0,
                      "currentValue": 9100.0,
                      "unrealizedPL": 1600.0,
                      "unrealizedPLPercent": 21.33,
                      "realizedPL": 0.0,
                      "realizedPLPercent": 0.0,
                      "totalReturn": 1600.0,
                      "totalReturnAmount": 1600.0,
                      "totalReturnPercent": 21.33,
                      "status": "OPEN"
                    },
                    {
                      "symbol": "PTT.BK",
                      "displaySymbol": "PTT",
                      "name": "PTT Public Company Limited",
                      "nameTh": "บริษัท ปตท. จำกัด (มหาชน)",
                      "assetType": "thai-stock",
                      "currency": "THB",
                      "investedCost": 33000.0,
                      "currentValue": 32000.0,
                      "unrealizedPL": -1000.0,
                      "unrealizedPLPercent": -3.03,
                      "realizedPL": 0.0,
                      "realizedPLPercent": 0.0,
                      "totalReturn": -1000.0,
                      "totalReturnAmount": -1000.0,
                      "totalReturnPercent": -3.03,
                      "status": "OPEN"
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
                    },
                    {
                      "assetType": "thai-stock",
                      "label": "Thai Stock",
                      "currentValue": 25000,
                      "actualPercent": 25,
                      "targetPercent": 25,
                      "rebalanceAmount": 0,
                      "deviationPercent": 0,
                      "action": "BALANCED"
                    },
                    {
                      "assetType": "mutual-fund",
                      "label": "Mutual Fund",
                      "currentValue": 20000,
                      "actualPercent": 20,
                      "targetPercent": 20,
                      "rebalanceAmount": 0,
                      "deviationPercent": 0,
                      "action": "BALANCED"
                    },
                    {
                      "assetType": "crypto",
                      "label": "Cryptocurrency",
                      "currentValue": 15000,
                      "actualPercent": 15,
                      "targetPercent": 15,
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
                      "name": "PTT Public Company Limited",
                      "nameTh": "บริษัท ปตท. จำกัด (มหาชน)",
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
                    },
                    {
                      "symbol": "K-USA",
                      "displaySymbol": "K-USA",
                      "name": "Kasikorn US Equity Fund",
                      "nameTh": "กองทุนเปิดเค ยูเอสเอ หุ้นทุน",
                      "assetType": "mutual-fund",
                      "assetTypeLabel": "Mutual Fund",
                      "currency": "THB",
                      "totalGrossDividends": 500,
                      "totalNetDividends": 450,
                      "totalWithholdingTax": 50,
                      "convertedNetDividends": 450,
                      "convertedGrossDividends": 500,
                      "convertedWithholdingTax": 50,
                      "dividendCount": 1,
                      "firstDividendDate": "2026-01-15",
                      "lastDividendDate": "2026-01-15",
                      "currentShares": 500,
                      "currentCostBasis": 7500,
                      "currentValue": 9100,
                      "trailingAnnualDPS": 0.9,
                      "currentYieldPercent": 4.95,
                      "yieldOnCostPercent": 6.00,
                      "projectedAnnualIncome": 450,
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
            String url = route.request().url();
            if (url.contains("solve-target")) {
                fulfillJson(route, 200, "{\"is_feasible\":true,\"required_shares\":25.0,\"required_amount\":4500.0,\"resulting_avg_cost\":195.0}");
            } else if (url.contains("rebalance")) {
                fulfillJson(route, 200, "{\"total_value\":100000.0,\"allocations\":[],\"actions\":[]}");
            } else if (url.contains("tvm")) {
                fulfillJson(route, 200, "{\"mode\":\"FV\",\"future_value\":150000.0,\"total_contributions\":100000.0,\"total_interest\":50000.0,\"schedule\":[]}");
            } else {
                fulfillJson(route, 200, "{\"success\":true,\"data\":{\"simulated_avg_cost\":192.5}}");
            }
        });

        // Mock /api/backend/nav/factsheet
        page.route("**/api/backend/nav/factsheet**", route -> {
            String url = route.request().url();
            String symbol = extractQueryParam(url, "symbol", "K-USA").toUpperCase();
            String assetType = extractQueryParam(url, "asset_type", "mutual-fund");
            if ("provident-fund".equalsIgnoreCase(assetType) || symbol.startsWith("PVD")) {
                String pvdJson = """
                    {
                      "symbol": "__SYMBOL__",
                      "displaySymbol": "__SYMBOL__",
                      "assetType": "provident-fund",
                      "projId": "V0001_2553",
                      "fundName": "นโยบายกองทุนรวมดัชนี S&P 500 THB",
                      "fundNameTh": "นโยบายกองทุนรวมดัชนี S&P 500 THB",
                      "amcName": "ไทยพาณิชย์ มาสเตอร์ฟันด์",
                      "amcNameTh": "ไทยพาณิชย์ มาสเตอร์ฟันด์",
                      "policyDesc": "ตราสารทุนต่างประเทศ",
                      "objective": "ลงทุนในกองทุนหลักต่างประเทศ S&P 500 เพื่อโอกาสรับผลตอบแทนระยะยาว",
                      "aimcType": "US Equity",
                      "aimcDescription": "US Equity Index Fund",
                      "riskLevel": "RS6",
                      "inceptionDate": "2555-01-15",
                      "asOfDate": "2026-09-30",
                      "fxHedgingPolicy": "Foreign Investment Only",
                      "fees": [
                        {"description": "ManagementFee", "actualRate": "0.45%"},
                        {"description": "TotalFeeMax", "ceilingRate": "0.85%"}
                      ],
                      "performance": [
                        {"category": "Trailing Return", "period": "1Y", "value": 22.8}
                      ],
                      "statistics": {
                        "maxDrawdown": -15.4,
                        "sharpeRatio": 1.35
                      },
                      "assetAllocation": [
                        {"seq": 1, "name": "หน่วยลงทุน", "ratio": 98.5}
                      ],
                      "topHoldings": [
                        {"seq": 1, "name": "SCBS&P500", "ratio": 98.5}
                      ]
                    }
                    """.replace("__SYMBOL__", symbol);
                fulfillJson(route, 200, pvdJson);
            } else {
                String mfJson = """
                    {
                      "symbol": "__SYMBOL__",
                      "displaySymbol": "__SYMBOL__",
                      "assetType": "mutual-fund",
                      "projId": "M0888_2560",
                      "fundName": "Kasikorn US Equity Fund",
                      "fundNameTh": "กองทุนเปิดเค ยูเอสเอ หุ้นทุน",
                      "amcName": "Kasikorn Asset Management Co., Ltd.",
                      "amcNameTh": "บริษัทหลักทรัพย์จัดการกองทุน กสิกรไทย จำกัด",
                      "policyDesc": "Foreign Equity",
                      "investmentPolicyDesc": "Invests in Morgan Stanley US Advantage Fund.",
                      "managementStyle": "AN - Feeder Fund (Active Master)",
                      "riskLevel": "RS6",
                      "riskDescription": "High Risk",
                      "benchmark": "S&P 500 Total Return Net",
                      "dividendPolicy": "N",
                      "inceptionDate": "2017-05-10",
                      "pdfUrl": "https://sec.example/factsheet/k-usa.pdf",
                      "amcUrl": "https://kasikornasset.example/k-usa",
                      "asOfDate": "2026-09-30",
                      "fees": [
                        {"description": "Management Fee", "ceilingRate": "2.14%", "actualRate": "1.605%"}
                      ],
                      "performance": [
                        {"category": "Fund Return", "period": "1Y", "value": 18.45}
                      ],
                      "statistics": {
                        "maxDrawdown": -21.3,
                        "sharpeRatio": 1.12,
                        "trackingError": 3.4,
                        "fxHedging": "78.5%"
                      },
                      "assetAllocation": [
                        {"seq": 1, "name": "Foreign Equity", "ratio": 96.5}
                      ],
                      "topHoldings": [
                        {"seq": 1, "name": "MS US Advantage", "ratio": 96.5}
                      ],
                      "tradeConditions": {
                        "minimumInitialSub": 500,
                        "minimumNextSub": 500,
                        "minimumRedempt": 500,
                        "currency": "THB",
                        "subscriptionPeriod": "08:30 - 15:30",
                        "redemptionPeriod": "08:30 - 14:00",
                        "settlementPeriod": "T+4"
                      }
                    }
                    """.replace("__SYMBOL__", symbol);
                fulfillJson(route, 200, mfJson);
            }
        });

        // Mock /api/backend/icon/meta/* and /api/backend/icon/*
        page.route("**/api/backend/icon/**", route -> {
            String url = route.request().url();
            if (url.contains("/icon/meta/")) {
                fulfillJson(route, 200,
                        "{\"symbol\":\"MOCK\",\"asset_type\":\"us-stock\",\"clean_ticker\":\"MOCK\",\"monogram\":\"MO\",\"brand_color\":\"#38bdf8\",\"is_mutual_fund\":false,\"icon_url\":\"/api/backend/icon/MOCK\"}");
            } else {
                String svg = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\"><circle cx=\"12\" cy=\"12\" r=\"10\" fill=\"#38bdf8\"/></svg>";
                route.fulfill(new Route.FulfillOptions()
                        .setStatus(200)
                        .setContentType("image/svg+xml")
                        .setBody(svg));
            }
        });
    }

    private void mockSupabaseAndAuthAPIs(Page page, boolean seedOwnerSession) {
        if (seedOwnerSession) {
            String initSessionScript = """
                    try {
                      const expiresAt = Math.floor(Date.now() / 1000) + 36000;
                      const sessionPayload = {
                        access_token: 'mock-owner-jwt',
                        token_type: 'bearer',
                        expires_in: 36000,
                        expires_at: expiresAt,
                        refresh_token: 'mock-refresh-token',
                        user: {
                          id: 'owner-1',
                          aud: 'authenticated',
                          role: 'authenticated',
                          email: 'vipatpolk@gmail.com',
                          user_metadata: { full_name: 'Owner' },
                          app_metadata: { provider: 'email', providers: ['email'] },
                          identities: [{
                            id: 'id-owner-email',
                            identity_id: 'id-owner-email',
                            user_id: 'owner-1',
                            provider: 'email',
                            identity_data: { email: 'vipatpolk@gmail.com' },
                            created_at: '2025-01-01T00:00:00Z'
                          }]
                        }
                      };
                      localStorage.setItem('sb-jjdnxifgpbdvntfwhyzz-auth-token', JSON.stringify(sessionPayload));
                    } catch (e) {}
                    """;
            page.addInitScript(initSessionScript);
        }

        page.route("https://jjdnxifgpbdvntfwhyzz.supabase.co/**", route -> {
            String url = route.request().url();
            String method = route.request().method();
            String authHeader = route.request().headers().getOrDefault("authorization", "");
            boolean isStandardUser = authHeader.contains("mock-standard-jwt");

            if ("OPTIONS".equalsIgnoreCase(method)) {
                route.fulfill(new Route.FulfillOptions().setStatus(204));
                return;
            }

            if (url.contains("/auth/v1/logout")) {
                route.fulfill(new Route.FulfillOptions().setStatus(204));
                return;
            }

            if (url.contains("/auth/v1/token") || url.contains("/auth/v1/signup")) {
                String body = route.request().postData() != null ? route.request().postData() : "";
                boolean loginStandard = !body.contains("vipatpolk@gmail.com");
                String uid = loginStandard ? "std-1" : "owner-1";
                String email = loginStandard ? "user@example.com" : "vipatpolk@gmail.com";
                String token = loginStandard ? "mock-standard-jwt" : "mock-owner-jwt";
                String payload = """
                        {
                          "access_token": "%s",
                          "token_type": "bearer",
                          "expires_in": 36000,
                          "refresh_token": "mock-refresh-token",
                          "user": {
                            "id": "%s",
                            "aud": "authenticated",
                            "role": "authenticated",
                            "email": "%s",
                            "user_metadata": { "full_name": "%s" },
                            "identities": [{ "id": "id-%s", "identity_id": "id-%s", "user_id": "%s", "provider": "email", "identity_data": { "email": "%s" } }]
                          }
                        }
                        """.formatted(token, uid, email, loginStandard ? "Standard User" : "Owner", uid, uid, uid, email);
                fulfillJson(route, 200, payload);
                return;
            }

            if (url.contains("/auth/v1/user")) {
                String uid = isStandardUser ? "std-1" : "owner-1";
                String email = isStandardUser ? "user@example.com" : "vipatpolk@gmail.com";
                String userJson = """
                        {
                          "id": "%s",
                          "aud": "authenticated",
                          "role": "authenticated",
                          "email": "%s",
                          "user_metadata": { "full_name": "%s" },
                          "identities": [{ "id": "id-%s", "identity_id": "id-%s", "user_id": "%s", "provider": "email", "identity_data": { "email": "%s" } }]
                        }
                        """.formatted(uid, email, isStandardUser ? "Standard User" : "Owner", uid, uid, uid, email);
                fulfillJson(route, 200, userJson);
                return;
            }

            if (url.contains("/rest/v1/user_profiles")) {
                String row = isStandardUser
                        ? "{\"id\":\"std-1\",\"email\":\"user@example.com\",\"display_name\":\"Standard User\",\"avatar_url\":null,\"role\":\"user\",\"can_view_cloud_portfolio\":false}"
                        : "{\"id\":\"owner-1\",\"email\":\"vipatpolk@gmail.com\",\"display_name\":\"Owner\",\"avatar_url\":null,\"role\":\"owner\",\"can_view_cloud_portfolio\":true}";
                String accept = route.request().headers().getOrDefault("accept", "");
                fulfillJson(route, 200, accept.contains("object+json") ? row : "[" + row + "]");
                return;
            }

            if (url.contains("/rest/v1/user_settings")) {
                String row = "{\"currency\":\"THB\",\"language\":\"en\",\"theme\":\"dark\",\"privacy_mode\":false,\"target_allocations\":{},\"rebalance_targets\":{},\"created_at\":\"2025-01-01T00:00:00Z\",\"updated_at\":\"2025-01-01T00:00:00Z\"}";
                String accept = route.request().headers().getOrDefault("accept", "");
                fulfillJson(route, "POST".equalsIgnoreCase(method) ? 201 : 200,
                        accept.contains("object+json") ? row : "[" + row + "]");
                return;
            }

            fulfillJson(route, 200, "{}");
        });
    }

    public void mockPortfolioAPIError(Page page, int statusCode) {
        page.route("**/api/backend/**", route -> {
            fulfillJson(route, statusCode, "{\"error\":\"Internal Server Error\"}");
        });
    }

    public void recoverPortfolioAPIs(Page page) {
        page.unroute("**/api/backend/**");
        mockPortfolioAPIs(page);
    }

    private String extractQueryParam(String url, String key, String defaultVal) {
        int qIdx = url.indexOf('?');
        if (qIdx < 0) return defaultVal;
        String query = url.substring(qIdx + 1);
        for (String pair : query.split("&")) {
            String[] kv = pair.split("=", 2);
            if (kv.length == 2 && key.equals(kv[0])) {
                return kv[1];
            }
        }
        return defaultVal;
    }

    private void fulfillJson(Route route, int status, String body) {
        route.fulfill(new Route.FulfillOptions()
                .setStatus(status)
                .setContentType("application/json")
                .setBody(body != null ? body : "{}"));
    }

    private String loadResource(String path) {
        try (InputStream in = ApiRouteMocker.class.getResourceAsStream(path)) {
            if (in == null) return null;
            return new String(in.readAllBytes(), StandardCharsets.UTF_8);
        } catch (Exception e) {
            return null;
        }
    }
}
