# ShareLot — FIFO Share Lot & Portfolio Tracker

<p align="center">
  <img src="public/favicon.svg" alt="ShareLot Logo" width="96" height="96" />
</p>

<p align="center">
  <strong>A modern, real-time investment portfolio tracker, FIFO share lot accounting dashboard, asset allocation rebalancer, and performance analytics engine.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Angular-22.1-DD0031?style=flat-square&logo=angular&logoColor=white" alt="Angular 22" />
  <img src="https://img.shields.io/badge/TailwindCSS-v4.3-38BDF8?style=flat-square&logo=tailwindcss&logoColor=white" alt="Tailwind CSS v4.3" />
  <img src="https://img.shields.io/badge/TypeScript-6.0-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript 6.0" />
  <img src="https://img.shields.io/badge/Playwright-1.50-45BA4B?style=flat-square&logo=playwright&logoColor=white" alt="Playwright E2E" />
  <img src="https://img.shields.io/badge/Vitest-4.1-FCC72B?style=flat-square&logo=vitest&logoColor=black" alt="Vitest Unit Testing" />
  <img src="https://img.shields.io/badge/Node.js-24.19_LTS-339933?style=flat-square&logo=nodedotjs&logoColor=white" alt="Node.js 24 LTS" />
  <img src="https://img.shields.io/badge/Deploy-Vercel-000000?style=flat-square&logo=vercel&logoColor=white" alt="Vercel" />
</p>

---

## Overview

**ShareLot** is an investment portfolio analytics web application designed to automate **First-In, First-Out (FIFO)** share lot accounting across multiple asset classes. It connects to **SGSKBackend** to ingest transaction logs from Google Sheets and streams real-time market data to compute cost basis, open lots, realized gains, holding values, total profit/loss (P/L), asset rebalancing, and comprehensive investment performance analytics.

---

## Key Features

### 📈 Investment Performance & Returns Analytics
- **Portfolio Summary Grid**: Five high-level KPI cards displaying *Total Invested*, *Total Value*, *P/L (Unrealized)*, *Realized P/L*, and *Total Return* with color-coded profit/loss amounts and relative return percentages.
- **Asset Type Performance Breakdown**: Grouped returns analysis by asset class (`U.S. Stock`, `Thai Stock`, `Cryptocurrency`, `Mutual Fund`), featuring proportional horizontal return bar charts and open/closed symbol counts.
- **Top Movers Ranking**: Dynamic top 5 **Gainers** and top 5 **Losers** leaderboards with badge styling, progress bars, and percentage return indicators.
- **Time Frame Selection & Date Filtering**: Integrated [`DateRangePickerComponent`](src/app/components/date-range-picker/date-range-picker.component.ts) with presets (`YTD`, `1M`, `3M`, `6M`, `1Y`, `All Time`, or custom bounds) to dynamically filter closed-lot realized gains over specific timeframes.
- **Interactive Symbol Search & Autocomplete**: Fast search toolbar with keyboard-accessible autocomplete suggestions (`↑`, `↓`, `Enter`, `Escape`), active index highlighting, asset badges, status pills, and clickable filter actions.
- **Multi-Currency Valuation**: Automatic conversion across `USD` $\leftrightarrow$ `USDT` $\leftrightarrow$ `THB` based on exchange rates and price quote currencies.
- **Flexible Sorting & Status Filters**: Sort performance table by Symbol, Total Return %, Total Return $, Invested Cost, Current Value, Realized P/L, or Unrealized P/L with Open/Closed/All status filters.

### ⚖️ Target Asset Allocation & Rebalancing
- **Auto-Aggregated Portfolio Overview**: Navigating to the Allocation page automatically aggregates positions across all asset categories (`U.S. Stock`, `Thai Stock`, `Cryptocurrency`, `Mutual Fund`).
- **Interactive Asset Class Filtering**: Clicking any Asset Class row, Donut Chart segment, or Legend item filters the Allocation view directly to that specific asset class.
- **"Symbol at Class" Detailed Breakdown View**: When filtered, the Target Rebalancing card dynamically transforms into **Symbol Allocation in [Asset Class]**, displaying individual holdings with a prominent **`← All Asset Classes`** reset button.
- **Editable Target Allocation**: Interactive edit mode with icon-enhanced action buttons and real-time target sum validation (must equal 100%).
- **Actionable Rebalance Deltas**: Calculates precise monetary actions needed to rebalance the portfolio (`+$1,000` to buy, `-$500` to sell, or `Balanced`).
- **Concentration & Currency Exposure**: Top Holdings Concentration chart with **Show All / Show Top 5** toggle controls, alongside USD/THB currency exposure visualizer.

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
  - **Mutual Funds**: Identified strictly by `.BKFUND` suffix; displays unit as `units` / `unit`.
  - **Stocks**: Displays unit as `shares` / `share`.
- **Export to CSV**: Download transactions in standard 5-column CSV format (`Symbol,Date,Quantity,Price,Currency`) with YYYY-MM-DD dates, signed quantities (`+` for BUY/EX-IN, `-` for SELL/EX-OUT), UTF-8 BOM encoding (`\uFEFF`), and filter options (Asset Type and Open/Closed scope).
- **Pagination & Sorting**: Configurable page size options (10, 50, 100) with responsive pagination navigation.

### 📱 Mobile & Tablet Responsive Experience
- **Fluid Layouts**: High-density desktop grids transform seamlessly into structured, touch-friendly card layouts on mobile and tablet devices.
- **Dropdown View Navigation**: Touch-friendly dropdown selector (`Holdings`, `Allocation`, `Performance`, `Transactions`) for seamless mobile navigation.
- **iOS Safari Auto-Zoom Prevention**: Touch inputs and select controls utilize optimized 16px mobile typography to prevent browser zooming.

### 🌐 Multi-Asset Class Support
- **U.S. Stocks**: Live market quotes and metadata via Yahoo Finance API (`USD`).
- **Thai Stocks**: Stock Exchange of Thailand (`.BK`) quotes via Yahoo Finance (`THB`).
- **Cryptocurrencies**: Live orderbook prices via Binance TH API (`THB`/`USD`).
- **Thai Mutual Funds**: Daily NAV lookups via SEC Thailand APIs (`THB`).
- **Closed Positions**: Historical realized gain/loss ledger with asset-type metadata.

---

## Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Framework** | [Angular 22](https://angular.dev/) (Standalone Components, Signals, Computed Signals) |
| **Styling** | Custom Design System with Modern CSS & [Tailwind CSS v4.3](https://tailwindcss.com/) |
| **Language** | [TypeScript 6.0](https://www.typescriptlang.org/) |
| **Runtime** | [Node.js 24 LTS](https://nodejs.org/) (v24.19.0) |
| **Backend Integration** | [FastAPI Backend (SGSKBackend)](https://github.com/vipatpolk/SGSKBackend) for data processing and API proxying |
| **Data Source** | Google Sheets CSV Export (via Backend) |
| **Unit Testing** | [Vitest](https://vitest.dev/) & jsdom (17 test suites, 137 unit tests) |
| **E2E Testing** | [Playwright](https://playwright.dev/) & Page Object Models (95 automated tests across 5 browser targets) |
| **Deployment** | [Vercel](https://vercel.com/) (with API proxy rewrites) |

---

## Project Structure

```
ShareLot/
├── e2e/                        # Playwright End-to-End (E2E) Test Suite
│   ├── fixtures/               # Deterministic mock JSON payloads (sheets, prices, rates)
│   ├── pages/                  # Page Object Model (POM) classes
│   ├── specs/                  # E2E test spec suites across core functional areas
│   └── utils/                  # Network interception utilities (page.route)
├── public/                     # Static assets & favicons
├── src/
│   ├── app/
│   │   ├── components/         # Reusable UI feature components & co-located unit tests
│   │   │   ├── asset-allocation/     # Asset allocation & target rebalancing
│   │   │   ├── date-range-picker/    # Preset & custom date range picker
│   │   │   ├── filters/              # Filter pill buttons & dropdowns
│   │   │   ├── header/               # Header, navigation, theme & currency switcher
│   │   │   ├── performance/          # Performance analytics, charts, movers & symbol table
│   │   │   ├── search-bar/           # Autocomplete symbol search input
│   │   │   ├── summary-card/         # Metric cards & statistics displays
│   │   │   ├── tab-bar/              # Asset category tab navigation
│   │   │   └── transaction-history/  # Transaction ledger, CSV export & pagination
│   │   ├── config/             # UI tab constants & asset metadata
│   │   │   └── asset.constants.ts
│   │   ├── models/             # Domain models (Transaction, ShareLot, Portfolio, Performance)
│   │   │   ├── portfolio.model.ts
│   │   │   └── transaction.model.ts
│   │   ├── services/           # Data fetching & portfolio services with spec tests
│   │   │   ├── portfolio.service.ts
│   │   │   ├── share-lot.service.ts
│   │   │   ├── price.service.ts
│   │   │   └── nav.service.ts
│   │   ├── utils/              # Dynamic formatting helpers & unit tests
│   │   │   └── format.utils.ts
│   │   ├── app.ts              # Root component logic & signal state
│   │   ├── app.html            # Dashboard layout & view switching
│   │   └── app.css             # Root component styling & animations
│   ├── index.html              # HTML entry point with favicon metadata
│   ├── main.ts                 # Application bootstrapping
│   └── styles.css              # Global styles & theme tokens
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

Execute unit tests using Vitest (16 test files, 134 unit tests):

```bash
npm test
```

### Running End-to-End (E2E) Tests

ShareLot includes a comprehensive Playwright E2E suite covering **70 automated tests** across 5 browser target environments (Chromium, Firefox, WebKit, Mobile Safari, Mobile Chrome):

```bash
# Run all E2E tests in headless mode across all 5 browser targets
npm run test:e2e

# Launch the interactive Playwright UI runner
npm run test:e2e:ui

# Debug E2E tests step-by-step with browser inspector
npm run test:e2e:debug

# View HTML test execution report
npm run test:e2e:report

# Clear test results and report output folders
npm run clean:e2e
```

### Production Build

To build the production bundle:

```bash
npm run build
```

The compiled output will be generated inside the `dist/` directory, ready for deployment.

---

## Configuration

### Views and Navigation

The top header enables instant switching across the 4 primary views:
- **Holdings**: Real-time open positions, FIFO lots, cost basis, and unrealized gains.
- **Allocation**: Target asset allocation, rebalancing recommendations, and concentration breakdown.
- **Performance**: Return percentages, asset type breakdown charts, top movers, and symbol metrics with date filtering.
- **Transactions**: Complete transaction history ledger, trade type filters, and CSV export.

### Asset Category Configuration

Asset categories (`All`, `U.S. Stock`, `Thai Stock`, `Cryptocurrency`, `Mutual Fund`, `Closed Position`) and brand colors are configured in [src/app/config/asset.constants.ts](src/app/config/asset.constants.ts) and [src/app/utils/format.utils.ts](src/app/utils/format.utils.ts).

### Backend Data Source

All Google Spreadsheet IDs, tab GID mappings, and data processing are configured centrally inside **[SGSKBackend](https://github.com/vipatpolk/SGSKBackend)** (`config/sheet_config.py`).

---

## License

This project is private and proprietary.
