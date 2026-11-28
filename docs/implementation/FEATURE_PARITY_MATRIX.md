# SGSK-Wealth Feature Parity Matrix

> **Purpose:** Single source of truth for 1-to-1 feature parity between the current Angular + Ionic + single-crate Rust system and the target Nuxt + Tailwind + Capacitor + Cargo Workspace system.

---

## 1. Asset Tabs & Cloud Sheet Sources (`backend/src/config/sheet_config.rs`)

| Tab ID | Label | Currency | Sheet GID | Spreadsheet Source | Target Parity |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `all` | All | Mixed | — | Aggregated tabs | Pending |
| `us-stock` | U.S. Stock | `USD` | `1032243687` | `google_spreadsheet_id` | Pending |
| `thai-stock` | Thai Stock | `THB` | `102823823` | `google_spreadsheet_id` | Pending |
| `crypto` | Cryptocurrency | `THB` | `1822302220` | `google_spreadsheet_id` | Pending |
| `mutual-fund` | Mutual Fund | `THB` | `359978839` | `google_spreadsheet_id` | Pending |
| `bond` | Bond | `USD` | `1657887056` | `google_spreadsheet_id` | Pending |
| `provident-fund` | Provident Fund | `THB` | `0` | `google_pvd_spreadsheet_id` | Pending |
| `closed-position` | Closed Position | Mixed | `273600915` | `google_spreadsheet_id` | Pending |

---

## 2. Web & Mobile UI Feature Inventory

| Domain | Web Component (`apps/web/src/app/features/`) | Mobile Screen / Modal (`apps/mobile/src/app/`) | Target Nuxt Wave | Parity Status |
| :--- | :--- | :--- | :--- | :--- |
| **Auth & Session** | `auth/auth-screen.component.ts` (`/auth/callback`) | `modals/auth-modal/mobile-auth-modal.component.ts` | Wave 1 | Pending |
| **Dashboard** | `dashboard/dashboard.component.ts` | `pages/dashboard/mobile-dashboard.page.ts` | Wave 1 | Pending |
| **Holdings & FIFO Lots** | `holdings/` | `pages/holdings/mobile-holdings.page.ts` (`[data-symbol-lots]`) | Wave 1 | Pending |
| **PVD Holdings** | `holdings/pvd/` | `pages/holdings/components/` | Wave 1 | Pending |
| **Fund Factsheet** | `factsheets/fund-factsheet-modal.component.ts` | `modals/fund-factsheet-modal/mobile-factsheet-modal.component.ts` | Wave 1 | Pending |
| **Transactions** | `transactions/transaction-history.component.ts` (CSV export, filters) | `pages/transactions/mobile-transactions.page.ts` | Wave 2 | Pending |
| **Dividends & YOC** | `dividends/dividend.component.ts` | `pages/dividends/mobile-dividends.page.ts` | Wave 2 | Pending |
| **Asset Allocation** | `analytics/asset-allocation/` | `pages/analytics/mobile-analytics.page.ts` | Wave 3 | Pending |
| **Performance Analytics** | `analytics/performance/` | `pages/analytics/mobile-analytics.page.ts` | Wave 3 | Pending |
| **Tools: Avg Cost / Target** | `tools/avg-cost-calculator/` | `pages/tools/components/` | Wave 3 | Pending |
| **Tools: Rebalance** | `tools/rebalance-calculator/` | `pages/tools/components/` | Wave 3 | Pending |
| **Tools: TVM** | `tools/tvm-calculator/` | `pages/tools/components/` | Wave 3 | Pending |
| **User Settings** | `settings/user-settings-modal.component.ts` | `modals/user-settings-modal/mobile-user-settings-modal.component.ts` | Wave 4 | Pending |
| **Local Guest Portfolio** | `local-portfolio/local-portfolio-modal.component.ts` | `modals/local-portfolio-modal/mobile-local-portfolio-modal.component.ts` | Wave 4 | Pending |
| **Shell & Cross-Cutting** | `ui/{header,tab-bar,filters,search,summary-card}`, `shared` (`SecondaryCurrency`, `SymbolIcon`, `DateRangePicker`, `LoadingScreen`, `en`/`th`, `Dark`/`Light`/`System`, privacy mask) | Capacitor 8 (`status-bar`, `haptics`, `preferences`, `splash-screen`, `app` backButton, safe-area insets) | Foundation + Phase 5 | Pending |

---

## 3. Backend API Route Parity (19 Legacy Routes → `/api/v1/*`)

| # | Legacy Route (`/` & `/api/backend/*`) | Target `/api/v1/*` Route | Auth Guard | Target Crate | Parity Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | `GET /` | `GET /api/v1/health` | `ApiKeyAuth` | `crates/api` | Pending |
| 2 | `GET /auth/me` | `GET /api/v1/auth/me` | `ApiKeyAuth` + `OptionalCurrentUser` | `crates/api` | Pending |
| 3 | `GET /share-lot/sheet/{tab_id}` | `GET /api/v1/share-lot/sheet/{tab_id}` | `ApiKeyAuth` + `RequirePortfolioAuthorizedUser` | `crates/api` + `crates/application` | Pending |
| 4 | `GET /share-lot/sheets` | `GET /api/v1/share-lot/sheets` | `ApiKeyAuth` + `RequirePortfolioAuthorizedUser` | `crates/api` + `crates/application` | Pending |
| 5 | `GET /portfolio/holdings` | `GET /api/v1/portfolio/holdings` | `ApiKeyAuth` + `RequirePortfolioAuthorizedUser` | `crates/api` + `crates/financial-engine` | Pending |
| 6 | `GET /portfolio/performance` | `GET /api/v1/portfolio/performance` | `ApiKeyAuth` + `RequirePortfolioAuthorizedUser` | `crates/api` + `crates/financial-engine` | Pending |
| 7 | `POST /portfolio/allocation` | `POST /api/v1/portfolio/allocation` | `ApiKeyAuth` + `RequirePortfolioAuthorizedUser` | `crates/api` + `crates/financial-engine` | Pending |
| 8 | `GET /portfolio/dividend` | `GET /api/v1/portfolio/dividend` | `ApiKeyAuth` + `RequirePortfolioAuthorizedUser` | `crates/api` + `crates/financial-engine` | Pending |
| 9 | `POST /portfolio/tools/simulate` | `POST /api/v1/portfolio/tools/simulate` | `ApiKeyAuth` + Conditional `OptionalCurrentUser` | `crates/api` + `crates/financial-engine` | Pending |
| 10 | `POST /portfolio/tools/solve-target` | `POST /api/v1/portfolio/tools/solve-target` | `ApiKeyAuth` + Conditional `OptionalCurrentUser` | `crates/api` + `crates/financial-engine` | Pending |
| 11 | `POST /portfolio/tools/tvm` | `POST /api/v1/portfolio/tools/tvm` | `ApiKeyAuth` | `crates/api` + `crates/financial-engine` | Pending |
| 12 | `POST /portfolio/tools/rebalance` | `POST /api/v1/portfolio/tools/rebalance` | `ApiKeyAuth` + `RequirePortfolioAuthorizedUser` | `crates/api` + `crates/financial-engine` | Pending |
| 13 | `POST /price/fetch-prices` | `POST /api/v1/price/fetch-prices` | `ApiKeyAuth` | `crates/api` + `crates/integrations` | Pending |
| 14 | `GET /price/exchange-rate` | `GET /api/v1/price/exchange-rate` | `ApiKeyAuth` | `crates/api` + `crates/integrations` | Pending |
| 15 | `POST /nav/fetch` | `POST /api/v1/nav/fetch` | `ApiKeyAuth` | `crates/api` + `crates/integrations` | Pending |
| 16 | `GET /nav/factsheet` | `GET /api/v1/nav/factsheet` | `ApiKeyAuth` | `crates/api` + `crates/integrations` | Pending |
| 17 | `GET /icon/meta/{*symbol}` | `GET /api/v1/icon/meta/{symbol}` | Public | `crates/api` + `crates/integrations` | Pending |
| 18 | `GET /icon` | `GET /api/v1/icon` | Public | `crates/api` + `crates/integrations` | Pending |
| 19 | `GET /icon/{*symbol}` | `GET /api/v1/icon/{symbol}` | Public | `crates/api` + `crates/integrations` | Pending |

---

## 4. BDD Feature Suite Mapping (25 Existing `.feature` Files)

| Suite | Existing Feature Files (`e2e/src/test/resources/features/`) | Target Module & Tags | Parity Status |
| :--- | :--- | :--- | :--- |
| **API (5)** | `api/auth/auth_api.feature`, `api/portfolio/portfolio_api.feature`, `api/price/price_api.feature`, `api/sharelot/share_lot_workflow_api.feature`, `api/tools/tools_api.feature` | `api-adapter` (`@api`, `@cross-platform` where shared) | Pending |
| **Web (12)** | `web/analytics/{asset_allocation,performance_analytics}.feature`, `web/auth/user_auth_and_settings.feature`, `web/dashboard/dashboard_overview.feature`, `web/dividends/dividend_analytics.feature`, `web/holdings/{holdings_fifolots,pvd_holdings}.feature`, `web/navigation/{navigation_header,responsive_layout}.feature`, `web/resilience/error_resilience.feature`, `web/tools/tools_calculator.feature`, `web/transactions/transaction_history.feature` | `web-adapter` (`@web`, `@cross-platform` for shared journeys) | Pending |
| **Mobile (8)** | `mobile/analytics/analytics.feature`, `mobile/auth/mobile_auth_and_settings.feature`, `mobile/dividends/dividends.feature`, `mobile/holdings/holdings_and_pvd.feature`, `mobile/navigation/navigation_and_shell.feature`, `mobile/platform/ios_and_android_platform.feature`, `mobile/tools/financial_tools.feature`, `mobile/transactions/transactions_history.feature` | `mobile-adapter` (`@mobile`, `@cross-platform` for shared journeys) | Pending |
