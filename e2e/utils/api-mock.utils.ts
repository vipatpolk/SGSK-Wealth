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
}

export async function mockPortfolioAPIError(page: Page, statusCode = 500) {
  await page.route('**/api/backend/share-lot/**', async (route) => {
    await route.fulfill({
      status: statusCode,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'Internal Server Error' }),
    });
  });
}
