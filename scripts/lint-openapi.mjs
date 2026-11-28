#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const specPath = path.join(rootDir, 'contracts', 'openapi', 'openapi.yaml');

if (!fs.existsSync(specPath)) {
  console.error(`[lint-openapi] Missing OpenAPI spec at ${specPath}`);
  process.exit(1);
}

const content = fs.readFileSync(specPath, 'utf8');

const requiredDirectives = [
  { label: 'openapi 3.1.0 header', pattern: /^openapi:\s*3\.1\.0\b/m },
  { label: 'info.title', pattern: /^\s+title:\s+\S+/m },
  { label: 'info.version', pattern: /^\s+version:\s+\S+/m },
  { label: 'ApiKeyAuth security scheme', pattern: /^\s+ApiKeyAuth:/m },
  { label: 'BearerAuth security scheme', pattern: /^\s+BearerAuth:/m },
];

const expectedPaths = [
  '/health',
  '/auth/me',
  '/share-lot/sheet/{tab_id}',
  '/share-lot/sheets',
  '/portfolio/holdings',
  '/portfolio/performance',
  '/portfolio/allocation',
  '/portfolio/dividend',
  '/portfolio/tools/simulate',
  '/portfolio/tools/solve-target',
  '/portfolio/tools/tvm',
  '/portfolio/tools/rebalance',
  '/price/fetch-prices',
  '/price/exchange-rate',
  '/nav/fetch',
  '/nav/factsheet',
  '/icon/meta/{symbol}',
  '/icon',
  '/icon/{symbol}',
];

const errors = [];

for (const req of requiredDirectives) {
  if (!req.pattern.test(content)) {
    errors.push(`Missing ${req.label}`);
  }
}

for (const p of expectedPaths) {
  const escaped = p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pathRegex = new RegExp(`^\\s{2}${escaped}:`, 'm');
  if (!pathRegex.test(content)) {
    errors.push(`Missing path '${p}'`);
  }
}

if (errors.length > 0) {
  console.error(`[lint-openapi] FAILED (${errors.length} issue(s)):`);
  for (const err of errors) {
    console.error(`  - ${err}`);
  }
  process.exit(1);
}

console.log(
  `[lint-openapi] PASSED: contracts/openapi/openapi.yaml valid (OpenAPI 3.1.0, ${expectedPaths.length} paths verified).`
);
