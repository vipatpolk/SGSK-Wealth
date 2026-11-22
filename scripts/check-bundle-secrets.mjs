#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const BUNDLE_DIRS = [
  path.join(rootDir, 'apps', 'web', 'dist'),
  path.join(rootDir, 'apps', 'mobile', 'dist'),
];

const FORBIDDEN_LITERALS = ['dev_secret_key_change_in_prod'];
const envBackendKey = (process.env.BACKEND_API_KEY || '').trim();
if (envBackendKey.length >= 8) {
  FORBIDDEN_LITERALS.push(envBackendKey);
}

function walkJsFiles(dir) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkJsFiles(full));
    } else if (entry.isFile() && /\.(m?js)$/.test(entry.name)) {
      results.push(full);
    }
  }
  return results;
}

let scannedFiles = 0;
const findings = [];

for (const distDir of BUNDLE_DIRS) {
  if (!fs.existsSync(distDir)) {
    console.warn(`[check-bundle-secrets] Skipping missing dist directory: ${path.relative(rootDir, distDir)}`);
    continue;
  }
  for (const file of walkJsFiles(distDir)) {
    scannedFiles++;
    const content = fs.readFileSync(file, 'utf8');
    for (const secret of FORBIDDEN_LITERALS) {
      if (content.includes(secret)) {
        findings.push({
          file: path.relative(rootDir, file),
          secretHint: secret === envBackendKey ? 'BACKEND_API_KEY' : secret,
        });
      }
    }
  }
}

if (scannedFiles === 0) {
  console.error('[check-bundle-secrets] ERROR: No production JS bundles found in apps/web/dist or apps/mobile/dist.');
  process.exit(1);
}

if (findings.length > 0) {
  console.error('[check-bundle-secrets] CRITICAL: Secret literal leaked into frontend production bundle:');
  for (const f of findings) {
    console.error(`  - ${f.file}: matched ${f.secretHint}`);
  }
  process.exit(1);
}

console.log(`[check-bundle-secrets] OK: Scanned ${scannedFiles} bundle JS files with zero backend API key leaks.`);
