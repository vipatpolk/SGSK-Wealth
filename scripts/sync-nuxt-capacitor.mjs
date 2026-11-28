#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const nuxtPublicDir = path.join(rootDir, 'apps', 'web', '.output', 'public');
const androidAssetsDir = path.join(rootDir, 'apps', 'mobile', 'android', 'app', 'src', 'main', 'assets');
const androidPublicDir = path.join(androidAssetsDir, 'public');
const iosAppDir = path.join(rootDir, 'apps', 'mobile', 'ios', 'App', 'App');
const iosPublicDir = path.join(iosAppDir, 'public');

if (!fs.existsSync(path.join(nuxtPublicDir, 'index.html'))) {
  console.error(`[sync-nuxt-capacitor] Missing generated Nuxt SPA in ${nuxtPublicDir}. Run "npm run generate:web" first.`);
  process.exit(1);
}

for (const target of [androidPublicDir, iosPublicDir]) {
  if (!fs.existsSync(path.dirname(target))) continue;
  fs.rmSync(target, { recursive: true, force: true });
  fs.cpSync(nuxtPublicDir, target, { recursive: true });
  console.log(`[sync-nuxt-capacitor] Synced Nuxt SPA -> ${path.relative(rootDir, target)}`);
}

const baseCapacitorConfig = {
  appId: 'com.sgsk.wealth.mobile',
  appName: 'SGSK Wealth',
  webDir: '../web/.output/public',
  server: {
    androidScheme: 'http',
    iosScheme: 'capacitor',
    cleartext: true,
    allowNavigation: ['10.0.2.2', '127.0.0.1', 'localhost', 'sgsk-wealth.vercel.app', '*.supabase.co'],
  },
  plugins: {
    CapacitorHttp: {
      enabled: false,
    },
    SplashScreen: {
      launchShowDuration: 1200,
      launchAutoHide: true,
      backgroundColor: '#0B1220',
      showSpinner: false,
    },
    StatusBar: {
      overlaysWebView: false,
      style: 'DARK',
      backgroundColor: '#0B1220',
    },
  },
};

for (const configPath of [
  path.join(androidAssetsDir, 'capacitor.config.json'),
  path.join(iosAppDir, 'capacitor.config.json'),
]) {
  if (!fs.existsSync(path.dirname(configPath))) continue;
  let nextConfig = { ...baseCapacitorConfig };
  if (fs.existsSync(configPath)) {
    try {
      const prev = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      if (Array.isArray(prev.packageClassList)) {
        nextConfig = { ...nextConfig, packageClassList: prev.packageClassList };
      }
    } catch {
      // Overwrite malformed config cleanly
    }
  }
  fs.writeFileSync(configPath, `${JSON.stringify(nextConfig, null, '\t')}\n`, 'utf8');
  console.log(`[sync-nuxt-capacitor] Synced capacitor.config.json -> ${path.relative(rootDir, configPath)}`);
}
