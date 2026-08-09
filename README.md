# ShareLot — FIFO Share Lot & Portfolio Tracker

<p align="center">
  <img src="public/favicon.svg" alt="ShareLot Logo" width="96" height="96" />
</p>

<p align="center">
  <strong>A modern, real-time investment portfolio tracker and FIFO share lot accounting dashboard.</strong>
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

**ShareLot** is an investment portfolio analytics web application designed to automate **First-In, First-Out (FIFO)** share lot accounting across multiple asset classes. It ingests transaction logs directly from Google Sheets and streams real-time market data to compute cost basis, open lots, realized gains, holding values, and total profit/loss (P/L).

---

## Key Features

- 📊 **FIFO Share Lot Engine**:
  - Automatically matches buy and sell transaction queues according to FIFO principles.
  - Computes remaining open lots, weighted average cost basis, and date of acquisition.
  - Analyzes closed positions with realized gains/losses, hold durations, and sell prices.

- 📜 **Full Transaction History Ledger**:
  - **All Symbols Feed & Symbol-Specific Views**: Unified cross-portfolio activity stream or dedicated per-symbol transaction drill-down.
  - **Interactive Date Range Filter**: Custom date range picker component with presets (`YTD`, `1M`, `3M`, `6M`, `1Y`, `All Time`, or custom date bounds).
  - **Pagination Controls**: Configurable page size options (10, 50, or 100 transactions per page) with full first/prev/page/next/last navigation and dynamic count indicators.
  - **Transaction Filtering & Sorting**: Filter by transaction type (`All`, `Buy`, `Sell`), asset class, or text search; smart symbol dropdown sorting open positions first followed by alphabetical order.
  - **Realized P/L Tracking**: Displays matched lots, gain/loss per sale, hold duration, and buy/sell execution prices.
  - **Expanded Symbol Display**: Generous space and smart truncation for long fund and company names with hover tooltips.
  - **Responsive Dual-Mode Display**: High-density table on desktop and touch-optimized card layout on mobile devices.

- 📱 **Mobile-First Responsive Experience**:
  - **Dedicated Mobile Transaction Cards**: Left-accented trade badges (Emerald for `BUY`, Rose for `SELL`), 2-column financial execution metrics, realized P/L highlight banners, and running share positions after trades.
  - **Unified Custom Dropdowns**: Touch-friendly, button-based custom dropdown menus replace native OS `<select>` controls for seamless, brand-consistent aesthetic across all viewports.
  - **Adaptive Header & Toolbar**: Touch-friendly navigation buttons (`← Holdings`, `All Symbols`), mobile-optimized sorting, and a 2-row responsive pagination bar.
  - **Mobile Datepicker Modal**: Centered modal popovers for the date range picker on phones and tablets ensure optimal touch usability without screen clipping.
  - **Optimized Performance**: Smooth transitions and touch-friendly controls across all screen sizes.

- 🏷️ **Dynamic Asset Classification & Filtering**:
  - **Color-Coded Asset Badges**: Visual indicators (`U.S. Stock`, `Thai Stock`, `Cryptocurrency`, `Mutual Fund`, and custom asset classes).
  - **Interactive Filter Bars**: Dynamic filter pills with real-time counts and portfolio metric recalculation.
  - **Zero Hardcoding Architecture**: 100% dynamic, data-driven symbol names, asset type categorization, and currency resolution without static lookup tables.

- 🌐 **Multi-Asset Class Support**:
  - **U.S. Stocks**: Live market quotes and metadata via Yahoo Finance API (`USD`).
  - **Thai Stocks**: Stock Exchange of Thailand (`.BK`) quotes and profiles via Yahoo Finance (`THB`).
  - **Cryptocurrencies**: Live orderbook prices via Binance TH API (`THB`/`USD`).
  - **Thai Mutual Funds**: Daily NAV lookups and fund profile matching via SEC Thailand APIs (`THB`).
  - **Closed Positions**: Historical realized gain/loss ledger with asset-type metadata and fund name lookups.
  - **Unified "All" View**: Combined cross-asset portfolio overview.

- 💱 **Live Currency Conversion**:
  - Real-time USD/THB exchange rate lookup.
  - Seamless one-click switching between USD ($) and THB (฿) with dynamic portfolio revaluation.

- 🔗 **Google Sheets Integration**:
  - Zero-backend transactional database.
  - Fetches and parses published CSV sheets on-the-fly with dynamic column header detection and parallel tab loading.

- 🔍 **Interactive Holdings Dashboard**:
  - Instant search across symbols and company/fund names.
  - Sort by Symbol, Total Cost, Average Cost, Holding Value, Realized P/L, and P/L percentage.
  - Expandable symbol cards displaying individual lot breakdown tiers.

- 🎨 **Modern Dark UI**:
  - Built with Angular Standalone Components, Signals, and modern control-flow syntax (`@if`, `@for`).
  - Custom design system with glassmorphism and gradient accents.
  - Responsive layout optimized for desktop, tablet, and mobile viewports.

---

## Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Framework** | [Angular 21](https://angular.dev/) (Standalone Components, Signals, RxJS) |
| **Styling** | Custom Design System with Modern CSS & Tailwind CSS |
| **Market Data APIs** | Yahoo Finance, Binance TH API, SEC Thailand API |
| **Data Source** | Google Sheets CSV Export |
| **Unit Testing** | [Vitest](https://vitest.dev/) & jsdom |
| **Deployment** | [Vercel](https://vercel.com/) (with API proxy rewrites) |

---

## Project Structure

```
ShareLot/
├── public/                     # Static assets & favicons
│   ├── favicon.ico             # Multi-resolution ICO (16x16, 32x32, 48x48, 64x64)
│   ├── favicon.svg             # Vector SVG favicon
│   ├── apple-touch-icon.png    # High-res 180x180 touch icon
│   ├── icon-192.png            # PWA manifest 192x192 icon
│   └── icon-512.png            # PWA manifest 512x512 icon
├── src/
│   ├── app/
│   │   ├── components/         # Reusable UI feature components
│   │   │   ├── date-range-picker/    # Interactive date range selector component
│   │   │   └── transaction-history/  # Dedicated transaction ledger component with pagination & mobile cards
│   │   ├── config/             # Google Sheets GIDs and asset tab definitions
│   │   │   └── sheet.config.ts
│   │   ├── models/             # Domain models (Transaction, ShareLot, SymbolSummary)
│   │   │   └── transaction.model.ts
│   │   ├── services/           # Data fetching & calculation services
│   │   │   ├── share-lot.service.ts  # FIFO queue calculation & CSV parsing
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
> The dev server uses `proxy.conf.json` to proxy requests to Yahoo Finance, Binance TH, and SEC Thailand APIs to prevent CORS issues in development.

### Running Unit Tests

Execute unit tests using the Vitest test runner:

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

### Google Sheets Setup

To connect your own Google Sheet:

1. Open [src/app/config/sheet.config.ts](src/app/config/sheet.config.ts).
2. Update `spreadsheetId` with your Google Spreadsheet ID.
3. Update the `gids` mapping with the sheet tab GIDs for each asset category (`us-stock`, `thai-stock`, `crypto`, `mutual-fund`, `closed-position`).
4. Ensure your Google Sheet is shared as **"Anyone with the link can view"** so the CSV export endpoint is accessible.

### Sheet Column Format

Each sheet tab should contain transaction records with standard columns (order-independent):
- **Symbol** (e.g. `AAPL`, `PTT.BK`, `BTC.CRYPTO`, `tsp3-balancer.BKFUND`)
- **Date** (e.g. `YYYY-MM-DD`)
- **Quantity / Qty** (Positive for Buy, Negative for Sell)
- **Price** (Price per share / NAV)
- **Currency** (`USD` or `THB`)

---

## License

This project is private and proprietary.
