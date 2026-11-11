import { Actor, Cast, TakeNotes } from '@serenity-js/core';
import { BrowseTheWebWithPlaywright } from '@serenity-js/playwright';
import * as playwright from 'playwright';

export class WebActors implements Cast {
  constructor(
    private readonly browser: playwright.Browser,
    private readonly contextOptions: playwright.BrowserContextOptions = {}
  ) {}

  prepare(actor: Actor): Actor {
    return actor.whoCan(
      BrowseTheWebWithPlaywright.using(this.browser as any, this.contextOptions),
      TakeNotes.usingAnEmptyNotepad()
    );
  }
}
