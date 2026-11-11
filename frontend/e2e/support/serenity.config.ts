import { AfterAll, BeforeAll, setDefaultTimeout } from '@cucumber/cucumber';
import { configure, Duration } from '@serenity-js/core';
import { spawn } from 'child_process';
import http from 'http';
import path from 'path';
import * as playwright from 'playwright';
import { WebActors } from './actors';

let browser: playwright.Browser;
let devServerProcess: any = null;

setDefaultTimeout(45000);

async function isServerReady(url = 'http://localhost:4200'): Promise<boolean> {
  return new Promise((resolve) => {
    const req = http.get(url, (res) => {
      resolve(res.statusCode === 200 || res.statusCode === 304);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(1000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function ensureWebServer(): Promise<void> {
  const ready = await isServerReady();
  if (ready) return;

  devServerProcess = spawn('npx', ['ng', 'serve', '--port', '4200'], {
    cwd: path.resolve(__dirname, '../..'),
    shell: true,
    stdio: 'ignore',
  });

  for (let i = 0; i < 90; i++) {
    await new Promise((r) => setTimeout(r, 1000));
    if (await isServerReady()) return;
  }
}

function stopWebServer(): void {
  if (devServerProcess && devServerProcess.pid) {
    try {
      if (process.platform === 'win32') {
        spawn('taskkill', ['/pid', devServerProcess.pid.toString(), '/T', '/F']);
      } else {
        devServerProcess.kill();
      }
    } catch {}
    devServerProcess = null;
  }
}

BeforeAll(async () => {
  await ensureWebServer();

  const browserType = (process.env.BROWSER as 'chromium' | 'firefox' | 'webkit') || 'chromium';
  const headless = process.env.HEADLESS !== 'false';

  browser = await playwright[browserType].launch({
    headless,
  });

  configure({
    actors: new WebActors(browser, {
      baseURL: process.env.E2E_BASE_URL || 'http://localhost:4200',
    }),
    crew: [
      ['@serenity-js/console-reporter', { theme: 'auto' }],
      ['@serenity-js/web:Photographer', { strategy: 'TakePhotosOfFailures' }],
      [
        '@serenity-js/html-reporter',
        {
          outputDirectory: path.resolve(__dirname, '../../reports/serenity-js'),
          specDirectory: path.resolve(__dirname, '../features'),
        },
      ],
    ],
    cueTimeout: Duration.ofSeconds(5),
  });
});

AfterAll(async () => {
  if (browser) {
    await browser.close();
  }
  stopWebServer();
});
