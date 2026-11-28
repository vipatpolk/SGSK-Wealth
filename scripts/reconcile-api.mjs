#!/usr/bin/env node
/**
 * Parity reconciliation tool comparing legacy (/api/backend/*) vs target (/api/v1/*)
 * and offline golden financial fixtures across Rust (rust_decimal) and TypeScript (@sgsk-wealth/domain).
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const offlineMode = process.argv.includes('--offline');

function runStep(label, command, args) {
  console.log(`[reconcile] Running ${label}...`);
  const res = spawnSync(command, args, {
    cwd: rootDir,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
  if (res.status !== 0) {
    console.error(`[reconcile] FAILED: ${label} (exit ${res.status})`);
    process.exit(res.status ?? 1);
  }
}

if (offlineMode) {
  const fixturePath = path.join(rootDir, 'fixtures', 'accounting', 'fifo_scenarios.json');
  if (!fs.existsSync(fixturePath)) {
    console.error(`[reconcile] Missing golden fixture file: ${fixturePath}`);
    process.exit(1);
  }
  runStep('Rust rust_decimal golden parity', 'cargo', [
    'test',
    '-p',
    'sgsk-financial-engine',
    '--test',
    'golden_parity',
  ]);
  runStep('TypeScript @sgsk-wealth/domain parity', 'npm', ['run', 'test:domain']);
  console.log('[reconcile] Offline golden parity reconciliation PASSED.');
  process.exit(0);
}

const legacyBase = (process.env.LEGACY_API_URL || 'http://127.0.0.1:8000/api/backend').replace(/\/$/, '');
const v1Base = (process.env.V1_API_URL || 'http://127.0.0.1:8000/api/v1').replace(/\/$/, '');
const apiKey = process.env.BACKEND_API_KEY || 'dev_secret_key_change_in_prod';
const bearer = process.env.AUTH_BEARER_TOKEN || '';

async function fetchJson(url, options = {}) {
  const headers = {
    'X-API-Key': apiKey,
    'Content-Type': 'application/json',
    ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}),
    ...(options.headers || {}),
  };
  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    throw new Error(`${url} returned HTTP ${res.status}`);
  }
  return await res.json();
}

function assertClose(label, a, b, tol = 1e-4) {
  const na = Number(a);
  const nb = Number(b);
  if (!Number.isFinite(na) || !Number.isFinite(nb) || Math.abs(na - nb) > tol) {
    throw new Error(`${label} mismatch: legacy=${a}, v1=${b}, tol=${tol}`);
  }
}

(async () => {
  const [legacyAuth, v1Auth] = await Promise.all([
    fetchJson(`${legacyBase}/auth/me`),
    fetchJson(`${v1Base}/auth/me`),
  ]);
  if (legacyAuth.portfolioSource !== v1Auth.portfolioSource) {
    throw new Error(`auth/me portfolioSource mismatch: ${legacyAuth.portfolioSource} vs ${v1Auth.portfolioSource}`);
  }

  const [legacyFx, v1Fx] = await Promise.all([
    fetchJson(`${legacyBase}/price/exchange-rate?from_currency=USD&to_currency=THB`),
    fetchJson(`${v1Base}/price/exchange-rate?from_currency=USD&to_currency=THB`),
  ]);
  assertClose('USD/THB rate', legacyFx.rate, v1Fx.rate);

  const simPayload = JSON.stringify({
    initialPosition: { shares: '10', avgCost: '100', marketPrice: '120', currency: 'USD' },
    steps: [{ action: 'BUY', shares: '10', price: '80', feePercent: '0' }],
    taxFeePercent: '0',
  });
  const [legacySim, v1Sim] = await Promise.all([
    fetchJson(`${legacyBase}/portfolio/tools/simulate`, { method: 'POST', body: simPayload }),
    fetchJson(`${v1Base}/portfolio/tools/simulate`, { method: 'POST', body: simPayload }),
  ]);
  assertClose('simulate.totalShares', legacySim.simulated.totalShares, v1Sim.simulated.totalShares);
  assertClose('simulate.averageCost', legacySim.simulated.averageCost, v1Sim.simulated.averageCost);

  console.log('[reconcile] Live API reconciliation PASSED.');
})().catch((err) => {
  console.error(`[reconcile] FAILED: ${err.message}`);
  process.exit(1);
});
