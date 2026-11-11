import { Page } from '@playwright/test';
import * as sheetsAllFixture from '../fixtures/sheets-all.json';
import * as priceFetchFixture from '../fixtures/price-fetch.json';
import * as exchangeRateFixture from '../fixtures/exchange-rate.json';

export async function mockPortfolioAPIs(page: Page) {
  // Mock /api/backend/share-lot/sheets
  await page.route('**/api/backend/share-lot/sheets**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(sheetsAllFixture),
    });
  });

  // Mock /api/backend/share-lot/sheet/*
  await page.route('**/api/backend/share-lot/sheet/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(sheetsAllFixture),
    });
  });

  // Mock /api/backend/price/fetch-prices
  await page.route('**/api/backend/price/fetch-prices**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(priceFetchFixture),
    });
  });

  // Mock /api/backend/price/exchange-rate
  await page.route('**/api/backend/price/exchange-rate**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(exchangeRateFixture),
    });
  });

  // Mock /api/backend/portfolio/holdings
  await page.route('**/api/backend/portfolio/holdings**', async (route) => {
    const url = new URL(route.request().url());
    const curr = url.searchParams.get('currency') || 'THB';
    const rate = exchangeRateFixture.rate || 35.0;

    const openPositions = (sheetsAllFixture.summaries || []).map((s: any) => {
      const pd = (priceFetchFixture.prices as Record<string, any>)[s.symbol];
      const hasPrice = !!pd && pd.price > 0;
      const rawPrice = hasPrice ? pd.price : s.averageCost;
      const priceCurr = pd?.currency || s.currency;
      let priceConverted = rawPrice;
      if (priceCurr === 'USD' && curr === 'THB') priceConverted = rawPrice * rate;
      if (priceCurr === 'THB' && curr === 'USD') priceConverted = rawPrice / rate;

      let costConverted = s.totalCost;
      if (s.currency === 'USD' && curr === 'THB') costConverted = s.totalCost * rate;
      if (s.currency === 'THB' && curr === 'USD') costConverted = s.totalCost / rate;

      const valConverted = s.totalShares * priceConverted;
      const unPL = valConverted - costConverted;
      const unPLPct = costConverted > 0 ? (unPL / costConverted) * 100 : 0;

      return {
        symbol: s.symbol,
        displaySymbol: s.displaySymbol || s.symbol.replace(/\.(FUND|BKFUND|BK|CRYPTO)$/i, ''),
        name: s.name || pd?.name || '',
        assetType: s.assetType,
        assetTypeLabel: s.assetType,
        totalShares: s.totalShares,
        totalCost: costConverted,
        averageCost: costConverted / s.totalShares,
        currentPrice: priceConverted,
        holdingValue: valConverted,
        unrealizedPL: unPL,
        unrealizedPLPercent: unPLPct,
        currency: curr,
        originalCurrency: s.currency,
        hasPrice,
        lots: (s.lots || []).map((l: any) => {
          let lotCost = l.totalCost;
          if (s.currency === 'USD' && curr === 'THB') lotCost = l.totalCost * rate;
          if (s.currency === 'THB' && curr === 'USD') lotCost = l.totalCost / rate;
          const lotVal = l.quantity * priceConverted;
          return {
            purchaseDate: l.purchaseDate,
            quantity: l.quantity,
            costBasis: lotCost / l.quantity,
            totalCost: lotCost,
            currentPrice: priceConverted,
            holdingValue: lotVal,
            unrealizedPL: lotVal - lotCost,
            unrealizedPLPercent: lotCost > 0 ? ((lotVal - lotCost) / lotCost) * 100 : 0,
            assetType: l.assetType,
            currency: curr,
            originalCostBasis: l.costBasis,
            originalCurrency: s.currency,
          };
        }),
      };
    });

    const closedPositions = (sheetsAllFixture.closedSummaries || []).map((c: any) => {
      let costConverted = c.totalCost;
      let procConverted = c.totalProceeds;
      let plConverted = c.realizedPL;
      if (c.currency === 'USD' && curr === 'THB') {
        costConverted *= rate;
        procConverted *= rate;
        plConverted *= rate;
      }
      if (c.currency === 'THB' && curr === 'USD') {
        costConverted /= rate;
        procConverted /= rate;
        plConverted /= rate;
      }

      return {
        symbol: c.symbol,
        displaySymbol: c.displaySymbol || c.symbol.replace(/\.(FUND|BKFUND|BK|CRYPTO)$/i, ''),
        name: c.name || '',
        assetType: c.assetType,
        assetTypeLabel: c.assetType,
        totalShares: 0,
        closedShares: c.closedShares,
        totalCost: costConverted,
        totalProceeds: procConverted,
        realizedPL: plConverted,
        realizedPLPercent: c.realizedPLPercent,
        averageBuyPrice: costConverted / c.closedShares,
        averageSellPrice: procConverted / c.closedShares,
        currency: curr,
        originalCurrency: c.currency,
        lots: c.lots || [],
      };
    });

    const openInvested = openPositions.reduce((acc: number, p: any) => acc + p.totalCost, 0);
    const totalVal = openPositions.reduce((acc: number, p: any) => acc + p.holdingValue, 0);
    const closedInvested = closedPositions.reduce((acc: number, p: any) => acc + p.totalCost, 0);
    const closedRealized = closedPositions.reduce((acc: number, p: any) => acc + p.realizedPL, 0);
    const unPL = totalVal - openInvested;

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        currency: curr,
        exchangeRate: rate,
        tabId: url.searchParams.get('tab_id') || 'all',
        summary: {
          totalInvested: openInvested + closedInvested,
          totalValue: totalVal,
          openInvested,
          closedInvested,
          totalUnrealizedPL: unPL,
          totalUnrealizedPLPercent: openInvested > 0 ? (unPL / openInvested) * 100 : 0,
          totalRealizedPL: closedRealized,
          totalRealizedPLPercent: closedInvested > 0 ? (closedRealized / closedInvested) * 100 : 0,
          totalReturn: unPL + closedRealized,
          totalReturnPercent: (openInvested + closedInvested) > 0 ? ((unPL + closedRealized) / (openInvested + closedInvested)) * 100 : 0,
        },
        openPositions,
        closedPositions,
        transactionSummaries: sheetsAllFixture.transactionSummaries,
        rawTransactions: (sheetsAllFixture as any).rawTransactions || [],
        error: null,
      }),
    });
  });

  // Mock /api/backend/portfolio/performance
  await page.route('**/api/backend/portfolio/performance**', async (route) => {
    const url = new URL(route.request().url());
    const curr = url.searchParams.get('currency') || 'THB';
    const tf = url.searchParams.get('timeframe') || 'ALL';

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        timeframe: tf,
        startDate: '',
        endDate: '',
        currency: curr,
        exchangeRate: 35.0,
        summary: {
          totalInvested: 100000,
          totalValue: 120000,
          openInvested: 80000,
          closedInvested: 20000,
          totalUnrealizedPL: 40000,
          totalUnrealizedPLPercent: 50.0,
          totalRealizedPL: 5000,
          totalRealizedPLPercent: 25.0,
          totalReturn: 45000,
          totalReturnPercent: 45.0,
        },
        assetTypePerformance: [],
        topGainers: [],
        topLosers: [],
        symbolPerformance: [],
        error: null,
      }),
    });
  });

  // Mock /api/backend/portfolio/allocation
  await page.route('**/api/backend/portfolio/allocation**', async (route) => {
    const url = new URL(route.request().url());
    const curr = url.searchParams.get('currency') || 'THB';

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        currency: curr,
        exchangeRate: 35.0,
        totalPortfolioValue: 100000,
        recommendations: [
          {
            assetType: 'us-stock',
            label: 'U.S. Stock',
            currentValue: 40000,
            actualPercent: 40,
            targetPercent: 40,
            rebalanceAmount: 0,
            deviationPercent: 0,
            action: 'BALANCED',
          },
        ],
        currencyExposure: {
          usd: 50000,
          thb: 50000,
          usdPercent: 50,
          thbPercent: 50,
        },
        holdingsConcentration: [],
        error: null,
      }),
    });
  });

  // Mock /api/backend/portfolio/dividend
  await page.route('**/api/backend/portfolio/dividend**', async (route) => {
    const url = new URL(route.request().url());
    const curr = (url.searchParams.get('currency') || 'THB') as 'USD' | 'THB';
    const rate = 35.0;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        currency: curr,
        exchangeRate: rate,
        totalGrossDividends: 10000,
        totalNetDividends: 9000,
        totalWithholdingTax: 1000,
        effectiveTaxRate: 10.0,
        projectedAnnualDividends: 2950,
        portfolioDividendYield: 5.5,
        portfolioYieldOnCost: 7.5,
        annualDividends: [
          {
            year: 2026,
            grossAmount: 6000,
            netAmount: 5400,
            withholdingTax: 600,
            byAssetType: { 'thai-stock': 3000, 'us-stock': 2400 },
            recordCount: 2,
            monthlyBreakdown: [],
          },
        ],
        monthlyDividends: [
          {
            yearMonth: '2026-03',
            year: 2026,
            month: 3,
            grossAmount: 6000,
            netAmount: 5400,
            withholdingTax: 600,
            byAssetType: { 'thai-stock': 3000, 'us-stock': 2400 },
            recordCount: 2,
          },
        ],
        assetTypeSummaries: [
          {
            assetType: 'thai-stock',
            assetTypeLabel: 'Thai Stock',
            totalGrossDividends: 7000,
            totalNetDividends: 6300,
            totalWithholdingTax: 700,
            percentageOfTotal: 70,
            symbolCount: 1,
            recordCount: 2,
            totalCostBasis: 35000,
            currentValue: 38000,
            projectedAnnualDividends: 2600,
            yieldOnCostPercent: 7.43,
            currentYieldPercent: 6.84,
          },
          {
            assetType: 'us-stock',
            assetTypeLabel: 'U.S. Stock',
            totalGrossDividends: 3000,
            totalNetDividends: 2700,
            totalWithholdingTax: 300,
            percentageOfTotal: 30,
            symbolCount: 1,
            recordCount: 1,
            totalCostBasis: 65000,
            currentValue: 70000,
            projectedAnnualDividends: 350,
            yieldOnCostPercent: 0.54,
            currentYieldPercent: 0.50,
          },
        ],
        symbolSummaries: [
          {
            symbol: 'PTT.BK',
            displaySymbol: 'PTT',
            name: 'PTT Public Company',
            assetType: 'thai-stock',
            assetTypeLabel: 'Thai Stock',
            currency: 'THB',
            totalGrossDividends: 7000,
            totalNetDividends: 6300,
            totalWithholdingTax: 700,
            convertedNetDividends: 6300,
            convertedGrossDividends: 7000,
            convertedWithholdingTax: 700,
            dividendCount: 2,
            firstDividendDate: '2025-09-15',
            lastDividendDate: '2026-03-20',
            currentShares: 1000,
            currentCostBasis: 35000,
            currentValue: 38000,
            trailingAnnualDPS: 2.6,
            currentYieldPercent: 6.84,
            yieldOnCostPercent: 7.43,
            projectedAnnualIncome: 2600,
            recentDistributions: [],
          },
          {
            symbol: 'AAPL',
            displaySymbol: 'AAPL',
            name: 'Apple Inc.',
            assetType: 'us-stock',
            assetTypeLabel: 'U.S. Stock',
            currency: 'USD',
            totalGrossDividends: 3000,
            totalNetDividends: 2700,
            totalWithholdingTax: 300,
            convertedNetDividends: 2700,
            convertedGrossDividends: 3000,
            convertedWithholdingTax: 300,
            dividendCount: 1,
            firstDividendDate: '2026-02-15',
            lastDividendDate: '2026-02-15',
            currentShares: 10,
            currentCostBasis: 65000,
            currentValue: 70000,
            trailingAnnualDPS: 1.0,
            currentYieldPercent: 0.50,
            yieldOnCostPercent: 0.54,
            projectedAnnualIncome: 350,
            recentDistributions: [],
          },
        ],
        records: [
          {
            id: 'div-1',
            symbol: 'PTT.BK',
            displaySymbol: 'PTT',
            date: '2026-03-20',
            assetType: 'thai-stock',
            assetTypeLabel: 'Thai Stock',
            shares: 1000,
            dividendPerShare: 1.2,
            grossAmount: 1200,
            withholdingTax: 120,
            withholdingTaxRate: 10,
            netAmount: 1080,
            currency: 'THB',
            convertedNetAmount: 1080,
            convertedGrossAmount: 1200,
            convertedWithholdingTax: 120,
          },
        ],
        error: null,
      }),
    });
  });

  // Mock /api/backend/portfolio/tools/**
  await page.route('**/api/backend/portfolio/tools/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {},
      }),
    });
  });
}

export async function mockPortfolioAPIError(page: Page, statusCode = 500) {
  await page.route('**/api/backend/**', async (route) => {
    await route.fulfill({
      status: statusCode,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'Internal Server Error' }),
    });
  });
}
