import { AfterAll, Before } from '@cucumber/cucumber';
import { actorCalled } from '@serenity-js/core';
import { mockPortfolioAPIs } from '../utils/api-mock.utils';
import { setupPactum, teardownPactum } from './pactum.config';
import { getPlaywrightPage } from './playwright.utils';

Before({ tags: '@api' }, async () => {
  await setupPactum();
});

Before({ tags: '@ui' }, async () => {
  const actor = actorCalled('Investor');
  const page = await getPlaywrightPage(actor);
  await mockPortfolioAPIs(page);
});

AfterAll(async () => {
  await teardownPactum();
});
