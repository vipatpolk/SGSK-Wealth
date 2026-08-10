import { test, expect } from '@playwright/test';
import { mockPortfolioAPIError } from '../utils/api-mock.utils';

test.describe('API Failure & Error Resilience', () => {
  test('TC-ERR-01: Displays error state card when backend API fails', async ({ page }) => {
    await mockPortfolioAPIError(page, 500);
    await page.goto('/');

    // Verify error state appears
    await expect(page.locator('#error-state')).toBeVisible();
    await expect(page.locator('#error-state')).toContainText('Unable to load data');
    await expect(page.locator('#retry-btn')).toBeVisible();
  });
});
