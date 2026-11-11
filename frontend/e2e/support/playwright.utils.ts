import { Actor } from '@serenity-js/core';
import { BrowseTheWebWithPlaywright } from '@serenity-js/playwright';
import { Page } from '@playwright/test';

export async function getPlaywrightPage(actor: Actor): Promise<Page> {
  const serenityPage = await BrowseTheWebWithPlaywright.as(actor).currentPage();
  return (await (serenityPage as any).nativePage()) as Page;
}
