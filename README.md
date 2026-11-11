# ShareLot — FIFO Share Lot & Portfolio Tracker

<p align="center">
  <img src="public/favicon.svg" alt="ShareLot Logo" width="96" height="96" />
</p>

<p align="center">
  <strong>A modern, real-time investment portfolio tracker, executive dashboard, FIFO share lot accounting engine, unified portfolio analytics (allocation & performance), dividend cash flow tracker, and financial tools suite.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Angular-22.1-DD0031?style=flat-square&logo=angular&logoColor=white" alt="Angular 22" />
  <img src="https://img.shields.io/badge/TailwindCSS-v4.3-38BDF8?style=flat-square&logo=tailwindcss&logoColor=white" alt="Tailwind CSS v4.3" />
  <img src="https://img.shields.io/badge/TypeScript-6.0-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript 6.0" />
  <img src="https://img.shields.io/badge/Cucumber-BDD-23D96C?style=flat-square&logo=cucumber&logoColor=white" alt="Cucumber BDD" />
  <img src="https://img.shields.io/badge/Serenity%2FJS-Living_Doc-5B9BD5?style=flat-square" alt="Serenity/JS Reporting" />
  <img src="https://img.shields.io/badge/PactumJS-API_Testing-FF6C37?style=flat-square" alt="PactumJS" />
  <img src="https://img.shields.io/badge/Playwright-1.50-45BA4B?style=flat-square&logo=playwright&logoColor=white" alt="Playwright E2E" />
  <img src="https://img.shields.io/badge/Vitest-4.1-FCC72B?style=flat-square&logo=vitest&logoColor=black" alt="Vitest Unit Testing" />
  <a href="https://vipatpolk.github.io/ShareLot/"><img src="https://img.shields.io/badge/Living_Docs-GitHub_Pages-2ea44f?style=flat-square&logo=githubpages&logoColor=white" alt="Living Documentation" /></a>
  <img src="https://img.shields.io/badge/Node.js-24.19_LTS-339933?style=flat-square&logo=nodedotjs&logoColor=white" alt="Node.js 24 LTS" />
  <img src="https://img.shields.io/badge/Deploy-Vercel-000000?style=flat-square&logo=vercel&logoColor=white" alt="Vercel" />
</p>

---

## Overview

**ShareLot** is an investment portfolio analytics web application designed to automate **First-In, First-Out (FIFO)** share lot accounting across multiple asset classes. It connects to **SGSKBackend** to ingest transaction logs from Google Sheets and streams real-time market data to compute cost basis, open lots, realized gains, holding values, total profit/loss (P/L), asset rebalancing, dividend income ledgers, privacy masking, and comprehensive investment performance analytics.

---

## Key Features

### 📊 Executive Dashboard Landing Page

- **Primary Landing View**: The root route (`/`) automatically lands on the Executive Dashboard, providing a comprehensive multi-aspect portfolio overview at a single glance.
- **Executive Portfolio Hero Banner**: High-contrast headline displaying Net Portfolio Value with dual-currency approximations ($ $\leftrightarrow$ ฿), live USD/THB exchange rate badge, seamless dark/light theme switching, and a 4-card metric strip (_Invested Capital_, _Unrealized P&L_, _Realized Gains_, and _Projected Dividend_).
- **Asset Allocation Snapshot**: Interactive SVG Donut Chart with class legend badges, class values, percentages, and one-click deep link into the Analytics (Allocation) view.
- **Top Movers Leaderboard**: Highlights the top 4 Gainers and top 4 Lagging positions with brand icons, tickers, market prices, and return percentages, with direct navigation to the Analytics (Performance) view.
- **Forward Dividend Cashflow & Yield**: Trailing/forward annual dividend income, Yield on Cost (YOC %), and Current Yield % with direct link to the Dividends hub.
- **Provident Fund (PVD) / Portfolio Vitality**: Accumulated PVD balance, employee vs. employer matching ratio bar, and policy details (strictly displays provident fund assets, or vitality metrics when PVD is absent).
- **Recent Activity Feed**: Latest 5 genuine trade transaction orders with trade type badges (`BUY`, `SELL`, `EX-IN`, `EX-OUT`), dynamic asset units (`shares`, `coins`, `units`), and converted totals (excluding synthetic provident fund entries).
- **Financial Tools Launchpad**: One-click action cards deep-linking directly into _Rebalance Planner_, _TVM Wealth Calculator_, _Average Cost Calculator_, and _FIFO Share Lots_.

### 🔒 Privacy Protection Mode

- **Instant Masking**: One-click toggle in the header to activate Privacy Mode (state preserved in `localStorage`).
- **Targeted Masking**: Automatically blurs sensitive monetary amounts, portfolio values, total cost, proceeds, shares, net received, and dividend payments.
- **Percentage Visibility**: Crucial performance percentages (`P/L %`, `Realized %`, `Yield on Cost %`, `Target %`, `Return %`, `Allocation %`) remain clearly readable and unblurred for safe public demonstrations or casual tracking.

### 💵 Dividend & Income Yield Tracking

- **100% API-Driven Dividend Engine**: Fetches complete dividend distributions automatically from Yahoo Finance (US & Thai stocks, Bonds) and the SEC Thailand Fund API (Mutual Funds).
- **Exact Ex-Date Share Accounting**: Evaluates historical trade logs to calculate exact shares held on each dividend ex-date ($T$):
  $$\text{Shares Held}(T) = \sum_{\text{Tx Date } < T} \text{Buy Quantity} - \sum_{\text{Tx Date } < T} \text{Sell Quantity}$$
- **Per-Asset-Type Yield on Cost (YOC) & Current Yield**: Detailed breakdown of cost basis, market value, forward annual dividends, and Yield on Cost % calculated individually across `Thai Stocks`, `U.S. Stocks`, `Mutual Funds`, and `Bonds` with zero currency distortion.
- **Forward Income & Yield on Cost (YOC)**: Displays trailing 12-month DPS, current market yield %, Yield on Cost %, and forward projected annual income.
- **Interactive Monthly Cashflow Timeline with Bonds**: Visual stacked bar chart tracking monthly dividend income split across Thai Stocks (`#22c55e`), US Stocks (`#3b82f6`), Mutual Funds (`#a855f7`), and Bonds (`#06b6d4`).
- **Holdings Distribution Ledger Popup Modal**: Responsive popup modal with a desktop table ($\ge 640\text{px}$) and touch-friendly mobile cards ($< 640\text{px}$) showing individual dividend payouts, withholding tax, and net amounts.
- **Global Asset Type & Year Filtering**: Filter summary metrics, monthly timeline chart, holdings breakdown, and transaction ledger across `All Assets`, `U.S. Stocks`, `Thai Stocks`, `Mutual Funds`, and `Bonds` or specific calendar years.
- **Fuzzy Autocomplete & Ledger Pagination**: Real-time autocomplete suggestions with keyboard navigation (`↑`, `↓`, `Enter`, `Escape`) and paginated historical payout ledger.

### 📊 Unified Portfolio Analytics (Overview, Allocation & Performance)

- **Unified Navigation Hub**: Consolidates Portfolio Overview, Target Asset Allocation, and Investment Returns Performance into a single unified component (`app-analytics`) with sub-tab controls (`Overview`, `Allocation`, `Performance`).
- **Overview Sub-tab**: High-level portfolio cockpit featuring 5-card summary KPI strip (_Total Invested_, _Total Value_, _Unrealized P&L_, _Realized P&L_, _Total Return_), asset class distribution bars with value and percentage breakdown, top 5 portfolio concentration rankings, and top gainers / losers movers.
- **Allocation Sub-tab**:
  - **Auto-Aggregated Portfolio Breakdown**: Visualizes asset distribution across categories (`U.S. Stock`, `Thai Stock`, `Cryptocurrency`, `Mutual Fund`, `Bond`, `Provident Fund`).
  - **Asset Class Breakdown Table**: Detailed table showing Asset Class, Value, and Allocation % with color-coded legend indicators.
  - **Interactive Asset Class Filtering**: Clicking any Asset Class row, Donut Chart segment, or Legend item isolates that specific asset class, with a prominent **`← All Asset Classes`** reset button.
  - **Concentration & Currency Exposure**: Top Holdings Concentration chart with **Show All / Show Top 5** toggle controls, alongside USD/THB currency exposure visualizer.
- **Performance Sub-tab**:
  - **Portfolio Summary Grid**: Five high-level KPI cards displaying return percentages on both unrealized and realized P/L.
  - **Asset Type Performance Breakdown**: Grouped returns analysis by asset class with proportional horizontal return bar charts and open/closed symbol counts.
  - **Top Movers Ranking**: Dynamic top 5 **Gainers** and top 5 **Losers** leaderboards with badge styling, progress bars, and percentage return indicators.
  - **Time Frame Selection & Date Filtering**: Integrated [`DateRangePickerComponent`](src/app/components/date-range-picker/date-range-picker.component.ts) with presets (`YTD`, `1M`, `3M`, `6M`, `1Y`, `All Time`, or custom bounds) to dynamically filter closed-lot realized gains over specific timeframes.
  - **Interactive Symbol Search & Autocomplete**: Fast search toolbar with keyboard-accessible autocomplete suggestions (`↑`, `↓`, `Enter`, `Escape`), active index highlighting, asset badges, status pills, and clickable filter actions.
  - **Multi-Currency Valuation & Sorting**: Automatic conversion across `USD` $\leftrightarrow$ `USDT` $\leftrightarrow$ `THB` and sorting by Symbol, Total Return %, Total Return $, Invested Cost, Current Value, Realized P/L, or Unrealized P/L with Open/Closed/All status filters.

### 💼 Provident Fund (PVD) Tracking & Contribution Breakdown

- **Dedicated Asset Tab**: Seamlessly navigates to the Provident Fund portfolio view via the tab bar (`briefcase` icon, `#6366f1` brand indigo).
- **Contribution Split Bar**: Visual header progress bar detailing Employee vs. Company contribution shares and percentages (e.g. `Emp 58% Co 42%`).
- **Laser-Aligned Layout**: Header cards maintain unified horizontal columns across desktop, tablet, and mobile, with the contribution split bar occupying the exact same slot as the Transactions button on trading asset types.
- **Dedicated Expanded Contribution Breakdown**:
  - **Employee Contribution Card**: Displays Employee Total Contribution ($), Cumulative Earnings ($), and percentage of total plan.
  - **Employer Matching Card**: Displays Employer Matching Contribution ($), Cumulative Company Earnings ($), and percentage of total plan.
  - **Official Snapshot Footer Banner**: Shows plan policy name, sub-policy ID, SEC Thailand AIMC classification, risk level, and aggregate portfolio valuation.
- **Transaction History Exemption**: Provident Fund positions reflect official balance snapshots without manual buy/sell trade logs, cleanly excluding PVD from the trading feed and transaction CSV export.

### 📊 FIFO Share Lot Engine

- Automatically matches buy and sell transaction queues according to First-In, First-Out (FIFO) principles.
- Computes remaining open lots, weighted average cost basis, and acquisition dates.
- **Mutual Fund Exchange Trades (`EX-OUT` & `EX-IN`)**: Renders purple exchange badges (`.tag-exchange`), connected fund pills (`From [K-CASH]` / `To [K-USA]`), and realized P/L tracking.
- Analyzes closed positions with realized gains/losses, hold durations, and sell execution prices.

### 📜 Full Transaction History Ledger

- **Initial Unfiltered Feed**: Opening the Transactions view automatically consolidates all asset classes and trade types (`BUY`, `SELL`, `EX-IN`, `EX-OUT`) across all symbols.
- **Normalized Table Layout**: Standardized column widths across all type filters with multi-line symbol name display.
- **Context-Aware Asset Units**: Dynamically formats unit labels:
  - **Cryptocurrency**: Displays unit as `coins` / `coin` (e.g., `+0.2500 coins`, `@ $98,400.00 / coin`).
  - **Mutual Funds & Provident Funds**: Displays unit as `units` / `unit` (e.g., `10,335.6092 units`, `32,772.99 units`).
  - **Stocks**: Displays unit as `shares` / `share`.
- **Export to CSV**: Download transactions in standard 5-column CSV format (`Symbol,Date,Quantity,Price,Currency`) with YYYY-MM-DD dates, signed quantities (`+` for BUY/EX-IN, `-` for SELL/EX-OUT), UTF-8 BOM encoding (`\uFEFF`), and filter options (Asset Type and Open/Closed scope).
- **Pagination & Sorting**: Configurable page size options (10, 50, 100) with responsive pagination navigation.

### 🧮 Investor Tools & Financial Simulators Hub

- **Portfolio Rebalance Planner**:
  - Symbol-level target allocation model grouped by asset classes (`U.S. Stocks`, `Thai Stocks`, `Crypto`, `Mutual Funds`, `Bonds`, `Provident Funds`).
  - **Standard Two-Way Rebalance**: Computes exact buy/sell orders, turnover, and delta shares to rebalance existing capital.
  - **No-Sell / Contribution Inflow Solver**: Solves the exact minimum cash inflow ($\Delta C_{\text{min}}$) needed based on the anchor overweight asset so zero assets are sold, plus smart deficit waterfall allocation for custom deposit budgets.
  - **Responsive Hybrid Interface**: 6-column widescreen data table on desktop (`≥ 1024px`), two-tier split header on tablet (`768px – 1023px`), and card grid on mobile (`< 1024px`).
  - **Filter-Aware Dynamic KPIs & Orders**: Asset class filter chips dynamically refresh portfolio/class values, buy/sell totals, required cash contribution, and copyable trade execution checklists.
  - Interactive Target % steppers (`[-]` / `[+]`) and distribution presets (`Equal Weight`, `Set Current`, `Normalize`).
- **Time Value of Money (TVM) Calculator**:
  - **5-Way Flexible Solve Modes**: Calculate Future Value ($FV$), Periodic Payment ($PMT$), Starting Principal ($PV$), Investment Horizon ($N$), and Required Annual Return Rate ($Rate$).
  - **8 Compounding Frequencies**: Daily ($m=365$), Weekly ($m=52$), Biweekly ($m=26$), Semimonthly ($m=24$), Monthly ($m=12$), Quarterly ($m=4$), Semiannually ($m=2$), and Annually ($m=1$).
  - **Multi-Asset Class Present Value ($PV$) Sync**: Directly sync starting principal from live portfolio market values or cost basis with multi-asset selection chips (U.S. Stocks, Thai Stocks, Crypto, Mutual Funds, Bonds).
  - **Interactive Year-by-Year Wealth Trajectory Line Graph**: Reactive SVG line & area curves, crosshair vertical guidelines, animated indicator dots, and floating tooltips displaying balance, invested capital, interest earned, and return multiples.
  - **Expandable Accumulation Schedule**: Complete year-by-year financial table with annual deposits, yearly interest, cumulative interest, and ending balances with Privacy Mode blurring.
- **Average Cost Basis Calculator**:
  - Multi-step forward Buy / Sell order simulation with custom brokerage fees.
  - Target Average Cost Solver calculating exact required shares and capital to achieve a desired cost basis.

### 📱 Responsive Experience & Tablet Optimization

- **Native Bottom Navigation for Mobile & Tablet**: Modern native app navigation bar docked at the bottom of the viewport with active pill indicators and instant view switching across 6 primary views (`Dashboard`, `Holdings`, `Analytics`, `Dividends`, `Transactions`, `Tools`) with equal 6-slot dock spread (`repeat(6, 1fr)`).
- **Distinct Navigation Iconography**: Clear visual distinction between the 4-card asymmetric **Dashboard** icon and the 3-tier isometric stacked **Holdings** icon (`layers`).
- **Desktop Header Navigation Capsule**: Floating capsule navigation for widescreen displays paired with quick USD/THB currency toggle, privacy mode, and dark/light theme switchers.
- **Tablet & Mobile Touch UX**: Optimized layout scaling for tablets (iPad Air, iPad Pro) and phones with touch-friendly controls and zero horizontal overflow.

---

## Tech Stack

| Layer                   | Technology                                                                                                     |
| :---------------------- | :------------------------------------------------------------------------------------------------------------- |
| **Framework**           | [Angular 22](https://angular.dev/) (Standalone Components, Signals, Computed Signals)                          |
| **Styling**             | Custom Design System with Modern CSS & [Tailwind CSS v4.3](https://tailwindcss.com/)                           |
| **Language**            | [TypeScript 6.0](https://www.typescriptlang.org/)                                                              |
| **Runtime**             | [Node.js 24 LTS](https://nodejs.org/) (v24.19.0)                                                               |
| **Backend Integration** | [FastAPI Backend (SGSKBackend)](https://github.com/vipatpolk/SGSKBackend) for data processing and API proxying |
| **Data Source**         | Google Sheets CSV Export (via Backend)                                                                         |
| **Unit Testing**        | [Vitest](https://vitest.dev/) & jsdom (**31 test files, 311 unit tests**)                                      |
| **E2E & API Testing**   | [Cucumber BDD](https://cucumber.io/), [Serenity/JS](https://serenity-js.org/) & [PactumJS](https://pactumjs.github.io/) (**51 scenarios: 41 UI, 10 API**) |
| **Deployment**          | [Vercel](https://vercel.com/) (with API proxy rewrites)                                                        |

---

## Project Structure

```
ShareLot/
├── e2e/                        # Unified Cucumber BDD, Serenity/JS & PactumJS Test Suite
│   ├── features/               # Gherkin .feature specifications (UI and API)
│   │   ├── api/                # REST API contract and service features
│   │   └── ui/                 # End-to-end user journey features
│   ├── step_definitions/       # Step definition implementations
│   │   ├── api/                # PactumJS REST API step definitions
│   │   └── ui/                 # Playwright UI step definitions
│   ├── support/                # Serenity actors, lifecycle hooks & Pactum config
│   ├── pages/                  # Page Object Model (POM) classes
│   ├── fixtures/               # Deterministic mock JSON payloads (sheets, prices, rates)
│   └── utils/                  # Network interception utilities (page.route)
├── public/                     # Static assets & favicons
├── src/
│   ├── app/
│   │   ├── components/         # Reusable UI feature components & co-located unit tests
│   │   │   ├── analytics/            # Unified Portfolio Analytics (Overview, Allocation, Performance)
│   │   │   ├── asset-allocation/     # Asset allocation & target rebalancing
│   │   │   ├── dashboard/            # Executive portfolio landing dashboard
│   │   │   ├── date-range-picker/    # Preset & custom date range picker
│   │   │   ├── dividend/             # Dividend cash flows, YOC, timeline & ledger modal
│   │   │   ├── filters/              # Filter pill buttons & dropdowns
│   │   │   ├── header/               # Header, navigation, theme, currency & privacy toggle
│   │   │   ├── performance/          # Performance analytics, charts, movers & symbol table
│   │   │   ├── search-bar/           # Autocomplete symbol search input
│   │   │   ├── summary-card/         # Metric cards & statistics displays
│   │   │   ├── tab-bar/              # Asset category tab navigation
│   │   │   ├── tools/                # Tools Hub, Avg Cost Simulator & TVM Calculator
│   │   │   │   ├── avg-cost-calculator/
│   │   │   │   └── tvm-calculator/
│   │   │   └── transaction-history/  # Transaction ledger, CSV export & pagination
│   │   ├── config/             # UI tab constants & asset metadata
│   │   │   └── asset.constants.ts
│   │   ├── models/             # Domain models (Transaction, ShareLot, Portfolio, Tools)
│   │   │   ├── portfolio.model.ts
│   │   │   ├── tools.model.ts
│   │   │   └── transaction.model.ts
│   │   ├── services/           # Data fetching & portfolio services with spec tests
│   │   │   ├── dividend.service.ts
│   │   │   ├── portfolio.service.ts
│   │   │   ├── share-lot.service.ts
│   │   │   ├── price.service.ts
│   │   │   └── nav.service.ts
│   │   ├── utils/              # Dynamic formatting & calculation helpers & unit tests
│   │   │   ├── calculator.utils.ts
│   │   │   ├── csv-exporter.utils.ts
│   │   │   ├── format.utils.ts
│   │   │   ├── rebalance-calculator.utils.ts
│   │   │   └── tvm-calculator.utils.ts
│   │   ├── app.ts              # Root component logic, signal state & privacy management
│   │   ├── app.html            # Dashboard layout & view switching
│   │   └── app.css             # Root component styling, animations & privacy filters
│   ├── index.html              # HTML entry point with favicon metadata
│   ├── main.ts                 # Application bootstrapping
│   └── styles.css              # Global styles, theme tokens & privacy masking rules
├── angular.json                # Angular CLI configuration
├── playwright.config.ts        # Playwright E2E configuration & browser targets
├── proxy.conf.json             # Dev server reverse proxies (CORS bypass)
├── vitest.config.ts            # Vitest unit testing configuration
├── vercel.json                 # Production API rewrites for Vercel
└── package.json                # Project dependencies & scripts
```

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (version 22.x or 24.x LTS recommended)
- [npm](https://www.npmjs.com/) (version 10.x or later)
- Python 3.9+ with virtualenv (for running `SGSKBackend`)

### Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/vipatpolk/ShareLot.git
cd ShareLot
npm install
npx playwright install --with-deps
```

### Development Server

Start the local Angular development server with proxy support:

```bash
npm start
```

Navigate to `http://localhost:4200/` in your browser. The application will automatically reload if you modify any source files.

> [!NOTE]
> The dev server uses `proxy.conf.json` to proxy requests to the local `SGSKBackend` running on `http://127.0.0.1:8000`. Make sure the backend is running locally.

### Running Unit Tests

Execute unit tests using Vitest (31 test files, 311 unit tests):

```bash
npm test
```

### Running End-to-End (E2E) & API Tests

ShareLot includes a unified Cucumber BDD test suite covering **51 automated scenarios** (41 UI and 10 REST API) with Serenity/JS HTML living documentation and PactumJS:

```bash
# Run all E2E and API scenarios via single Cucumber runner (51 scenarios)
npm run test:e2e

# Run only UI browser scenarios
npm run test:e2e:ui

# Run only REST API scenarios via PactumJS
npm run test:e2e:api

# Run critical path smoke tests
npm run test:e2e:smoke

# View interactive Serenity/JS HTML living documentation report locally
npm run test:e2e:report

# Generate GitHub Actions Job Summary markdown
npm run test:e2e:summary

# Clear test results and report output folders
npm run clean:e2e
```

### Viewing Serenity Living Documentation on CI/CD

The GitHub Actions CI/CD workflow (`.github/workflows/e2e.yml`) automatically publishes test reports on every build:

1. **GitHub Pages (Live Interactive Report)**:
   - On every push to `master` / `main`, the Serenity HTML living documentation is automatically deployed to GitHub Pages at:
     `https://vipatpolk.github.io/ShareLot/`
   - Browse interactive execution timelines, scenario steps, and failure screenshots with zero local installation.
2. **GitHub Actions Job Summary**:
   - Every workflow run (pushes and pull requests) generates an instant **Execution Scorecard** directly inside the GitHub Actions run summary tab with total pass rates, scenario counts, duration, and top slowest scenarios.
3. **Downloadable Artifacts**:
   - The full `reports/serenity-js/` archive is stored as a GitHub Actions build artifact (`serenity-living-documentation`) for 14 days. Download and run `npm run test:e2e:report` to view offline.

### Production Build

To build the production bundle:

```bash
npm run build
```

The compiled output will be generated inside the `dist/` directory, ready for deployment.

---

## Configuration

### Views and Navigation

The top header enables instant switching across the 6 primary views:

- **Dashboard**: Primary landing page featuring executive portfolio hero banner with dark/light theme switching, asset allocation donut snapshot, top movers, forward dividends, PVD metrics, recent trade activity feed, and financial tools launchpad.
- **Holdings**: Real-time open positions, FIFO lots, cost basis, and unrealized gains (represented by 3-tier isometric layers icon).
- **Analytics**: Unified portfolio analytics combining Portfolio Overview (KPI summary, distribution, concentration, top movers), Target Asset Allocation (interactive donut chart, asset class drill-down, currency exposure), and Investment Performance (timeframe filtering, asset class return bars, symbol rankings).
- **Dividends**: FIFO cashflow accounting, Yield on Cost (YOC), monthly timeline charts, and distribution ledgers.
- **Transactions**: Complete transaction history ledger, trade type filters, and CSV export.
- **Tools**: Investor tools & financial simulators hub (Portfolio Rebalance Planner, TVM Calculator, Average Cost Simulator).

### Asset Category Configuration

Asset categories (`All`, `U.S. Stock`, `Thai Stock`, `Cryptocurrency`, `Mutual Fund`, `Bond`, `Provident Fund`, `Closed Position`) and brand colors are configured in [src/app/config/asset.constants.ts](src/app/config/asset.constants.ts) and [src/app/utils/format.utils.ts](src/app/utils/format.utils.ts).

### Backend Data Source

All Google Spreadsheet IDs, tab GID mappings, and data processing are configured centrally inside **[SGSKBackend](https://github.com/vipatpolk/SGSKBackend)** (`config/sheet_config.py`).

---

## License

© 2026 SGSK ShareLot — Investment Portfolio Tracker & FIFO Engine. Private and proprietary.
