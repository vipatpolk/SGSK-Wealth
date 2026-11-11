window.__SERENITY_REPORT_DATA__ = {
  "schemaVersion": 1,
  "summary": {
    "title": "sgsk-wealth",
    "totalScenarios": 51,
    "outcomes": {
      "passed": 51,
      "failed": 0,
      "pending": 0,
      "skipped": 0,
      "compromised": 0,
      "error": 0
    },
    "duration": 26379,
    "startedAt": "2026-11-11T09:47:32.331Z",
    "finishedAt": "2026-11-11T09:47:58.710Z",
    "testRunner": "Cucumber"
  },
  "scenarios": [
    {
      "name": "Request without X-API-Key is rejected with 401 Unauthorized",
      "category": "Backend API Authentication & Security",
      "outcome": "SUCCESS",
      "duration": 14,
      "startedAt": "2026-11-11T09:47:32.331Z",
      "source": {
        "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/api/01_auth_api.feature",
        "line": 7
      },
      "tags": [
        {
          "type": "capability",
          "name": "Api"
        },
        {
          "type": "feature",
          "name": "Backend API Authentication & Security"
        },
        {
          "type": "tag",
          "name": "api"
        },
        {
          "type": "tag",
          "name": "auth"
        },
        {
          "type": "module",
          "name": "frontend"
        }
      ],
      "activities": [
        {
          "name": "Before",
          "outcome": "SUCCESS",
          "duration": 3,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:32.333Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/support/hooks.ts",
            "line": 7
          }
        },
        {
          "name": "When I send an unauthorized GET request to \"/share-lot/sheets\"",
          "outcome": "SUCCESS",
          "duration": 6,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:32.337Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/api/01_auth_api.feature",
            "line": 8
          }
        },
        {
          "name": "Then the response status should be 401",
          "outcome": "SUCCESS",
          "duration": 0,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:32.343Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/api/01_auth_api.feature",
            "line": 9
          }
        },
        {
          "name": "And the response JSON should contain:\n{\n  \"detail\": \"Invalid or missing API Key\"\n}",
          "outcome": "SUCCESS",
          "duration": 1,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:32.344Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/api/01_auth_api.feature",
            "line": 10
          }
        }
      ],
      "executionHistory": [
        {
          "outcome": "SUCCESS",
          "run": "4",
          "timestamp": "2026-11-11T09:47:32.331Z",
          "duration": 14,
          "activities": [
            {
              "name": "Before",
              "outcome": "SUCCESS",
              "duration": 3,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:32.333Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/support/hooks.ts",
                "line": 7
              }
            },
            {
              "name": "When I send an unauthorized GET request to \"/share-lot/sheets\"",
              "outcome": "SUCCESS",
              "duration": 6,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:32.337Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/api/01_auth_api.feature",
                "line": 8
              }
            },
            {
              "name": "Then the response status should be 401",
              "outcome": "SUCCESS",
              "duration": 0,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:32.343Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/api/01_auth_api.feature",
                "line": 9
              }
            },
            {
              "name": "And the response JSON should contain:\n{\n  \"detail\": \"Invalid or missing API Key\"\n}",
              "outcome": "SUCCESS",
              "duration": 1,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:32.344Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/api/01_auth_api.feature",
                "line": 10
              }
            }
          ]
        }
      ],
      "narrative": "<p>As an API client\nI want my API requests to be authenticated via X-API-Key\nSo that unauthorized access to portfolio and financial data is prevented</p>\n",
      "id": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/api/01_auth_api.feature:7@frontend"
    },
    {
      "name": "Request with invalid X-API-Key is rejected with 401 Unauthorized",
      "category": "Backend API Authentication & Security",
      "outcome": "SUCCESS",
      "duration": 3,
      "startedAt": "2026-11-11T09:47:32.347Z",
      "source": {
        "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/api/01_auth_api.feature",
        "line": 17
      },
      "tags": [
        {
          "type": "capability",
          "name": "Api"
        },
        {
          "type": "feature",
          "name": "Backend API Authentication & Security"
        },
        {
          "type": "tag",
          "name": "api"
        },
        {
          "type": "tag",
          "name": "auth"
        },
        {
          "type": "module",
          "name": "frontend"
        }
      ],
      "activities": [
        {
          "name": "Before",
          "outcome": "SUCCESS",
          "duration": 0,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:32.348Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/support/hooks.ts",
            "line": 7
          }
        },
        {
          "name": "When I send a request to \"/price/exchange-rate\" with custom header \"X-API-Key\" value \"invalid-key-xyz\"",
          "outcome": "SUCCESS",
          "duration": 1,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:32.348Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/api/01_auth_api.feature",
            "line": 18
          }
        },
        {
          "name": "Then the response status should be 401",
          "outcome": "SUCCESS",
          "duration": 1,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:32.349Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/api/01_auth_api.feature",
            "line": 19
          }
        }
      ],
      "executionHistory": [
        {
          "outcome": "SUCCESS",
          "run": "4",
          "timestamp": "2026-11-11T09:47:32.331Z",
          "duration": 3,
          "activities": [
            {
              "name": "Before",
              "outcome": "SUCCESS",
              "duration": 0,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:32.348Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/support/hooks.ts",
                "line": 7
              }
            },
            {
              "name": "When I send a request to \"/price/exchange-rate\" with custom header \"X-API-Key\" value \"invalid-key-xyz\"",
              "outcome": "SUCCESS",
              "duration": 1,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:32.348Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/api/01_auth_api.feature",
                "line": 18
              }
            },
            {
              "name": "Then the response status should be 401",
              "outcome": "SUCCESS",
              "duration": 1,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:32.349Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/api/01_auth_api.feature",
                "line": 19
              }
            }
          ]
        }
      ],
      "narrative": "<p>As an API client\nI want my API requests to be authenticated via X-API-Key\nSo that unauthorized access to portfolio and financial data is prevented</p>\n",
      "id": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/api/01_auth_api.feature:17@frontend"
    },
    {
      "name": "Authorized request with valid X-API-Key succeeds",
      "category": "Backend API Authentication & Security",
      "outcome": "SUCCESS",
      "duration": 9,
      "startedAt": "2026-11-11T09:47:32.351Z",
      "source": {
        "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/api/01_auth_api.feature",
        "line": 21
      },
      "tags": [
        {
          "type": "capability",
          "name": "Api"
        },
        {
          "type": "feature",
          "name": "Backend API Authentication & Security"
        },
        {
          "type": "tag",
          "name": "api"
        },
        {
          "type": "tag",
          "name": "auth"
        },
        {
          "type": "module",
          "name": "frontend"
        }
      ],
      "activities": [
        {
          "name": "Before",
          "outcome": "SUCCESS",
          "duration": 0,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:32.351Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/support/hooks.ts",
            "line": 7
          }
        },
        {
          "name": "When I send a GET request to \"/price/exchange-rate\" with params:\n| from_currency | USD |\n| to_currency   | THB |",
          "outcome": "SUCCESS",
          "duration": 2,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:32.354Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/api/01_auth_api.feature",
            "line": 22
          }
        },
        {
          "name": "Then the response status should be 200",
          "outcome": "SUCCESS",
          "duration": 0,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:32.356Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/api/01_auth_api.feature",
            "line": 25
          }
        },
        {
          "name": "And the response should contain a positive number property \"rate\"",
          "outcome": "SUCCESS",
          "duration": 4,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:32.356Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/api/01_auth_api.feature",
            "line": 26
          }
        }
      ],
      "executionHistory": [
        {
          "outcome": "SUCCESS",
          "run": "4",
          "timestamp": "2026-11-11T09:47:32.331Z",
          "duration": 9,
          "activities": [
            {
              "name": "Before",
              "outcome": "SUCCESS",
              "duration": 0,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:32.351Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/support/hooks.ts",
                "line": 7
              }
            },
            {
              "name": "When I send a GET request to \"/price/exchange-rate\" with params:\n| from_currency | USD |\n| to_currency   | THB |",
              "outcome": "SUCCESS",
              "duration": 2,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:32.354Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/api/01_auth_api.feature",
                "line": 22
              }
            },
            {
              "name": "Then the response status should be 200",
              "outcome": "SUCCESS",
              "duration": 0,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:32.356Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/api/01_auth_api.feature",
                "line": 25
              }
            },
            {
              "name": "And the response should contain a positive number property \"rate\"",
              "outcome": "SUCCESS",
              "duration": 4,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:32.356Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/api/01_auth_api.feature",
                "line": 26
              }
            }
          ]
        }
      ],
      "narrative": "<p>As an API client\nI want my API requests to be authenticated via X-API-Key\nSo that unauthorized access to portfolio and financial data is prevented</p>\n",
      "id": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/api/01_auth_api.feature:21@frontend"
    },
    {
      "name": "Fetch USD to THB exchange rate",
      "category": "Price & Market Data API Services",
      "outcome": "SUCCESS",
      "duration": 4,
      "startedAt": "2026-11-11T09:47:32.361Z",
      "source": {
        "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/api/02_price_api.feature",
        "line": 7
      },
      "tags": [
        {
          "type": "capability",
          "name": "Api"
        },
        {
          "type": "feature",
          "name": "Price & Market Data API Services"
        },
        {
          "type": "tag",
          "name": "api"
        },
        {
          "type": "tag",
          "name": "price"
        },
        {
          "type": "module",
          "name": "frontend"
        }
      ],
      "activities": [
        {
          "name": "Before",
          "outcome": "SUCCESS",
          "duration": 0,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:32.361Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/support/hooks.ts",
            "line": 7
          }
        },
        {
          "name": "When I send a GET request to \"/price/exchange-rate\" with params:\n| from_currency | USD |\n| to_currency   | THB |",
          "outcome": "SUCCESS",
          "duration": 1,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:32.362Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/api/02_price_api.feature",
            "line": 8
          }
        },
        {
          "name": "Then the response status should be 200",
          "outcome": "SUCCESS",
          "duration": 1,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:32.363Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/api/02_price_api.feature",
            "line": 11
          }
        },
        {
          "name": "And the response time should be within 3000 ms",
          "outcome": "SUCCESS",
          "duration": 0,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:32.364Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/api/02_price_api.feature",
            "line": 12
          }
        },
        {
          "name": "And the response should contain a positive number property \"rate\"",
          "outcome": "SUCCESS",
          "duration": 1,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:32.364Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/api/02_price_api.feature",
            "line": 13
          }
        }
      ],
      "executionHistory": [
        {
          "outcome": "SUCCESS",
          "run": "4",
          "timestamp": "2026-11-11T09:47:32.331Z",
          "duration": 4,
          "activities": [
            {
              "name": "Before",
              "outcome": "SUCCESS",
              "duration": 0,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:32.361Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/support/hooks.ts",
                "line": 7
              }
            },
            {
              "name": "When I send a GET request to \"/price/exchange-rate\" with params:\n| from_currency | USD |\n| to_currency   | THB |",
              "outcome": "SUCCESS",
              "duration": 1,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:32.362Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/api/02_price_api.feature",
                "line": 8
              }
            },
            {
              "name": "Then the response status should be 200",
              "outcome": "SUCCESS",
              "duration": 1,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:32.363Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/api/02_price_api.feature",
                "line": 11
              }
            },
            {
              "name": "And the response time should be within 3000 ms",
              "outcome": "SUCCESS",
              "duration": 0,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:32.364Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/api/02_price_api.feature",
                "line": 12
              }
            },
            {
              "name": "And the response should contain a positive number property \"rate\"",
              "outcome": "SUCCESS",
              "duration": 1,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:32.364Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/api/02_price_api.feature",
                "line": 13
              }
            }
          ]
        }
      ],
      "narrative": "<p>As a portfolio tracking service\nI want to fetch foreign exchange rates and market price summaries\nSo that multi-currency asset valuations can be computed</p>\n",
      "id": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/api/02_price_api.feature:7@frontend"
    },
    {
      "name": "Batch fetch market prices for portfolio symbols",
      "category": "Price & Market Data API Services",
      "outcome": "SUCCESS",
      "duration": 3,
      "startedAt": "2026-11-11T09:47:32.366Z",
      "source": {
        "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/api/02_price_api.feature",
        "line": 15
      },
      "tags": [
        {
          "type": "capability",
          "name": "Api"
        },
        {
          "type": "feature",
          "name": "Price & Market Data API Services"
        },
        {
          "type": "tag",
          "name": "api"
        },
        {
          "type": "tag",
          "name": "price"
        },
        {
          "type": "module",
          "name": "frontend"
        }
      ],
      "activities": [
        {
          "name": "Before",
          "outcome": "SUCCESS",
          "duration": 0,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:32.366Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/support/hooks.ts",
            "line": 7
          }
        },
        {
          "name": "When I send a POST request to \"/price/fetch-prices\" with payload:\n{\n  \"summaries\": [\n    { \"symbol\": \"AAPL\", \"assetClass\": \"U.S. Stock\", \"currency\": \"USD\" },\n    { \"symbol\": \"PTT.BK\", \"assetClass\": \"Thai Stock\", \"currency\": \"THB\" }\n  ]\n}",
          "outcome": "SUCCESS",
          "duration": 1,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:32.367Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/api/02_price_api.feature",
            "line": 16
          }
        },
        {
          "name": "Then the response status should be 200",
          "outcome": "SUCCESS",
          "duration": 0,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:32.368Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/api/02_price_api.feature",
            "line": 25
          }
        },
        {
          "name": "And the response time should be within 5000 ms",
          "outcome": "SUCCESS",
          "duration": 0,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:32.368Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/api/02_price_api.feature",
            "line": 26
          }
        }
      ],
      "executionHistory": [
        {
          "outcome": "SUCCESS",
          "run": "4",
          "timestamp": "2026-11-11T09:47:32.331Z",
          "duration": 3,
          "activities": [
            {
              "name": "Before",
              "outcome": "SUCCESS",
              "duration": 0,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:32.366Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/support/hooks.ts",
                "line": 7
              }
            },
            {
              "name": "When I send a POST request to \"/price/fetch-prices\" with payload:\n{\n  \"summaries\": [\n    { \"symbol\": \"AAPL\", \"assetClass\": \"U.S. Stock\", \"currency\": \"USD\" },\n    { \"symbol\": \"PTT.BK\", \"assetClass\": \"Thai Stock\", \"currency\": \"THB\" }\n  ]\n}",
              "outcome": "SUCCESS",
              "duration": 1,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:32.367Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/api/02_price_api.feature",
                "line": 16
              }
            },
            {
              "name": "Then the response status should be 200",
              "outcome": "SUCCESS",
              "duration": 0,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:32.368Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/api/02_price_api.feature",
                "line": 25
              }
            },
            {
              "name": "And the response time should be within 5000 ms",
              "outcome": "SUCCESS",
              "duration": 0,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:32.368Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/api/02_price_api.feature",
                "line": 26
              }
            }
          ]
        }
      ],
      "narrative": "<p>As a portfolio tracking service\nI want to fetch foreign exchange rates and market price summaries\nSo that multi-currency asset valuations can be computed</p>\n",
      "id": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/api/02_price_api.feature:15@frontend"
    },
    {
      "name": "Fetch portfolio holdings converted to THB",
      "category": "Portfolio & Financial Analytics API Services",
      "outcome": "SUCCESS",
      "duration": 3,
      "startedAt": "2026-11-11T09:47:32.369Z",
      "source": {
        "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/api/03_portfolio_api.feature",
        "line": 7
      },
      "tags": [
        {
          "type": "capability",
          "name": "Api"
        },
        {
          "type": "feature",
          "name": "Portfolio & Financial Analytics API Services"
        },
        {
          "type": "tag",
          "name": "api"
        },
        {
          "type": "tag",
          "name": "portfolio"
        },
        {
          "type": "module",
          "name": "frontend"
        }
      ],
      "activities": [
        {
          "name": "Before",
          "outcome": "SUCCESS",
          "duration": 0,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:32.370Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/support/hooks.ts",
            "line": 7
          }
        },
        {
          "name": "When I send a GET request to \"/portfolio/holdings\" with params:\n| tab_id   | all |\n| currency | THB |",
          "outcome": "SUCCESS",
          "duration": 1,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:32.370Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/api/03_portfolio_api.feature",
            "line": 8
          }
        },
        {
          "name": "Then the response status should be 200",
          "outcome": "SUCCESS",
          "duration": 0,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:32.372Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/api/03_portfolio_api.feature",
            "line": 11
          }
        },
        {
          "name": "And the response time should be within 4000 ms",
          "outcome": "SUCCESS",
          "duration": 0,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:32.372Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/api/03_portfolio_api.feature",
            "line": 12
          }
        }
      ],
      "executionHistory": [
        {
          "outcome": "SUCCESS",
          "run": "4",
          "timestamp": "2026-11-11T09:47:32.331Z",
          "duration": 3,
          "activities": [
            {
              "name": "Before",
              "outcome": "SUCCESS",
              "duration": 0,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:32.370Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/support/hooks.ts",
                "line": 7
              }
            },
            {
              "name": "When I send a GET request to \"/portfolio/holdings\" with params:\n| tab_id   | all |\n| currency | THB |",
              "outcome": "SUCCESS",
              "duration": 1,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:32.370Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/api/03_portfolio_api.feature",
                "line": 8
              }
            },
            {
              "name": "Then the response status should be 200",
              "outcome": "SUCCESS",
              "duration": 0,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:32.372Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/api/03_portfolio_api.feature",
                "line": 11
              }
            },
            {
              "name": "And the response time should be within 4000 ms",
              "outcome": "SUCCESS",
              "duration": 0,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:32.372Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/api/03_portfolio_api.feature",
                "line": 12
              }
            }
          ]
        }
      ],
      "narrative": "<p>As a portfolio tracking service\nI want to query portfolio holdings, performance analytics, and dividends\nSo that users can monitor their investment accounts</p>\n",
      "id": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/api/03_portfolio_api.feature:7@frontend"
    },
    {
      "name": "Fetch portfolio performance metrics for YTD timeframe",
      "category": "Portfolio & Financial Analytics API Services",
      "outcome": "SUCCESS",
      "duration": 2,
      "startedAt": "2026-11-11T09:47:32.373Z",
      "source": {
        "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/api/03_portfolio_api.feature",
        "line": 14
      },
      "tags": [
        {
          "type": "capability",
          "name": "Api"
        },
        {
          "type": "feature",
          "name": "Portfolio & Financial Analytics API Services"
        },
        {
          "type": "tag",
          "name": "api"
        },
        {
          "type": "tag",
          "name": "portfolio"
        },
        {
          "type": "module",
          "name": "frontend"
        }
      ],
      "activities": [
        {
          "name": "Before",
          "outcome": "SUCCESS",
          "duration": 0,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:32.373Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/support/hooks.ts",
            "line": 7
          }
        },
        {
          "name": "When I send a GET request to \"/portfolio/performance\" with params:\n| timeframe | YTD |\n| currency  | THB |",
          "outcome": "SUCCESS",
          "duration": 1,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:32.374Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/api/03_portfolio_api.feature",
            "line": 15
          }
        },
        {
          "name": "Then the response status should be 200",
          "outcome": "SUCCESS",
          "duration": 0,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:32.375Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/api/03_portfolio_api.feature",
            "line": 18
          }
        },
        {
          "name": "And the response time should be within 3000 ms",
          "outcome": "SUCCESS",
          "duration": 0,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:32.375Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/api/03_portfolio_api.feature",
            "line": 19
          }
        }
      ],
      "executionHistory": [
        {
          "outcome": "SUCCESS",
          "run": "4",
          "timestamp": "2026-11-11T09:47:32.331Z",
          "duration": 2,
          "activities": [
            {
              "name": "Before",
              "outcome": "SUCCESS",
              "duration": 0,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:32.373Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/support/hooks.ts",
                "line": 7
              }
            },
            {
              "name": "When I send a GET request to \"/portfolio/performance\" with params:\n| timeframe | YTD |\n| currency  | THB |",
              "outcome": "SUCCESS",
              "duration": 1,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:32.374Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/api/03_portfolio_api.feature",
                "line": 15
              }
            },
            {
              "name": "Then the response status should be 200",
              "outcome": "SUCCESS",
              "duration": 0,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:32.375Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/api/03_portfolio_api.feature",
                "line": 18
              }
            },
            {
              "name": "And the response time should be within 3000 ms",
              "outcome": "SUCCESS",
              "duration": 0,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:32.375Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/api/03_portfolio_api.feature",
                "line": 19
              }
            }
          ]
        }
      ],
      "narrative": "<p>As a portfolio tracking service\nI want to query portfolio holdings, performance analytics, and dividends\nSo that users can monitor their investment accounts</p>\n",
      "id": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/api/03_portfolio_api.feature:14@frontend"
    },
    {
      "name": "Fetch dividend analytics ledger and YOC metrics",
      "category": "Portfolio & Financial Analytics API Services",
      "outcome": "SUCCESS",
      "duration": 3,
      "startedAt": "2026-11-11T09:47:32.376Z",
      "source": {
        "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/api/03_portfolio_api.feature",
        "line": 21
      },
      "tags": [
        {
          "type": "capability",
          "name": "Api"
        },
        {
          "type": "feature",
          "name": "Portfolio & Financial Analytics API Services"
        },
        {
          "type": "tag",
          "name": "api"
        },
        {
          "type": "tag",
          "name": "portfolio"
        },
        {
          "type": "module",
          "name": "frontend"
        }
      ],
      "activities": [
        {
          "name": "Before",
          "outcome": "SUCCESS",
          "duration": 0,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:32.376Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/support/hooks.ts",
            "line": 7
          }
        },
        {
          "name": "When I send a GET request to \"/portfolio/dividend\" with params:\n| currency | THB |\n| tab_id   | all |",
          "outcome": "SUCCESS",
          "duration": 0,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:32.377Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/api/03_portfolio_api.feature",
            "line": 22
          }
        },
        {
          "name": "Then the response status should be 200",
          "outcome": "SUCCESS",
          "duration": 0,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:32.378Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/api/03_portfolio_api.feature",
            "line": 25
          }
        },
        {
          "name": "And the response time should be within 4000 ms",
          "outcome": "SUCCESS",
          "duration": 0,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:32.378Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/api/03_portfolio_api.feature",
            "line": 26
          }
        }
      ],
      "executionHistory": [
        {
          "outcome": "SUCCESS",
          "run": "4",
          "timestamp": "2026-11-11T09:47:32.331Z",
          "duration": 3,
          "activities": [
            {
              "name": "Before",
              "outcome": "SUCCESS",
              "duration": 0,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:32.376Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/support/hooks.ts",
                "line": 7
              }
            },
            {
              "name": "When I send a GET request to \"/portfolio/dividend\" with params:\n| currency | THB |\n| tab_id   | all |",
              "outcome": "SUCCESS",
              "duration": 0,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:32.377Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/api/03_portfolio_api.feature",
                "line": 22
              }
            },
            {
              "name": "Then the response status should be 200",
              "outcome": "SUCCESS",
              "duration": 0,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:32.378Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/api/03_portfolio_api.feature",
                "line": 25
              }
            },
            {
              "name": "And the response time should be within 4000 ms",
              "outcome": "SUCCESS",
              "duration": 0,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:32.378Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/api/03_portfolio_api.feature",
                "line": 26
              }
            }
          ]
        }
      ],
      "narrative": "<p>As a portfolio tracking service\nI want to query portfolio holdings, performance analytics, and dividends\nSo that users can monitor their investment accounts</p>\n",
      "id": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/api/03_portfolio_api.feature:21@frontend"
    },
    {
      "name": "TVM Calculator calculates future value (FV)",
      "category": "Financial Simulators & Portfolio Tools API",
      "outcome": "SUCCESS",
      "duration": 8,
      "startedAt": "2026-11-11T09:47:32.379Z",
      "source": {
        "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/api/04_tools_api.feature",
        "line": 7
      },
      "tags": [
        {
          "type": "capability",
          "name": "Api"
        },
        {
          "type": "feature",
          "name": "Financial Simulators & Portfolio Tools API"
        },
        {
          "type": "tag",
          "name": "api"
        },
        {
          "type": "tag",
          "name": "tools"
        },
        {
          "type": "module",
          "name": "frontend"
        }
      ],
      "activities": [
        {
          "name": "Before",
          "outcome": "SUCCESS",
          "duration": 0,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:32.380Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/support/hooks.ts",
            "line": 7
          }
        },
        {
          "name": "When I send a POST request to \"/portfolio/tools/tvm\" with payload:\n{\n  \"mode\": \"FV\",\n  \"principal\": 100000,\n  \"annual_rate_pct\": 8.0,\n  \"compounding_frequency\": \"MONTHLY\",\n  \"contribution_amount\": 5000,\n  \"contribution_timing\": \"END\",\n  \"years\": 10\n}",
          "outcome": "SUCCESS",
          "duration": 5,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:32.380Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/api/04_tools_api.feature",
            "line": 8
          }
        },
        {
          "name": "Then the response status should be 200",
          "outcome": "SUCCESS",
          "duration": 0,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:32.386Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/api/04_tools_api.feature",
            "line": 20
          }
        },
        {
          "name": "And the response time should be within 2000 ms",
          "outcome": "SUCCESS",
          "duration": 0,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:32.386Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/api/04_tools_api.feature",
            "line": 21
          }
        },
        {
          "name": "And the response JSON should contain:\n{\n  \"mode\": \"FV\"\n}",
          "outcome": "SUCCESS",
          "duration": 0,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:32.386Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/api/04_tools_api.feature",
            "line": 22
          }
        }
      ],
      "executionHistory": [
        {
          "outcome": "SUCCESS",
          "run": "4",
          "timestamp": "2026-11-11T09:47:32.331Z",
          "duration": 8,
          "activities": [
            {
              "name": "Before",
              "outcome": "SUCCESS",
              "duration": 0,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:32.380Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/support/hooks.ts",
                "line": 7
              }
            },
            {
              "name": "When I send a POST request to \"/portfolio/tools/tvm\" with payload:\n{\n  \"mode\": \"FV\",\n  \"principal\": 100000,\n  \"annual_rate_pct\": 8.0,\n  \"compounding_frequency\": \"MONTHLY\",\n  \"contribution_amount\": 5000,\n  \"contribution_timing\": \"END\",\n  \"years\": 10\n}",
              "outcome": "SUCCESS",
              "duration": 5,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:32.380Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/api/04_tools_api.feature",
                "line": 8
              }
            },
            {
              "name": "Then the response status should be 200",
              "outcome": "SUCCESS",
              "duration": 0,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:32.386Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/api/04_tools_api.feature",
                "line": 20
              }
            },
            {
              "name": "And the response time should be within 2000 ms",
              "outcome": "SUCCESS",
              "duration": 0,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:32.386Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/api/04_tools_api.feature",
                "line": 21
              }
            },
            {
              "name": "And the response JSON should contain:\n{\n  \"mode\": \"FV\"\n}",
              "outcome": "SUCCESS",
              "duration": 0,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:32.386Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/api/04_tools_api.feature",
                "line": 22
              }
            }
          ]
        }
      ],
      "narrative": "<p>As an investor\nI want to calculate TVM wealth compounding, forward cost basis, and portfolio rebalances\nSo that I can plan future financial decisions accurately</p>\n",
      "id": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/api/04_tools_api.feature:7@frontend"
    },
    {
      "name": "Average Cost Calculator forward buy simulation",
      "category": "Financial Simulators & Portfolio Tools API",
      "outcome": "SUCCESS",
      "duration": 3,
      "startedAt": "2026-11-11T09:47:32.387Z",
      "source": {
        "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/api/04_tools_api.feature",
        "line": 29
      },
      "tags": [
        {
          "type": "capability",
          "name": "Api"
        },
        {
          "type": "feature",
          "name": "Financial Simulators & Portfolio Tools API"
        },
        {
          "type": "tag",
          "name": "api"
        },
        {
          "type": "tag",
          "name": "tools"
        },
        {
          "type": "module",
          "name": "frontend"
        }
      ],
      "activities": [
        {
          "name": "Before",
          "outcome": "SUCCESS",
          "duration": 0,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:32.388Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/support/hooks.ts",
            "line": 7
          }
        },
        {
          "name": "When I send a POST request to \"/portfolio/tools/simulate\" with payload:\n{\n  \"symbol\": \"AAPL\",\n  \"currency\": \"USD\",\n  \"current_shares\": 10,\n  \"current_avg_cost\": 150.0,\n  \"current_market_price\": 200.0,\n  \"orders\": [\n    { \"order_type\": \"BUY\", \"shares\": 5, \"price\": 180.0, \"fee_pct\": 0.1 }\n  ]\n}",
          "outcome": "SUCCESS",
          "duration": 1,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:32.388Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/api/04_tools_api.feature",
            "line": 30
          }
        },
        {
          "name": "Then the response status should be 200",
          "outcome": "SUCCESS",
          "duration": 0,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:32.389Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/api/04_tools_api.feature",
            "line": 43
          }
        },
        {
          "name": "And the response time should be within 2000 ms",
          "outcome": "SUCCESS",
          "duration": 0,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:32.390Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/api/04_tools_api.feature",
            "line": 44
          }
        }
      ],
      "executionHistory": [
        {
          "outcome": "SUCCESS",
          "run": "4",
          "timestamp": "2026-11-11T09:47:32.331Z",
          "duration": 3,
          "activities": [
            {
              "name": "Before",
              "outcome": "SUCCESS",
              "duration": 0,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:32.388Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/support/hooks.ts",
                "line": 7
              }
            },
            {
              "name": "When I send a POST request to \"/portfolio/tools/simulate\" with payload:\n{\n  \"symbol\": \"AAPL\",\n  \"currency\": \"USD\",\n  \"current_shares\": 10,\n  \"current_avg_cost\": 150.0,\n  \"current_market_price\": 200.0,\n  \"orders\": [\n    { \"order_type\": \"BUY\", \"shares\": 5, \"price\": 180.0, \"fee_pct\": 0.1 }\n  ]\n}",
              "outcome": "SUCCESS",
              "duration": 1,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:32.388Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/api/04_tools_api.feature",
                "line": 30
              }
            },
            {
              "name": "Then the response status should be 200",
              "outcome": "SUCCESS",
              "duration": 0,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:32.389Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/api/04_tools_api.feature",
                "line": 43
              }
            },
            {
              "name": "And the response time should be within 2000 ms",
              "outcome": "SUCCESS",
              "duration": 0,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:32.390Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/api/04_tools_api.feature",
                "line": 44
              }
            }
          ]
        }
      ],
      "narrative": "<p>As an investor\nI want to calculate TVM wealth compounding, forward cost basis, and portfolio rebalances\nSo that I can plan future financial decisions accurately</p>\n",
      "id": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/api/04_tools_api.feature:29@frontend"
    },
    {
      "name": "TC-NAV-01: View Mode Switcher navigates between primary views",
      "category": "Global Navigation & Header Controls",
      "outcome": "SUCCESS",
      "duration": 1025,
      "startedAt": "2026-11-11T09:47:32.391Z",
      "source": {
        "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/01_navigation_header.feature",
        "line": 10
      },
      "tags": [
        {
          "type": "capability",
          "name": "Ui"
        },
        {
          "type": "feature",
          "name": "Global Navigation & Header Controls"
        },
        {
          "type": "tag",
          "name": "ui"
        },
        {
          "type": "tag",
          "name": "navigation"
        },
        {
          "type": "tag",
          "name": "smoke"
        },
        {
          "type": "module",
          "name": "frontend"
        }
      ],
      "activities": [
        {
          "name": "Before",
          "outcome": "SUCCESS",
          "duration": 42,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:32.391Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/support/hooks.ts",
            "line": 11
          }
        },
        {
          "name": "Given I open the SGSK Wealth application",
          "outcome": "SUCCESS",
          "duration": 271,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:32.433Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/01_navigation_header.feature",
            "line": 8
          }
        },
        {
          "name": "Then the Dashboard view should be visible",
          "outcome": "SUCCESS",
          "duration": 110,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:32.704Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/01_navigation_header.feature",
            "line": 11
          }
        },
        {
          "name": "When I switch to the Holdings view",
          "outcome": "SUCCESS",
          "duration": 50,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:32.815Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/01_navigation_header.feature",
            "line": 12
          }
        },
        {
          "name": "Then the asset tab bar should be visible",
          "outcome": "SUCCESS",
          "duration": 39,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:32.865Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/01_navigation_header.feature",
            "line": 13
          }
        },
        {
          "name": "When I switch to the Analytics view",
          "outcome": "SUCCESS",
          "duration": 42,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:32.904Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/01_navigation_header.feature",
            "line": 14
          }
        },
        {
          "name": "Then the analytics container should be visible",
          "outcome": "SUCCESS",
          "duration": 39,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:32.946Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/01_navigation_header.feature",
            "line": 15
          }
        },
        {
          "name": "When I switch to the Allocation sub-tab",
          "outcome": "SUCCESS",
          "duration": 76,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:32.986Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/01_navigation_header.feature",
            "line": 16
          }
        },
        {
          "name": "Then the asset allocation container should be visible",
          "outcome": "SUCCESS",
          "duration": 33,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:33.063Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/01_navigation_header.feature",
            "line": 17
          }
        },
        {
          "name": "When I switch to the Performance sub-tab",
          "outcome": "SUCCESS",
          "duration": 68,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:33.096Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/01_navigation_header.feature",
            "line": 18
          }
        },
        {
          "name": "Then the performance analytics container should be visible",
          "outcome": "SUCCESS",
          "duration": 35,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:33.164Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/01_navigation_header.feature",
            "line": 19
          }
        },
        {
          "name": "When I switch to the Transactions view",
          "outcome": "SUCCESS",
          "duration": 34,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:33.199Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/01_navigation_header.feature",
            "line": 20
          }
        },
        {
          "name": "Then the transaction history container should be visible",
          "outcome": "SUCCESS",
          "duration": 64,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:33.233Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/01_navigation_header.feature",
            "line": 21
          }
        },
        {
          "name": "When I switch back to the Dashboard view",
          "outcome": "SUCCESS",
          "duration": 41,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:33.298Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/01_navigation_header.feature",
            "line": 22
          }
        },
        {
          "name": "Then the Dashboard view should be visible",
          "outcome": "SUCCESS",
          "duration": 47,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:33.339Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/01_navigation_header.feature",
            "line": 23
          }
        }
      ],
      "executionHistory": [
        {
          "outcome": "SUCCESS",
          "run": "4",
          "timestamp": "2026-11-11T09:47:32.331Z",
          "duration": 1025,
          "activities": [
            {
              "name": "Before",
              "outcome": "SUCCESS",
              "duration": 42,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:32.391Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/support/hooks.ts",
                "line": 11
              }
            },
            {
              "name": "Given I open the SGSK Wealth application",
              "outcome": "SUCCESS",
              "duration": 271,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:32.433Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/01_navigation_header.feature",
                "line": 8
              }
            },
            {
              "name": "Then the Dashboard view should be visible",
              "outcome": "SUCCESS",
              "duration": 110,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:32.704Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/01_navigation_header.feature",
                "line": 11
              }
            },
            {
              "name": "When I switch to the Holdings view",
              "outcome": "SUCCESS",
              "duration": 50,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:32.815Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/01_navigation_header.feature",
                "line": 12
              }
            },
            {
              "name": "Then the asset tab bar should be visible",
              "outcome": "SUCCESS",
              "duration": 39,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:32.865Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/01_navigation_header.feature",
                "line": 13
              }
            },
            {
              "name": "When I switch to the Analytics view",
              "outcome": "SUCCESS",
              "duration": 42,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:32.904Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/01_navigation_header.feature",
                "line": 14
              }
            },
            {
              "name": "Then the analytics container should be visible",
              "outcome": "SUCCESS",
              "duration": 39,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:32.946Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/01_navigation_header.feature",
                "line": 15
              }
            },
            {
              "name": "When I switch to the Allocation sub-tab",
              "outcome": "SUCCESS",
              "duration": 76,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:32.986Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/01_navigation_header.feature",
                "line": 16
              }
            },
            {
              "name": "Then the asset allocation container should be visible",
              "outcome": "SUCCESS",
              "duration": 33,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:33.063Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/01_navigation_header.feature",
                "line": 17
              }
            },
            {
              "name": "When I switch to the Performance sub-tab",
              "outcome": "SUCCESS",
              "duration": 68,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:33.096Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/01_navigation_header.feature",
                "line": 18
              }
            },
            {
              "name": "Then the performance analytics container should be visible",
              "outcome": "SUCCESS",
              "duration": 35,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:33.164Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/01_navigation_header.feature",
                "line": 19
              }
            },
            {
              "name": "When I switch to the Transactions view",
              "outcome": "SUCCESS",
              "duration": 34,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:33.199Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/01_navigation_header.feature",
                "line": 20
              }
            },
            {
              "name": "Then the transaction history container should be visible",
              "outcome": "SUCCESS",
              "duration": 64,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:33.233Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/01_navigation_header.feature",
                "line": 21
              }
            },
            {
              "name": "When I switch back to the Dashboard view",
              "outcome": "SUCCESS",
              "duration": 41,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:33.298Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/01_navigation_header.feature",
                "line": 22
              }
            },
            {
              "name": "Then the Dashboard view should be visible",
              "outcome": "SUCCESS",
              "duration": 47,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:33.339Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/01_navigation_header.feature",
                "line": 23
              }
            }
          ]
        }
      ],
      "narrative": "<p>As a SGSK Wealth investor\nI want to switch views, currencies, and themes\nSo that I can monitor my portfolio across different layouts and currencies</p>\n",
      "cast": [
        {
          "name": "Investor",
          "abilities": [
            {
              "name": "PerformActivities"
            },
            {
              "name": "AnswerQuestions"
            },
            {
              "name": "RaiseErrors"
            },
            {
              "name": "ScheduleWork",
              "details": "{\"scheduler\":{\"clock\":{\"timeAdjustment\":{\"milliseconds\":0}},\"interactionTimeout\":{\"milliseconds\":5000}}}"
            },
            {
              "name": "BrowseTheWebWithPlaywright"
            },
            {
              "name": "TakeNotes",
              "details": "{\"notepad\":{}}"
            }
          ]
        }
      ],
      "id": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/01_navigation_header.feature:10@frontend"
    },
    {
      "name": "TC-NAV-02: Currency Toggle switches display currency between USD and THB",
      "category": "Global Navigation & Header Controls",
      "outcome": "SUCCESS",
      "duration": 482,
      "startedAt": "2026-11-11T09:47:33.418Z",
      "source": {
        "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/01_navigation_header.feature",
        "line": 25
      },
      "tags": [
        {
          "type": "capability",
          "name": "Ui"
        },
        {
          "type": "feature",
          "name": "Global Navigation & Header Controls"
        },
        {
          "type": "tag",
          "name": "ui"
        },
        {
          "type": "tag",
          "name": "navigation"
        },
        {
          "type": "tag",
          "name": "smoke"
        },
        {
          "type": "module",
          "name": "frontend"
        }
      ],
      "activities": [
        {
          "name": "Before",
          "outcome": "SUCCESS",
          "duration": 31,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:33.418Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/support/hooks.ts",
            "line": 11
          }
        },
        {
          "name": "Given I open the SGSK Wealth application",
          "outcome": "SUCCESS",
          "duration": 268,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:33.449Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/01_navigation_header.feature",
            "line": 8
          }
        },
        {
          "name": "When I switch currency to USD",
          "outcome": "SUCCESS",
          "duration": 88,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:33.718Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/01_navigation_header.feature",
            "line": 26
          }
        },
        {
          "name": "Then the USD currency button should be active",
          "outcome": "SUCCESS",
          "duration": 14,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:33.807Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/01_navigation_header.feature",
            "line": 27
          }
        },
        {
          "name": "When I switch currency to THB",
          "outcome": "SUCCESS",
          "duration": 40,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:33.822Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/01_navigation_header.feature",
            "line": 28
          }
        },
        {
          "name": "Then the THB currency button should be active",
          "outcome": "SUCCESS",
          "duration": 27,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:33.862Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/01_navigation_header.feature",
            "line": 29
          }
        }
      ],
      "executionHistory": [
        {
          "outcome": "SUCCESS",
          "run": "4",
          "timestamp": "2026-11-11T09:47:32.331Z",
          "duration": 482,
          "activities": [
            {
              "name": "Before",
              "outcome": "SUCCESS",
              "duration": 31,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:33.418Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/support/hooks.ts",
                "line": 11
              }
            },
            {
              "name": "Given I open the SGSK Wealth application",
              "outcome": "SUCCESS",
              "duration": 268,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:33.449Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/01_navigation_header.feature",
                "line": 8
              }
            },
            {
              "name": "When I switch currency to USD",
              "outcome": "SUCCESS",
              "duration": 88,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:33.718Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/01_navigation_header.feature",
                "line": 26
              }
            },
            {
              "name": "Then the USD currency button should be active",
              "outcome": "SUCCESS",
              "duration": 14,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:33.807Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/01_navigation_header.feature",
                "line": 27
              }
            },
            {
              "name": "When I switch currency to THB",
              "outcome": "SUCCESS",
              "duration": 40,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:33.822Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/01_navigation_header.feature",
                "line": 28
              }
            },
            {
              "name": "Then the THB currency button should be active",
              "outcome": "SUCCESS",
              "duration": 27,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:33.862Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/01_navigation_header.feature",
                "line": 29
              }
            }
          ]
        }
      ],
      "narrative": "<p>As a SGSK Wealth investor\nI want to switch views, currencies, and themes\nSo that I can monitor my portfolio across different layouts and currencies</p>\n",
      "cast": [
        {
          "name": "Investor",
          "abilities": [
            {
              "name": "PerformActivities"
            },
            {
              "name": "AnswerQuestions"
            },
            {
              "name": "RaiseErrors"
            },
            {
              "name": "ScheduleWork",
              "details": "{\"scheduler\":{\"clock\":{\"timeAdjustment\":{\"milliseconds\":0}},\"interactionTimeout\":{\"milliseconds\":5000}}}"
            },
            {
              "name": "BrowseTheWebWithPlaywright"
            },
            {
              "name": "TakeNotes",
              "details": "{\"notepad\":{}}"
            }
          ]
        }
      ],
      "id": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/01_navigation_header.feature:25@frontend"
    },
    {
      "name": "TC-NAV-03: Theme Switcher toggles dark and light theme state",
      "category": "Global Navigation & Header Controls",
      "outcome": "SUCCESS",
      "duration": 449,
      "startedAt": "2026-11-11T09:47:33.900Z",
      "source": {
        "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/01_navigation_header.feature",
        "line": 31
      },
      "tags": [
        {
          "type": "capability",
          "name": "Ui"
        },
        {
          "type": "feature",
          "name": "Global Navigation & Header Controls"
        },
        {
          "type": "tag",
          "name": "ui"
        },
        {
          "type": "tag",
          "name": "navigation"
        },
        {
          "type": "tag",
          "name": "smoke"
        },
        {
          "type": "module",
          "name": "frontend"
        }
      ],
      "activities": [
        {
          "name": "Before",
          "outcome": "SUCCESS",
          "duration": 32,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:33.901Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/support/hooks.ts",
            "line": 11
          }
        },
        {
          "name": "Given I open the SGSK Wealth application",
          "outcome": "SUCCESS",
          "duration": 250,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:33.933Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/01_navigation_header.feature",
            "line": 8
          }
        },
        {
          "name": "When I toggle the theme",
          "outcome": "SUCCESS",
          "duration": 100,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:34.183Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/01_navigation_header.feature",
            "line": 32
          }
        },
        {
          "name": "Then the document theme attribute should be \"light\"",
          "outcome": "SUCCESS",
          "duration": 9,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:34.283Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/01_navigation_header.feature",
            "line": 33
          }
        },
        {
          "name": "When I toggle the theme",
          "outcome": "SUCCESS",
          "duration": 43,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:34.292Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/01_navigation_header.feature",
            "line": 34
          }
        },
        {
          "name": "Then the document theme attribute should be \"dark\"",
          "outcome": "SUCCESS",
          "duration": 2,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:34.336Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/01_navigation_header.feature",
            "line": 35
          }
        }
      ],
      "executionHistory": [
        {
          "outcome": "SUCCESS",
          "run": "4",
          "timestamp": "2026-11-11T09:47:32.331Z",
          "duration": 449,
          "activities": [
            {
              "name": "Before",
              "outcome": "SUCCESS",
              "duration": 32,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:33.901Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/support/hooks.ts",
                "line": 11
              }
            },
            {
              "name": "Given I open the SGSK Wealth application",
              "outcome": "SUCCESS",
              "duration": 250,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:33.933Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/01_navigation_header.feature",
                "line": 8
              }
            },
            {
              "name": "When I toggle the theme",
              "outcome": "SUCCESS",
              "duration": 100,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:34.183Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/01_navigation_header.feature",
                "line": 32
              }
            },
            {
              "name": "Then the document theme attribute should be \"light\"",
              "outcome": "SUCCESS",
              "duration": 9,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:34.283Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/01_navigation_header.feature",
                "line": 33
              }
            },
            {
              "name": "When I toggle the theme",
              "outcome": "SUCCESS",
              "duration": 43,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:34.292Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/01_navigation_header.feature",
                "line": 34
              }
            },
            {
              "name": "Then the document theme attribute should be \"dark\"",
              "outcome": "SUCCESS",
              "duration": 2,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:34.336Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/01_navigation_header.feature",
                "line": 35
              }
            }
          ]
        }
      ],
      "narrative": "<p>As a SGSK Wealth investor\nI want to switch views, currencies, and themes\nSo that I can monitor my portfolio across different layouts and currencies</p>\n",
      "cast": [
        {
          "name": "Investor",
          "abilities": [
            {
              "name": "PerformActivities"
            },
            {
              "name": "AnswerQuestions"
            },
            {
              "name": "RaiseErrors"
            },
            {
              "name": "ScheduleWork",
              "details": "{\"scheduler\":{\"clock\":{\"timeAdjustment\":{\"milliseconds\":0}},\"interactionTimeout\":{\"milliseconds\":5000}}}"
            },
            {
              "name": "BrowseTheWebWithPlaywright"
            },
            {
              "name": "TakeNotes",
              "details": "{\"notepad\":{}}"
            }
          ]
        }
      ],
      "id": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/01_navigation_header.feature:31@frontend"
    },
    {
      "name": "TC-HLD-01: Asset Tab Filtering displays symbols matching tab category",
      "category": "Portfolio Holdings & FIFO Share Lot Accounting",
      "outcome": "SUCCESS",
      "duration": 890,
      "startedAt": "2026-11-11T09:47:34.350Z",
      "source": {
        "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/02_holdings_fifolots.feature",
        "line": 10
      },
      "tags": [
        {
          "type": "capability",
          "name": "Ui"
        },
        {
          "type": "feature",
          "name": "Portfolio Holdings & FIFO Share Lot Accounting"
        },
        {
          "type": "tag",
          "name": "ui"
        },
        {
          "type": "tag",
          "name": "holdings"
        },
        {
          "type": "module",
          "name": "frontend"
        }
      ],
      "activities": [
        {
          "name": "Before",
          "outcome": "SUCCESS",
          "duration": 34,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:34.351Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/support/hooks.ts",
            "line": 11
          }
        },
        {
          "name": "Given I open the SGSK Wealth application",
          "outcome": "SUCCESS",
          "duration": 284,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:34.386Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/02_holdings_fifolots.feature",
            "line": 8
          }
        },
        {
          "name": "When I select the \"U.S. Stock\" asset tab",
          "outcome": "SUCCESS",
          "duration": 227,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:34.670Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/02_holdings_fifolots.feature",
            "line": 11
          }
        },
        {
          "name": "Then the card for \"AAPL\" should be visible",
          "outcome": "SUCCESS",
          "duration": 3,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:34.898Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/02_holdings_fifolots.feature",
            "line": 12
          }
        },
        {
          "name": "When I select the \"Thai Stock\" asset tab",
          "outcome": "SUCCESS",
          "duration": 78,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:34.901Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/02_holdings_fifolots.feature",
            "line": 13
          }
        },
        {
          "name": "Then the card for \"PTT.BK\" should be visible",
          "outcome": "SUCCESS",
          "duration": 2,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:34.980Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/02_holdings_fifolots.feature",
            "line": 14
          }
        },
        {
          "name": "When I select the \"Cryptocurrency\" asset tab",
          "outcome": "SUCCESS",
          "duration": 62,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:34.983Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/02_holdings_fifolots.feature",
            "line": 15
          }
        },
        {
          "name": "Then the card for \"BTC\" should be visible",
          "outcome": "SUCCESS",
          "duration": 2,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:35.046Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/02_holdings_fifolots.feature",
            "line": 16
          }
        },
        {
          "name": "When I select the \"Mutual Fund\" asset tab",
          "outcome": "SUCCESS",
          "duration": 65,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:35.048Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/02_holdings_fifolots.feature",
            "line": 17
          }
        },
        {
          "name": "Then the card for \"K-USA\" should be visible",
          "outcome": "SUCCESS",
          "duration": 2,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:35.113Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/02_holdings_fifolots.feature",
            "line": 18
          }
        },
        {
          "name": "When I select the \"Closed Position\" asset tab",
          "outcome": "SUCCESS",
          "duration": 64,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:35.115Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/02_holdings_fifolots.feature",
            "line": 19
          }
        },
        {
          "name": "Then the card for \"NVDA\" should be visible",
          "outcome": "SUCCESS",
          "duration": 50,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:35.179Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/02_holdings_fifolots.feature",
            "line": 20
          }
        }
      ],
      "executionHistory": [
        {
          "outcome": "SUCCESS",
          "run": "4",
          "timestamp": "2026-11-11T09:47:32.331Z",
          "duration": 890,
          "activities": [
            {
              "name": "Before",
              "outcome": "SUCCESS",
              "duration": 34,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:34.351Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/support/hooks.ts",
                "line": 11
              }
            },
            {
              "name": "Given I open the SGSK Wealth application",
              "outcome": "SUCCESS",
              "duration": 284,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:34.386Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/02_holdings_fifolots.feature",
                "line": 8
              }
            },
            {
              "name": "When I select the \"U.S. Stock\" asset tab",
              "outcome": "SUCCESS",
              "duration": 227,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:34.670Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/02_holdings_fifolots.feature",
                "line": 11
              }
            },
            {
              "name": "Then the card for \"AAPL\" should be visible",
              "outcome": "SUCCESS",
              "duration": 3,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:34.898Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/02_holdings_fifolots.feature",
                "line": 12
              }
            },
            {
              "name": "When I select the \"Thai Stock\" asset tab",
              "outcome": "SUCCESS",
              "duration": 78,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:34.901Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/02_holdings_fifolots.feature",
                "line": 13
              }
            },
            {
              "name": "Then the card for \"PTT.BK\" should be visible",
              "outcome": "SUCCESS",
              "duration": 2,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:34.980Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/02_holdings_fifolots.feature",
                "line": 14
              }
            },
            {
              "name": "When I select the \"Cryptocurrency\" asset tab",
              "outcome": "SUCCESS",
              "duration": 62,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:34.983Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/02_holdings_fifolots.feature",
                "line": 15
              }
            },
            {
              "name": "Then the card for \"BTC\" should be visible",
              "outcome": "SUCCESS",
              "duration": 2,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:35.046Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/02_holdings_fifolots.feature",
                "line": 16
              }
            },
            {
              "name": "When I select the \"Mutual Fund\" asset tab",
              "outcome": "SUCCESS",
              "duration": 65,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:35.048Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/02_holdings_fifolots.feature",
                "line": 17
              }
            },
            {
              "name": "Then the card for \"K-USA\" should be visible",
              "outcome": "SUCCESS",
              "duration": 2,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:35.113Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/02_holdings_fifolots.feature",
                "line": 18
              }
            },
            {
              "name": "When I select the \"Closed Position\" asset tab",
              "outcome": "SUCCESS",
              "duration": 64,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:35.115Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/02_holdings_fifolots.feature",
                "line": 19
              }
            },
            {
              "name": "Then the card for \"NVDA\" should be visible",
              "outcome": "SUCCESS",
              "duration": 50,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:35.179Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/02_holdings_fifolots.feature",
                "line": 20
              }
            }
          ]
        }
      ],
      "narrative": "<p>As an investor\nI want to filter holdings by asset category, expand FIFO lots, and search symbols\nSo that I can analyze lot acquisition dates and individual cost bases</p>\n",
      "cast": [
        {
          "name": "Investor",
          "abilities": [
            {
              "name": "PerformActivities"
            },
            {
              "name": "AnswerQuestions"
            },
            {
              "name": "RaiseErrors"
            },
            {
              "name": "ScheduleWork",
              "details": "{\"scheduler\":{\"clock\":{\"timeAdjustment\":{\"milliseconds\":0}},\"interactionTimeout\":{\"milliseconds\":5000}}}"
            },
            {
              "name": "BrowseTheWebWithPlaywright"
            },
            {
              "name": "TakeNotes",
              "details": "{\"notepad\":{}}"
            }
          ]
        }
      ],
      "id": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/02_holdings_fifolots.feature:10@frontend"
    },
    {
      "name": "TC-HLD-02: Expanding Symbol Row reveals FIFO share lot details",
      "category": "Portfolio Holdings & FIFO Share Lot Accounting",
      "outcome": "SUCCESS",
      "duration": 641,
      "startedAt": "2026-11-11T09:47:35.241Z",
      "source": {
        "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/02_holdings_fifolots.feature",
        "line": 22
      },
      "tags": [
        {
          "type": "capability",
          "name": "Ui"
        },
        {
          "type": "feature",
          "name": "Portfolio Holdings & FIFO Share Lot Accounting"
        },
        {
          "type": "tag",
          "name": "ui"
        },
        {
          "type": "tag",
          "name": "holdings"
        },
        {
          "type": "module",
          "name": "frontend"
        }
      ],
      "activities": [
        {
          "name": "Before",
          "outcome": "SUCCESS",
          "duration": 33,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:35.242Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/support/hooks.ts",
            "line": 11
          }
        },
        {
          "name": "Given I open the SGSK Wealth application",
          "outcome": "SUCCESS",
          "duration": 290,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:35.275Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/02_holdings_fifolots.feature",
            "line": 8
          }
        },
        {
          "name": "When I select the \"U.S. Stock\" asset tab",
          "outcome": "SUCCESS",
          "duration": 181,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:35.566Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/02_holdings_fifolots.feature",
            "line": 23
          }
        },
        {
          "name": "And I expand the symbol row for \"AAPL\"",
          "outcome": "SUCCESS",
          "duration": 81,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:35.747Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/02_holdings_fifolots.feature",
            "line": 24
          }
        },
        {
          "name": "Then the lots drawer container should be visible",
          "outcome": "SUCCESS",
          "duration": 39,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:35.828Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/02_holdings_fifolots.feature",
            "line": 25
          }
        },
        {
          "name": "And the lots drawer should contain \"Jan 15, 2024\"",
          "outcome": "SUCCESS",
          "duration": 3,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:35.867Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/02_holdings_fifolots.feature",
            "line": 26
          }
        },
        {
          "name": "And the lots drawer should contain \"Mar 10, 2024\"",
          "outcome": "SUCCESS",
          "duration": 2,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:35.870Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/02_holdings_fifolots.feature",
            "line": 27
          }
        }
      ],
      "executionHistory": [
        {
          "outcome": "SUCCESS",
          "run": "4",
          "timestamp": "2026-11-11T09:47:32.331Z",
          "duration": 641,
          "activities": [
            {
              "name": "Before",
              "outcome": "SUCCESS",
              "duration": 33,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:35.242Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/support/hooks.ts",
                "line": 11
              }
            },
            {
              "name": "Given I open the SGSK Wealth application",
              "outcome": "SUCCESS",
              "duration": 290,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:35.275Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/02_holdings_fifolots.feature",
                "line": 8
              }
            },
            {
              "name": "When I select the \"U.S. Stock\" asset tab",
              "outcome": "SUCCESS",
              "duration": 181,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:35.566Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/02_holdings_fifolots.feature",
                "line": 23
              }
            },
            {
              "name": "And I expand the symbol row for \"AAPL\"",
              "outcome": "SUCCESS",
              "duration": 81,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:35.747Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/02_holdings_fifolots.feature",
                "line": 24
              }
            },
            {
              "name": "Then the lots drawer container should be visible",
              "outcome": "SUCCESS",
              "duration": 39,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:35.828Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/02_holdings_fifolots.feature",
                "line": 25
              }
            },
            {
              "name": "And the lots drawer should contain \"Jan 15, 2024\"",
              "outcome": "SUCCESS",
              "duration": 3,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:35.867Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/02_holdings_fifolots.feature",
                "line": 26
              }
            },
            {
              "name": "And the lots drawer should contain \"Mar 10, 2024\"",
              "outcome": "SUCCESS",
              "duration": 2,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:35.870Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/02_holdings_fifolots.feature",
                "line": 27
              }
            }
          ]
        }
      ],
      "narrative": "<p>As an investor\nI want to filter holdings by asset category, expand FIFO lots, and search symbols\nSo that I can analyze lot acquisition dates and individual cost bases</p>\n",
      "cast": [
        {
          "name": "Investor",
          "abilities": [
            {
              "name": "PerformActivities"
            },
            {
              "name": "AnswerQuestions"
            },
            {
              "name": "RaiseErrors"
            },
            {
              "name": "ScheduleWork",
              "details": "{\"scheduler\":{\"clock\":{\"timeAdjustment\":{\"milliseconds\":0}},\"interactionTimeout\":{\"milliseconds\":5000}}}"
            },
            {
              "name": "BrowseTheWebWithPlaywright"
            },
            {
              "name": "TakeNotes",
              "details": "{\"notepad\":{}}"
            }
          ]
        }
      ],
      "id": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/02_holdings_fifolots.feature:22@frontend"
    },
    {
      "name": "TC-HLD-03: Search Bar filters portfolio holdings by symbol or name",
      "category": "Portfolio Holdings & FIFO Share Lot Accounting",
      "outcome": "SUCCESS",
      "duration": 465,
      "startedAt": "2026-11-11T09:47:35.883Z",
      "source": {
        "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/02_holdings_fifolots.feature",
        "line": 29
      },
      "tags": [
        {
          "type": "capability",
          "name": "Ui"
        },
        {
          "type": "feature",
          "name": "Portfolio Holdings & FIFO Share Lot Accounting"
        },
        {
          "type": "tag",
          "name": "ui"
        },
        {
          "type": "tag",
          "name": "holdings"
        },
        {
          "type": "module",
          "name": "frontend"
        }
      ],
      "activities": [
        {
          "name": "Before",
          "outcome": "SUCCESS",
          "duration": 30,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:35.883Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/support/hooks.ts",
            "line": 11
          }
        },
        {
          "name": "Given I open the SGSK Wealth application",
          "outcome": "SUCCESS",
          "duration": 249,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:35.913Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/02_holdings_fifolots.feature",
            "line": 8
          }
        },
        {
          "name": "When I search holdings for \"Bitcoin\"",
          "outcome": "SUCCESS",
          "duration": 171,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:36.162Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/02_holdings_fifolots.feature",
            "line": 30
          }
        },
        {
          "name": "Then the card for \"BTC\" should be visible",
          "outcome": "SUCCESS",
          "duration": 4,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:36.333Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/02_holdings_fifolots.feature",
            "line": 31
          }
        }
      ],
      "executionHistory": [
        {
          "outcome": "SUCCESS",
          "run": "4",
          "timestamp": "2026-11-11T09:47:32.331Z",
          "duration": 465,
          "activities": [
            {
              "name": "Before",
              "outcome": "SUCCESS",
              "duration": 30,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:35.883Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/support/hooks.ts",
                "line": 11
              }
            },
            {
              "name": "Given I open the SGSK Wealth application",
              "outcome": "SUCCESS",
              "duration": 249,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:35.913Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/02_holdings_fifolots.feature",
                "line": 8
              }
            },
            {
              "name": "When I search holdings for \"Bitcoin\"",
              "outcome": "SUCCESS",
              "duration": 171,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:36.162Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/02_holdings_fifolots.feature",
                "line": 30
              }
            },
            {
              "name": "Then the card for \"BTC\" should be visible",
              "outcome": "SUCCESS",
              "duration": 4,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:36.333Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/02_holdings_fifolots.feature",
                "line": 31
              }
            }
          ]
        }
      ],
      "narrative": "<p>As an investor\nI want to filter holdings by asset category, expand FIFO lots, and search symbols\nSo that I can analyze lot acquisition dates and individual cost bases</p>\n",
      "cast": [
        {
          "name": "Investor",
          "abilities": [
            {
              "name": "PerformActivities"
            },
            {
              "name": "AnswerQuestions"
            },
            {
              "name": "RaiseErrors"
            },
            {
              "name": "ScheduleWork",
              "details": "{\"scheduler\":{\"clock\":{\"timeAdjustment\":{\"milliseconds\":0}},\"interactionTimeout\":{\"milliseconds\":5000}}}"
            },
            {
              "name": "BrowseTheWebWithPlaywright"
            },
            {
              "name": "TakeNotes",
              "details": "{\"notepad\":{}}"
            }
          ]
        }
      ],
      "id": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/02_holdings_fifolots.feature:29@frontend"
    },
    {
      "name": "TC-ALC-01: Asset Allocation view defaults to All tab aggregated portfolio view",
      "category": "Target Asset Allocation & Rebalancing Engine",
      "outcome": "SUCCESS",
      "duration": 564,
      "startedAt": "2026-11-11T09:47:36.349Z",
      "source": {
        "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/03_asset_allocation.feature",
        "line": 11
      },
      "tags": [
        {
          "type": "capability",
          "name": "Ui"
        },
        {
          "type": "feature",
          "name": "Target Asset Allocation & Rebalancing Engine"
        },
        {
          "type": "tag",
          "name": "ui"
        },
        {
          "type": "tag",
          "name": "allocation"
        },
        {
          "type": "module",
          "name": "frontend"
        }
      ],
      "activities": [
        {
          "name": "Before",
          "outcome": "SUCCESS",
          "duration": 30,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:36.349Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/support/hooks.ts",
            "line": 11
          }
        },
        {
          "name": "Given I open the SGSK Wealth application",
          "outcome": "SUCCESS",
          "duration": 288,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:36.379Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/03_asset_allocation.feature",
            "line": 8
          }
        },
        {
          "name": "And I navigate to the Allocation analytics view",
          "outcome": "SUCCESS",
          "duration": 193,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:36.668Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/03_asset_allocation.feature",
            "line": 9
          }
        },
        {
          "name": "Then the asset allocation container should be visible",
          "outcome": "SUCCESS",
          "duration": 37,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:36.862Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/03_asset_allocation.feature",
            "line": 12
          }
        },
        {
          "name": "And the allocation donut chart should be visible",
          "outcome": "SUCCESS",
          "duration": 2,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:36.900Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/03_asset_allocation.feature",
            "line": 13
          }
        }
      ],
      "executionHistory": [
        {
          "outcome": "SUCCESS",
          "run": "4",
          "timestamp": "2026-11-11T09:47:32.331Z",
          "duration": 564,
          "activities": [
            {
              "name": "Before",
              "outcome": "SUCCESS",
              "duration": 30,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:36.349Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/support/hooks.ts",
                "line": 11
              }
            },
            {
              "name": "Given I open the SGSK Wealth application",
              "outcome": "SUCCESS",
              "duration": 288,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:36.379Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/03_asset_allocation.feature",
                "line": 8
              }
            },
            {
              "name": "And I navigate to the Allocation analytics view",
              "outcome": "SUCCESS",
              "duration": 193,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:36.668Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/03_asset_allocation.feature",
                "line": 9
              }
            },
            {
              "name": "Then the asset allocation container should be visible",
              "outcome": "SUCCESS",
              "duration": 37,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:36.862Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/03_asset_allocation.feature",
                "line": 12
              }
            },
            {
              "name": "And the allocation donut chart should be visible",
              "outcome": "SUCCESS",
              "duration": 2,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:36.900Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/03_asset_allocation.feature",
                "line": 13
              }
            }
          ]
        }
      ],
      "narrative": "<p>As an investor\nI want to view portfolio allocation charts and drill down by asset class\nSo that I can evaluate category weightings against target distributions</p>\n",
      "cast": [
        {
          "name": "Investor",
          "abilities": [
            {
              "name": "PerformActivities"
            },
            {
              "name": "AnswerQuestions"
            },
            {
              "name": "RaiseErrors"
            },
            {
              "name": "ScheduleWork",
              "details": "{\"scheduler\":{\"clock\":{\"timeAdjustment\":{\"milliseconds\":0}},\"interactionTimeout\":{\"milliseconds\":5000}}}"
            },
            {
              "name": "BrowseTheWebWithPlaywright"
            },
            {
              "name": "TakeNotes",
              "details": "{\"notepad\":{}}"
            }
          ]
        }
      ],
      "id": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/03_asset_allocation.feature:11@frontend"
    },
    {
      "name": "TC-ALC-02 & TC-ALC-03: Filtering to asset class displays symbol breakdown and allows filter reset",
      "category": "Target Asset Allocation & Rebalancing Engine",
      "outcome": "SUCCESS",
      "duration": 480,
      "startedAt": "2026-11-11T09:47:36.914Z",
      "source": {
        "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/03_asset_allocation.feature",
        "line": 15
      },
      "tags": [
        {
          "type": "capability",
          "name": "Ui"
        },
        {
          "type": "feature",
          "name": "Target Asset Allocation & Rebalancing Engine"
        },
        {
          "type": "tag",
          "name": "ui"
        },
        {
          "type": "tag",
          "name": "allocation"
        },
        {
          "type": "module",
          "name": "frontend"
        }
      ],
      "activities": [
        {
          "name": "Before",
          "outcome": "SUCCESS",
          "duration": 34,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:36.914Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/support/hooks.ts",
            "line": 11
          }
        },
        {
          "name": "Given I open the SGSK Wealth application",
          "outcome": "SUCCESS",
          "duration": 267,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:36.948Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/03_asset_allocation.feature",
            "line": 8
          }
        },
        {
          "name": "And I navigate to the Allocation analytics view",
          "outcome": "SUCCESS",
          "duration": 163,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:37.216Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/03_asset_allocation.feature",
            "line": 9
          }
        },
        {
          "name": "When I filter allocation to \"U.S. Stock\" if present",
          "outcome": "SUCCESS",
          "duration": 2,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:37.379Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/03_asset_allocation.feature",
            "line": 16
          }
        },
        {
          "name": "Then I reset the allocation filter if the reset button is visible",
          "outcome": "SUCCESS",
          "duration": 2,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:37.382Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/03_asset_allocation.feature",
            "line": 17
          }
        }
      ],
      "executionHistory": [
        {
          "outcome": "SUCCESS",
          "run": "4",
          "timestamp": "2026-11-11T09:47:32.331Z",
          "duration": 480,
          "activities": [
            {
              "name": "Before",
              "outcome": "SUCCESS",
              "duration": 34,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:36.914Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/support/hooks.ts",
                "line": 11
              }
            },
            {
              "name": "Given I open the SGSK Wealth application",
              "outcome": "SUCCESS",
              "duration": 267,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:36.948Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/03_asset_allocation.feature",
                "line": 8
              }
            },
            {
              "name": "And I navigate to the Allocation analytics view",
              "outcome": "SUCCESS",
              "duration": 163,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:37.216Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/03_asset_allocation.feature",
                "line": 9
              }
            },
            {
              "name": "When I filter allocation to \"U.S. Stock\" if present",
              "outcome": "SUCCESS",
              "duration": 2,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:37.379Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/03_asset_allocation.feature",
                "line": 16
              }
            },
            {
              "name": "Then I reset the allocation filter if the reset button is visible",
              "outcome": "SUCCESS",
              "duration": 2,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:37.382Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/03_asset_allocation.feature",
                "line": 17
              }
            }
          ]
        }
      ],
      "narrative": "<p>As an investor\nI want to view portfolio allocation charts and drill down by asset class\nSo that I can evaluate category weightings against target distributions</p>\n",
      "cast": [
        {
          "name": "Investor",
          "abilities": [
            {
              "name": "PerformActivities"
            },
            {
              "name": "AnswerQuestions"
            },
            {
              "name": "RaiseErrors"
            },
            {
              "name": "ScheduleWork",
              "details": "{\"scheduler\":{\"clock\":{\"timeAdjustment\":{\"milliseconds\":0}},\"interactionTimeout\":{\"milliseconds\":5000}}}"
            },
            {
              "name": "BrowseTheWebWithPlaywright"
            },
            {
              "name": "TakeNotes",
              "details": "{\"notepad\":{}}"
            }
          ]
        }
      ],
      "id": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/03_asset_allocation.feature:15@frontend"
    },
    {
      "name": "TC-ALC-04: Asset Class Breakdown table display",
      "category": "Target Asset Allocation & Rebalancing Engine",
      "outcome": "SUCCESS",
      "duration": 498,
      "startedAt": "2026-11-11T09:47:37.395Z",
      "source": {
        "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/03_asset_allocation.feature",
        "line": 19
      },
      "tags": [
        {
          "type": "capability",
          "name": "Ui"
        },
        {
          "type": "feature",
          "name": "Target Asset Allocation & Rebalancing Engine"
        },
        {
          "type": "tag",
          "name": "ui"
        },
        {
          "type": "tag",
          "name": "allocation"
        },
        {
          "type": "module",
          "name": "frontend"
        }
      ],
      "activities": [
        {
          "name": "Before",
          "outcome": "SUCCESS",
          "duration": 32,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:37.396Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/support/hooks.ts",
            "line": 11
          }
        },
        {
          "name": "Given I open the SGSK Wealth application",
          "outcome": "SUCCESS",
          "duration": 278,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:37.428Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/03_asset_allocation.feature",
            "line": 8
          }
        },
        {
          "name": "And I navigate to the Allocation analytics view",
          "outcome": "SUCCESS",
          "duration": 139,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:37.707Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/03_asset_allocation.feature",
            "line": 9
          }
        },
        {
          "name": "Then the asset class breakdown table and rebalance list should be visible",
          "outcome": "SUCCESS",
          "duration": 36,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:37.846Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/03_asset_allocation.feature",
            "line": 20
          }
        }
      ],
      "executionHistory": [
        {
          "outcome": "SUCCESS",
          "run": "4",
          "timestamp": "2026-11-11T09:47:32.331Z",
          "duration": 498,
          "activities": [
            {
              "name": "Before",
              "outcome": "SUCCESS",
              "duration": 32,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:37.396Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/support/hooks.ts",
                "line": 11
              }
            },
            {
              "name": "Given I open the SGSK Wealth application",
              "outcome": "SUCCESS",
              "duration": 278,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:37.428Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/03_asset_allocation.feature",
                "line": 8
              }
            },
            {
              "name": "And I navigate to the Allocation analytics view",
              "outcome": "SUCCESS",
              "duration": 139,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:37.707Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/03_asset_allocation.feature",
                "line": 9
              }
            },
            {
              "name": "Then the asset class breakdown table and rebalance list should be visible",
              "outcome": "SUCCESS",
              "duration": 36,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:37.846Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/03_asset_allocation.feature",
                "line": 20
              }
            }
          ]
        }
      ],
      "narrative": "<p>As an investor\nI want to view portfolio allocation charts and drill down by asset class\nSo that I can evaluate category weightings against target distributions</p>\n",
      "cast": [
        {
          "name": "Investor",
          "abilities": [
            {
              "name": "PerformActivities"
            },
            {
              "name": "AnswerQuestions"
            },
            {
              "name": "RaiseErrors"
            },
            {
              "name": "ScheduleWork",
              "details": "{\"scheduler\":{\"clock\":{\"timeAdjustment\":{\"milliseconds\":0}},\"interactionTimeout\":{\"milliseconds\":5000}}}"
            },
            {
              "name": "BrowseTheWebWithPlaywright"
            },
            {
              "name": "TakeNotes",
              "details": "{\"notepad\":{}}"
            }
          ]
        }
      ],
      "id": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/03_asset_allocation.feature:19@frontend"
    },
    {
      "name": "TC-TXN-01: Displays initial unfiltered transaction feed",
      "category": "Transaction History Ledger & CSV Exporter",
      "outcome": "SUCCESS",
      "duration": 484,
      "startedAt": "2026-11-11T09:47:37.894Z",
      "source": {
        "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/04_transaction_history.feature",
        "line": 11
      },
      "tags": [
        {
          "type": "capability",
          "name": "Ui"
        },
        {
          "type": "feature",
          "name": "Transaction History Ledger & CSV Exporter"
        },
        {
          "type": "tag",
          "name": "ui"
        },
        {
          "type": "tag",
          "name": "transactions"
        },
        {
          "type": "module",
          "name": "frontend"
        }
      ],
      "activities": [
        {
          "name": "Before",
          "outcome": "SUCCESS",
          "duration": 31,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:37.894Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/support/hooks.ts",
            "line": 11
          }
        },
        {
          "name": "Given I open the SGSK Wealth application",
          "outcome": "SUCCESS",
          "duration": 269,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:37.925Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/04_transaction_history.feature",
            "line": 8
          }
        },
        {
          "name": "And I switch to the Transactions view",
          "outcome": "SUCCESS",
          "duration": 102,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:38.194Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/04_transaction_history.feature",
            "line": 9
          }
        },
        {
          "name": "Then the transaction history container should be visible",
          "outcome": "SUCCESS",
          "duration": 71,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:38.296Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/04_transaction_history.feature",
            "line": 12
          }
        }
      ],
      "executionHistory": [
        {
          "outcome": "SUCCESS",
          "run": "4",
          "timestamp": "2026-11-11T09:47:32.331Z",
          "duration": 484,
          "activities": [
            {
              "name": "Before",
              "outcome": "SUCCESS",
              "duration": 31,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:37.894Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/support/hooks.ts",
                "line": 11
              }
            },
            {
              "name": "Given I open the SGSK Wealth application",
              "outcome": "SUCCESS",
              "duration": 269,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:37.925Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/04_transaction_history.feature",
                "line": 8
              }
            },
            {
              "name": "And I switch to the Transactions view",
              "outcome": "SUCCESS",
              "duration": 102,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:38.194Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/04_transaction_history.feature",
                "line": 9
              }
            },
            {
              "name": "Then the transaction history container should be visible",
              "outcome": "SUCCESS",
              "duration": 71,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:38.296Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/04_transaction_history.feature",
                "line": 12
              }
            }
          ]
        }
      ],
      "narrative": "<p>As an investor\nI want to view historical transactions and export them to CSV\nSo that I can audit trade history and tax filings</p>\n",
      "cast": [
        {
          "name": "Investor",
          "abilities": [
            {
              "name": "PerformActivities"
            },
            {
              "name": "AnswerQuestions"
            },
            {
              "name": "RaiseErrors"
            },
            {
              "name": "ScheduleWork",
              "details": "{\"scheduler\":{\"clock\":{\"timeAdjustment\":{\"milliseconds\":0}},\"interactionTimeout\":{\"milliseconds\":5000}}}"
            },
            {
              "name": "BrowseTheWebWithPlaywright"
            },
            {
              "name": "TakeNotes",
              "details": "{\"notepad\":{}}"
            }
          ]
        }
      ],
      "id": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/04_transaction_history.feature:11@frontend"
    },
    {
      "name": "TC-TXN-02: Formats units according to asset type context",
      "category": "Transaction History Ledger & CSV Exporter",
      "outcome": "SUCCESS",
      "duration": 466,
      "startedAt": "2026-11-11T09:47:38.378Z",
      "source": {
        "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/04_transaction_history.feature",
        "line": 14
      },
      "tags": [
        {
          "type": "capability",
          "name": "Ui"
        },
        {
          "type": "feature",
          "name": "Transaction History Ledger & CSV Exporter"
        },
        {
          "type": "tag",
          "name": "ui"
        },
        {
          "type": "tag",
          "name": "transactions"
        },
        {
          "type": "module",
          "name": "frontend"
        }
      ],
      "activities": [
        {
          "name": "Before",
          "outcome": "SUCCESS",
          "duration": 29,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:38.379Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/support/hooks.ts",
            "line": 11
          }
        },
        {
          "name": "Given I open the SGSK Wealth application",
          "outcome": "SUCCESS",
          "duration": 266,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:38.408Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/04_transaction_history.feature",
            "line": 8
          }
        },
        {
          "name": "And I switch to the Transactions view",
          "outcome": "SUCCESS",
          "duration": 101,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:38.674Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/04_transaction_history.feature",
            "line": 9
          }
        },
        {
          "name": "Then the transaction history ledger should contain \"AAPL\"",
          "outcome": "SUCCESS",
          "duration": 57,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:38.775Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/04_transaction_history.feature",
            "line": 15
          }
        }
      ],
      "executionHistory": [
        {
          "outcome": "SUCCESS",
          "run": "4",
          "timestamp": "2026-11-11T09:47:32.331Z",
          "duration": 466,
          "activities": [
            {
              "name": "Before",
              "outcome": "SUCCESS",
              "duration": 29,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:38.379Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/support/hooks.ts",
                "line": 11
              }
            },
            {
              "name": "Given I open the SGSK Wealth application",
              "outcome": "SUCCESS",
              "duration": 266,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:38.408Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/04_transaction_history.feature",
                "line": 8
              }
            },
            {
              "name": "And I switch to the Transactions view",
              "outcome": "SUCCESS",
              "duration": 101,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:38.674Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/04_transaction_history.feature",
                "line": 9
              }
            },
            {
              "name": "Then the transaction history ledger should contain \"AAPL\"",
              "outcome": "SUCCESS",
              "duration": 57,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:38.775Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/04_transaction_history.feature",
                "line": 15
              }
            }
          ]
        }
      ],
      "narrative": "<p>As an investor\nI want to view historical transactions and export them to CSV\nSo that I can audit trade history and tax filings</p>\n",
      "cast": [
        {
          "name": "Investor",
          "abilities": [
            {
              "name": "PerformActivities"
            },
            {
              "name": "AnswerQuestions"
            },
            {
              "name": "RaiseErrors"
            },
            {
              "name": "ScheduleWork",
              "details": "{\"scheduler\":{\"clock\":{\"timeAdjustment\":{\"milliseconds\":0}},\"interactionTimeout\":{\"milliseconds\":5000}}}"
            },
            {
              "name": "BrowseTheWebWithPlaywright"
            },
            {
              "name": "TakeNotes",
              "details": "{\"notepad\":{}}"
            }
          ]
        }
      ],
      "id": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/04_transaction_history.feature:14@frontend"
    },
    {
      "name": "TC-TXN-05: CSV Export triggers file download",
      "category": "Transaction History Ledger & CSV Exporter",
      "outcome": "SUCCESS",
      "duration": 1032,
      "startedAt": "2026-11-11T09:47:38.845Z",
      "source": {
        "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/04_transaction_history.feature",
        "line": 17
      },
      "tags": [
        {
          "type": "capability",
          "name": "Ui"
        },
        {
          "type": "feature",
          "name": "Transaction History Ledger & CSV Exporter"
        },
        {
          "type": "tag",
          "name": "ui"
        },
        {
          "type": "tag",
          "name": "transactions"
        },
        {
          "type": "module",
          "name": "frontend"
        }
      ],
      "activities": [
        {
          "name": "Before",
          "outcome": "SUCCESS",
          "duration": 30,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:38.845Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/support/hooks.ts",
            "line": 11
          }
        },
        {
          "name": "Given I open the SGSK Wealth application",
          "outcome": "SUCCESS",
          "duration": 263,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:38.876Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/04_transaction_history.feature",
            "line": 8
          }
        },
        {
          "name": "And I switch to the Transactions view",
          "outcome": "SUCCESS",
          "duration": 149,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:39.139Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/04_transaction_history.feature",
            "line": 9
          }
        },
        {
          "name": "When I trigger CSV export of all transactions",
          "outcome": "SUCCESS",
          "duration": 576,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:39.289Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/04_transaction_history.feature",
            "line": 18
          }
        },
        {
          "name": "Then the downloaded file name should match the pattern \"(?:sgsk_wealth|sharelot)_.*\\.csv\"",
          "outcome": "SUCCESS",
          "duration": 1,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:39.865Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/04_transaction_history.feature",
            "line": 19
          }
        }
      ],
      "executionHistory": [
        {
          "outcome": "SUCCESS",
          "run": "4",
          "timestamp": "2026-11-11T09:47:32.331Z",
          "duration": 1032,
          "activities": [
            {
              "name": "Before",
              "outcome": "SUCCESS",
              "duration": 30,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:38.845Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/support/hooks.ts",
                "line": 11
              }
            },
            {
              "name": "Given I open the SGSK Wealth application",
              "outcome": "SUCCESS",
              "duration": 263,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:38.876Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/04_transaction_history.feature",
                "line": 8
              }
            },
            {
              "name": "And I switch to the Transactions view",
              "outcome": "SUCCESS",
              "duration": 149,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:39.139Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/04_transaction_history.feature",
                "line": 9
              }
            },
            {
              "name": "When I trigger CSV export of all transactions",
              "outcome": "SUCCESS",
              "duration": 576,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:39.289Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/04_transaction_history.feature",
                "line": 18
              }
            },
            {
              "name": "Then the downloaded file name should match the pattern \"(?:sgsk_wealth|sharelot)_.*\\.csv\"",
              "outcome": "SUCCESS",
              "duration": 1,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:39.865Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/04_transaction_history.feature",
                "line": 19
              }
            }
          ]
        }
      ],
      "narrative": "<p>As an investor\nI want to view historical transactions and export them to CSV\nSo that I can audit trade history and tax filings</p>\n",
      "cast": [
        {
          "name": "Investor",
          "abilities": [
            {
              "name": "PerformActivities"
            },
            {
              "name": "AnswerQuestions"
            },
            {
              "name": "RaiseErrors"
            },
            {
              "name": "ScheduleWork",
              "details": "{\"scheduler\":{\"clock\":{\"timeAdjustment\":{\"milliseconds\":0}},\"interactionTimeout\":{\"milliseconds\":5000}}}"
            },
            {
              "name": "BrowseTheWebWithPlaywright"
            },
            {
              "name": "TakeNotes",
              "details": "{\"notepad\":{}}"
            }
          ]
        }
      ],
      "id": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/04_transaction_history.feature:17@frontend"
    },
    {
      "name": "TC-MOB-01: Mobile view renders responsive cards and native bottom navigation bar",
      "category": "Mobile Responsiveness & Touch Layouts",
      "outcome": "SUCCESS",
      "duration": 486,
      "startedAt": "2026-11-11T09:47:39.878Z",
      "source": {
        "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/05_mobile_responsive.feature",
        "line": 10
      },
      "tags": [
        {
          "type": "capability",
          "name": "Ui"
        },
        {
          "type": "feature",
          "name": "Mobile Responsiveness & Touch Layouts"
        },
        {
          "type": "tag",
          "name": "ui"
        },
        {
          "type": "tag",
          "name": "mobile"
        },
        {
          "type": "module",
          "name": "frontend"
        }
      ],
      "activities": [
        {
          "name": "Before",
          "outcome": "SUCCESS",
          "duration": 32,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:39.879Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/support/hooks.ts",
            "line": 11
          }
        },
        {
          "name": "Given I open the SGSK Wealth application on a mobile viewport",
          "outcome": "SUCCESS",
          "duration": 268,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:39.911Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/05_mobile_responsive.feature",
            "line": 8
          }
        },
        {
          "name": "Then the native bottom navigation bar should be visible",
          "outcome": "SUCCESS",
          "duration": 69,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:40.179Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/05_mobile_responsive.feature",
            "line": 11
          }
        },
        {
          "name": "When I tap Analytics on the bottom navigation bar",
          "outcome": "SUCCESS",
          "duration": 47,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:40.249Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/05_mobile_responsive.feature",
            "line": 12
          }
        },
        {
          "name": "Then the analytics container should be visible",
          "outcome": "SUCCESS",
          "duration": 57,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:40.297Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/05_mobile_responsive.feature",
            "line": 13
          }
        }
      ],
      "executionHistory": [
        {
          "outcome": "SUCCESS",
          "run": "4",
          "timestamp": "2026-11-11T09:47:32.331Z",
          "duration": 486,
          "activities": [
            {
              "name": "Before",
              "outcome": "SUCCESS",
              "duration": 32,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:39.879Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/support/hooks.ts",
                "line": 11
              }
            },
            {
              "name": "Given I open the SGSK Wealth application on a mobile viewport",
              "outcome": "SUCCESS",
              "duration": 268,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:39.911Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/05_mobile_responsive.feature",
                "line": 8
              }
            },
            {
              "name": "Then the native bottom navigation bar should be visible",
              "outcome": "SUCCESS",
              "duration": 69,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:40.179Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/05_mobile_responsive.feature",
                "line": 11
              }
            },
            {
              "name": "When I tap Analytics on the bottom navigation bar",
              "outcome": "SUCCESS",
              "duration": 47,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:40.249Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/05_mobile_responsive.feature",
                "line": 12
              }
            },
            {
              "name": "Then the analytics container should be visible",
              "outcome": "SUCCESS",
              "duration": 57,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:40.297Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/05_mobile_responsive.feature",
                "line": 13
              }
            }
          ]
        }
      ],
      "narrative": "<p>As an investor on a mobile device\nI want responsive cards and native bottom navigation dock\nSo that I have an optimized touch experience</p>\n",
      "cast": [
        {
          "name": "Investor",
          "abilities": [
            {
              "name": "PerformActivities"
            },
            {
              "name": "AnswerQuestions"
            },
            {
              "name": "RaiseErrors"
            },
            {
              "name": "ScheduleWork",
              "details": "{\"scheduler\":{\"clock\":{\"timeAdjustment\":{\"milliseconds\":0}},\"interactionTimeout\":{\"milliseconds\":5000}}}"
            },
            {
              "name": "BrowseTheWebWithPlaywright"
            },
            {
              "name": "TakeNotes",
              "details": "{\"notepad\":{}}"
            }
          ]
        }
      ],
      "id": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/05_mobile_responsive.feature:10@frontend"
    },
    {
      "name": "TC-MOB-02: Mobile view renders responsive Rebalance Planner cards and touch mode toggle",
      "category": "Mobile Responsiveness & Touch Layouts",
      "outcome": "SUCCESS",
      "duration": 882,
      "startedAt": "2026-11-11T09:47:40.365Z",
      "source": {
        "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/05_mobile_responsive.feature",
        "line": 15
      },
      "tags": [
        {
          "type": "capability",
          "name": "Ui"
        },
        {
          "type": "feature",
          "name": "Mobile Responsiveness & Touch Layouts"
        },
        {
          "type": "tag",
          "name": "ui"
        },
        {
          "type": "tag",
          "name": "mobile"
        },
        {
          "type": "module",
          "name": "frontend"
        }
      ],
      "activities": [
        {
          "name": "Before",
          "outcome": "SUCCESS",
          "duration": 30,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:40.366Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/support/hooks.ts",
            "line": 11
          }
        },
        {
          "name": "Given I open the SGSK Wealth application on a mobile viewport",
          "outcome": "SUCCESS",
          "duration": 278,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:40.396Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/05_mobile_responsive.feature",
            "line": 8
          }
        },
        {
          "name": "When I tap Tools on the bottom navigation bar",
          "outcome": "SUCCESS",
          "duration": 140,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:40.674Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/05_mobile_responsive.feature",
            "line": 16
          }
        },
        {
          "name": "Then the tools container should be visible",
          "outcome": "SUCCESS",
          "duration": 72,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:40.814Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/05_mobile_responsive.feature",
            "line": 17
          }
        },
        {
          "name": "When I select Rebalance Planner from the mobile tools dropdown",
          "outcome": "SUCCESS",
          "duration": 307,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:40.887Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/05_mobile_responsive.feature",
            "line": 18
          }
        },
        {
          "name": "Then the rebalance calculator should be visible",
          "outcome": "SUCCESS",
          "duration": 36,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:41.195Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/05_mobile_responsive.feature",
            "line": 19
          }
        },
        {
          "name": "And the mobile rebalance mode toggle should be visible",
          "outcome": "SUCCESS",
          "duration": 4,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:41.231Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/05_mobile_responsive.feature",
            "line": 20
          }
        },
        {
          "name": "And the mobile symbol cards should be visible",
          "outcome": "SUCCESS",
          "duration": 2,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:41.235Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/05_mobile_responsive.feature",
            "line": 21
          }
        }
      ],
      "executionHistory": [
        {
          "outcome": "SUCCESS",
          "run": "4",
          "timestamp": "2026-11-11T09:47:32.331Z",
          "duration": 882,
          "activities": [
            {
              "name": "Before",
              "outcome": "SUCCESS",
              "duration": 30,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:40.366Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/support/hooks.ts",
                "line": 11
              }
            },
            {
              "name": "Given I open the SGSK Wealth application on a mobile viewport",
              "outcome": "SUCCESS",
              "duration": 278,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:40.396Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/05_mobile_responsive.feature",
                "line": 8
              }
            },
            {
              "name": "When I tap Tools on the bottom navigation bar",
              "outcome": "SUCCESS",
              "duration": 140,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:40.674Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/05_mobile_responsive.feature",
                "line": 16
              }
            },
            {
              "name": "Then the tools container should be visible",
              "outcome": "SUCCESS",
              "duration": 72,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:40.814Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/05_mobile_responsive.feature",
                "line": 17
              }
            },
            {
              "name": "When I select Rebalance Planner from the mobile tools dropdown",
              "outcome": "SUCCESS",
              "duration": 307,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:40.887Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/05_mobile_responsive.feature",
                "line": 18
              }
            },
            {
              "name": "Then the rebalance calculator should be visible",
              "outcome": "SUCCESS",
              "duration": 36,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:41.195Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/05_mobile_responsive.feature",
                "line": 19
              }
            },
            {
              "name": "And the mobile rebalance mode toggle should be visible",
              "outcome": "SUCCESS",
              "duration": 4,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:41.231Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/05_mobile_responsive.feature",
                "line": 20
              }
            },
            {
              "name": "And the mobile symbol cards should be visible",
              "outcome": "SUCCESS",
              "duration": 2,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:41.235Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/05_mobile_responsive.feature",
                "line": 21
              }
            }
          ]
        }
      ],
      "narrative": "<p>As an investor on a mobile device\nI want responsive cards and native bottom navigation dock\nSo that I have an optimized touch experience</p>\n",
      "cast": [
        {
          "name": "Investor",
          "abilities": [
            {
              "name": "PerformActivities"
            },
            {
              "name": "AnswerQuestions"
            },
            {
              "name": "RaiseErrors"
            },
            {
              "name": "ScheduleWork",
              "details": "{\"scheduler\":{\"clock\":{\"timeAdjustment\":{\"milliseconds\":0}},\"interactionTimeout\":{\"milliseconds\":5000}}}"
            },
            {
              "name": "BrowseTheWebWithPlaywright"
            },
            {
              "name": "TakeNotes",
              "details": "{\"notepad\":{}}"
            }
          ]
        }
      ],
      "id": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/05_mobile_responsive.feature:15@frontend"
    },
    {
      "name": "TC-MOB-03: Native bottom navigation bar highlights active tab and switches views smoothly",
      "category": "Mobile Responsiveness & Touch Layouts",
      "outcome": "SUCCESS",
      "duration": 735,
      "startedAt": "2026-11-11T09:47:41.248Z",
      "source": {
        "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/05_mobile_responsive.feature",
        "line": 23
      },
      "tags": [
        {
          "type": "capability",
          "name": "Ui"
        },
        {
          "type": "feature",
          "name": "Mobile Responsiveness & Touch Layouts"
        },
        {
          "type": "tag",
          "name": "ui"
        },
        {
          "type": "tag",
          "name": "mobile"
        },
        {
          "type": "module",
          "name": "frontend"
        }
      ],
      "activities": [
        {
          "name": "Before",
          "outcome": "SUCCESS",
          "duration": 32,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:41.248Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/support/hooks.ts",
            "line": 11
          }
        },
        {
          "name": "Given I open the SGSK Wealth application on a mobile viewport",
          "outcome": "SUCCESS",
          "duration": 351,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:41.280Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/05_mobile_responsive.feature",
            "line": 8
          }
        },
        {
          "name": "Then the bottom nav dashboard tab should be active",
          "outcome": "SUCCESS",
          "duration": 29,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:41.632Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/05_mobile_responsive.feature",
            "line": 24
          }
        },
        {
          "name": "When I tap Holdings on the bottom navigation bar",
          "outcome": "SUCCESS",
          "duration": 68,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:41.661Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/05_mobile_responsive.feature",
            "line": 25
          }
        },
        {
          "name": "Then the bottom nav holdings tab should be active",
          "outcome": "SUCCESS",
          "duration": 78,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:41.729Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/05_mobile_responsive.feature",
            "line": 26
          }
        },
        {
          "name": "And the asset tab bar should be visible",
          "outcome": "SUCCESS",
          "duration": 6,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:41.807Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/05_mobile_responsive.feature",
            "line": 27
          }
        },
        {
          "name": "When I tap Analytics on the bottom navigation bar",
          "outcome": "SUCCESS",
          "duration": 34,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:41.813Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/05_mobile_responsive.feature",
            "line": 28
          }
        },
        {
          "name": "Then the bottom nav analytics tab should be active",
          "outcome": "SUCCESS",
          "duration": 24,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:41.848Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/05_mobile_responsive.feature",
            "line": 29
          }
        },
        {
          "name": "And the analytics container should be visible",
          "outcome": "SUCCESS",
          "duration": 12,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:41.873Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/05_mobile_responsive.feature",
            "line": 30
          }
        },
        {
          "name": "When I tap Dividends on the bottom navigation bar",
          "outcome": "SUCCESS",
          "duration": 47,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:41.885Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/05_mobile_responsive.feature",
            "line": 31
          }
        },
        {
          "name": "Then the bottom nav dividends tab should be active",
          "outcome": "SUCCESS",
          "duration": 37,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:41.932Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/05_mobile_responsive.feature",
            "line": 32
          }
        },
        {
          "name": "And the dividend container should be visible",
          "outcome": "SUCCESS",
          "duration": 2,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:41.970Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/05_mobile_responsive.feature",
            "line": 33
          }
        }
      ],
      "executionHistory": [
        {
          "outcome": "SUCCESS",
          "run": "4",
          "timestamp": "2026-11-11T09:47:32.331Z",
          "duration": 735,
          "activities": [
            {
              "name": "Before",
              "outcome": "SUCCESS",
              "duration": 32,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:41.248Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/support/hooks.ts",
                "line": 11
              }
            },
            {
              "name": "Given I open the SGSK Wealth application on a mobile viewport",
              "outcome": "SUCCESS",
              "duration": 351,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:41.280Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/05_mobile_responsive.feature",
                "line": 8
              }
            },
            {
              "name": "Then the bottom nav dashboard tab should be active",
              "outcome": "SUCCESS",
              "duration": 29,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:41.632Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/05_mobile_responsive.feature",
                "line": 24
              }
            },
            {
              "name": "When I tap Holdings on the bottom navigation bar",
              "outcome": "SUCCESS",
              "duration": 68,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:41.661Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/05_mobile_responsive.feature",
                "line": 25
              }
            },
            {
              "name": "Then the bottom nav holdings tab should be active",
              "outcome": "SUCCESS",
              "duration": 78,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:41.729Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/05_mobile_responsive.feature",
                "line": 26
              }
            },
            {
              "name": "And the asset tab bar should be visible",
              "outcome": "SUCCESS",
              "duration": 6,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:41.807Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/05_mobile_responsive.feature",
                "line": 27
              }
            },
            {
              "name": "When I tap Analytics on the bottom navigation bar",
              "outcome": "SUCCESS",
              "duration": 34,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:41.813Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/05_mobile_responsive.feature",
                "line": 28
              }
            },
            {
              "name": "Then the bottom nav analytics tab should be active",
              "outcome": "SUCCESS",
              "duration": 24,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:41.848Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/05_mobile_responsive.feature",
                "line": 29
              }
            },
            {
              "name": "And the analytics container should be visible",
              "outcome": "SUCCESS",
              "duration": 12,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:41.873Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/05_mobile_responsive.feature",
                "line": 30
              }
            },
            {
              "name": "When I tap Dividends on the bottom navigation bar",
              "outcome": "SUCCESS",
              "duration": 47,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:41.885Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/05_mobile_responsive.feature",
                "line": 31
              }
            },
            {
              "name": "Then the bottom nav dividends tab should be active",
              "outcome": "SUCCESS",
              "duration": 37,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:41.932Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/05_mobile_responsive.feature",
                "line": 32
              }
            },
            {
              "name": "And the dividend container should be visible",
              "outcome": "SUCCESS",
              "duration": 2,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:41.970Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/05_mobile_responsive.feature",
                "line": 33
              }
            }
          ]
        }
      ],
      "narrative": "<p>As an investor on a mobile device\nI want responsive cards and native bottom navigation dock\nSo that I have an optimized touch experience</p>\n",
      "cast": [
        {
          "name": "Investor",
          "abilities": [
            {
              "name": "PerformActivities"
            },
            {
              "name": "AnswerQuestions"
            },
            {
              "name": "RaiseErrors"
            },
            {
              "name": "ScheduleWork",
              "details": "{\"scheduler\":{\"clock\":{\"timeAdjustment\":{\"milliseconds\":0}},\"interactionTimeout\":{\"milliseconds\":5000}}}"
            },
            {
              "name": "BrowseTheWebWithPlaywright"
            },
            {
              "name": "TakeNotes",
              "details": "{\"notepad\":{}}"
            }
          ]
        }
      ],
      "id": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/05_mobile_responsive.feature:23@frontend"
    },
    {
      "name": "TC-ERR-01: Displays error state card when backend API fails",
      "category": "API Failure & Error Resilience",
      "outcome": "SUCCESS",
      "duration": 341,
      "startedAt": "2026-11-11T09:47:41.984Z",
      "source": {
        "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/06_error_resilience.feature",
        "line": 7
      },
      "tags": [
        {
          "type": "capability",
          "name": "Ui"
        },
        {
          "type": "feature",
          "name": "API Failure & Error Resilience"
        },
        {
          "type": "tag",
          "name": "ui"
        },
        {
          "type": "tag",
          "name": "resilience"
        },
        {
          "type": "module",
          "name": "frontend"
        }
      ],
      "activities": [
        {
          "name": "Before",
          "outcome": "SUCCESS",
          "duration": 31,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:41.985Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/support/hooks.ts",
            "line": 11
          }
        },
        {
          "name": "Given the backend API returns error status 500",
          "outcome": "SUCCESS",
          "duration": 4,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:42.016Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/06_error_resilience.feature",
            "line": 8
          }
        },
        {
          "name": "When I open the SGSK Wealth application without mocking",
          "outcome": "SUCCESS",
          "duration": 263,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:42.020Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/06_error_resilience.feature",
            "line": 9
          }
        },
        {
          "name": "Then the error state card should be visible with \"Unable to load data\"",
          "outcome": "SUCCESS",
          "duration": 29,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:42.284Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/06_error_resilience.feature",
            "line": 10
          }
        },
        {
          "name": "And the retry button should be visible",
          "outcome": "SUCCESS",
          "duration": 2,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:42.313Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/06_error_resilience.feature",
            "line": 11
          }
        }
      ],
      "executionHistory": [
        {
          "outcome": "SUCCESS",
          "run": "4",
          "timestamp": "2026-11-11T09:47:32.331Z",
          "duration": 341,
          "activities": [
            {
              "name": "Before",
              "outcome": "SUCCESS",
              "duration": 31,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:41.985Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/support/hooks.ts",
                "line": 11
              }
            },
            {
              "name": "Given the backend API returns error status 500",
              "outcome": "SUCCESS",
              "duration": 4,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:42.016Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/06_error_resilience.feature",
                "line": 8
              }
            },
            {
              "name": "When I open the SGSK Wealth application without mocking",
              "outcome": "SUCCESS",
              "duration": 263,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:42.020Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/06_error_resilience.feature",
                "line": 9
              }
            },
            {
              "name": "Then the error state card should be visible with \"Unable to load data\"",
              "outcome": "SUCCESS",
              "duration": 29,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:42.284Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/06_error_resilience.feature",
                "line": 10
              }
            },
            {
              "name": "And the retry button should be visible",
              "outcome": "SUCCESS",
              "duration": 2,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:42.313Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/06_error_resilience.feature",
                "line": 11
              }
            }
          ]
        }
      ],
      "narrative": "<p>As an investor\nI want clear error feedback when the backend service experiences outages\nSo that I know data could not be fetched and can retry</p>\n",
      "cast": [
        {
          "name": "Investor",
          "abilities": [
            {
              "name": "PerformActivities"
            },
            {
              "name": "AnswerQuestions"
            },
            {
              "name": "RaiseErrors"
            },
            {
              "name": "ScheduleWork",
              "details": "{\"scheduler\":{\"clock\":{\"timeAdjustment\":{\"milliseconds\":0}},\"interactionTimeout\":{\"milliseconds\":5000}}}"
            },
            {
              "name": "BrowseTheWebWithPlaywright"
            },
            {
              "name": "TakeNotes",
              "details": "{\"notepad\":{}}"
            }
          ]
        }
      ],
      "id": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/06_error_resilience.feature:7@frontend"
    },
    {
      "name": "TC-PRF-01: Performance view renders summary KPI cards",
      "category": "Investment Performance & Analytics Engine",
      "outcome": "SUCCESS",
      "duration": 741,
      "startedAt": "2026-11-11T09:47:42.326Z",
      "source": {
        "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/07_performance_analytics.feature",
        "line": 11
      },
      "tags": [
        {
          "type": "capability",
          "name": "Ui"
        },
        {
          "type": "feature",
          "name": "Investment Performance & Analytics Engine"
        },
        {
          "type": "tag",
          "name": "ui"
        },
        {
          "type": "tag",
          "name": "performance"
        },
        {
          "type": "module",
          "name": "frontend"
        }
      ],
      "activities": [
        {
          "name": "Before",
          "outcome": "SUCCESS",
          "duration": 30,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:42.326Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/support/hooks.ts",
            "line": 11
          }
        },
        {
          "name": "Given I open the SGSK Wealth application",
          "outcome": "SUCCESS",
          "duration": 265,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:42.356Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/07_performance_analytics.feature",
            "line": 8
          }
        },
        {
          "name": "And I switch to the Performance sub-tab",
          "outcome": "SUCCESS",
          "duration": 389,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:42.622Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/07_performance_analytics.feature",
            "line": 9
          }
        },
        {
          "name": "Then the performance analytics container should be visible",
          "outcome": "SUCCESS",
          "duration": 39,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:43.012Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/07_performance_analytics.feature",
            "line": 12
          }
        },
        {
          "name": "And the performance summary grid should render 5 KPI cards",
          "outcome": "SUCCESS",
          "duration": 4,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:43.052Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/07_performance_analytics.feature",
            "line": 13
          }
        }
      ],
      "executionHistory": [
        {
          "outcome": "SUCCESS",
          "run": "4",
          "timestamp": "2026-11-11T09:47:32.331Z",
          "duration": 741,
          "activities": [
            {
              "name": "Before",
              "outcome": "SUCCESS",
              "duration": 30,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:42.326Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/support/hooks.ts",
                "line": 11
              }
            },
            {
              "name": "Given I open the SGSK Wealth application",
              "outcome": "SUCCESS",
              "duration": 265,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:42.356Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/07_performance_analytics.feature",
                "line": 8
              }
            },
            {
              "name": "And I switch to the Performance sub-tab",
              "outcome": "SUCCESS",
              "duration": 389,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:42.622Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/07_performance_analytics.feature",
                "line": 9
              }
            },
            {
              "name": "Then the performance analytics container should be visible",
              "outcome": "SUCCESS",
              "duration": 39,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:43.012Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/07_performance_analytics.feature",
                "line": 12
              }
            },
            {
              "name": "And the performance summary grid should render 5 KPI cards",
              "outcome": "SUCCESS",
              "duration": 4,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:43.052Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/07_performance_analytics.feature",
                "line": 13
              }
            }
          ]
        }
      ],
      "narrative": "<p>As an investor\nI want summary return KPIs, timeframe presets, movers, and symbol autocomplete\nSo that I can evaluate portfolio profitability across custom holding periods</p>\n",
      "cast": [
        {
          "name": "Investor",
          "abilities": [
            {
              "name": "PerformActivities"
            },
            {
              "name": "AnswerQuestions"
            },
            {
              "name": "RaiseErrors"
            },
            {
              "name": "ScheduleWork",
              "details": "{\"scheduler\":{\"clock\":{\"timeAdjustment\":{\"milliseconds\":0}},\"interactionTimeout\":{\"milliseconds\":5000}}}"
            },
            {
              "name": "BrowseTheWebWithPlaywright"
            },
            {
              "name": "TakeNotes",
              "details": "{\"notepad\":{}}"
            }
          ]
        }
      ],
      "id": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/07_performance_analytics.feature:11@frontend"
    },
    {
      "name": "TC-PRF-02: Date range preset buttons trigger timeframe updates",
      "category": "Investment Performance & Analytics Engine",
      "outcome": "SUCCESS",
      "duration": 1497,
      "startedAt": "2026-11-11T09:47:43.068Z",
      "source": {
        "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/07_performance_analytics.feature",
        "line": 15
      },
      "tags": [
        {
          "type": "capability",
          "name": "Ui"
        },
        {
          "type": "feature",
          "name": "Investment Performance & Analytics Engine"
        },
        {
          "type": "tag",
          "name": "ui"
        },
        {
          "type": "tag",
          "name": "performance"
        },
        {
          "type": "module",
          "name": "frontend"
        }
      ],
      "activities": [
        {
          "name": "Before",
          "outcome": "SUCCESS",
          "duration": 32,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:43.068Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/support/hooks.ts",
            "line": 11
          }
        },
        {
          "name": "Given I open the SGSK Wealth application",
          "outcome": "SUCCESS",
          "duration": 260,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:43.101Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/07_performance_analytics.feature",
            "line": 8
          }
        },
        {
          "name": "And I switch to the Performance sub-tab",
          "outcome": "SUCCESS",
          "duration": 166,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:43.362Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/07_performance_analytics.feature",
            "line": 9
          }
        },
        {
          "name": "When I select the performance date preset \"YTD\"",
          "outcome": "SUCCESS",
          "duration": 667,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:43.528Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/07_performance_analytics.feature",
            "line": 16
          }
        },
        {
          "name": "Then the date range picker trigger should display \"YTD\"",
          "outcome": "SUCCESS",
          "duration": 25,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:44.195Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/07_performance_analytics.feature",
            "line": 17
          }
        },
        {
          "name": "When I select the performance date preset \"Last 30 Days\"",
          "outcome": "SUCCESS",
          "duration": 307,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:44.221Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/07_performance_analytics.feature",
            "line": 18
          }
        },
        {
          "name": "Then the date range picker trigger should display \"Last 30 Days\"",
          "outcome": "SUCCESS",
          "duration": 27,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:44.528Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/07_performance_analytics.feature",
            "line": 19
          }
        }
      ],
      "executionHistory": [
        {
          "outcome": "SUCCESS",
          "run": "4",
          "timestamp": "2026-11-11T09:47:32.331Z",
          "duration": 1497,
          "activities": [
            {
              "name": "Before",
              "outcome": "SUCCESS",
              "duration": 32,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:43.068Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/support/hooks.ts",
                "line": 11
              }
            },
            {
              "name": "Given I open the SGSK Wealth application",
              "outcome": "SUCCESS",
              "duration": 260,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:43.101Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/07_performance_analytics.feature",
                "line": 8
              }
            },
            {
              "name": "And I switch to the Performance sub-tab",
              "outcome": "SUCCESS",
              "duration": 166,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:43.362Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/07_performance_analytics.feature",
                "line": 9
              }
            },
            {
              "name": "When I select the performance date preset \"YTD\"",
              "outcome": "SUCCESS",
              "duration": 667,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:43.528Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/07_performance_analytics.feature",
                "line": 16
              }
            },
            {
              "name": "Then the date range picker trigger should display \"YTD\"",
              "outcome": "SUCCESS",
              "duration": 25,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:44.195Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/07_performance_analytics.feature",
                "line": 17
              }
            },
            {
              "name": "When I select the performance date preset \"Last 30 Days\"",
              "outcome": "SUCCESS",
              "duration": 307,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:44.221Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/07_performance_analytics.feature",
                "line": 18
              }
            },
            {
              "name": "Then the date range picker trigger should display \"Last 30 Days\"",
              "outcome": "SUCCESS",
              "duration": 27,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:44.528Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/07_performance_analytics.feature",
                "line": 19
              }
            }
          ]
        }
      ],
      "narrative": "<p>As an investor\nI want summary return KPIs, timeframe presets, movers, and symbol autocomplete\nSo that I can evaluate portfolio profitability across custom holding periods</p>\n",
      "cast": [
        {
          "name": "Investor",
          "abilities": [
            {
              "name": "PerformActivities"
            },
            {
              "name": "AnswerQuestions"
            },
            {
              "name": "RaiseErrors"
            },
            {
              "name": "ScheduleWork",
              "details": "{\"scheduler\":{\"clock\":{\"timeAdjustment\":{\"milliseconds\":0}},\"interactionTimeout\":{\"milliseconds\":5000}}}"
            },
            {
              "name": "BrowseTheWebWithPlaywright"
            },
            {
              "name": "TakeNotes",
              "details": "{\"notepad\":{}}"
            }
          ]
        }
      ],
      "id": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/07_performance_analytics.feature:15@frontend"
    },
    {
      "name": "TC-PRF-03: Asset Type Return and Top Movers sections render correctly",
      "category": "Investment Performance & Analytics Engine",
      "outcome": "SUCCESS",
      "duration": 515,
      "startedAt": "2026-11-11T09:47:44.566Z",
      "source": {
        "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/07_performance_analytics.feature",
        "line": 21
      },
      "tags": [
        {
          "type": "capability",
          "name": "Ui"
        },
        {
          "type": "feature",
          "name": "Investment Performance & Analytics Engine"
        },
        {
          "type": "tag",
          "name": "ui"
        },
        {
          "type": "tag",
          "name": "performance"
        },
        {
          "type": "module",
          "name": "frontend"
        }
      ],
      "activities": [
        {
          "name": "Before",
          "outcome": "SUCCESS",
          "duration": 33,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:44.566Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/support/hooks.ts",
            "line": 11
          }
        },
        {
          "name": "Given I open the SGSK Wealth application",
          "outcome": "SUCCESS",
          "duration": 263,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:44.600Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/07_performance_analytics.feature",
            "line": 8
          }
        },
        {
          "name": "And I switch to the Performance sub-tab",
          "outcome": "SUCCESS",
          "duration": 186,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:44.863Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/07_performance_analytics.feature",
            "line": 9
          }
        },
        {
          "name": "Then the performance sections should contain \"Asset Type Return\" and \"Top Movers\"",
          "outcome": "SUCCESS",
          "duration": 20,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:45.049Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/07_performance_analytics.feature",
            "line": 22
          }
        }
      ],
      "executionHistory": [
        {
          "outcome": "SUCCESS",
          "run": "4",
          "timestamp": "2026-11-11T09:47:32.331Z",
          "duration": 515,
          "activities": [
            {
              "name": "Before",
              "outcome": "SUCCESS",
              "duration": 33,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:44.566Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/support/hooks.ts",
                "line": 11
              }
            },
            {
              "name": "Given I open the SGSK Wealth application",
              "outcome": "SUCCESS",
              "duration": 263,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:44.600Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/07_performance_analytics.feature",
                "line": 8
              }
            },
            {
              "name": "And I switch to the Performance sub-tab",
              "outcome": "SUCCESS",
              "duration": 186,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:44.863Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/07_performance_analytics.feature",
                "line": 9
              }
            },
            {
              "name": "Then the performance sections should contain \"Asset Type Return\" and \"Top Movers\"",
              "outcome": "SUCCESS",
              "duration": 20,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:45.049Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/07_performance_analytics.feature",
                "line": 22
              }
            }
          ]
        }
      ],
      "narrative": "<p>As an investor\nI want summary return KPIs, timeframe presets, movers, and symbol autocomplete\nSo that I can evaluate portfolio profitability across custom holding periods</p>\n",
      "cast": [
        {
          "name": "Investor",
          "abilities": [
            {
              "name": "PerformActivities"
            },
            {
              "name": "AnswerQuestions"
            },
            {
              "name": "RaiseErrors"
            },
            {
              "name": "ScheduleWork",
              "details": "{\"scheduler\":{\"clock\":{\"timeAdjustment\":{\"milliseconds\":0}},\"interactionTimeout\":{\"milliseconds\":5000}}}"
            },
            {
              "name": "BrowseTheWebWithPlaywright"
            },
            {
              "name": "TakeNotes",
              "details": "{\"notepad\":{}}"
            }
          ]
        }
      ],
      "id": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/07_performance_analytics.feature:21@frontend"
    },
    {
      "name": "TC-PRF-04: Symbol search autocomplete dropdown provides instant suggestions",
      "category": "Investment Performance & Analytics Engine",
      "outcome": "SUCCESS",
      "duration": 540,
      "startedAt": "2026-11-11T09:47:45.083Z",
      "source": {
        "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/07_performance_analytics.feature",
        "line": 24
      },
      "tags": [
        {
          "type": "capability",
          "name": "Ui"
        },
        {
          "type": "feature",
          "name": "Investment Performance & Analytics Engine"
        },
        {
          "type": "tag",
          "name": "ui"
        },
        {
          "type": "tag",
          "name": "performance"
        },
        {
          "type": "module",
          "name": "frontend"
        }
      ],
      "activities": [
        {
          "name": "Before",
          "outcome": "SUCCESS",
          "duration": 53,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:45.084Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/support/hooks.ts",
            "line": 11
          }
        },
        {
          "name": "Given I open the SGSK Wealth application",
          "outcome": "SUCCESS",
          "duration": 260,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:45.137Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/07_performance_analytics.feature",
            "line": 8
          }
        },
        {
          "name": "And I switch to the Performance sub-tab",
          "outcome": "SUCCESS",
          "duration": 163,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:45.398Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/07_performance_analytics.feature",
            "line": 9
          }
        },
        {
          "name": "When I search performance symbols for \"AAP\"",
          "outcome": "SUCCESS",
          "duration": 40,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:45.561Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/07_performance_analytics.feature",
            "line": 25
          }
        },
        {
          "name": "Then the performance autocomplete dropdown should suggest \"Apple\"",
          "outcome": "SUCCESS",
          "duration": 11,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:45.601Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/07_performance_analytics.feature",
            "line": 26
          }
        }
      ],
      "executionHistory": [
        {
          "outcome": "SUCCESS",
          "run": "4",
          "timestamp": "2026-11-11T09:47:32.331Z",
          "duration": 540,
          "activities": [
            {
              "name": "Before",
              "outcome": "SUCCESS",
              "duration": 53,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:45.084Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/support/hooks.ts",
                "line": 11
              }
            },
            {
              "name": "Given I open the SGSK Wealth application",
              "outcome": "SUCCESS",
              "duration": 260,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:45.137Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/07_performance_analytics.feature",
                "line": 8
              }
            },
            {
              "name": "And I switch to the Performance sub-tab",
              "outcome": "SUCCESS",
              "duration": 163,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:45.398Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/07_performance_analytics.feature",
                "line": 9
              }
            },
            {
              "name": "When I search performance symbols for \"AAP\"",
              "outcome": "SUCCESS",
              "duration": 40,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:45.561Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/07_performance_analytics.feature",
                "line": 25
              }
            },
            {
              "name": "Then the performance autocomplete dropdown should suggest \"Apple\"",
              "outcome": "SUCCESS",
              "duration": 11,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:45.601Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/07_performance_analytics.feature",
                "line": 26
              }
            }
          ]
        }
      ],
      "narrative": "<p>As an investor\nI want summary return KPIs, timeframe presets, movers, and symbol autocomplete\nSo that I can evaluate portfolio profitability across custom holding periods</p>\n",
      "cast": [
        {
          "name": "Investor",
          "abilities": [
            {
              "name": "PerformActivities"
            },
            {
              "name": "AnswerQuestions"
            },
            {
              "name": "RaiseErrors"
            },
            {
              "name": "ScheduleWork",
              "details": "{\"scheduler\":{\"clock\":{\"timeAdjustment\":{\"milliseconds\":0}},\"interactionTimeout\":{\"milliseconds\":5000}}}"
            },
            {
              "name": "BrowseTheWebWithPlaywright"
            },
            {
              "name": "TakeNotes",
              "details": "{\"notepad\":{}}"
            }
          ]
        }
      ],
      "id": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/07_performance_analytics.feature:24@frontend"
    },
    {
      "name": "TC-PRF-05: Status and Asset Type filters are accessible and selectable",
      "category": "Investment Performance & Analytics Engine",
      "outcome": "SUCCESS",
      "duration": 533,
      "startedAt": "2026-11-11T09:47:45.624Z",
      "source": {
        "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/07_performance_analytics.feature",
        "line": 28
      },
      "tags": [
        {
          "type": "capability",
          "name": "Ui"
        },
        {
          "type": "feature",
          "name": "Investment Performance & Analytics Engine"
        },
        {
          "type": "tag",
          "name": "ui"
        },
        {
          "type": "tag",
          "name": "performance"
        },
        {
          "type": "module",
          "name": "frontend"
        }
      ],
      "activities": [
        {
          "name": "Before",
          "outcome": "SUCCESS",
          "duration": 30,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:45.625Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/support/hooks.ts",
            "line": 11
          }
        },
        {
          "name": "Given I open the SGSK Wealth application",
          "outcome": "SUCCESS",
          "duration": 263,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:45.655Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/07_performance_analytics.feature",
            "line": 8
          }
        },
        {
          "name": "And I switch to the Performance sub-tab",
          "outcome": "SUCCESS",
          "duration": 161,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:45.918Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/07_performance_analytics.feature",
            "line": 9
          }
        },
        {
          "name": "When I filter performance by status \"open\"",
          "outcome": "SUCCESS",
          "duration": 45,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:46.079Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/07_performance_analytics.feature",
            "line": 29
          }
        },
        {
          "name": "Then the status select should have value \"open\"",
          "outcome": "SUCCESS",
          "duration": 3,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:46.124Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/07_performance_analytics.feature",
            "line": 30
          }
        },
        {
          "name": "When I filter performance by status \"closed\"",
          "outcome": "SUCCESS",
          "duration": 5,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:46.128Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/07_performance_analytics.feature",
            "line": 31
          }
        },
        {
          "name": "Then the status select should have value \"closed\"",
          "outcome": "SUCCESS",
          "duration": 2,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:46.133Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/07_performance_analytics.feature",
            "line": 32
          }
        },
        {
          "name": "When I filter performance by status \"all\"",
          "outcome": "SUCCESS",
          "duration": 5,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:46.135Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/07_performance_analytics.feature",
            "line": 33
          }
        },
        {
          "name": "Then the status select should have value \"all\"",
          "outcome": "SUCCESS",
          "duration": 7,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:46.140Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/07_performance_analytics.feature",
            "line": 34
          }
        }
      ],
      "executionHistory": [
        {
          "outcome": "SUCCESS",
          "run": "4",
          "timestamp": "2026-11-11T09:47:32.331Z",
          "duration": 533,
          "activities": [
            {
              "name": "Before",
              "outcome": "SUCCESS",
              "duration": 30,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:45.625Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/support/hooks.ts",
                "line": 11
              }
            },
            {
              "name": "Given I open the SGSK Wealth application",
              "outcome": "SUCCESS",
              "duration": 263,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:45.655Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/07_performance_analytics.feature",
                "line": 8
              }
            },
            {
              "name": "And I switch to the Performance sub-tab",
              "outcome": "SUCCESS",
              "duration": 161,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:45.918Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/07_performance_analytics.feature",
                "line": 9
              }
            },
            {
              "name": "When I filter performance by status \"open\"",
              "outcome": "SUCCESS",
              "duration": 45,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:46.079Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/07_performance_analytics.feature",
                "line": 29
              }
            },
            {
              "name": "Then the status select should have value \"open\"",
              "outcome": "SUCCESS",
              "duration": 3,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:46.124Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/07_performance_analytics.feature",
                "line": 30
              }
            },
            {
              "name": "When I filter performance by status \"closed\"",
              "outcome": "SUCCESS",
              "duration": 5,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:46.128Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/07_performance_analytics.feature",
                "line": 31
              }
            },
            {
              "name": "Then the status select should have value \"closed\"",
              "outcome": "SUCCESS",
              "duration": 2,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:46.133Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/07_performance_analytics.feature",
                "line": 32
              }
            },
            {
              "name": "When I filter performance by status \"all\"",
              "outcome": "SUCCESS",
              "duration": 5,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:46.135Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/07_performance_analytics.feature",
                "line": 33
              }
            },
            {
              "name": "Then the status select should have value \"all\"",
              "outcome": "SUCCESS",
              "duration": 7,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:46.140Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/07_performance_analytics.feature",
                "line": 34
              }
            }
          ]
        }
      ],
      "narrative": "<p>As an investor\nI want summary return KPIs, timeframe presets, movers, and symbol autocomplete\nSo that I can evaluate portfolio profitability across custom holding periods</p>\n",
      "cast": [
        {
          "name": "Investor",
          "abilities": [
            {
              "name": "PerformActivities"
            },
            {
              "name": "AnswerQuestions"
            },
            {
              "name": "RaiseErrors"
            },
            {
              "name": "ScheduleWork",
              "details": "{\"scheduler\":{\"clock\":{\"timeAdjustment\":{\"milliseconds\":0}},\"interactionTimeout\":{\"milliseconds\":5000}}}"
            },
            {
              "name": "BrowseTheWebWithPlaywright"
            },
            {
              "name": "TakeNotes",
              "details": "{\"notepad\":{}}"
            }
          ]
        }
      ],
      "id": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/07_performance_analytics.feature:28@frontend"
    },
    {
      "name": "TC-TOOLS-01: Navigation to Tools tab and renders Avg Cost Calculator",
      "category": "Tools Hub & Investor Simulators",
      "outcome": "SUCCESS",
      "duration": 499,
      "startedAt": "2026-11-11T09:47:46.158Z",
      "source": {
        "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/08_tools_calculator.feature",
        "line": 11
      },
      "tags": [
        {
          "type": "capability",
          "name": "Ui"
        },
        {
          "type": "feature",
          "name": "Tools Hub & Investor Simulators"
        },
        {
          "type": "tag",
          "name": "ui"
        },
        {
          "type": "tag",
          "name": "tools"
        },
        {
          "type": "module",
          "name": "frontend"
        }
      ],
      "activities": [
        {
          "name": "Before",
          "outcome": "SUCCESS",
          "duration": 32,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:46.159Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/support/hooks.ts",
            "line": 11
          }
        },
        {
          "name": "Given I open the SGSK Wealth application",
          "outcome": "SUCCESS",
          "duration": 266,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:46.191Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/08_tools_calculator.feature",
            "line": 8
          }
        },
        {
          "name": "And I navigate to the Tools view",
          "outcome": "SUCCESS",
          "duration": 105,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:46.458Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/08_tools_calculator.feature",
            "line": 9
          }
        },
        {
          "name": "Then the tools container should be visible",
          "outcome": "SUCCESS",
          "duration": 71,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:46.563Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/08_tools_calculator.feature",
            "line": 12
          }
        },
        {
          "name": "And the tools hero title should contain \"Investor Tools & Simulators\"",
          "outcome": "SUCCESS",
          "duration": 6,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:46.634Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/08_tools_calculator.feature",
            "line": 13
          }
        },
        {
          "name": "And the average cost calculator should be visible",
          "outcome": "SUCCESS",
          "duration": 4,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:46.641Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/08_tools_calculator.feature",
            "line": 14
          }
        }
      ],
      "executionHistory": [
        {
          "outcome": "SUCCESS",
          "run": "4",
          "timestamp": "2026-11-11T09:47:32.331Z",
          "duration": 499,
          "activities": [
            {
              "name": "Before",
              "outcome": "SUCCESS",
              "duration": 32,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:46.159Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/support/hooks.ts",
                "line": 11
              }
            },
            {
              "name": "Given I open the SGSK Wealth application",
              "outcome": "SUCCESS",
              "duration": 266,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:46.191Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/08_tools_calculator.feature",
                "line": 8
              }
            },
            {
              "name": "And I navigate to the Tools view",
              "outcome": "SUCCESS",
              "duration": 105,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:46.458Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/08_tools_calculator.feature",
                "line": 9
              }
            },
            {
              "name": "Then the tools container should be visible",
              "outcome": "SUCCESS",
              "duration": 71,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:46.563Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/08_tools_calculator.feature",
                "line": 12
              }
            },
            {
              "name": "And the tools hero title should contain \"Investor Tools & Simulators\"",
              "outcome": "SUCCESS",
              "duration": 6,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:46.634Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/08_tools_calculator.feature",
                "line": 13
              }
            },
            {
              "name": "And the average cost calculator should be visible",
              "outcome": "SUCCESS",
              "duration": 4,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:46.641Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/08_tools_calculator.feature",
                "line": 14
              }
            }
          ]
        }
      ],
      "narrative": "<p>As an investor\nI want to simulate average cost orders, calculate TVM compounding, and plan portfolio rebalancing\nSo that I can model forward investment strategies</p>\n",
      "cast": [
        {
          "name": "Investor",
          "abilities": [
            {
              "name": "PerformActivities"
            },
            {
              "name": "AnswerQuestions"
            },
            {
              "name": "RaiseErrors"
            },
            {
              "name": "ScheduleWork",
              "details": "{\"scheduler\":{\"clock\":{\"timeAdjustment\":{\"milliseconds\":0}},\"interactionTimeout\":{\"milliseconds\":5000}}}"
            },
            {
              "name": "BrowseTheWebWithPlaywright"
            },
            {
              "name": "TakeNotes",
              "details": "{\"notepad\":{}}"
            }
          ]
        }
      ],
      "id": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/08_tools_calculator.feature:11@frontend"
    },
    {
      "name": "TC-TOOLS-02: Symbol selection and forward Buy simulation",
      "category": "Tools Hub & Investor Simulators",
      "outcome": "SUCCESS",
      "duration": 619,
      "startedAt": "2026-11-11T09:47:46.658Z",
      "source": {
        "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/08_tools_calculator.feature",
        "line": 16
      },
      "tags": [
        {
          "type": "capability",
          "name": "Ui"
        },
        {
          "type": "feature",
          "name": "Tools Hub & Investor Simulators"
        },
        {
          "type": "tag",
          "name": "ui"
        },
        {
          "type": "tag",
          "name": "tools"
        },
        {
          "type": "module",
          "name": "frontend"
        }
      ],
      "activities": [
        {
          "name": "Before",
          "outcome": "SUCCESS",
          "duration": 33,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:46.658Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/support/hooks.ts",
            "line": 11
          }
        },
        {
          "name": "Given I open the SGSK Wealth application",
          "outcome": "SUCCESS",
          "duration": 276,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:46.692Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/08_tools_calculator.feature",
            "line": 8
          }
        },
        {
          "name": "And I navigate to the Tools view",
          "outcome": "SUCCESS",
          "duration": 94,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:46.968Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/08_tools_calculator.feature",
            "line": 9
          }
        },
        {
          "name": "When I select the custom simulation option from the symbol dropdown",
          "outcome": "SUCCESS",
          "duration": 133,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:47.063Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/08_tools_calculator.feature",
            "line": 17
          }
        },
        {
          "name": "And I click the simulation calculate button",
          "outcome": "SUCCESS",
          "duration": 66,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:47.196Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/08_tools_calculator.feature",
            "line": 18
          }
        },
        {
          "name": "Then the simulation results panel and KPI grid should be visible",
          "outcome": "SUCCESS",
          "duration": 4,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:47.263Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/08_tools_calculator.feature",
            "line": 19
          }
        }
      ],
      "executionHistory": [
        {
          "outcome": "SUCCESS",
          "run": "4",
          "timestamp": "2026-11-11T09:47:32.331Z",
          "duration": 619,
          "activities": [
            {
              "name": "Before",
              "outcome": "SUCCESS",
              "duration": 33,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:46.658Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/support/hooks.ts",
                "line": 11
              }
            },
            {
              "name": "Given I open the SGSK Wealth application",
              "outcome": "SUCCESS",
              "duration": 276,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:46.692Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/08_tools_calculator.feature",
                "line": 8
              }
            },
            {
              "name": "And I navigate to the Tools view",
              "outcome": "SUCCESS",
              "duration": 94,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:46.968Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/08_tools_calculator.feature",
                "line": 9
              }
            },
            {
              "name": "When I select the custom simulation option from the symbol dropdown",
              "outcome": "SUCCESS",
              "duration": 133,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:47.063Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/08_tools_calculator.feature",
                "line": 17
              }
            },
            {
              "name": "And I click the simulation calculate button",
              "outcome": "SUCCESS",
              "duration": 66,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:47.196Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/08_tools_calculator.feature",
                "line": 18
              }
            },
            {
              "name": "Then the simulation results panel and KPI grid should be visible",
              "outcome": "SUCCESS",
              "duration": 4,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:47.263Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/08_tools_calculator.feature",
                "line": 19
              }
            }
          ]
        }
      ],
      "narrative": "<p>As an investor\nI want to simulate average cost orders, calculate TVM compounding, and plan portfolio rebalancing\nSo that I can model forward investment strategies</p>\n",
      "cast": [
        {
          "name": "Investor",
          "abilities": [
            {
              "name": "PerformActivities"
            },
            {
              "name": "AnswerQuestions"
            },
            {
              "name": "RaiseErrors"
            },
            {
              "name": "ScheduleWork",
              "details": "{\"scheduler\":{\"clock\":{\"timeAdjustment\":{\"milliseconds\":0}},\"interactionTimeout\":{\"milliseconds\":5000}}}"
            },
            {
              "name": "BrowseTheWebWithPlaywright"
            },
            {
              "name": "TakeNotes",
              "details": "{\"notepad\":{}}"
            }
          ]
        }
      ],
      "id": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/08_tools_calculator.feature:16@frontend"
    },
    {
      "name": "TC-TOOLS-03: Switching between Shares and Amount mode",
      "category": "Tools Hub & Investor Simulators",
      "outcome": "SUCCESS",
      "duration": 622,
      "startedAt": "2026-11-11T09:47:47.278Z",
      "source": {
        "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/08_tools_calculator.feature",
        "line": 21
      },
      "tags": [
        {
          "type": "capability",
          "name": "Ui"
        },
        {
          "type": "feature",
          "name": "Tools Hub & Investor Simulators"
        },
        {
          "type": "tag",
          "name": "ui"
        },
        {
          "type": "tag",
          "name": "tools"
        },
        {
          "type": "module",
          "name": "frontend"
        }
      ],
      "activities": [
        {
          "name": "Before",
          "outcome": "SUCCESS",
          "duration": 28,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:47.279Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/support/hooks.ts",
            "line": 11
          }
        },
        {
          "name": "Given I open the SGSK Wealth application",
          "outcome": "SUCCESS",
          "duration": 297,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:47.307Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/08_tools_calculator.feature",
            "line": 8
          }
        },
        {
          "name": "And I navigate to the Tools view",
          "outcome": "SUCCESS",
          "duration": 120,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:47.604Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/08_tools_calculator.feature",
            "line": 9
          }
        },
        {
          "name": "When I select the custom simulation option from the symbol dropdown",
          "outcome": "SUCCESS",
          "duration": 103,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:47.725Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/08_tools_calculator.feature",
            "line": 22
          }
        },
        {
          "name": "And I switch to By Amount mode",
          "outcome": "SUCCESS",
          "duration": 58,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:47.829Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/08_tools_calculator.feature",
            "line": 23
          }
        },
        {
          "name": "Then the simulation amount input should be visible",
          "outcome": "SUCCESS",
          "duration": 3,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:47.887Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/08_tools_calculator.feature",
            "line": 24
          }
        }
      ],
      "executionHistory": [
        {
          "outcome": "SUCCESS",
          "run": "4",
          "timestamp": "2026-11-11T09:47:32.331Z",
          "duration": 622,
          "activities": [
            {
              "name": "Before",
              "outcome": "SUCCESS",
              "duration": 28,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:47.279Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/support/hooks.ts",
                "line": 11
              }
            },
            {
              "name": "Given I open the SGSK Wealth application",
              "outcome": "SUCCESS",
              "duration": 297,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:47.307Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/08_tools_calculator.feature",
                "line": 8
              }
            },
            {
              "name": "And I navigate to the Tools view",
              "outcome": "SUCCESS",
              "duration": 120,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:47.604Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/08_tools_calculator.feature",
                "line": 9
              }
            },
            {
              "name": "When I select the custom simulation option from the symbol dropdown",
              "outcome": "SUCCESS",
              "duration": 103,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:47.725Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/08_tools_calculator.feature",
                "line": 22
              }
            },
            {
              "name": "And I switch to By Amount mode",
              "outcome": "SUCCESS",
              "duration": 58,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:47.829Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/08_tools_calculator.feature",
                "line": 23
              }
            },
            {
              "name": "Then the simulation amount input should be visible",
              "outcome": "SUCCESS",
              "duration": 3,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:47.887Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/08_tools_calculator.feature",
                "line": 24
              }
            }
          ]
        }
      ],
      "narrative": "<p>As an investor\nI want to simulate average cost orders, calculate TVM compounding, and plan portfolio rebalancing\nSo that I can model forward investment strategies</p>\n",
      "cast": [
        {
          "name": "Investor",
          "abilities": [
            {
              "name": "PerformActivities"
            },
            {
              "name": "AnswerQuestions"
            },
            {
              "name": "RaiseErrors"
            },
            {
              "name": "ScheduleWork",
              "details": "{\"scheduler\":{\"clock\":{\"timeAdjustment\":{\"milliseconds\":0}},\"interactionTimeout\":{\"milliseconds\":5000}}}"
            },
            {
              "name": "BrowseTheWebWithPlaywright"
            },
            {
              "name": "TakeNotes",
              "details": "{\"notepad\":{}}"
            }
          ]
        }
      ],
      "id": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/08_tools_calculator.feature:21@frontend"
    },
    {
      "name": "TC-TOOLS-04: Switch to TVM Calculator and calculate Future Value",
      "category": "Tools Hub & Investor Simulators",
      "outcome": "SUCCESS",
      "duration": 812,
      "startedAt": "2026-11-11T09:47:47.901Z",
      "source": {
        "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/08_tools_calculator.feature",
        "line": 26
      },
      "tags": [
        {
          "type": "capability",
          "name": "Ui"
        },
        {
          "type": "feature",
          "name": "Tools Hub & Investor Simulators"
        },
        {
          "type": "tag",
          "name": "ui"
        },
        {
          "type": "tag",
          "name": "tools"
        },
        {
          "type": "module",
          "name": "frontend"
        }
      ],
      "activities": [
        {
          "name": "Before",
          "outcome": "SUCCESS",
          "duration": 32,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:47.902Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/support/hooks.ts",
            "line": 11
          }
        },
        {
          "name": "Given I open the SGSK Wealth application",
          "outcome": "SUCCESS",
          "duration": 274,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:47.935Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/08_tools_calculator.feature",
            "line": 8
          }
        },
        {
          "name": "And I navigate to the Tools view",
          "outcome": "SUCCESS",
          "duration": 97,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:48.210Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/08_tools_calculator.feature",
            "line": 9
          }
        },
        {
          "name": "When I switch to the TVM Calculator tool",
          "outcome": "SUCCESS",
          "duration": 130,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:48.307Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/08_tools_calculator.feature",
            "line": 27
          }
        },
        {
          "name": "Then the TVM hero display and projected value should be visible",
          "outcome": "SUCCESS",
          "duration": 6,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:48.438Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/08_tools_calculator.feature",
            "line": 28
          }
        },
        {
          "name": "When I switch the TVM solve mode to PMT",
          "outcome": "SUCCESS",
          "duration": 60,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:48.444Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/08_tools_calculator.feature",
            "line": 29
          }
        },
        {
          "name": "Then the target FV input should be visible",
          "outcome": "SUCCESS",
          "duration": 2,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:48.504Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/08_tools_calculator.feature",
            "line": 30
          }
        },
        {
          "name": "When I select TVM compounding frequency \"Quarterly\"",
          "outcome": "SUCCESS",
          "duration": 105,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:48.507Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/08_tools_calculator.feature",
            "line": 31
          }
        },
        {
          "name": "Then the active compounding frequency should display \"Quarterly\"",
          "outcome": "SUCCESS",
          "duration": 24,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:48.612Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/08_tools_calculator.feature",
            "line": 32
          }
        },
        {
          "name": "When I toggle the TVM accumulation schedule table",
          "outcome": "SUCCESS",
          "duration": 27,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:48.636Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/08_tools_calculator.feature",
            "line": 33
          }
        },
        {
          "name": "Then the schedule table should be visible",
          "outcome": "SUCCESS",
          "duration": 39,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:48.663Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/08_tools_calculator.feature",
            "line": 34
          }
        }
      ],
      "executionHistory": [
        {
          "outcome": "SUCCESS",
          "run": "4",
          "timestamp": "2026-11-11T09:47:32.331Z",
          "duration": 812,
          "activities": [
            {
              "name": "Before",
              "outcome": "SUCCESS",
              "duration": 32,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:47.902Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/support/hooks.ts",
                "line": 11
              }
            },
            {
              "name": "Given I open the SGSK Wealth application",
              "outcome": "SUCCESS",
              "duration": 274,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:47.935Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/08_tools_calculator.feature",
                "line": 8
              }
            },
            {
              "name": "And I navigate to the Tools view",
              "outcome": "SUCCESS",
              "duration": 97,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:48.210Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/08_tools_calculator.feature",
                "line": 9
              }
            },
            {
              "name": "When I switch to the TVM Calculator tool",
              "outcome": "SUCCESS",
              "duration": 130,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:48.307Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/08_tools_calculator.feature",
                "line": 27
              }
            },
            {
              "name": "Then the TVM hero display and projected value should be visible",
              "outcome": "SUCCESS",
              "duration": 6,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:48.438Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/08_tools_calculator.feature",
                "line": 28
              }
            },
            {
              "name": "When I switch the TVM solve mode to PMT",
              "outcome": "SUCCESS",
              "duration": 60,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:48.444Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/08_tools_calculator.feature",
                "line": 29
              }
            },
            {
              "name": "Then the target FV input should be visible",
              "outcome": "SUCCESS",
              "duration": 2,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:48.504Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/08_tools_calculator.feature",
                "line": 30
              }
            },
            {
              "name": "When I select TVM compounding frequency \"Quarterly\"",
              "outcome": "SUCCESS",
              "duration": 105,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:48.507Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/08_tools_calculator.feature",
                "line": 31
              }
            },
            {
              "name": "Then the active compounding frequency should display \"Quarterly\"",
              "outcome": "SUCCESS",
              "duration": 24,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:48.612Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/08_tools_calculator.feature",
                "line": 32
              }
            },
            {
              "name": "When I toggle the TVM accumulation schedule table",
              "outcome": "SUCCESS",
              "duration": 27,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:48.636Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/08_tools_calculator.feature",
                "line": 33
              }
            },
            {
              "name": "Then the schedule table should be visible",
              "outcome": "SUCCESS",
              "duration": 39,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:48.663Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/08_tools_calculator.feature",
                "line": 34
              }
            }
          ]
        }
      ],
      "narrative": "<p>As an investor\nI want to simulate average cost orders, calculate TVM compounding, and plan portfolio rebalancing\nSo that I can model forward investment strategies</p>\n",
      "cast": [
        {
          "name": "Investor",
          "abilities": [
            {
              "name": "PerformActivities"
            },
            {
              "name": "AnswerQuestions"
            },
            {
              "name": "RaiseErrors"
            },
            {
              "name": "ScheduleWork",
              "details": "{\"scheduler\":{\"clock\":{\"timeAdjustment\":{\"milliseconds\":0}},\"interactionTimeout\":{\"milliseconds\":5000}}}"
            },
            {
              "name": "BrowseTheWebWithPlaywright"
            },
            {
              "name": "TakeNotes",
              "details": "{\"notepad\":{}}"
            }
          ]
        }
      ],
      "id": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/08_tools_calculator.feature:26@frontend"
    },
    {
      "name": "TC-TOOLS-05: TVM Calculator asset class multi-selection and valuation basis",
      "category": "Tools Hub & Investor Simulators",
      "outcome": "SUCCESS",
      "duration": 836,
      "startedAt": "2026-11-11T09:47:48.714Z",
      "source": {
        "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/08_tools_calculator.feature",
        "line": 36
      },
      "tags": [
        {
          "type": "capability",
          "name": "Ui"
        },
        {
          "type": "feature",
          "name": "Tools Hub & Investor Simulators"
        },
        {
          "type": "tag",
          "name": "ui"
        },
        {
          "type": "tag",
          "name": "tools"
        },
        {
          "type": "module",
          "name": "frontend"
        }
      ],
      "activities": [
        {
          "name": "Before",
          "outcome": "SUCCESS",
          "duration": 31,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:48.715Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/support/hooks.ts",
            "line": 11
          }
        },
        {
          "name": "Given I open the SGSK Wealth application",
          "outcome": "SUCCESS",
          "duration": 263,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:48.746Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/08_tools_calculator.feature",
            "line": 8
          }
        },
        {
          "name": "And I navigate to the Tools view",
          "outcome": "SUCCESS",
          "duration": 121,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:49.009Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/08_tools_calculator.feature",
            "line": 9
          }
        },
        {
          "name": "When I switch to the TVM Calculator tool",
          "outcome": "SUCCESS",
          "duration": 152,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:49.130Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/08_tools_calculator.feature",
            "line": 37
          }
        },
        {
          "name": "And I click the PV valuation basis \"Invested Cost\"",
          "outcome": "SUCCESS",
          "duration": 29,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:49.282Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/08_tools_calculator.feature",
            "line": 38
          }
        },
        {
          "name": "Then the \"Invested Cost\" valuation basis button should be active",
          "outcome": "SUCCESS",
          "duration": 26,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:49.311Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/08_tools_calculator.feature",
            "line": 39
          }
        },
        {
          "name": "When I click the PV valuation basis \"Market Value\"",
          "outcome": "SUCCESS",
          "duration": 44,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:49.337Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/08_tools_calculator.feature",
            "line": 40
          }
        },
        {
          "name": "Then the \"Market Value\" valuation basis button should be active",
          "outcome": "SUCCESS",
          "duration": 27,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:49.381Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/08_tools_calculator.feature",
            "line": 41
          }
        },
        {
          "name": "And I test asset type chips selection if present",
          "outcome": "SUCCESS",
          "duration": 131,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:49.408Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/08_tools_calculator.feature",
            "line": 42
          }
        }
      ],
      "executionHistory": [
        {
          "outcome": "SUCCESS",
          "run": "4",
          "timestamp": "2026-11-11T09:47:32.331Z",
          "duration": 836,
          "activities": [
            {
              "name": "Before",
              "outcome": "SUCCESS",
              "duration": 31,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:48.715Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/support/hooks.ts",
                "line": 11
              }
            },
            {
              "name": "Given I open the SGSK Wealth application",
              "outcome": "SUCCESS",
              "duration": 263,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:48.746Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/08_tools_calculator.feature",
                "line": 8
              }
            },
            {
              "name": "And I navigate to the Tools view",
              "outcome": "SUCCESS",
              "duration": 121,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:49.009Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/08_tools_calculator.feature",
                "line": 9
              }
            },
            {
              "name": "When I switch to the TVM Calculator tool",
              "outcome": "SUCCESS",
              "duration": 152,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:49.130Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/08_tools_calculator.feature",
                "line": 37
              }
            },
            {
              "name": "And I click the PV valuation basis \"Invested Cost\"",
              "outcome": "SUCCESS",
              "duration": 29,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:49.282Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/08_tools_calculator.feature",
                "line": 38
              }
            },
            {
              "name": "Then the \"Invested Cost\" valuation basis button should be active",
              "outcome": "SUCCESS",
              "duration": 26,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:49.311Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/08_tools_calculator.feature",
                "line": 39
              }
            },
            {
              "name": "When I click the PV valuation basis \"Market Value\"",
              "outcome": "SUCCESS",
              "duration": 44,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:49.337Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/08_tools_calculator.feature",
                "line": 40
              }
            },
            {
              "name": "Then the \"Market Value\" valuation basis button should be active",
              "outcome": "SUCCESS",
              "duration": 27,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:49.381Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/08_tools_calculator.feature",
                "line": 41
              }
            },
            {
              "name": "And I test asset type chips selection if present",
              "outcome": "SUCCESS",
              "duration": 131,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:49.408Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/08_tools_calculator.feature",
                "line": 42
              }
            }
          ]
        }
      ],
      "narrative": "<p>As an investor\nI want to simulate average cost orders, calculate TVM compounding, and plan portfolio rebalancing\nSo that I can model forward investment strategies</p>\n",
      "cast": [
        {
          "name": "Investor",
          "abilities": [
            {
              "name": "PerformActivities"
            },
            {
              "name": "AnswerQuestions"
            },
            {
              "name": "RaiseErrors"
            },
            {
              "name": "ScheduleWork",
              "details": "{\"scheduler\":{\"clock\":{\"timeAdjustment\":{\"milliseconds\":0}},\"interactionTimeout\":{\"milliseconds\":5000}}}"
            },
            {
              "name": "BrowseTheWebWithPlaywright"
            },
            {
              "name": "TakeNotes",
              "details": "{\"notepad\":{}}"
            }
          ]
        }
      ],
      "id": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/08_tools_calculator.feature:36@frontend"
    },
    {
      "name": "TC-TOOLS-06: TVM Calculator Year-by-Year Growth Chart and Area/Lines toggle",
      "category": "Tools Hub & Investor Simulators",
      "outcome": "SUCCESS",
      "duration": 670,
      "startedAt": "2026-11-11T09:47:49.550Z",
      "source": {
        "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/08_tools_calculator.feature",
        "line": 44
      },
      "tags": [
        {
          "type": "capability",
          "name": "Ui"
        },
        {
          "type": "feature",
          "name": "Tools Hub & Investor Simulators"
        },
        {
          "type": "tag",
          "name": "ui"
        },
        {
          "type": "tag",
          "name": "tools"
        },
        {
          "type": "module",
          "name": "frontend"
        }
      ],
      "activities": [
        {
          "name": "Before",
          "outcome": "SUCCESS",
          "duration": 31,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:49.551Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/support/hooks.ts",
            "line": 11
          }
        },
        {
          "name": "Given I open the SGSK Wealth application",
          "outcome": "SUCCESS",
          "duration": 283,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:49.583Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/08_tools_calculator.feature",
            "line": 8
          }
        },
        {
          "name": "And I navigate to the Tools view",
          "outcome": "SUCCESS",
          "duration": 87,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:49.867Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/08_tools_calculator.feature",
            "line": 9
          }
        },
        {
          "name": "When I switch to the TVM Calculator tool",
          "outcome": "SUCCESS",
          "duration": 111,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:49.954Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/08_tools_calculator.feature",
            "line": 45
          }
        },
        {
          "name": "Then the TVM growth chart card and svg should be visible",
          "outcome": "SUCCESS",
          "duration": 11,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:50.065Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/08_tools_calculator.feature",
            "line": 46
          }
        },
        {
          "name": "When I toggle TVM chart mode to \"Lines\"",
          "outcome": "SUCCESS",
          "duration": 34,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:50.077Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/08_tools_calculator.feature",
            "line": 47
          }
        },
        {
          "name": "Then the lines chart mode button should be active",
          "outcome": "SUCCESS",
          "duration": 27,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:50.112Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/08_tools_calculator.feature",
            "line": 48
          }
        },
        {
          "name": "When I toggle TVM chart mode to \"Area\"",
          "outcome": "SUCCESS",
          "duration": 41,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:50.139Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/08_tools_calculator.feature",
            "line": 49
          }
        },
        {
          "name": "Then the area chart mode button should be active",
          "outcome": "SUCCESS",
          "duration": 29,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:50.180Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/08_tools_calculator.feature",
            "line": 50
          }
        }
      ],
      "executionHistory": [
        {
          "outcome": "SUCCESS",
          "run": "4",
          "timestamp": "2026-11-11T09:47:32.331Z",
          "duration": 670,
          "activities": [
            {
              "name": "Before",
              "outcome": "SUCCESS",
              "duration": 31,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:49.551Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/support/hooks.ts",
                "line": 11
              }
            },
            {
              "name": "Given I open the SGSK Wealth application",
              "outcome": "SUCCESS",
              "duration": 283,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:49.583Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/08_tools_calculator.feature",
                "line": 8
              }
            },
            {
              "name": "And I navigate to the Tools view",
              "outcome": "SUCCESS",
              "duration": 87,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:49.867Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/08_tools_calculator.feature",
                "line": 9
              }
            },
            {
              "name": "When I switch to the TVM Calculator tool",
              "outcome": "SUCCESS",
              "duration": 111,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:49.954Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/08_tools_calculator.feature",
                "line": 45
              }
            },
            {
              "name": "Then the TVM growth chart card and svg should be visible",
              "outcome": "SUCCESS",
              "duration": 11,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:50.065Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/08_tools_calculator.feature",
                "line": 46
              }
            },
            {
              "name": "When I toggle TVM chart mode to \"Lines\"",
              "outcome": "SUCCESS",
              "duration": 34,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:50.077Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/08_tools_calculator.feature",
                "line": 47
              }
            },
            {
              "name": "Then the lines chart mode button should be active",
              "outcome": "SUCCESS",
              "duration": 27,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:50.112Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/08_tools_calculator.feature",
                "line": 48
              }
            },
            {
              "name": "When I toggle TVM chart mode to \"Area\"",
              "outcome": "SUCCESS",
              "duration": 41,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:50.139Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/08_tools_calculator.feature",
                "line": 49
              }
            },
            {
              "name": "Then the area chart mode button should be active",
              "outcome": "SUCCESS",
              "duration": 29,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:50.180Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/08_tools_calculator.feature",
                "line": 50
              }
            }
          ]
        }
      ],
      "narrative": "<p>As an investor\nI want to simulate average cost orders, calculate TVM compounding, and plan portfolio rebalancing\nSo that I can model forward investment strategies</p>\n",
      "cast": [
        {
          "name": "Investor",
          "abilities": [
            {
              "name": "PerformActivities"
            },
            {
              "name": "AnswerQuestions"
            },
            {
              "name": "RaiseErrors"
            },
            {
              "name": "ScheduleWork",
              "details": "{\"scheduler\":{\"clock\":{\"timeAdjustment\":{\"milliseconds\":0}},\"interactionTimeout\":{\"milliseconds\":5000}}}"
            },
            {
              "name": "BrowseTheWebWithPlaywright"
            },
            {
              "name": "TakeNotes",
              "details": "{\"notepad\":{}}"
            }
          ]
        }
      ],
      "id": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/08_tools_calculator.feature:44@frontend"
    },
    {
      "name": "TC-TOOLS-07: Switch to Rebalance Planner tool and render asset class groups",
      "category": "Tools Hub & Investor Simulators",
      "outcome": "SUCCESS",
      "duration": 595,
      "startedAt": "2026-11-11T09:47:50.221Z",
      "source": {
        "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/08_tools_calculator.feature",
        "line": 52
      },
      "tags": [
        {
          "type": "capability",
          "name": "Ui"
        },
        {
          "type": "feature",
          "name": "Tools Hub & Investor Simulators"
        },
        {
          "type": "tag",
          "name": "ui"
        },
        {
          "type": "tag",
          "name": "tools"
        },
        {
          "type": "module",
          "name": "frontend"
        }
      ],
      "activities": [
        {
          "name": "Before",
          "outcome": "SUCCESS",
          "duration": 31,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:50.221Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/support/hooks.ts",
            "line": 11
          }
        },
        {
          "name": "Given I open the SGSK Wealth application",
          "outcome": "SUCCESS",
          "duration": 306,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:50.253Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/08_tools_calculator.feature",
            "line": 8
          }
        },
        {
          "name": "And I navigate to the Tools view",
          "outcome": "SUCCESS",
          "duration": 97,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:50.560Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/08_tools_calculator.feature",
            "line": 9
          }
        },
        {
          "name": "When I switch to the Rebalance Planner tool",
          "outcome": "SUCCESS",
          "duration": 139,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:50.657Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/08_tools_calculator.feature",
            "line": 53
          }
        },
        {
          "name": "Then the rebalance calculator should be visible",
          "outcome": "SUCCESS",
          "duration": 2,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:50.796Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/08_tools_calculator.feature",
            "line": 54
          }
        },
        {
          "name": "And the rebalance KPI grid should be visible",
          "outcome": "SUCCESS",
          "duration": 2,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:50.798Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/08_tools_calculator.feature",
            "line": 55
          }
        },
        {
          "name": "And the Standard rebalance mode button should be active",
          "outcome": "SUCCESS",
          "duration": 3,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:50.801Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/08_tools_calculator.feature",
            "line": 56
          }
        },
        {
          "name": "And the No-Sell rebalance mode button should be visible",
          "outcome": "SUCCESS",
          "duration": 1,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:50.804Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/08_tools_calculator.feature",
            "line": 57
          }
        }
      ],
      "executionHistory": [
        {
          "outcome": "SUCCESS",
          "run": "4",
          "timestamp": "2026-11-11T09:47:32.331Z",
          "duration": 595,
          "activities": [
            {
              "name": "Before",
              "outcome": "SUCCESS",
              "duration": 31,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:50.221Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/support/hooks.ts",
                "line": 11
              }
            },
            {
              "name": "Given I open the SGSK Wealth application",
              "outcome": "SUCCESS",
              "duration": 306,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:50.253Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/08_tools_calculator.feature",
                "line": 8
              }
            },
            {
              "name": "And I navigate to the Tools view",
              "outcome": "SUCCESS",
              "duration": 97,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:50.560Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/08_tools_calculator.feature",
                "line": 9
              }
            },
            {
              "name": "When I switch to the Rebalance Planner tool",
              "outcome": "SUCCESS",
              "duration": 139,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:50.657Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/08_tools_calculator.feature",
                "line": 53
              }
            },
            {
              "name": "Then the rebalance calculator should be visible",
              "outcome": "SUCCESS",
              "duration": 2,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:50.796Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/08_tools_calculator.feature",
                "line": 54
              }
            },
            {
              "name": "And the rebalance KPI grid should be visible",
              "outcome": "SUCCESS",
              "duration": 2,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:50.798Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/08_tools_calculator.feature",
                "line": 55
              }
            },
            {
              "name": "And the Standard rebalance mode button should be active",
              "outcome": "SUCCESS",
              "duration": 3,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:50.801Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/08_tools_calculator.feature",
                "line": 56
              }
            },
            {
              "name": "And the No-Sell rebalance mode button should be visible",
              "outcome": "SUCCESS",
              "duration": 1,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:50.804Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/08_tools_calculator.feature",
                "line": 57
              }
            }
          ]
        }
      ],
      "narrative": "<p>As an investor\nI want to simulate average cost orders, calculate TVM compounding, and plan portfolio rebalancing\nSo that I can model forward investment strategies</p>\n",
      "cast": [
        {
          "name": "Investor",
          "abilities": [
            {
              "name": "PerformActivities"
            },
            {
              "name": "AnswerQuestions"
            },
            {
              "name": "RaiseErrors"
            },
            {
              "name": "ScheduleWork",
              "details": "{\"scheduler\":{\"clock\":{\"timeAdjustment\":{\"milliseconds\":0}},\"interactionTimeout\":{\"milliseconds\":5000}}}"
            },
            {
              "name": "BrowseTheWebWithPlaywright"
            },
            {
              "name": "TakeNotes",
              "details": "{\"notepad\":{}}"
            }
          ]
        }
      ],
      "id": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/08_tools_calculator.feature:52@frontend"
    },
    {
      "name": "TC-TOOLS-08: Rebalance Planner quick actions and target adjustments",
      "category": "Tools Hub & Investor Simulators",
      "outcome": "SUCCESS",
      "duration": 591,
      "startedAt": "2026-11-11T09:47:50.817Z",
      "source": {
        "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/08_tools_calculator.feature",
        "line": 59
      },
      "tags": [
        {
          "type": "capability",
          "name": "Ui"
        },
        {
          "type": "feature",
          "name": "Tools Hub & Investor Simulators"
        },
        {
          "type": "tag",
          "name": "ui"
        },
        {
          "type": "tag",
          "name": "tools"
        },
        {
          "type": "module",
          "name": "frontend"
        }
      ],
      "activities": [
        {
          "name": "Before",
          "outcome": "SUCCESS",
          "duration": 32,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:50.818Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/support/hooks.ts",
            "line": 11
          }
        },
        {
          "name": "Given I open the SGSK Wealth application",
          "outcome": "SUCCESS",
          "duration": 266,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:50.850Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/08_tools_calculator.feature",
            "line": 8
          }
        },
        {
          "name": "And I navigate to the Tools view",
          "outcome": "SUCCESS",
          "duration": 99,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:51.116Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/08_tools_calculator.feature",
            "line": 9
          }
        },
        {
          "name": "When I switch to the Rebalance Planner tool",
          "outcome": "SUCCESS",
          "duration": 134,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:51.215Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/08_tools_calculator.feature",
            "line": 60
          }
        },
        {
          "name": "Then I test Rebalance Planner equal weight actions if groups exist",
          "outcome": "SUCCESS",
          "duration": 47,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:51.350Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/08_tools_calculator.feature",
            "line": 61
          }
        }
      ],
      "executionHistory": [
        {
          "outcome": "SUCCESS",
          "run": "4",
          "timestamp": "2026-11-11T09:47:32.331Z",
          "duration": 591,
          "activities": [
            {
              "name": "Before",
              "outcome": "SUCCESS",
              "duration": 32,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:50.818Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/support/hooks.ts",
                "line": 11
              }
            },
            {
              "name": "Given I open the SGSK Wealth application",
              "outcome": "SUCCESS",
              "duration": 266,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:50.850Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/08_tools_calculator.feature",
                "line": 8
              }
            },
            {
              "name": "And I navigate to the Tools view",
              "outcome": "SUCCESS",
              "duration": 99,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:51.116Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/08_tools_calculator.feature",
                "line": 9
              }
            },
            {
              "name": "When I switch to the Rebalance Planner tool",
              "outcome": "SUCCESS",
              "duration": 134,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:51.215Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/08_tools_calculator.feature",
                "line": 60
              }
            },
            {
              "name": "Then I test Rebalance Planner equal weight actions if groups exist",
              "outcome": "SUCCESS",
              "duration": 47,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:51.350Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/08_tools_calculator.feature",
                "line": 61
              }
            }
          ]
        }
      ],
      "narrative": "<p>As an investor\nI want to simulate average cost orders, calculate TVM compounding, and plan portfolio rebalancing\nSo that I can model forward investment strategies</p>\n",
      "cast": [
        {
          "name": "Investor",
          "abilities": [
            {
              "name": "PerformActivities"
            },
            {
              "name": "AnswerQuestions"
            },
            {
              "name": "RaiseErrors"
            },
            {
              "name": "ScheduleWork",
              "details": "{\"scheduler\":{\"clock\":{\"timeAdjustment\":{\"milliseconds\":0}},\"interactionTimeout\":{\"milliseconds\":5000}}}"
            },
            {
              "name": "BrowseTheWebWithPlaywright"
            },
            {
              "name": "TakeNotes",
              "details": "{\"notepad\":{}}"
            }
          ]
        }
      ],
      "id": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/08_tools_calculator.feature:59@frontend"
    },
    {
      "name": "TC-TOOLS-09: Rebalance Planner No-Sell mode and cash deposit calculation",
      "category": "Tools Hub & Investor Simulators",
      "outcome": "SUCCESS",
      "duration": 670,
      "startedAt": "2026-11-11T09:47:51.409Z",
      "source": {
        "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/08_tools_calculator.feature",
        "line": 63
      },
      "tags": [
        {
          "type": "capability",
          "name": "Ui"
        },
        {
          "type": "feature",
          "name": "Tools Hub & Investor Simulators"
        },
        {
          "type": "tag",
          "name": "ui"
        },
        {
          "type": "tag",
          "name": "tools"
        },
        {
          "type": "module",
          "name": "frontend"
        }
      ],
      "activities": [
        {
          "name": "Before",
          "outcome": "SUCCESS",
          "duration": 31,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:51.410Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/support/hooks.ts",
            "line": 11
          }
        },
        {
          "name": "Given I open the SGSK Wealth application",
          "outcome": "SUCCESS",
          "duration": 260,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:51.442Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/08_tools_calculator.feature",
            "line": 8
          }
        },
        {
          "name": "And I navigate to the Tools view",
          "outcome": "SUCCESS",
          "duration": 88,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:51.703Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/08_tools_calculator.feature",
            "line": 9
          }
        },
        {
          "name": "When I switch to the Rebalance Planner tool",
          "outcome": "SUCCESS",
          "duration": 149,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:51.791Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/08_tools_calculator.feature",
            "line": 64
          }
        },
        {
          "name": "And I click the No-Sell mode button",
          "outcome": "SUCCESS",
          "duration": 63,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:51.940Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/08_tools_calculator.feature",
            "line": 65
          }
        },
        {
          "name": "Then the No-Sell settings panel should be visible",
          "outcome": "SUCCESS",
          "duration": 2,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:52.004Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/08_tools_calculator.feature",
            "line": 66
          }
        },
        {
          "name": "When I select the custom cash deposit radio",
          "outcome": "SUCCESS",
          "duration": 40,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:52.006Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/08_tools_calculator.feature",
            "line": 67
          }
        },
        {
          "name": "Then the custom cash input should be visible",
          "outcome": "SUCCESS",
          "duration": 22,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:52.046Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/08_tools_calculator.feature",
            "line": 68
          }
        }
      ],
      "executionHistory": [
        {
          "outcome": "SUCCESS",
          "run": "4",
          "timestamp": "2026-11-11T09:47:32.331Z",
          "duration": 670,
          "activities": [
            {
              "name": "Before",
              "outcome": "SUCCESS",
              "duration": 31,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:51.410Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/support/hooks.ts",
                "line": 11
              }
            },
            {
              "name": "Given I open the SGSK Wealth application",
              "outcome": "SUCCESS",
              "duration": 260,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:51.442Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/08_tools_calculator.feature",
                "line": 8
              }
            },
            {
              "name": "And I navigate to the Tools view",
              "outcome": "SUCCESS",
              "duration": 88,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:51.703Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/08_tools_calculator.feature",
                "line": 9
              }
            },
            {
              "name": "When I switch to the Rebalance Planner tool",
              "outcome": "SUCCESS",
              "duration": 149,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:51.791Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/08_tools_calculator.feature",
                "line": 64
              }
            },
            {
              "name": "And I click the No-Sell mode button",
              "outcome": "SUCCESS",
              "duration": 63,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:51.940Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/08_tools_calculator.feature",
                "line": 65
              }
            },
            {
              "name": "Then the No-Sell settings panel should be visible",
              "outcome": "SUCCESS",
              "duration": 2,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:52.004Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/08_tools_calculator.feature",
                "line": 66
              }
            },
            {
              "name": "When I select the custom cash deposit radio",
              "outcome": "SUCCESS",
              "duration": 40,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:52.006Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/08_tools_calculator.feature",
                "line": 67
              }
            },
            {
              "name": "Then the custom cash input should be visible",
              "outcome": "SUCCESS",
              "duration": 22,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:52.046Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/08_tools_calculator.feature",
                "line": 68
              }
            }
          ]
        }
      ],
      "narrative": "<p>As an investor\nI want to simulate average cost orders, calculate TVM compounding, and plan portfolio rebalancing\nSo that I can model forward investment strategies</p>\n",
      "cast": [
        {
          "name": "Investor",
          "abilities": [
            {
              "name": "PerformActivities"
            },
            {
              "name": "AnswerQuestions"
            },
            {
              "name": "RaiseErrors"
            },
            {
              "name": "ScheduleWork",
              "details": "{\"scheduler\":{\"clock\":{\"timeAdjustment\":{\"milliseconds\":0}},\"interactionTimeout\":{\"milliseconds\":5000}}}"
            },
            {
              "name": "BrowseTheWebWithPlaywright"
            },
            {
              "name": "TakeNotes",
              "details": "{\"notepad\":{}}"
            }
          ]
        }
      ],
      "id": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/08_tools_calculator.feature:63@frontend"
    },
    {
      "name": "TC-TOOLS-10: Rebalance Planner filter refreshes KPI grid and orders checklist",
      "category": "Tools Hub & Investor Simulators",
      "outcome": "SUCCESS",
      "duration": 668,
      "startedAt": "2026-11-11T09:47:52.080Z",
      "source": {
        "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/08_tools_calculator.feature",
        "line": 70
      },
      "tags": [
        {
          "type": "capability",
          "name": "Ui"
        },
        {
          "type": "feature",
          "name": "Tools Hub & Investor Simulators"
        },
        {
          "type": "tag",
          "name": "ui"
        },
        {
          "type": "tag",
          "name": "tools"
        },
        {
          "type": "module",
          "name": "frontend"
        }
      ],
      "activities": [
        {
          "name": "Before",
          "outcome": "SUCCESS",
          "duration": 32,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:52.081Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/support/hooks.ts",
            "line": 11
          }
        },
        {
          "name": "Given I open the SGSK Wealth application",
          "outcome": "SUCCESS",
          "duration": 272,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:52.114Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/08_tools_calculator.feature",
            "line": 8
          }
        },
        {
          "name": "And I navigate to the Tools view",
          "outcome": "SUCCESS",
          "duration": 90,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:52.387Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/08_tools_calculator.feature",
            "line": 9
          }
        },
        {
          "name": "When I switch to the Rebalance Planner tool",
          "outcome": "SUCCESS",
          "duration": 138,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:52.478Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/08_tools_calculator.feature",
            "line": 71
          }
        },
        {
          "name": "Then I test Rebalance Planner class chip filters if present",
          "outcome": "SUCCESS",
          "duration": 120,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:52.617Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/08_tools_calculator.feature",
            "line": 72
          }
        }
      ],
      "executionHistory": [
        {
          "outcome": "SUCCESS",
          "run": "4",
          "timestamp": "2026-11-11T09:47:32.331Z",
          "duration": 668,
          "activities": [
            {
              "name": "Before",
              "outcome": "SUCCESS",
              "duration": 32,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:52.081Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/support/hooks.ts",
                "line": 11
              }
            },
            {
              "name": "Given I open the SGSK Wealth application",
              "outcome": "SUCCESS",
              "duration": 272,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:52.114Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/08_tools_calculator.feature",
                "line": 8
              }
            },
            {
              "name": "And I navigate to the Tools view",
              "outcome": "SUCCESS",
              "duration": 90,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:52.387Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/08_tools_calculator.feature",
                "line": 9
              }
            },
            {
              "name": "When I switch to the Rebalance Planner tool",
              "outcome": "SUCCESS",
              "duration": 138,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:52.478Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/08_tools_calculator.feature",
                "line": 71
              }
            },
            {
              "name": "Then I test Rebalance Planner class chip filters if present",
              "outcome": "SUCCESS",
              "duration": 120,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:52.617Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/08_tools_calculator.feature",
                "line": 72
              }
            }
          ]
        }
      ],
      "narrative": "<p>As an investor\nI want to simulate average cost orders, calculate TVM compounding, and plan portfolio rebalancing\nSo that I can model forward investment strategies</p>\n",
      "cast": [
        {
          "name": "Investor",
          "abilities": [
            {
              "name": "PerformActivities"
            },
            {
              "name": "AnswerQuestions"
            },
            {
              "name": "RaiseErrors"
            },
            {
              "name": "ScheduleWork",
              "details": "{\"scheduler\":{\"clock\":{\"timeAdjustment\":{\"milliseconds\":0}},\"interactionTimeout\":{\"milliseconds\":5000}}}"
            },
            {
              "name": "BrowseTheWebWithPlaywright"
            },
            {
              "name": "TakeNotes",
              "details": "{\"notepad\":{}}"
            }
          ]
        }
      ],
      "id": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/08_tools_calculator.feature:70@frontend"
    },
    {
      "name": "TC-DIV-01: Displays summary KPI cards including Yield on Cost (YOC)",
      "category": "Dividend Analytics & Yield on Cost (YOC)",
      "outcome": "SUCCESS",
      "duration": 420,
      "startedAt": "2026-11-11T09:47:52.749Z",
      "source": {
        "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/09_dividend_analytics.feature",
        "line": 11
      },
      "tags": [
        {
          "type": "capability",
          "name": "Ui"
        },
        {
          "type": "feature",
          "name": "Dividend Analytics & Yield on Cost (YOC)"
        },
        {
          "type": "tag",
          "name": "ui"
        },
        {
          "type": "tag",
          "name": "dividend"
        },
        {
          "type": "module",
          "name": "frontend"
        }
      ],
      "activities": [
        {
          "name": "Before",
          "outcome": "SUCCESS",
          "duration": 30,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:52.750Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/support/hooks.ts",
            "line": 11
          }
        },
        {
          "name": "Given I open the SGSK Wealth application",
          "outcome": "SUCCESS",
          "duration": 248,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:52.780Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/09_dividend_analytics.feature",
            "line": 8
          }
        },
        {
          "name": "And I navigate to the Dividends view",
          "outcome": "SUCCESS",
          "duration": 120,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:53.028Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/09_dividend_analytics.feature",
            "line": 9
          }
        },
        {
          "name": "Then the dividend view should render 5 summary KPI cards",
          "outcome": "SUCCESS",
          "duration": 3,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:53.149Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/09_dividend_analytics.feature",
            "line": 12
          }
        },
        {
          "name": "And the Yield on Cost card should display \"7.50%\" and label \"Yield on Cost (YOC)\"",
          "outcome": "SUCCESS",
          "duration": 6,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:53.152Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/09_dividend_analytics.feature",
            "line": 13
          }
        }
      ],
      "executionHistory": [
        {
          "outcome": "SUCCESS",
          "run": "4",
          "timestamp": "2026-11-11T09:47:32.331Z",
          "duration": 420,
          "activities": [
            {
              "name": "Before",
              "outcome": "SUCCESS",
              "duration": 30,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:52.750Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/support/hooks.ts",
                "line": 11
              }
            },
            {
              "name": "Given I open the SGSK Wealth application",
              "outcome": "SUCCESS",
              "duration": 248,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:52.780Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/09_dividend_analytics.feature",
                "line": 8
              }
            },
            {
              "name": "And I navigate to the Dividends view",
              "outcome": "SUCCESS",
              "duration": 120,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:53.028Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/09_dividend_analytics.feature",
                "line": 9
              }
            },
            {
              "name": "Then the dividend view should render 5 summary KPI cards",
              "outcome": "SUCCESS",
              "duration": 3,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:53.149Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/09_dividend_analytics.feature",
                "line": 12
              }
            },
            {
              "name": "And the Yield on Cost card should display \"7.50%\" and label \"Yield on Cost (YOC)\"",
              "outcome": "SUCCESS",
              "duration": 6,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:53.152Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/09_dividend_analytics.feature",
                "line": 13
              }
            }
          ]
        }
      ],
      "narrative": "<p>As an investor\nI want to track dividend income, Yield on Cost (YOC), and monthly cashflow timelines\nSo that I can evaluate passive cashflow generation</p>\n",
      "cast": [
        {
          "name": "Investor",
          "abilities": [
            {
              "name": "PerformActivities"
            },
            {
              "name": "AnswerQuestions"
            },
            {
              "name": "RaiseErrors"
            },
            {
              "name": "ScheduleWork",
              "details": "{\"scheduler\":{\"clock\":{\"timeAdjustment\":{\"milliseconds\":0}},\"interactionTimeout\":{\"milliseconds\":5000}}}"
            },
            {
              "name": "BrowseTheWebWithPlaywright"
            },
            {
              "name": "TakeNotes",
              "details": "{\"notepad\":{}}"
            }
          ]
        }
      ],
      "id": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/09_dividend_analytics.feature:11@frontend"
    },
    {
      "name": "TC-DIV-02: Displays asset type breakdown cards with accurate YOC indicators",
      "category": "Dividend Analytics & Yield on Cost (YOC)",
      "outcome": "SUCCESS",
      "duration": 452,
      "startedAt": "2026-11-11T09:47:53.170Z",
      "source": {
        "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/09_dividend_analytics.feature",
        "line": 15
      },
      "tags": [
        {
          "type": "capability",
          "name": "Ui"
        },
        {
          "type": "feature",
          "name": "Dividend Analytics & Yield on Cost (YOC)"
        },
        {
          "type": "tag",
          "name": "ui"
        },
        {
          "type": "tag",
          "name": "dividend"
        },
        {
          "type": "module",
          "name": "frontend"
        }
      ],
      "activities": [
        {
          "name": "Before",
          "outcome": "SUCCESS",
          "duration": 29,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:53.171Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/support/hooks.ts",
            "line": 11
          }
        },
        {
          "name": "Given I open the SGSK Wealth application",
          "outcome": "SUCCESS",
          "duration": 252,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:53.201Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/09_dividend_analytics.feature",
            "line": 8
          }
        },
        {
          "name": "And I navigate to the Dividends view",
          "outcome": "SUCCESS",
          "duration": 133,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:53.454Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/09_dividend_analytics.feature",
            "line": 9
          }
        },
        {
          "name": "Then the dividend asset breakdown card for \"Thai Stock\" should display YOC \"7.43%\"",
          "outcome": "SUCCESS",
          "duration": 16,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:53.588Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/09_dividend_analytics.feature",
            "line": 16
          }
        },
        {
          "name": "And the dividend asset breakdown card for \"U.S. Stock\" should display YOC \"0.54%\"",
          "outcome": "SUCCESS",
          "duration": 7,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:53.604Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/09_dividend_analytics.feature",
            "line": 17
          }
        }
      ],
      "executionHistory": [
        {
          "outcome": "SUCCESS",
          "run": "4",
          "timestamp": "2026-11-11T09:47:32.331Z",
          "duration": 452,
          "activities": [
            {
              "name": "Before",
              "outcome": "SUCCESS",
              "duration": 29,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:53.171Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/support/hooks.ts",
                "line": 11
              }
            },
            {
              "name": "Given I open the SGSK Wealth application",
              "outcome": "SUCCESS",
              "duration": 252,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:53.201Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/09_dividend_analytics.feature",
                "line": 8
              }
            },
            {
              "name": "And I navigate to the Dividends view",
              "outcome": "SUCCESS",
              "duration": 133,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:53.454Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/09_dividend_analytics.feature",
                "line": 9
              }
            },
            {
              "name": "Then the dividend asset breakdown card for \"Thai Stock\" should display YOC \"7.43%\"",
              "outcome": "SUCCESS",
              "duration": 16,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:53.588Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/09_dividend_analytics.feature",
                "line": 16
              }
            },
            {
              "name": "And the dividend asset breakdown card for \"U.S. Stock\" should display YOC \"0.54%\"",
              "outcome": "SUCCESS",
              "duration": 7,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:53.604Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/09_dividend_analytics.feature",
                "line": 17
              }
            }
          ]
        }
      ],
      "narrative": "<p>As an investor\nI want to track dividend income, Yield on Cost (YOC), and monthly cashflow timelines\nSo that I can evaluate passive cashflow generation</p>\n",
      "cast": [
        {
          "name": "Investor",
          "abilities": [
            {
              "name": "PerformActivities"
            },
            {
              "name": "AnswerQuestions"
            },
            {
              "name": "RaiseErrors"
            },
            {
              "name": "ScheduleWork",
              "details": "{\"scheduler\":{\"clock\":{\"timeAdjustment\":{\"milliseconds\":0}},\"interactionTimeout\":{\"milliseconds\":5000}}}"
            },
            {
              "name": "BrowseTheWebWithPlaywright"
            },
            {
              "name": "TakeNotes",
              "details": "{\"notepad\":{}}"
            }
          ]
        }
      ],
      "id": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/09_dividend_analytics.feature:15@frontend"
    },
    {
      "name": "TC-DIV-03: Switching asset type filters YOC KPI card accurately without currency distortion",
      "category": "Dividend Analytics & Yield on Cost (YOC)",
      "outcome": "SUCCESS",
      "duration": 624,
      "startedAt": "2026-11-11T09:47:53.623Z",
      "source": {
        "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/09_dividend_analytics.feature",
        "line": 19
      },
      "tags": [
        {
          "type": "capability",
          "name": "Ui"
        },
        {
          "type": "feature",
          "name": "Dividend Analytics & Yield on Cost (YOC)"
        },
        {
          "type": "tag",
          "name": "ui"
        },
        {
          "type": "tag",
          "name": "dividend"
        },
        {
          "type": "module",
          "name": "frontend"
        }
      ],
      "activities": [
        {
          "name": "Before",
          "outcome": "SUCCESS",
          "duration": 28,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:53.624Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/support/hooks.ts",
            "line": 11
          }
        },
        {
          "name": "Given I open the SGSK Wealth application",
          "outcome": "SUCCESS",
          "duration": 261,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:53.653Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/09_dividend_analytics.feature",
            "line": 8
          }
        },
        {
          "name": "And I navigate to the Dividends view",
          "outcome": "SUCCESS",
          "duration": 164,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:53.914Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/09_dividend_analytics.feature",
            "line": 9
          }
        },
        {
          "name": "Then the Yield on Cost KPI card should show \"7.50%\"",
          "outcome": "SUCCESS",
          "duration": 3,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:54.078Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/09_dividend_analytics.feature",
            "line": 20
          }
        },
        {
          "name": "When I filter dividends to asset type \"Thai Stocks\"",
          "outcome": "SUCCESS",
          "duration": 29,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:54.082Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/09_dividend_analytics.feature",
            "line": 21
          }
        },
        {
          "name": "Then the Yield on Cost KPI card should show \"7.43%\"",
          "outcome": "SUCCESS",
          "duration": 25,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:54.111Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/09_dividend_analytics.feature",
            "line": 22
          }
        },
        {
          "name": "When I filter dividends to asset type \"U.S. Stocks\"",
          "outcome": "SUCCESS",
          "duration": 25,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:54.136Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/09_dividend_analytics.feature",
            "line": 23
          }
        },
        {
          "name": "Then the Yield on Cost KPI card should show \"0.54%\"",
          "outcome": "SUCCESS",
          "duration": 26,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:54.161Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/09_dividend_analytics.feature",
            "line": 24
          }
        },
        {
          "name": "When I filter dividends to asset type \"All Assets\"",
          "outcome": "SUCCESS",
          "duration": 24,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:54.187Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/09_dividend_analytics.feature",
            "line": 25
          }
        },
        {
          "name": "Then the Yield on Cost KPI card should show \"7.50%\"",
          "outcome": "SUCCESS",
          "duration": 25,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:54.211Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/09_dividend_analytics.feature",
            "line": 26
          }
        }
      ],
      "executionHistory": [
        {
          "outcome": "SUCCESS",
          "run": "4",
          "timestamp": "2026-11-11T09:47:32.331Z",
          "duration": 624,
          "activities": [
            {
              "name": "Before",
              "outcome": "SUCCESS",
              "duration": 28,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:53.624Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/support/hooks.ts",
                "line": 11
              }
            },
            {
              "name": "Given I open the SGSK Wealth application",
              "outcome": "SUCCESS",
              "duration": 261,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:53.653Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/09_dividend_analytics.feature",
                "line": 8
              }
            },
            {
              "name": "And I navigate to the Dividends view",
              "outcome": "SUCCESS",
              "duration": 164,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:53.914Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/09_dividend_analytics.feature",
                "line": 9
              }
            },
            {
              "name": "Then the Yield on Cost KPI card should show \"7.50%\"",
              "outcome": "SUCCESS",
              "duration": 3,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:54.078Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/09_dividend_analytics.feature",
                "line": 20
              }
            },
            {
              "name": "When I filter dividends to asset type \"Thai Stocks\"",
              "outcome": "SUCCESS",
              "duration": 29,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:54.082Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/09_dividend_analytics.feature",
                "line": 21
              }
            },
            {
              "name": "Then the Yield on Cost KPI card should show \"7.43%\"",
              "outcome": "SUCCESS",
              "duration": 25,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:54.111Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/09_dividend_analytics.feature",
                "line": 22
              }
            },
            {
              "name": "When I filter dividends to asset type \"U.S. Stocks\"",
              "outcome": "SUCCESS",
              "duration": 25,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:54.136Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/09_dividend_analytics.feature",
                "line": 23
              }
            },
            {
              "name": "Then the Yield on Cost KPI card should show \"0.54%\"",
              "outcome": "SUCCESS",
              "duration": 26,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:54.161Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/09_dividend_analytics.feature",
                "line": 24
              }
            },
            {
              "name": "When I filter dividends to asset type \"All Assets\"",
              "outcome": "SUCCESS",
              "duration": 24,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:54.187Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/09_dividend_analytics.feature",
                "line": 25
              }
            },
            {
              "name": "Then the Yield on Cost KPI card should show \"7.50%\"",
              "outcome": "SUCCESS",
              "duration": 25,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:54.211Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/09_dividend_analytics.feature",
                "line": 26
              }
            }
          ]
        }
      ],
      "narrative": "<p>As an investor\nI want to track dividend income, Yield on Cost (YOC), and monthly cashflow timelines\nSo that I can evaluate passive cashflow generation</p>\n",
      "cast": [
        {
          "name": "Investor",
          "abilities": [
            {
              "name": "PerformActivities"
            },
            {
              "name": "AnswerQuestions"
            },
            {
              "name": "RaiseErrors"
            },
            {
              "name": "ScheduleWork",
              "details": "{\"scheduler\":{\"clock\":{\"timeAdjustment\":{\"milliseconds\":0}},\"interactionTimeout\":{\"milliseconds\":5000}}}"
            },
            {
              "name": "BrowseTheWebWithPlaywright"
            },
            {
              "name": "TakeNotes",
              "details": "{\"notepad\":{}}"
            }
          ]
        }
      ],
      "id": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/09_dividend_analytics.feature:19@frontend"
    },
    {
      "name": "TC-DIV-05: Monthly Cashflow Timeline includes Bonds in legend and timeline segments",
      "category": "Dividend Analytics & Yield on Cost (YOC)",
      "outcome": "SUCCESS",
      "duration": 485,
      "startedAt": "2026-11-11T09:47:54.248Z",
      "source": {
        "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/09_dividend_analytics.feature",
        "line": 28
      },
      "tags": [
        {
          "type": "capability",
          "name": "Ui"
        },
        {
          "type": "feature",
          "name": "Dividend Analytics & Yield on Cost (YOC)"
        },
        {
          "type": "tag",
          "name": "ui"
        },
        {
          "type": "tag",
          "name": "dividend"
        },
        {
          "type": "module",
          "name": "frontend"
        }
      ],
      "activities": [
        {
          "name": "Before",
          "outcome": "SUCCESS",
          "duration": 31,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:54.249Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/support/hooks.ts",
            "line": 11
          }
        },
        {
          "name": "Given I open the SGSK Wealth application",
          "outcome": "SUCCESS",
          "duration": 287,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:54.280Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/09_dividend_analytics.feature",
            "line": 8
          }
        },
        {
          "name": "And I navigate to the Dividends view",
          "outcome": "SUCCESS",
          "duration": 139,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:54.567Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/09_dividend_analytics.feature",
            "line": 9
          }
        },
        {
          "name": "Then the monthly cashflow timeline chart should be visible",
          "outcome": "SUCCESS",
          "duration": 8,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:54.706Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/09_dividend_analytics.feature",
            "line": 29
          }
        },
        {
          "name": "And the timeline legend should contain \"U.S. Stocks\", \"Thai Stocks\", \"Mutual Funds\", and \"Bonds\"",
          "outcome": "SUCCESS",
          "duration": 8,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:54.714Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/09_dividend_analytics.feature",
            "line": 30
          }
        }
      ],
      "executionHistory": [
        {
          "outcome": "SUCCESS",
          "run": "4",
          "timestamp": "2026-11-11T09:47:32.331Z",
          "duration": 485,
          "activities": [
            {
              "name": "Before",
              "outcome": "SUCCESS",
              "duration": 31,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:54.249Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/support/hooks.ts",
                "line": 11
              }
            },
            {
              "name": "Given I open the SGSK Wealth application",
              "outcome": "SUCCESS",
              "duration": 287,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:54.280Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/09_dividend_analytics.feature",
                "line": 8
              }
            },
            {
              "name": "And I navigate to the Dividends view",
              "outcome": "SUCCESS",
              "duration": 139,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:54.567Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/09_dividend_analytics.feature",
                "line": 9
              }
            },
            {
              "name": "Then the monthly cashflow timeline chart should be visible",
              "outcome": "SUCCESS",
              "duration": 8,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:54.706Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/09_dividend_analytics.feature",
                "line": 29
              }
            },
            {
              "name": "And the timeline legend should contain \"U.S. Stocks\", \"Thai Stocks\", \"Mutual Funds\", and \"Bonds\"",
              "outcome": "SUCCESS",
              "duration": 8,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:54.714Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/09_dividend_analytics.feature",
                "line": 30
              }
            }
          ]
        }
      ],
      "narrative": "<p>As an investor\nI want to track dividend income, Yield on Cost (YOC), and monthly cashflow timelines\nSo that I can evaluate passive cashflow generation</p>\n",
      "cast": [
        {
          "name": "Investor",
          "abilities": [
            {
              "name": "PerformActivities"
            },
            {
              "name": "AnswerQuestions"
            },
            {
              "name": "RaiseErrors"
            },
            {
              "name": "ScheduleWork",
              "details": "{\"scheduler\":{\"clock\":{\"timeAdjustment\":{\"milliseconds\":0}},\"interactionTimeout\":{\"milliseconds\":5000}}}"
            },
            {
              "name": "BrowseTheWebWithPlaywright"
            },
            {
              "name": "TakeNotes",
              "details": "{\"notepad\":{}}"
            }
          ]
        }
      ],
      "id": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/09_dividend_analytics.feature:28@frontend"
    },
    {
      "name": "TC-DASH-01: Application lands on Dashboard by default with Executive Net Worth banner",
      "category": "Dashboard Landing Page & Executive Overview",
      "outcome": "SUCCESS",
      "duration": 440,
      "startedAt": "2026-11-11T09:47:54.734Z",
      "source": {
        "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/10_dashboard_overview.feature",
        "line": 10
      },
      "tags": [
        {
          "type": "capability",
          "name": "Ui"
        },
        {
          "type": "feature",
          "name": "Dashboard Landing Page & Executive Overview"
        },
        {
          "type": "tag",
          "name": "ui"
        },
        {
          "type": "tag",
          "name": "dashboard"
        },
        {
          "type": "tag",
          "name": "smoke"
        },
        {
          "type": "module",
          "name": "frontend"
        }
      ],
      "activities": [
        {
          "name": "Before",
          "outcome": "SUCCESS",
          "duration": 35,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:54.735Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/support/hooks.ts",
            "line": 11
          }
        },
        {
          "name": "Given I open the SGSK Wealth application",
          "outcome": "SUCCESS",
          "duration": 317,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:54.771Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/10_dashboard_overview.feature",
            "line": 8
          }
        },
        {
          "name": "Then the Dashboard view should be visible",
          "outcome": "SUCCESS",
          "duration": 51,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:55.088Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/10_dashboard_overview.feature",
            "line": 11
          }
        },
        {
          "name": "And the Dashboard header navigation button should be active",
          "outcome": "SUCCESS",
          "duration": 5,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:55.139Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/10_dashboard_overview.feature",
            "line": 12
          }
        },
        {
          "name": "And the Executive Net Worth banner should be displayed",
          "outcome": "SUCCESS",
          "duration": 6,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:55.145Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/10_dashboard_overview.feature",
            "line": 13
          }
        },
        {
          "name": "And the 4 executive KPI cards should be visible",
          "outcome": "SUCCESS",
          "duration": 11,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:55.152Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/10_dashboard_overview.feature",
            "line": 14
          }
        }
      ],
      "executionHistory": [
        {
          "outcome": "SUCCESS",
          "run": "4",
          "timestamp": "2026-11-11T09:47:32.331Z",
          "duration": 440,
          "activities": [
            {
              "name": "Before",
              "outcome": "SUCCESS",
              "duration": 35,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:54.735Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/support/hooks.ts",
                "line": 11
              }
            },
            {
              "name": "Given I open the SGSK Wealth application",
              "outcome": "SUCCESS",
              "duration": 317,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:54.771Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/10_dashboard_overview.feature",
                "line": 8
              }
            },
            {
              "name": "Then the Dashboard view should be visible",
              "outcome": "SUCCESS",
              "duration": 51,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:55.088Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/10_dashboard_overview.feature",
                "line": 11
              }
            },
            {
              "name": "And the Dashboard header navigation button should be active",
              "outcome": "SUCCESS",
              "duration": 5,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:55.139Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/10_dashboard_overview.feature",
                "line": 12
              }
            },
            {
              "name": "And the Executive Net Worth banner should be displayed",
              "outcome": "SUCCESS",
              "duration": 6,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:55.145Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/10_dashboard_overview.feature",
                "line": 13
              }
            },
            {
              "name": "And the 4 executive KPI cards should be visible",
              "outcome": "SUCCESS",
              "duration": 11,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:55.152Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/10_dashboard_overview.feature",
                "line": 14
              }
            }
          ]
        }
      ],
      "narrative": "<p>As an executive investor\nI want an executive dashboard landing page with net worth hero banner, donut snapshot, movers, and tools\nSo that I have an immediate high-level summary of my investment portfolio</p>\n",
      "cast": [
        {
          "name": "Investor",
          "abilities": [
            {
              "name": "PerformActivities"
            },
            {
              "name": "AnswerQuestions"
            },
            {
              "name": "RaiseErrors"
            },
            {
              "name": "ScheduleWork",
              "details": "{\"scheduler\":{\"clock\":{\"timeAdjustment\":{\"milliseconds\":0}},\"interactionTimeout\":{\"milliseconds\":5000}}}"
            },
            {
              "name": "BrowseTheWebWithPlaywright"
            },
            {
              "name": "TakeNotes",
              "details": "{\"notepad\":{}}"
            }
          ]
        }
      ],
      "id": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/10_dashboard_overview.feature:10@frontend"
    },
    {
      "name": "TC-DASH-02: Asset Allocation donut chart is displayed with direct navigation",
      "category": "Dashboard Landing Page & Executive Overview",
      "outcome": "SUCCESS",
      "duration": 884,
      "startedAt": "2026-11-11T09:47:55.175Z",
      "source": {
        "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/10_dashboard_overview.feature",
        "line": 16
      },
      "tags": [
        {
          "type": "capability",
          "name": "Ui"
        },
        {
          "type": "feature",
          "name": "Dashboard Landing Page & Executive Overview"
        },
        {
          "type": "tag",
          "name": "ui"
        },
        {
          "type": "tag",
          "name": "dashboard"
        },
        {
          "type": "tag",
          "name": "smoke"
        },
        {
          "type": "module",
          "name": "frontend"
        }
      ],
      "activities": [
        {
          "name": "Before",
          "outcome": "SUCCESS",
          "duration": 29,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:55.176Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/support/hooks.ts",
            "line": 11
          }
        },
        {
          "name": "Given I open the SGSK Wealth application",
          "outcome": "SUCCESS",
          "duration": 265,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:55.205Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/10_dashboard_overview.feature",
            "line": 8
          }
        },
        {
          "name": "Then the Dashboard allocation card and donut svg should be visible",
          "outcome": "SUCCESS",
          "duration": 72,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:55.471Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/10_dashboard_overview.feature",
            "line": 17
          }
        },
        {
          "name": "When I click the Dashboard go to allocation button",
          "outcome": "SUCCESS",
          "duration": 496,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:55.544Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/10_dashboard_overview.feature",
            "line": 18
          }
        },
        {
          "name": "Then the asset allocation container should be visible",
          "outcome": "SUCCESS",
          "duration": 8,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:56.040Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/10_dashboard_overview.feature",
            "line": 19
          }
        }
      ],
      "executionHistory": [
        {
          "outcome": "SUCCESS",
          "run": "4",
          "timestamp": "2026-11-11T09:47:32.331Z",
          "duration": 884,
          "activities": [
            {
              "name": "Before",
              "outcome": "SUCCESS",
              "duration": 29,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:55.176Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/support/hooks.ts",
                "line": 11
              }
            },
            {
              "name": "Given I open the SGSK Wealth application",
              "outcome": "SUCCESS",
              "duration": 265,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:55.205Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/10_dashboard_overview.feature",
                "line": 8
              }
            },
            {
              "name": "Then the Dashboard allocation card and donut svg should be visible",
              "outcome": "SUCCESS",
              "duration": 72,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:55.471Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/10_dashboard_overview.feature",
                "line": 17
              }
            },
            {
              "name": "When I click the Dashboard go to allocation button",
              "outcome": "SUCCESS",
              "duration": 496,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:55.544Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/10_dashboard_overview.feature",
                "line": 18
              }
            },
            {
              "name": "Then the asset allocation container should be visible",
              "outcome": "SUCCESS",
              "duration": 8,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:56.040Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/10_dashboard_overview.feature",
                "line": 19
              }
            }
          ]
        }
      ],
      "narrative": "<p>As an executive investor\nI want an executive dashboard landing page with net worth hero banner, donut snapshot, movers, and tools\nSo that I have an immediate high-level summary of my investment portfolio</p>\n",
      "cast": [
        {
          "name": "Investor",
          "abilities": [
            {
              "name": "PerformActivities"
            },
            {
              "name": "AnswerQuestions"
            },
            {
              "name": "RaiseErrors"
            },
            {
              "name": "ScheduleWork",
              "details": "{\"scheduler\":{\"clock\":{\"timeAdjustment\":{\"milliseconds\":0}},\"interactionTimeout\":{\"milliseconds\":5000}}}"
            },
            {
              "name": "BrowseTheWebWithPlaywright"
            },
            {
              "name": "TakeNotes",
              "details": "{\"notepad\":{}}"
            }
          ]
        }
      ],
      "id": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/10_dashboard_overview.feature:16@frontend"
    },
    {
      "name": "TC-DASH-03: Performance top movers card renders and navigates to performance view",
      "category": "Dashboard Landing Page & Executive Overview",
      "outcome": "SUCCESS",
      "duration": 899,
      "startedAt": "2026-11-11T09:47:56.060Z",
      "source": {
        "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/10_dashboard_overview.feature",
        "line": 21
      },
      "tags": [
        {
          "type": "capability",
          "name": "Ui"
        },
        {
          "type": "feature",
          "name": "Dashboard Landing Page & Executive Overview"
        },
        {
          "type": "tag",
          "name": "ui"
        },
        {
          "type": "tag",
          "name": "dashboard"
        },
        {
          "type": "tag",
          "name": "smoke"
        },
        {
          "type": "module",
          "name": "frontend"
        }
      ],
      "activities": [
        {
          "name": "Before",
          "outcome": "SUCCESS",
          "duration": 89,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:56.062Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/support/hooks.ts",
            "line": 11
          }
        },
        {
          "name": "Given I open the SGSK Wealth application",
          "outcome": "SUCCESS",
          "duration": 279,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:56.152Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/10_dashboard_overview.feature",
            "line": 8
          }
        },
        {
          "name": "Then the Dashboard performance card should be visible",
          "outcome": "SUCCESS",
          "duration": 59,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:56.432Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/10_dashboard_overview.feature",
            "line": 22
          }
        },
        {
          "name": "When I click the Dashboard go to performance button",
          "outcome": "SUCCESS",
          "duration": 387,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:56.492Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/10_dashboard_overview.feature",
            "line": 23
          }
        },
        {
          "name": "Then the performance analytics container should be visible",
          "outcome": "SUCCESS",
          "duration": 68,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:56.880Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/10_dashboard_overview.feature",
            "line": 24
          }
        }
      ],
      "executionHistory": [
        {
          "outcome": "SUCCESS",
          "run": "4",
          "timestamp": "2026-11-11T09:47:32.331Z",
          "duration": 899,
          "activities": [
            {
              "name": "Before",
              "outcome": "SUCCESS",
              "duration": 89,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:56.062Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/support/hooks.ts",
                "line": 11
              }
            },
            {
              "name": "Given I open the SGSK Wealth application",
              "outcome": "SUCCESS",
              "duration": 279,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:56.152Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/10_dashboard_overview.feature",
                "line": 8
              }
            },
            {
              "name": "Then the Dashboard performance card should be visible",
              "outcome": "SUCCESS",
              "duration": 59,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:56.432Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/10_dashboard_overview.feature",
                "line": 22
              }
            },
            {
              "name": "When I click the Dashboard go to performance button",
              "outcome": "SUCCESS",
              "duration": 387,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:56.492Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/10_dashboard_overview.feature",
                "line": 23
              }
            },
            {
              "name": "Then the performance analytics container should be visible",
              "outcome": "SUCCESS",
              "duration": 68,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:56.880Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/10_dashboard_overview.feature",
                "line": 24
              }
            }
          ]
        }
      ],
      "narrative": "<p>As an executive investor\nI want an executive dashboard landing page with net worth hero banner, donut snapshot, movers, and tools\nSo that I have an immediate high-level summary of my investment portfolio</p>\n",
      "cast": [
        {
          "name": "Investor",
          "abilities": [
            {
              "name": "PerformActivities"
            },
            {
              "name": "AnswerQuestions"
            },
            {
              "name": "RaiseErrors"
            },
            {
              "name": "ScheduleWork",
              "details": "{\"scheduler\":{\"clock\":{\"timeAdjustment\":{\"milliseconds\":0}},\"interactionTimeout\":{\"milliseconds\":5000}}}"
            },
            {
              "name": "BrowseTheWebWithPlaywright"
            },
            {
              "name": "TakeNotes",
              "details": "{\"notepad\":{}}"
            }
          ]
        }
      ],
      "id": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/10_dashboard_overview.feature:21@frontend"
    },
    {
      "name": "TC-DASH-04: Financial Tools launchpad opens simulator directly in Tools view",
      "category": "Dashboard Landing Page & Executive Overview",
      "outcome": "SUCCESS",
      "duration": 791,
      "startedAt": "2026-11-11T09:47:56.960Z",
      "source": {
        "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/10_dashboard_overview.feature",
        "line": 26
      },
      "tags": [
        {
          "type": "capability",
          "name": "Ui"
        },
        {
          "type": "feature",
          "name": "Dashboard Landing Page & Executive Overview"
        },
        {
          "type": "tag",
          "name": "ui"
        },
        {
          "type": "tag",
          "name": "dashboard"
        },
        {
          "type": "tag",
          "name": "smoke"
        },
        {
          "type": "module",
          "name": "frontend"
        }
      ],
      "activities": [
        {
          "name": "Before",
          "outcome": "SUCCESS",
          "duration": 30,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:56.961Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/support/hooks.ts",
            "line": 11
          }
        },
        {
          "name": "Given I open the SGSK Wealth application",
          "outcome": "SUCCESS",
          "duration": 260,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:56.992Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/10_dashboard_overview.feature",
            "line": 8
          }
        },
        {
          "name": "Then the Dashboard tools launchpad card should be visible",
          "outcome": "SUCCESS",
          "duration": 66,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:57.252Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/10_dashboard_overview.feature",
            "line": 27
          }
        },
        {
          "name": "When I click the Dashboard launch Rebalance Planner card",
          "outcome": "SUCCESS",
          "duration": 377,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:57.318Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/10_dashboard_overview.feature",
            "line": 28
          }
        },
        {
          "name": "Then the tools container should be visible",
          "outcome": "SUCCESS",
          "duration": 41,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:57.695Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/10_dashboard_overview.feature",
            "line": 29
          }
        },
        {
          "name": "And the rebalance calculator should be visible",
          "outcome": "SUCCESS",
          "duration": 4,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:57.736Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/10_dashboard_overview.feature",
            "line": 30
          }
        }
      ],
      "executionHistory": [
        {
          "outcome": "SUCCESS",
          "run": "4",
          "timestamp": "2026-11-11T09:47:32.331Z",
          "duration": 791,
          "activities": [
            {
              "name": "Before",
              "outcome": "SUCCESS",
              "duration": 30,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:56.961Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/support/hooks.ts",
                "line": 11
              }
            },
            {
              "name": "Given I open the SGSK Wealth application",
              "outcome": "SUCCESS",
              "duration": 260,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:56.992Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/10_dashboard_overview.feature",
                "line": 8
              }
            },
            {
              "name": "Then the Dashboard tools launchpad card should be visible",
              "outcome": "SUCCESS",
              "duration": 66,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:57.252Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/10_dashboard_overview.feature",
                "line": 27
              }
            },
            {
              "name": "When I click the Dashboard launch Rebalance Planner card",
              "outcome": "SUCCESS",
              "duration": 377,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:57.318Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/10_dashboard_overview.feature",
                "line": 28
              }
            },
            {
              "name": "Then the tools container should be visible",
              "outcome": "SUCCESS",
              "duration": 41,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:57.695Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/10_dashboard_overview.feature",
                "line": 29
              }
            },
            {
              "name": "And the rebalance calculator should be visible",
              "outcome": "SUCCESS",
              "duration": 4,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:57.736Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/10_dashboard_overview.feature",
                "line": 30
              }
            }
          ]
        }
      ],
      "narrative": "<p>As an executive investor\nI want an executive dashboard landing page with net worth hero banner, donut snapshot, movers, and tools\nSo that I have an immediate high-level summary of my investment portfolio</p>\n",
      "cast": [
        {
          "name": "Investor",
          "abilities": [
            {
              "name": "PerformActivities"
            },
            {
              "name": "AnswerQuestions"
            },
            {
              "name": "RaiseErrors"
            },
            {
              "name": "ScheduleWork",
              "details": "{\"scheduler\":{\"clock\":{\"timeAdjustment\":{\"milliseconds\":0}},\"interactionTimeout\":{\"milliseconds\":5000}}}"
            },
            {
              "name": "BrowseTheWebWithPlaywright"
            },
            {
              "name": "TakeNotes",
              "details": "{\"notepad\":{}}"
            }
          ]
        }
      ],
      "id": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/10_dashboard_overview.feature:26@frontend"
    },
    {
      "name": "TC-DASH-05: Currency switch converts Net Worth and KPI amounts",
      "category": "Dashboard Landing Page & Executive Overview",
      "outcome": "SUCCESS",
      "duration": 510,
      "startedAt": "2026-11-11T09:47:57.752Z",
      "source": {
        "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/10_dashboard_overview.feature",
        "line": 32
      },
      "tags": [
        {
          "type": "capability",
          "name": "Ui"
        },
        {
          "type": "feature",
          "name": "Dashboard Landing Page & Executive Overview"
        },
        {
          "type": "tag",
          "name": "ui"
        },
        {
          "type": "tag",
          "name": "dashboard"
        },
        {
          "type": "tag",
          "name": "smoke"
        },
        {
          "type": "module",
          "name": "frontend"
        }
      ],
      "activities": [
        {
          "name": "Before",
          "outcome": "SUCCESS",
          "duration": 35,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:57.753Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/support/hooks.ts",
            "line": 11
          }
        },
        {
          "name": "Given I open the SGSK Wealth application",
          "outcome": "SUCCESS",
          "duration": 269,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:57.788Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/10_dashboard_overview.feature",
            "line": 8
          }
        },
        {
          "name": "Then the Executive Net Worth banner should be displayed",
          "outcome": "SUCCESS",
          "duration": 81,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:58.058Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/10_dashboard_overview.feature",
            "line": 33
          }
        },
        {
          "name": "When I switch currency to USD",
          "outcome": "SUCCESS",
          "duration": 39,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:58.139Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/10_dashboard_overview.feature",
            "line": 34
          }
        },
        {
          "name": "Then the USD currency button should be active",
          "outcome": "SUCCESS",
          "duration": 25,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:58.178Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/10_dashboard_overview.feature",
            "line": 35
          }
        },
        {
          "name": "When I switch currency to THB",
          "outcome": "SUCCESS",
          "duration": 23,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:58.204Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/10_dashboard_overview.feature",
            "line": 36
          }
        },
        {
          "name": "Then the THB currency button should be active",
          "outcome": "SUCCESS",
          "duration": 24,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:58.228Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/10_dashboard_overview.feature",
            "line": 37
          }
        }
      ],
      "executionHistory": [
        {
          "outcome": "SUCCESS",
          "run": "4",
          "timestamp": "2026-11-11T09:47:32.331Z",
          "duration": 510,
          "activities": [
            {
              "name": "Before",
              "outcome": "SUCCESS",
              "duration": 35,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:57.753Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/support/hooks.ts",
                "line": 11
              }
            },
            {
              "name": "Given I open the SGSK Wealth application",
              "outcome": "SUCCESS",
              "duration": 269,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:57.788Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/10_dashboard_overview.feature",
                "line": 8
              }
            },
            {
              "name": "Then the Executive Net Worth banner should be displayed",
              "outcome": "SUCCESS",
              "duration": 81,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:58.058Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/10_dashboard_overview.feature",
                "line": 33
              }
            },
            {
              "name": "When I switch currency to USD",
              "outcome": "SUCCESS",
              "duration": 39,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:58.139Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/10_dashboard_overview.feature",
                "line": 34
              }
            },
            {
              "name": "Then the USD currency button should be active",
              "outcome": "SUCCESS",
              "duration": 25,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:58.178Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/10_dashboard_overview.feature",
                "line": 35
              }
            },
            {
              "name": "When I switch currency to THB",
              "outcome": "SUCCESS",
              "duration": 23,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:58.204Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/10_dashboard_overview.feature",
                "line": 36
              }
            },
            {
              "name": "Then the THB currency button should be active",
              "outcome": "SUCCESS",
              "duration": 24,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:58.228Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/10_dashboard_overview.feature",
                "line": 37
              }
            }
          ]
        }
      ],
      "narrative": "<p>As an executive investor\nI want an executive dashboard landing page with net worth hero banner, donut snapshot, movers, and tools\nSo that I have an immediate high-level summary of my investment portfolio</p>\n",
      "cast": [
        {
          "name": "Investor",
          "abilities": [
            {
              "name": "PerformActivities"
            },
            {
              "name": "AnswerQuestions"
            },
            {
              "name": "RaiseErrors"
            },
            {
              "name": "ScheduleWork",
              "details": "{\"scheduler\":{\"clock\":{\"timeAdjustment\":{\"milliseconds\":0}},\"interactionTimeout\":{\"milliseconds\":5000}}}"
            },
            {
              "name": "BrowseTheWebWithPlaywright"
            },
            {
              "name": "TakeNotes",
              "details": "{\"notepad\":{}}"
            }
          ]
        }
      ],
      "id": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/10_dashboard_overview.feature:32@frontend"
    },
    {
      "name": "TC-DASH-06: Privacy toggle hides monetary values on Dashboard",
      "category": "Dashboard Landing Page & Executive Overview",
      "outcome": "SUCCESS",
      "duration": 447,
      "startedAt": "2026-11-11T09:47:58.263Z",
      "source": {
        "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/10_dashboard_overview.feature",
        "line": 39
      },
      "tags": [
        {
          "type": "capability",
          "name": "Ui"
        },
        {
          "type": "feature",
          "name": "Dashboard Landing Page & Executive Overview"
        },
        {
          "type": "tag",
          "name": "ui"
        },
        {
          "type": "tag",
          "name": "dashboard"
        },
        {
          "type": "tag",
          "name": "smoke"
        },
        {
          "type": "module",
          "name": "frontend"
        }
      ],
      "activities": [
        {
          "name": "Before",
          "outcome": "SUCCESS",
          "duration": 29,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:58.264Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/support/hooks.ts",
            "line": 11
          }
        },
        {
          "name": "Given I open the SGSK Wealth application",
          "outcome": "SUCCESS",
          "duration": 259,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:58.293Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/10_dashboard_overview.feature",
            "line": 8
          }
        },
        {
          "name": "Then the Executive Net Worth banner should be displayed",
          "outcome": "SUCCESS",
          "duration": 82,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:58.552Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/10_dashboard_overview.feature",
            "line": 40
          }
        },
        {
          "name": "When I toggle privacy mode",
          "outcome": "SUCCESS",
          "duration": 28,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:58.635Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/10_dashboard_overview.feature",
            "line": 41
          }
        },
        {
          "name": "Then the document privacy attribute should be \"true\"",
          "outcome": "SUCCESS",
          "duration": 3,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:58.663Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/10_dashboard_overview.feature",
            "line": 42
          }
        },
        {
          "name": "When I toggle privacy mode",
          "outcome": "SUCCESS",
          "duration": 30,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:58.666Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/10_dashboard_overview.feature",
            "line": 43
          }
        },
        {
          "name": "Then the document privacy attribute should be \"false\"",
          "outcome": "SUCCESS",
          "duration": 2,
          "children": [],
          "type": "Task",
          "startedAt": "2026-11-11T09:47:58.697Z",
          "location": {
            "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/10_dashboard_overview.feature",
            "line": 44
          }
        }
      ],
      "executionHistory": [
        {
          "outcome": "SUCCESS",
          "run": "4",
          "timestamp": "2026-11-11T09:47:32.331Z",
          "duration": 447,
          "activities": [
            {
              "name": "Before",
              "outcome": "SUCCESS",
              "duration": 29,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:58.264Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/support/hooks.ts",
                "line": 11
              }
            },
            {
              "name": "Given I open the SGSK Wealth application",
              "outcome": "SUCCESS",
              "duration": 259,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:58.293Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/10_dashboard_overview.feature",
                "line": 8
              }
            },
            {
              "name": "Then the Executive Net Worth banner should be displayed",
              "outcome": "SUCCESS",
              "duration": 82,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:58.552Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/10_dashboard_overview.feature",
                "line": 40
              }
            },
            {
              "name": "When I toggle privacy mode",
              "outcome": "SUCCESS",
              "duration": 28,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:58.635Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/10_dashboard_overview.feature",
                "line": 41
              }
            },
            {
              "name": "Then the document privacy attribute should be \"true\"",
              "outcome": "SUCCESS",
              "duration": 3,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:58.663Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/10_dashboard_overview.feature",
                "line": 42
              }
            },
            {
              "name": "When I toggle privacy mode",
              "outcome": "SUCCESS",
              "duration": 30,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:58.666Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/10_dashboard_overview.feature",
                "line": 43
              }
            },
            {
              "name": "Then the document privacy attribute should be \"false\"",
              "outcome": "SUCCESS",
              "duration": 2,
              "children": [],
              "type": "Task",
              "startedAt": "2026-11-11T09:47:58.697Z",
              "location": {
                "path": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/10_dashboard_overview.feature",
                "line": 44
              }
            }
          ]
        }
      ],
      "narrative": "<p>As an executive investor\nI want an executive dashboard landing page with net worth hero banner, donut snapshot, movers, and tools\nSo that I have an immediate high-level summary of my investment portfolio</p>\n",
      "cast": [
        {
          "name": "Investor",
          "abilities": [
            {
              "name": "PerformActivities"
            },
            {
              "name": "AnswerQuestions"
            },
            {
              "name": "RaiseErrors"
            },
            {
              "name": "ScheduleWork",
              "details": "{\"scheduler\":{\"clock\":{\"timeAdjustment\":{\"milliseconds\":0}},\"interactionTimeout\":{\"milliseconds\":5000}}}"
            },
            {
              "name": "BrowseTheWebWithPlaywright"
            },
            {
              "name": "TakeNotes",
              "details": "{\"notepad\":{}}"
            }
          ]
        }
      ],
      "id": "/home/runner/work/SGSK-Wealth/SGSK-Wealth/frontend/e2e/features/ui/10_dashboard_overview.feature:39@frontend"
    }
  ],
  "history": [
    {
      "timestamp": "2026-11-11T09:47:32.331Z",
      "duration": 26379,
      "outcomes": {
        "passed": 51,
        "failed": 0,
        "pending": 0,
        "skipped": 0,
        "compromised": 0,
        "error": 0
      },
      "label": "4",
      "slowest": 1497,
      "fastest": 2,
      "average": 516,
      "commit": "8492c30e51f1efff899162bda53e6b8deb03d80c",
      "branch": "main",
      "ciJobUrl": "https://github.com/vipatpolk/SGSK-Wealth/actions/runs/42998045052",
      "repositoryUrl": "https://github.com/vipatpolk/SGSK-Wealth",
      "score": {
        "confidence": 100,
        "passRate": 100,
        "consistency": 100,
        "completeness": 100
      }
    }
  ],
  "tags": [
    {
      "type": "capability",
      "name": "Api",
      "scenarioCount": 10,
      "passed": 10,
      "failed": 0,
      "skipped": 0
    },
    {
      "type": "feature",
      "name": "Backend API Authentication & Security",
      "scenarioCount": 3,
      "passed": 3,
      "failed": 0,
      "skipped": 0
    },
    {
      "type": "tag",
      "name": "api",
      "scenarioCount": 10,
      "passed": 10,
      "failed": 0,
      "skipped": 0
    },
    {
      "type": "tag",
      "name": "auth",
      "scenarioCount": 3,
      "passed": 3,
      "failed": 0,
      "skipped": 0
    },
    {
      "type": "module",
      "name": "frontend",
      "scenarioCount": 51,
      "passed": 51,
      "failed": 0,
      "skipped": 0
    },
    {
      "type": "feature",
      "name": "Price & Market Data API Services",
      "scenarioCount": 2,
      "passed": 2,
      "failed": 0,
      "skipped": 0
    },
    {
      "type": "tag",
      "name": "price",
      "scenarioCount": 2,
      "passed": 2,
      "failed": 0,
      "skipped": 0
    },
    {
      "type": "feature",
      "name": "Portfolio & Financial Analytics API Services",
      "scenarioCount": 3,
      "passed": 3,
      "failed": 0,
      "skipped": 0
    },
    {
      "type": "tag",
      "name": "portfolio",
      "scenarioCount": 3,
      "passed": 3,
      "failed": 0,
      "skipped": 0
    },
    {
      "type": "feature",
      "name": "Financial Simulators & Portfolio Tools API",
      "scenarioCount": 2,
      "passed": 2,
      "failed": 0,
      "skipped": 0
    },
    {
      "type": "tag",
      "name": "tools",
      "scenarioCount": 12,
      "passed": 12,
      "failed": 0,
      "skipped": 0
    },
    {
      "type": "capability",
      "name": "Ui",
      "scenarioCount": 41,
      "passed": 41,
      "failed": 0,
      "skipped": 0
    },
    {
      "type": "feature",
      "name": "Global Navigation & Header Controls",
      "scenarioCount": 3,
      "passed": 3,
      "failed": 0,
      "skipped": 0
    },
    {
      "type": "tag",
      "name": "ui",
      "scenarioCount": 41,
      "passed": 41,
      "failed": 0,
      "skipped": 0
    },
    {
      "type": "tag",
      "name": "navigation",
      "scenarioCount": 3,
      "passed": 3,
      "failed": 0,
      "skipped": 0
    },
    {
      "type": "tag",
      "name": "smoke",
      "scenarioCount": 9,
      "passed": 9,
      "failed": 0,
      "skipped": 0
    },
    {
      "type": "feature",
      "name": "Portfolio Holdings & FIFO Share Lot Accounting",
      "scenarioCount": 3,
      "passed": 3,
      "failed": 0,
      "skipped": 0
    },
    {
      "type": "tag",
      "name": "holdings",
      "scenarioCount": 3,
      "passed": 3,
      "failed": 0,
      "skipped": 0
    },
    {
      "type": "feature",
      "name": "Target Asset Allocation & Rebalancing Engine",
      "scenarioCount": 3,
      "passed": 3,
      "failed": 0,
      "skipped": 0
    },
    {
      "type": "tag",
      "name": "allocation",
      "scenarioCount": 3,
      "passed": 3,
      "failed": 0,
      "skipped": 0
    },
    {
      "type": "feature",
      "name": "Transaction History Ledger & CSV Exporter",
      "scenarioCount": 3,
      "passed": 3,
      "failed": 0,
      "skipped": 0
    },
    {
      "type": "tag",
      "name": "transactions",
      "scenarioCount": 3,
      "passed": 3,
      "failed": 0,
      "skipped": 0
    },
    {
      "type": "feature",
      "name": "Mobile Responsiveness & Touch Layouts",
      "scenarioCount": 3,
      "passed": 3,
      "failed": 0,
      "skipped": 0
    },
    {
      "type": "tag",
      "name": "mobile",
      "scenarioCount": 3,
      "passed": 3,
      "failed": 0,
      "skipped": 0
    },
    {
      "type": "feature",
      "name": "API Failure & Error Resilience",
      "scenarioCount": 1,
      "passed": 1,
      "failed": 0,
      "skipped": 0
    },
    {
      "type": "tag",
      "name": "resilience",
      "scenarioCount": 1,
      "passed": 1,
      "failed": 0,
      "skipped": 0
    },
    {
      "type": "feature",
      "name": "Investment Performance & Analytics Engine",
      "scenarioCount": 5,
      "passed": 5,
      "failed": 0,
      "skipped": 0
    },
    {
      "type": "tag",
      "name": "performance",
      "scenarioCount": 5,
      "passed": 5,
      "failed": 0,
      "skipped": 0
    },
    {
      "type": "feature",
      "name": "Tools Hub & Investor Simulators",
      "scenarioCount": 10,
      "passed": 10,
      "failed": 0,
      "skipped": 0
    },
    {
      "type": "feature",
      "name": "Dividend Analytics & Yield on Cost (YOC)",
      "scenarioCount": 4,
      "passed": 4,
      "failed": 0,
      "skipped": 0
    },
    {
      "type": "tag",
      "name": "dividend",
      "scenarioCount": 4,
      "passed": 4,
      "failed": 0,
      "skipped": 0
    },
    {
      "type": "feature",
      "name": "Dashboard Landing Page & Executive Overview",
      "scenarioCount": 6,
      "passed": 6,
      "failed": 0,
      "skipped": 0
    },
    {
      "type": "tag",
      "name": "dashboard",
      "scenarioCount": 6,
      "passed": 6,
      "failed": 0,
      "skipped": 0
    }
  ],
  "inconsistentTests": [],
  "newFailures": [],
  "newPasses": [],
  "systemContext": {
    "nodeVersion": "v24.22.2",
    "os": {
      "name": "linux",
      "version": "7.0.0-1019-azure",
      "arch": "x64"
    },
    "serenityVersion": "3.49.0",
    "testRunner": {
      "name": "Cucumber",
      "version": "13.3.0"
    },
    "browsers": [],
    "ci": {
      "provider": "GitHub Actions",
      "buildNumber": "4",
      "branch": "main",
      "commit": "8492c30e51f1efff899162bda53e6b8deb03d80c",
      "commitMessage": "fix(monorepo): remove workspace hoisting to retain complete cross-platform lockfile",
      "commitAuthor": "Vipatpol Kovittayawong",
      "jobUrl": "https://github.com/vipatpolk/SGSK-Wealth/actions/runs/42998045052",
      "workflow": "Frontend E2E & API Regression Testing",
      "repositoryUrl": "https://github.com/vipatpolk/SGSK-Wealth",
      "triggeredBy": "vipatpolk"
    },
    "projectName": "sgsk-wealth",
    "packageManager": "npm"
  },
  "capabilities": {
    "type": "directory",
    "name": "features",
    "outcomes": {
      "passed": 51,
      "failed": 0,
      "pending": 0,
      "skipped": 0,
      "compromised": 0,
      "error": 0
    },
    "scenarioCount": 51,
    "children": [
      {
        "type": "directory",
        "name": "api",
        "outcomes": {
          "passed": 10,
          "failed": 0,
          "pending": 0,
          "skipped": 0,
          "compromised": 0,
          "error": 0
        },
        "scenarioCount": 10,
        "children": [
          {
            "type": "file",
            "name": "01_auth_api",
            "outcomes": {
              "passed": 3,
              "failed": 0,
              "pending": 0,
              "skipped": 0,
              "compromised": 0,
              "error": 0
            },
            "scenarioCount": 3,
            "scenarios": [
              {
                "name": "Request without X-API-Key is rejected with 401 Unauthorized",
                "outcome": "SUCCESS",
                "executionHistory": [
                  "SUCCESS"
                ]
              },
              {
                "name": "Request with invalid X-API-Key is rejected with 401 Unauthorized",
                "outcome": "SUCCESS",
                "executionHistory": [
                  "SUCCESS"
                ]
              },
              {
                "name": "Authorized request with valid X-API-Key succeeds",
                "outcome": "SUCCESS",
                "executionHistory": [
                  "SUCCESS"
                ]
              }
            ],
            "narrative": "As an API client\nI want my API requests to be authenticated via X-API-Key\nSo that unauthorized access to portfolio and financial data is prevented",
            "score": {
              "confidence": 100,
              "passRate": 100,
              "completeness": 100,
              "consistency": 100
            }
          },
          {
            "type": "file",
            "name": "02_price_api",
            "outcomes": {
              "passed": 2,
              "failed": 0,
              "pending": 0,
              "skipped": 0,
              "compromised": 0,
              "error": 0
            },
            "scenarioCount": 2,
            "scenarios": [
              {
                "name": "Fetch USD to THB exchange rate",
                "outcome": "SUCCESS",
                "executionHistory": [
                  "SUCCESS"
                ]
              },
              {
                "name": "Batch fetch market prices for portfolio symbols",
                "outcome": "SUCCESS",
                "executionHistory": [
                  "SUCCESS"
                ]
              }
            ],
            "narrative": "As a portfolio tracking service\nI want to fetch foreign exchange rates and market price summaries\nSo that multi-currency asset valuations can be computed",
            "score": {
              "confidence": 100,
              "passRate": 100,
              "completeness": 100,
              "consistency": 100
            }
          },
          {
            "type": "file",
            "name": "03_portfolio_api",
            "outcomes": {
              "passed": 3,
              "failed": 0,
              "pending": 0,
              "skipped": 0,
              "compromised": 0,
              "error": 0
            },
            "scenarioCount": 3,
            "scenarios": [
              {
                "name": "Fetch portfolio holdings converted to THB",
                "outcome": "SUCCESS",
                "executionHistory": [
                  "SUCCESS"
                ]
              },
              {
                "name": "Fetch portfolio performance metrics for YTD timeframe",
                "outcome": "SUCCESS",
                "executionHistory": [
                  "SUCCESS"
                ]
              },
              {
                "name": "Fetch dividend analytics ledger and YOC metrics",
                "outcome": "SUCCESS",
                "executionHistory": [
                  "SUCCESS"
                ]
              }
            ],
            "narrative": "As a portfolio tracking service\nI want to query portfolio holdings, performance analytics, and dividends\nSo that users can monitor their investment accounts",
            "score": {
              "confidence": 100,
              "passRate": 100,
              "completeness": 100,
              "consistency": 100
            }
          },
          {
            "type": "file",
            "name": "04_tools_api",
            "outcomes": {
              "passed": 2,
              "failed": 0,
              "pending": 0,
              "skipped": 0,
              "compromised": 0,
              "error": 0
            },
            "scenarioCount": 2,
            "scenarios": [
              {
                "name": "TVM Calculator calculates future value (FV)",
                "outcome": "SUCCESS",
                "executionHistory": [
                  "SUCCESS"
                ]
              },
              {
                "name": "Average Cost Calculator forward buy simulation",
                "outcome": "SUCCESS",
                "executionHistory": [
                  "SUCCESS"
                ]
              }
            ],
            "narrative": "As an investor\nI want to calculate TVM wealth compounding, forward cost basis, and portfolio rebalances\nSo that I can plan future financial decisions accurately",
            "score": {
              "confidence": 100,
              "passRate": 100,
              "completeness": 100,
              "consistency": 100
            }
          }
        ],
        "score": {
          "confidence": 100,
          "passRate": 100,
          "completeness": 100,
          "consistency": 100
        }
      },
      {
        "type": "directory",
        "name": "ui",
        "outcomes": {
          "passed": 41,
          "failed": 0,
          "pending": 0,
          "skipped": 0,
          "compromised": 0,
          "error": 0
        },
        "scenarioCount": 41,
        "children": [
          {
            "type": "file",
            "name": "01_navigation_header",
            "outcomes": {
              "passed": 3,
              "failed": 0,
              "pending": 0,
              "skipped": 0,
              "compromised": 0,
              "error": 0
            },
            "scenarioCount": 3,
            "scenarios": [
              {
                "name": "TC-NAV-01: View Mode Switcher navigates between primary views",
                "outcome": "SUCCESS",
                "executionHistory": [
                  "SUCCESS"
                ]
              },
              {
                "name": "TC-NAV-02: Currency Toggle switches display currency between USD and THB",
                "outcome": "SUCCESS",
                "executionHistory": [
                  "SUCCESS"
                ]
              },
              {
                "name": "TC-NAV-03: Theme Switcher toggles dark and light theme state",
                "outcome": "SUCCESS",
                "executionHistory": [
                  "SUCCESS"
                ]
              }
            ],
            "narrative": "As a SGSK Wealth investor\nI want to switch views, currencies, and themes\nSo that I can monitor my portfolio across different layouts and currencies",
            "score": {
              "confidence": 100,
              "passRate": 100,
              "completeness": 100,
              "consistency": 100
            }
          },
          {
            "type": "file",
            "name": "02_holdings_fifolots",
            "outcomes": {
              "passed": 3,
              "failed": 0,
              "pending": 0,
              "skipped": 0,
              "compromised": 0,
              "error": 0
            },
            "scenarioCount": 3,
            "scenarios": [
              {
                "name": "TC-HLD-01: Asset Tab Filtering displays symbols matching tab category",
                "outcome": "SUCCESS",
                "executionHistory": [
                  "SUCCESS"
                ]
              },
              {
                "name": "TC-HLD-02: Expanding Symbol Row reveals FIFO share lot details",
                "outcome": "SUCCESS",
                "executionHistory": [
                  "SUCCESS"
                ]
              },
              {
                "name": "TC-HLD-03: Search Bar filters portfolio holdings by symbol or name",
                "outcome": "SUCCESS",
                "executionHistory": [
                  "SUCCESS"
                ]
              }
            ],
            "narrative": "As an investor\nI want to filter holdings by asset category, expand FIFO lots, and search symbols\nSo that I can analyze lot acquisition dates and individual cost bases",
            "score": {
              "confidence": 100,
              "passRate": 100,
              "completeness": 100,
              "consistency": 100
            }
          },
          {
            "type": "file",
            "name": "03_asset_allocation",
            "outcomes": {
              "passed": 3,
              "failed": 0,
              "pending": 0,
              "skipped": 0,
              "compromised": 0,
              "error": 0
            },
            "scenarioCount": 3,
            "scenarios": [
              {
                "name": "TC-ALC-01: Asset Allocation view defaults to All tab aggregated portfolio view",
                "outcome": "SUCCESS",
                "executionHistory": [
                  "SUCCESS"
                ]
              },
              {
                "name": "TC-ALC-02 & TC-ALC-03: Filtering to asset class displays symbol breakdown and allows filter reset",
                "outcome": "SUCCESS",
                "executionHistory": [
                  "SUCCESS"
                ]
              },
              {
                "name": "TC-ALC-04: Asset Class Breakdown table display",
                "outcome": "SUCCESS",
                "executionHistory": [
                  "SUCCESS"
                ]
              }
            ],
            "narrative": "As an investor\nI want to view portfolio allocation charts and drill down by asset class\nSo that I can evaluate category weightings against target distributions",
            "score": {
              "confidence": 100,
              "passRate": 100,
              "completeness": 100,
              "consistency": 100
            }
          },
          {
            "type": "file",
            "name": "04_transaction_history",
            "outcomes": {
              "passed": 3,
              "failed": 0,
              "pending": 0,
              "skipped": 0,
              "compromised": 0,
              "error": 0
            },
            "scenarioCount": 3,
            "scenarios": [
              {
                "name": "TC-TXN-01: Displays initial unfiltered transaction feed",
                "outcome": "SUCCESS",
                "executionHistory": [
                  "SUCCESS"
                ]
              },
              {
                "name": "TC-TXN-02: Formats units according to asset type context",
                "outcome": "SUCCESS",
                "executionHistory": [
                  "SUCCESS"
                ]
              },
              {
                "name": "TC-TXN-05: CSV Export triggers file download",
                "outcome": "SUCCESS",
                "executionHistory": [
                  "SUCCESS"
                ]
              }
            ],
            "narrative": "As an investor\nI want to view historical transactions and export them to CSV\nSo that I can audit trade history and tax filings",
            "score": {
              "confidence": 100,
              "passRate": 100,
              "completeness": 100,
              "consistency": 100
            }
          },
          {
            "type": "file",
            "name": "05_mobile_responsive",
            "outcomes": {
              "passed": 3,
              "failed": 0,
              "pending": 0,
              "skipped": 0,
              "compromised": 0,
              "error": 0
            },
            "scenarioCount": 3,
            "scenarios": [
              {
                "name": "TC-MOB-01: Mobile view renders responsive cards and native bottom navigation bar",
                "outcome": "SUCCESS",
                "executionHistory": [
                  "SUCCESS"
                ]
              },
              {
                "name": "TC-MOB-02: Mobile view renders responsive Rebalance Planner cards and touch mode toggle",
                "outcome": "SUCCESS",
                "executionHistory": [
                  "SUCCESS"
                ]
              },
              {
                "name": "TC-MOB-03: Native bottom navigation bar highlights active tab and switches views smoothly",
                "outcome": "SUCCESS",
                "executionHistory": [
                  "SUCCESS"
                ]
              }
            ],
            "narrative": "As an investor on a mobile device\nI want responsive cards and native bottom navigation dock\nSo that I have an optimized touch experience",
            "score": {
              "confidence": 100,
              "passRate": 100,
              "completeness": 100,
              "consistency": 100
            }
          },
          {
            "type": "file",
            "name": "06_error_resilience",
            "outcomes": {
              "passed": 1,
              "failed": 0,
              "pending": 0,
              "skipped": 0,
              "compromised": 0,
              "error": 0
            },
            "scenarioCount": 1,
            "scenarios": [
              {
                "name": "TC-ERR-01: Displays error state card when backend API fails",
                "outcome": "SUCCESS",
                "executionHistory": [
                  "SUCCESS"
                ]
              }
            ],
            "narrative": "As an investor\nI want clear error feedback when the backend service experiences outages\nSo that I know data could not be fetched and can retry",
            "score": {
              "confidence": 100,
              "passRate": 100,
              "completeness": 100,
              "consistency": 100
            }
          },
          {
            "type": "file",
            "name": "07_performance_analytics",
            "outcomes": {
              "passed": 5,
              "failed": 0,
              "pending": 0,
              "skipped": 0,
              "compromised": 0,
              "error": 0
            },
            "scenarioCount": 5,
            "scenarios": [
              {
                "name": "TC-PRF-01: Performance view renders summary KPI cards",
                "outcome": "SUCCESS",
                "executionHistory": [
                  "SUCCESS"
                ]
              },
              {
                "name": "TC-PRF-02: Date range preset buttons trigger timeframe updates",
                "outcome": "SUCCESS",
                "executionHistory": [
                  "SUCCESS"
                ]
              },
              {
                "name": "TC-PRF-03: Asset Type Return and Top Movers sections render correctly",
                "outcome": "SUCCESS",
                "executionHistory": [
                  "SUCCESS"
                ]
              },
              {
                "name": "TC-PRF-04: Symbol search autocomplete dropdown provides instant suggestions",
                "outcome": "SUCCESS",
                "executionHistory": [
                  "SUCCESS"
                ]
              },
              {
                "name": "TC-PRF-05: Status and Asset Type filters are accessible and selectable",
                "outcome": "SUCCESS",
                "executionHistory": [
                  "SUCCESS"
                ]
              }
            ],
            "narrative": "As an investor\nI want summary return KPIs, timeframe presets, movers, and symbol autocomplete\nSo that I can evaluate portfolio profitability across custom holding periods",
            "score": {
              "confidence": 100,
              "passRate": 100,
              "completeness": 100,
              "consistency": 100
            }
          },
          {
            "type": "file",
            "name": "08_tools_calculator",
            "outcomes": {
              "passed": 10,
              "failed": 0,
              "pending": 0,
              "skipped": 0,
              "compromised": 0,
              "error": 0
            },
            "scenarioCount": 10,
            "scenarios": [
              {
                "name": "TC-TOOLS-01: Navigation to Tools tab and renders Avg Cost Calculator",
                "outcome": "SUCCESS",
                "executionHistory": [
                  "SUCCESS"
                ]
              },
              {
                "name": "TC-TOOLS-02: Symbol selection and forward Buy simulation",
                "outcome": "SUCCESS",
                "executionHistory": [
                  "SUCCESS"
                ]
              },
              {
                "name": "TC-TOOLS-03: Switching between Shares and Amount mode",
                "outcome": "SUCCESS",
                "executionHistory": [
                  "SUCCESS"
                ]
              },
              {
                "name": "TC-TOOLS-04: Switch to TVM Calculator and calculate Future Value",
                "outcome": "SUCCESS",
                "executionHistory": [
                  "SUCCESS"
                ]
              },
              {
                "name": "TC-TOOLS-05: TVM Calculator asset class multi-selection and valuation basis",
                "outcome": "SUCCESS",
                "executionHistory": [
                  "SUCCESS"
                ]
              },
              {
                "name": "TC-TOOLS-06: TVM Calculator Year-by-Year Growth Chart and Area/Lines toggle",
                "outcome": "SUCCESS",
                "executionHistory": [
                  "SUCCESS"
                ]
              },
              {
                "name": "TC-TOOLS-07: Switch to Rebalance Planner tool and render asset class groups",
                "outcome": "SUCCESS",
                "executionHistory": [
                  "SUCCESS"
                ]
              },
              {
                "name": "TC-TOOLS-08: Rebalance Planner quick actions and target adjustments",
                "outcome": "SUCCESS",
                "executionHistory": [
                  "SUCCESS"
                ]
              },
              {
                "name": "TC-TOOLS-09: Rebalance Planner No-Sell mode and cash deposit calculation",
                "outcome": "SUCCESS",
                "executionHistory": [
                  "SUCCESS"
                ]
              },
              {
                "name": "TC-TOOLS-10: Rebalance Planner filter refreshes KPI grid and orders checklist",
                "outcome": "SUCCESS",
                "executionHistory": [
                  "SUCCESS"
                ]
              }
            ],
            "narrative": "As an investor\nI want to simulate average cost orders, calculate TVM compounding, and plan portfolio rebalancing\nSo that I can model forward investment strategies",
            "score": {
              "confidence": 100,
              "passRate": 100,
              "completeness": 100,
              "consistency": 100
            }
          },
          {
            "type": "file",
            "name": "09_dividend_analytics",
            "outcomes": {
              "passed": 4,
              "failed": 0,
              "pending": 0,
              "skipped": 0,
              "compromised": 0,
              "error": 0
            },
            "scenarioCount": 4,
            "scenarios": [
              {
                "name": "TC-DIV-01: Displays summary KPI cards including Yield on Cost (YOC)",
                "outcome": "SUCCESS",
                "executionHistory": [
                  "SUCCESS"
                ]
              },
              {
                "name": "TC-DIV-02: Displays asset type breakdown cards with accurate YOC indicators",
                "outcome": "SUCCESS",
                "executionHistory": [
                  "SUCCESS"
                ]
              },
              {
                "name": "TC-DIV-03: Switching asset type filters YOC KPI card accurately without currency distortion",
                "outcome": "SUCCESS",
                "executionHistory": [
                  "SUCCESS"
                ]
              },
              {
                "name": "TC-DIV-05: Monthly Cashflow Timeline includes Bonds in legend and timeline segments",
                "outcome": "SUCCESS",
                "executionHistory": [
                  "SUCCESS"
                ]
              }
            ],
            "narrative": "As an investor\nI want to track dividend income, Yield on Cost (YOC), and monthly cashflow timelines\nSo that I can evaluate passive cashflow generation",
            "score": {
              "confidence": 100,
              "passRate": 100,
              "completeness": 100,
              "consistency": 100
            }
          },
          {
            "type": "file",
            "name": "10_dashboard_overview",
            "outcomes": {
              "passed": 6,
              "failed": 0,
              "pending": 0,
              "skipped": 0,
              "compromised": 0,
              "error": 0
            },
            "scenarioCount": 6,
            "scenarios": [
              {
                "name": "TC-DASH-01: Application lands on Dashboard by default with Executive Net Worth banner",
                "outcome": "SUCCESS",
                "executionHistory": [
                  "SUCCESS"
                ]
              },
              {
                "name": "TC-DASH-02: Asset Allocation donut chart is displayed with direct navigation",
                "outcome": "SUCCESS",
                "executionHistory": [
                  "SUCCESS"
                ]
              },
              {
                "name": "TC-DASH-03: Performance top movers card renders and navigates to performance view",
                "outcome": "SUCCESS",
                "executionHistory": [
                  "SUCCESS"
                ]
              },
              {
                "name": "TC-DASH-04: Financial Tools launchpad opens simulator directly in Tools view",
                "outcome": "SUCCESS",
                "executionHistory": [
                  "SUCCESS"
                ]
              },
              {
                "name": "TC-DASH-05: Currency switch converts Net Worth and KPI amounts",
                "outcome": "SUCCESS",
                "executionHistory": [
                  "SUCCESS"
                ]
              },
              {
                "name": "TC-DASH-06: Privacy toggle hides monetary values on Dashboard",
                "outcome": "SUCCESS",
                "executionHistory": [
                  "SUCCESS"
                ]
              }
            ],
            "narrative": "As an executive investor\nI want an executive dashboard landing page with net worth hero banner, donut snapshot, movers, and tools\nSo that I have an immediate high-level summary of my investment portfolio",
            "score": {
              "confidence": 100,
              "passRate": 100,
              "completeness": 100,
              "consistency": 100
            }
          }
        ],
        "score": {
          "confidence": 100,
          "passRate": 100,
          "completeness": 100,
          "consistency": 100
        }
      }
    ],
    "score": {
      "confidence": 100,
      "passRate": 100,
      "completeness": 100,
      "consistency": 100
    }
  },
  "specDirectory": "features"
};
