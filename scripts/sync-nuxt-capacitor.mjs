#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const nuxtPublicDir = path.join(rootDir, 'apps', 'web', '.output', 'public');
const androidMainDir = path.join(rootDir, 'apps', 'mobile', 'android', 'app', 'src', 'main');
const androidAssetsDir = path.join(androidMainDir, 'assets');
const androidPublicDir = path.join(androidAssetsDir, 'public');
const iosAppDir = path.join(rootDir, 'apps', 'mobile', 'ios', 'App', 'App');
const iosPublicDir = path.join(iosAppDir, 'public');

if (!fs.existsSync(path.join(nuxtPublicDir, 'index.html'))) {
  console.error(`[sync-nuxt-capacitor] Missing generated Nuxt SPA in ${nuxtPublicDir}. Run "npm run generate:web" first.`);
  process.exit(1);
}

const syncTargets = [];
if (fs.existsSync(androidMainDir)) {
  fs.mkdirSync(androidAssetsDir, { recursive: true });
  syncTargets.push({ platform: 'android', root: androidAssetsDir, publicDir: androidPublicDir });
}
if (fs.existsSync(iosAppDir)) {
  syncTargets.push({ platform: 'ios', root: iosAppDir, publicDir: iosPublicDir });
}

for (const { publicDir } of syncTargets) {
  fs.rmSync(publicDir, { recursive: true, force: true });
  fs.cpSync(nuxtPublicDir, publicDir, { recursive: true });
  console.log(`[sync-nuxt-capacitor] Synced Nuxt SPA -> ${path.relative(rootDir, publicDir)}`);
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

const androidPluginsConfig = [
  { pkg: '@capacitor/app', classpath: 'com.capacitorjs.plugins.app.AppPlugin' },
  { pkg: '@capacitor/browser', classpath: 'com.capacitorjs.plugins.browser.BrowserPlugin' },
  { pkg: '@capacitor/haptics', classpath: 'com.capacitorjs.plugins.haptics.HapticsPlugin' },
  { pkg: '@capacitor/preferences', classpath: 'com.capacitorjs.plugins.preferences.PreferencesPlugin' },
  { pkg: '@capacitor/splash-screen', classpath: 'com.capacitorjs.plugins.splashscreen.SplashScreenPlugin' },
  { pkg: '@capacitor/status-bar', classpath: 'com.capacitorjs.plugins.statusbar.StatusBarPlugin' },
];

for (const { platform, root } of syncTargets) {
  const configPath = path.join(root, 'capacitor.config.json');
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

  if (platform === 'android') {
    const pluginsPath = path.join(root, 'capacitor.plugins.json');
    fs.writeFileSync(pluginsPath, `${JSON.stringify(androidPluginsConfig, null, '\t')}\n`, 'utf8');
    console.log(`[sync-nuxt-capacitor] Synced capacitor.plugins.json -> ${path.relative(rootDir, pluginsPath)}`);
  }
}

if (fs.existsSync(androidMainDir)) {
  const requiredAndroidFiles = [
    path.join(androidPublicDir, 'index.html'),
    path.join(androidAssetsDir, 'capacitor.config.json'),
    path.join(androidAssetsDir, 'capacitor.plugins.json'),
  ];
  for (const requiredFile of requiredAndroidFiles) {
    if (!fs.existsSync(requiredFile)) {
      console.error(`[sync-nuxt-capacitor] Missing required Android asset after sync: ${requiredFile}`);
      process.exit(1);
    }
  }
}
