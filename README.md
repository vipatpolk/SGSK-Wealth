# ShareLot — FIFO Share Lot & Portfolio Tracker

<p align="center">
  <img src="public/favicon.svg" alt="ShareLot Logo" width="96" height="96" />
</p>

<p align="center">
  <strong>A modern, real-time investment portfolio tracker, FIFO share lot accounting dashboard, and asset allocation rebalancer.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Angular-22.1-DD0031?style=flat-square&logo=angular&logoColor=white" alt="Angular 22" />
  <img src="https://img.shields.io/badge/TailwindCSS-v4.3-38BDF8?style=flat-square&logo=tailwindcss&logoColor=white" alt="Tailwind CSS v4.3" />
  <img src="https://img.shields.io/badge/TypeScript-6.0-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript 6.0" />
  <img src="https://img.shields.io/badge/Node.js-24.19_LTS-339933?style=flat-square&logo=nodedotjs&logoColor=white" alt="Node.js 24 LTS" />
  <img src="https://img.shields.io/badge/Deploy-Vercel-000000?style=flat-square&logo=vercel&logoColor=white" alt="Vercel" />
</p>

---

## Overview

**ShareLot** is an investment portfolio analytics web application designed to automate **First-In, First-Out (FIFO)** share lot accounting across multiple asset classes. It connects to **SGSKBackend** to ingest transaction logs from Google Sheets and streams real-time market data to compute cost basis, open lots, realized gains, holding values, total profit/loss (P/L), and target asset rebalancing.

---

## Key Features

- ⚖️ **Target Asset Allocation & Rebalancing**:
  - **Auto-Aggregated Portfolio Overview**: Navigating to the Allocation page automatically switches to the `All` tab, aggregating portfolio positions across all asset categories (`U.S. Stock`, `Thai Stock`, `Cryptocurrency`, `Mutual Fund`).
  - **Interactive Asset Class Filtering**: Clicking any Asset Class row, Donut Chart segment, or Legend item filters the Allocation page directly to that specific asset class.
  - **"Symbol at Class" Detailed Breakdown View**: When filtered, the Target Rebalancing card dynamically transforms into **Symbol Allocation in [Asset Class]**, displaying individual holdings (quantity, value, class %, portfolio %) with a prominent **`← All Asset Classes`** button positioned above the Pie Chart for one-click filter reset.
  - **Editable Target Allocation**: Interactive edit mode with icon-enhanced action buttons and real-time target sum validation (must equal 100%).
  - **Actionable Rebalance Deltas**: Calculates precise monetary actions needed to rebalance portfolio (`+$1,000` to buy, `-$500` to sell, or `Balanced`).
  - **Concentration & Currency Exposure**: Top Holdings Concentration chart with **Show All / Show Top 5** toggle controls, alongside USD/THB currency exposure visualizer.

- 📊 **FIFO Share Lot Engine**:
  - Automatically matches buy and sell transaction queues according to FIFO principles.
  - Computes remaining open lots, weighted average cost basis, and acquisition dates.
  - Analyzes closed positions with realized gains/losses, hold durations, and sell execution prices.

- 📜 **Full Transaction History Ledger**:
  - **Initial Unfiltered Feed**: Opening the Transactions view automatically consolidates all asset classes and trade types (`BUY` & `SELL`) across all symbols without initial filtering.
  - **All Symbols Feed & Symbol-Specific Views**: Unified cross-portfolio activity stream or dedicated per-symbol transaction drill-down.
  - **Context-Aware Asset Units**: Dynamically formats unit text based on asset class:
    - **Cryptocurrency**: Displays unit as `coins` / `coin` (e.g., `+0.2500 coins`, `@ $98,400.00 / coin`, `Coins & Execution`).
    - **Mutual Funds**: Displays unit as `units` / `unit`.
    - **Stocks**: Displays unit as `shares` / `share`.
  - **Export to CSV**: Download unpaginated transactions in CSV format matching Google Sheets schema (`Symbol,Date,Quantity,Price,Currency`) with YYYY-MM-DD formatted dates and 3 export scope options:
    - **Export All Transactions**: All transactions matching active search & date filters.
    - **Only Open Positions**: Transactions filtered exclusively for active open holdings.
    - **Only Closed Positions**: Transactions filtered exclusively for fully realized closed holdings.
  - **Interactive Date Range Filter**: Custom date range picker component with presets (`YTD`, `1M`, `3M`, `6M`, `1Y`, `All Time`, or custom date bounds).
  - **Pagination Controls**: Configurable page size options (10, 50, or 100 transactions per page) with full navigation, touch-friendly dropdown styling, and dynamic count indicators.
  - **Transaction Filtering & Sorting**: Filter by transaction type (`All`, `Buy`, `Sell`), asset class, or text search.

- 📱 **Mobile-First Responsive Experience**:
  - **Mobile-Responsive Card Layouts**: High-density tables on desktop seamlessly transform into touch-friendly cards on mobile devices without horizontal clipping.
  - **Dropdown View Selector**: Touch-friendly dropdown selector (`Holdings`, `Allocation`, `Transactions`) for effortless mobile navigation.
  - **iOS Safari Auto-Zoom Prevention**: Touch inputs and per-page select controls are optimized with explicit styling and `16px` mobile sizing to prevent unwanted layout zooming.
  - **Adaptive Header & Toolbar**: Dynamic USD/THB currency toggle, theme switcher, and mobile-optimized pagination bar.

- 🌐 **Multi-Asset Class Support**:
  - **U.S. Stocks**: Live market quotes and metadata via Yahoo Finance API (`USD`).
  - **Thai Stocks**: Stock Exchange of Thailand (`.BK`) quotes via Yahoo Finance (`THB`).
  - **Cryptocurrencies**: Live orderbook prices via Binance TH API (`THB`/`USD`).
  - **Thai Mutual Funds**: Daily NAV lookups via SEC Thailand APIs (`THB`).
  - **Closed Positions**: Historical realized gain/loss ledger with asset-type metadata.

- 💱 **Live Currency Conversion**:
  - Real-time USD/THB exchange rate lookup with one-click switching between USD ($) and THB (฿).

- 🎨 **Modern Architecture & Dark UI**:
  - Built with **Angular 22**, Standalone Components, Signals, RxJS, and modern control-flow syntax (`@if`, `@for`).
  - Decoupled client architecture utilizing `asset.constants.ts` for clean UI configuration; raw Google Sheets IDs/GIDs are fully encapsulated within `SGSKBackend`.

---

## Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Framework** | [Angular 22](https://angular.dev/) (Standalone Components, Signals, RxJS) |
| **Styling** | Custom Design System with Modern CSS & [Tailwind CSS v4.3](https://tailwindcss.com/) |
| **Language** | [TypeScript 6.0](https://www.typescriptlang.org/) |
| **Runtime** | [Node.js 24 LTS](https://nodejs.org/) (v24.19.0) |
| **Backend Integration** | [FastAPI Backend (SGSKBackend)](https://github.com/vipatpolk/SGSKBackend) for data processing and API proxying |
| **Data Source** | Google Sheets CSV Export (via Backend) |
| **Unit Testing** | [Vitest](https://vitest.dev/) & jsdom (13 test suites, 105 unit tests) |
| **Deployment** | [Vercel](https://vercel.com/) (with API proxy rewrites) |

---

## Project Structure

```
ShareLot/
├── public/                     # Static assets & favicons
├── src/
│   ├── app/
│   │   ├── components/         # Reusable UI feature components & co-located unit tests
│   │   │   ├── asset-allocation/
│   │   │   │   ├── asset-allocation.component.ts
│   │   │   │   ├── asset-allocation.component.html
│   │   │   │   ├── asset-allocation.component.css
│   │   │   │   └── asset-allocation.component.spec.ts
│   │   │   ├── date-range-picker/
│   │   │   │   ├── date-range-picker.component.ts
│   │   │   │   ├── date-range-picker.component.html
│   │   │   │   ├── date-range-picker.component.css
│   │   │   │   └── date-range-picker.component.spec.ts
│   │   │   ├── filters/
│   │   │   │   ├── filters.component.ts
│   │   │   │   ├── filters.component.html
│   │   │   │   └── filters.component.spec.ts
│   │   │   ├── header/
│   │   │   │   ├── header.component.ts
│   │   │   │   ├── header.component.html
│   │   │   │   └── header.component.spec.ts
│   │   │   ├── search-bar/
│   │   │   │   ├── search-bar.component.ts
│   │   │   │   ├── search-bar.component.html
│   │   │   │   └── search-bar.component.spec.ts
│   │   │   ├── summary-card/
│   │   │   │   ├── summary-card.component.ts
│   │   │   │   ├── summary-card.component.html
│   │   │   │   └── summary-card.component.spec.ts
│   │   │   ├── tab-bar/
│   │   │   │   ├── tab-bar.component.ts
│   │   │   │   ├── tab-bar.component.html
│   │   │   │   └── tab-bar.component.spec.ts
│   │   │   └── transaction-history/
│   │   │       ├── transaction-history.component.ts
│   │   │       ├── transaction-history.component.html
│   │   │       ├── transaction-history.component.css
│   │   │       └── transaction-history.component.spec.ts
│   │   ├── config/             # Clean UI tab constants & metadata
│   │   │   └── asset.constants.ts
│   │   ├── models/             # Domain models (Transaction, ShareLot, SymbolSummary)
│   │   │   └── transaction.model.ts
│   │   ├── services/           # Data fetching & calculation services with spec tests
│   │   │   ├── share-lot.service.ts
│   │   │   ├── share-lot.service.spec.ts
│   │   │   ├── price.service.ts
│   │   │   ├── price.service.spec.ts
│   │   │   ├── nav.service.ts
│   │   │   └── nav.service.spec.ts
│   │   ├── utils/              # Dynamic formatting helpers & unit tests
│   │   │   ├── format.utils.ts
│   │   │   └── format.utils.spec.ts
│   │   ├── app.ts              # Root component logic & signal state
│   │   ├── app.html            # Dashboard layout & template
│   │   ├── app.css             # Component styling & animations
│   │   └── app.spec.ts         # Root component unit tests
│   ├── index.html              # HTML entry point with favicon metadata
│   ├── main.ts                 # Application bootstrapping
│   └── styles.css              # Global styles & theme tokens
├── angular.json                # Angular CLI configuration
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

### Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/vipatpolk/ShareLot.git
cd ShareLot
npm install
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

Execute unit tests using Vitest (13 test files, 103 unit tests):

```bash
npm test
```

### Production Build

To build the production bundle:

```bash
npm run build
```

The compiled output will be generated inside the `dist/` directory, ready for deployment.

---

## Configuration

### Asset Category Navigation

Tab navigation categories (`All`, `U.S. Stock`, `Thai Stock`, `Cryptocurrency`, `Mutual Fund`, `Closed Position`) are configured in [src/app/config/asset.constants.ts](src/app/config/asset.constants.ts). 

### Backend Data Source

All Google Spreadsheet IDs, tab GID mappings, and data processing are configured centrally inside **[SGSKBackend](https://github.com/vipatpolk/SGSKBackend)** (`config/sheet_config.py`).

---

## License

This project is private and proprietary.
