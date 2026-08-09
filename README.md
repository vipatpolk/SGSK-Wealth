# ShareLot — FIFO Share Lot & Portfolio Tracker

<p align="center">
  <img src="public/favicon.svg" alt="ShareLot Logo" width="96" height="96" />
</p>

<p align="center">
  <strong>A modern, real-time investment portfolio tracker, FIFO share lot accounting dashboard, and asset allocation rebalancer.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Angular-21.0-DD0031?style=flat-square&logo=angular&logoColor=white" alt="Angular 21" />
  <img src="https://img.shields.io/badge/TailwindCSS-v4.0-38BDF8?style=flat-square&logo=tailwindcss&logoColor=white" alt="Tailwind CSS v4" />
  <img src="https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vitest-4.0-6E9F18?style=flat-square&logo=vitest&logoColor=white" alt="Vitest" />
  <img src="https://img.shields.io/badge/Deploy-Vercel-000000?style=flat-square&logo=vercel&logoColor=white" alt="Vercel" />
</p>

---

## Overview

**ShareLot** is an investment portfolio analytics web application designed to automate **First-In, First-Out (FIFO)** share lot accounting across multiple asset classes. It connects to the **SGSKBackend** to ingest transaction logs from Google Sheets and streams real-time market data to compute cost basis, open lots, realized gains, holding values, total profit/loss (P/L), and target asset rebalancing.

---

## Key Features

- ⚖️ **Target Asset Allocation & Rebalancing**:
  - **Live Portfolio Rebalancer**: Computes real-time target vs. actual allocation percentages across asset classes (`U.S. Stock`, `Thai Stock`, `Cryptocurrency`, `Mutual Fund`).
  - **Editable Target Allocation**: Interactive edit mode with real-time target sum validation (must equal 100%). Prevents invalid target submission with visual color cues.
  - **Actionable Rebalance Deltas**: Calculates precise monetary actions needed to rebalance portfolio (`+$1,000` to buy, `-$500` to sell, or `Balanced`).
  - **Concentration & Currency Exposure**: Top Holdings Concentration chart with **Show All / Show Top 5** toggle controls, alongside USD/THB currency exposure visualizer.

- 📊 **FIFO Share Lot Engine**:
  - Automatically matches buy and sell transaction queues according to FIFO principles.
  - Computes remaining open lots, weighted average cost basis, and date of acquisition.
  - Analyzes closed positions with realized gains/losses, hold durations, and sell prices.

- 📜 **Full Transaction History Ledger**:
  - **All Symbols Feed & Symbol-Specific Views**: Unified cross-portfolio activity stream or dedicated per-symbol transaction drill-down.
  - **Interactive Date Range Filter**: Custom date range picker component with presets (`YTD`, `1M`, `3M`, `6M`, `1Y`, `All Time`, or custom date bounds).
  - **Pagination Controls**: Configurable page size options (10, 50, or 100 transactions per page) with full navigation and dynamic count indicators.
  - **Transaction Filtering & Sorting**: Filter by transaction type (`All`, `Buy`, `Sell`), asset class, or text search.
  - **Realized P/L Tracking**: Displays matched lots, gain/loss per sale, hold duration, and execution prices.

- 📱 **Mobile-First Responsive Experience**:
  - **Mobile-Responsive Card Layouts**: High-density tables on desktop seamlessly transform into touch-friendly cards on mobile devices without horizontal clipping or blowout.
  - **Dropdown View Selector**: Touch-friendly dropdown selector (`Holdings`, `Allocation`, `Transactions`) for effortless mobile navigation.
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
  - Decoupled client architecture utilizing `asset.constants.ts` for clean UI configuration; raw Google Sheets IDs/GIDs are fully encapsulated within `SGSKBackend`.
  - Angular Standalone Components, Signals, and modern control-flow syntax (`@if`, `@for`).

---

## Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Framework** | [Angular 21](https://angular.dev/) (Standalone Components, Signals, RxJS) |
| **Styling** | Custom Design System with Modern CSS & Tailwind CSS |
| **Backend Integration** | [FastAPI Backend (SGSKBackend)](https://github.com/vipatpolk/SGSKBackend) for data processing and API proxying |
| **Data Source** | Google Sheets CSV Export (via Backend) |
| **Unit Testing** | [Vitest](https://vitest.dev/) & jsdom |
| **Deployment** | [Vercel](https://vercel.com/) (with API proxy rewrites) |

---

## Project Structure

```
ShareLot/
├── public/                     # Static assets & favicons
├── src/
│   ├── app/
│   │   ├── components/         # Reusable UI feature components
│   │   │   ├── asset-allocation/     # Asset allocation & target rebalancing component
│   │   │   ├── date-range-picker/    # Interactive date range selector component
│   │   │   ├── filters/              # Asset class filter pills & search bar
│   │   │   ├── header/               # Header logo, portfolio summary stats & view toggle
│   │   │   ├── search-bar/           # Symbol & fund autocomplete search component
│   │   │   ├── summary-card/          # Holdings summary card & lot expansion table
│   │   │   ├── tab-bar/              # Asset class tab navigation bar
│   │   │   └── transaction-history/  # Dedicated transaction ledger component
│   │   ├── config/             # Clean UI tab constants & metadata
│   │   │   └── asset.constants.ts
│   │   ├── models/             # Domain models (Transaction, ShareLot, SymbolSummary)
│   │   │   └── transaction.model.ts
│   │   ├── services/           # Data fetching & calculation services
│   │   │   ├── share-lot.service.ts  # Backend API client for share lots & transactions
│   │   │   ├── price.service.ts      # Multi-source live pricing & FX rates
│   │   │   └── nav.service.ts        # Thai Mutual Fund NAV lookups
│   │   ├── utils/              # Dynamic formatting helpers (currencies, quantities, colors)
│   │   │   └── format.utils.ts
│   │   ├── app.ts              # Root component logic & signal state
│   │   ├── app.html            # Dashboard layout & template
│   │   └── app.css             # Component styling & animations
│   ├── index.html              # HTML entry point with favicon metadata
│   ├── main.ts                 # Application bootstrapping
│   └── styles.css              # Global styles & theme tokens
├── angular.json                # Angular CLI configuration
├── proxy.conf.json             # Dev server reverse proxies (CORS bypass)
├── vercel.json                 # Production API rewrites for Vercel
└── package.json                # Project dependencies & scripts
```

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (version 20.x or later recommended)
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

Execute unit tests using Vitest:

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

All Google Spreadsheet IDs, tab GID mappings, and data processing are configured centrally inside the **[SGSKBackend](https://github.com/vipatpolk/SGSKBackend)** (`config/sheet_config.py`).

---

## License

This project is private and proprietary.
