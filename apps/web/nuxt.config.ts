import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';

function loadRootEnvPublicVars(): Record<string, string> {
  const rootEnvPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../.env');
  if (!fs.existsSync(rootEnvPath)) return {};
  const vars: Record<string, string> = {};
  for (const rawLine of fs.readFileSync(rootEnvPath, 'utf8').split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq <= 0) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    vars[key] = val;
  }
  return vars;
}

const rootEnv = loadRootEnvPublicVars();
const pickPublicEnv = (...keys: string[]): string => {
  for (const key of keys) {
    const val = (process.env[key] || rootEnv[key] || '').trim();
    if (val) return val;
  }
  return '';
};

const backendApiKey =
  process.env.NODE_ENV !== 'production' ? pickPublicEnv('BACKEND_API_KEY') : '';

export default defineNuxtConfig({
  ssr: false,
  compatibilityDate: '2025-07-15',
  devtools: { enabled: false },
  app: {
    head: {
      title: 'SGSK Wealth — Investment Portfolio & Wealth Analytics',
      meta: [
        {
          name: 'description',
          content:
            'SGSK Wealth: Comprehensive investment portfolio tracking, FIFO share lot accounting, dividend analytics, and wealth compounding tools.',
        },
        {
          name: 'viewport',
          content: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0, viewport-fit=cover',
        },
        { name: 'theme-color', content: '#0B1220', media: '(prefers-color-scheme: dark)' },
        { name: 'theme-color', content: '#F3F6FB', media: '(prefers-color-scheme: light)' },
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'icon', type: 'image/png', href: '/brand-logo.png' },
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Noto+Sans+Thai:wght@300;400;500;600;700&display=swap',
        },
      ],
    },
  },
  css: ['~/assets/css/main.css'],
  vite: {
    plugins: [tailwindcss()],
  },
  ...(process.env.NODE_ENV !== 'production'
    ? {
        nitro: {
          devProxy: {
            '/api/v1': {
              target: 'http://127.0.0.1:8000/api/v1',
              changeOrigin: true,
              headers: backendApiKey ? { 'X-API-Key': backendApiKey } : undefined,
            },
            '/api/backend': {
              target: 'http://127.0.0.1:8000/api/backend',
              changeOrigin: true,
              headers: backendApiKey ? { 'X-API-Key': backendApiKey } : undefined,
            },
          },
        },
      }
    : {}),
  runtimeConfig: {
    public: {
      apiBaseUrl: pickPublicEnv('NUXT_PUBLIC_API_BASE_URL') || '/api/v1',
      supabaseUrl: pickPublicEnv('NUXT_PUBLIC_SUPABASE_URL', 'SUPABASE_URL'),
      supabaseAnonKey: pickPublicEnv(
        'NUXT_PUBLIC_SUPABASE_ANON_KEY',
        'NUXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
        'SUPABASE_PUBLISHABLE_KEY',
        'SUPABASE_ANON_KEY',
      ),
    },
  },
});
