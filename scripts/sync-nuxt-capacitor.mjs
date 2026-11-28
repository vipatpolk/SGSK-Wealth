#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const nuxtPublicDir = path.join(rootDir, 'apps', 'web', '.output', 'public');
const androidPublicDir = path.join(
  rootDir,
  'apps',
  'mobile',
  'android',
  'app',
  'src',
  'main',
  'assets',
  'public',
);
const iosPublicDir = path.join(rootDir, 'apps', 'mobile', 'ios', 'App', 'App', 'public');

if (!fs.existsSync(path.join(nuxtPublicDir, 'index.html'))) {
  console.error(`[sync-nuxt-capacitor] Missing generated Nuxt SPA in ${nuxtPublicDir}. Run "npm run generate:web-nuxt" first.`);
  process.exit(1);
}

for (const target of [androidPublicDir, iosPublicDir]) {
  if (!fs.existsSync(path.dirname(target))) continue;
  fs.rmSync(target, { recursive: true, force: true });
  fs.cpSync(nuxtPublicDir, target, { recursive: true });
  console.log(`[sync-nuxt-capacitor] Synced Nuxt SPA -> ${path.relative(rootDir, target)}`);
}
