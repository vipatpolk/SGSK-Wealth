#!/usr/bin/env node
/**
 * Architecture boundary enforcement check (ADR-D3 / M2).
 *
 * Enforces:
 * 1. packages/domain/src and packages/contracts/src (non-test files) MUST NOT import:
 *    - @angular/*, @ionic/*, @capacitor/*, @supabase/*, rxjs, shared/, apps/, backend/
 * 2. packages/domain/src and packages/contracts/src (non-test files) MUST NOT reference
 *    browser/DOM globals (window., document., localStorage., sessionStorage.).
 * 3. packages/contracts/src (non-test files) MUST NOT import @sgsk-wealth/domain or packages/domain.
 * 4. apps/, packages/, and shared/ MUST NOT import from backend/.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const FORBIDDEN_PACKAGE_IMPORTS = [
  '@angular/',
  '@ionic/',
  '@capacitor/',
  '@supabase/',
  'rxjs',
  '@shared/',
  'shared/',
  '../shared',
  '../../shared',
  'apps/',
  'backend/',
];

const FORBIDDEN_DOM_GLOBALS_REGEX = /\b(window|document|localStorage|sessionStorage)\./g;
const FORBIDDEN_DOM_TYPEOF_REGEX = /\btypeof\s+(window|document|localStorage|sessionStorage)\b/g;

function walkSourceFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (['node_modules', 'dist', '.angular', 'out-tsc', 'android', 'ios'].includes(entry.name)) {
        continue;
      }
      results.push(...walkSourceFiles(full));
    } else if (entry.isFile() && /\.(ts|tsx|mts|cts|js|mjs|cjs)$/.test(entry.name)) {
      results.push(full);
    }
  }
  return results;
}

function isTestFile(filePath) {
  const normalized = filePath.replace(/\\/g, '/');
  return (
    normalized.includes('/__tests__/') ||
    /\.(spec|test)\.(ts|tsx|mts|cts|js|mjs|cjs)$/.test(normalized)
  );
}

function stripComments(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')
    .replace(/([^:]|^)\/\/.*$/gm, '$1');
}

function extractModuleSpecifiers(code) {
  const specifiers = [];
  const importExportRegex =
    /(?:^|[\s;])(?:import|export)\s+(?:type\s+)?(?:[\s\S]*?\s+from\s+)?['"]([^'"]+)['"]/gm;
  const dynamicImportRegex = /(?:import|require)\(\s*['"]([^'"]+)['"]\s*\)/g;

  let m;
  while ((m = importExportRegex.exec(code)) !== null) {
    specifiers.push(m[1]);
  }
  while ((m = dynamicImportRegex.exec(code)) !== null) {
    specifiers.push(m[1]);
  }
  return specifiers;
}

function checkPurePackage(pkgName, extraForbidden = []) {
  const srcDir = path.join(rootDir, 'packages', pkgName, 'src');
  const violations = [];
  const files = walkSourceFiles(srcDir).filter((f) => !isTestFile(f));

  for (const file of files) {
    const rel = path.relative(rootDir, file).replace(/\\/g, '/');
    const raw = fs.readFileSync(file, 'utf8');
    const code = stripComments(raw);
    const specifiers = extractModuleSpecifiers(code);

    for (const spec of specifiers) {
      for (const prefix of [...FORBIDDEN_PACKAGE_IMPORTS, ...extraForbidden]) {
        if (spec === prefix || spec.startsWith(prefix) || spec.includes(`/${prefix}`)) {
          violations.push(`[${pkgName}] Forbidden import '${spec}' in ${rel}`);
        }
      }
    }

    for (const regex of [FORBIDDEN_DOM_GLOBALS_REGEX, FORBIDDEN_DOM_TYPEOF_REGEX]) {
      regex.lastIndex = 0;
      const match = regex.exec(code);
      if (match) {
        violations.push(`[${pkgName}] Forbidden browser/DOM global '${match[0]}' in ${rel}`);
      }
    }
  }

  return { fileCount: files.length, violations };
}

function checkNoBackendImports() {
  const roots = ['apps', 'packages', 'shared'];
  const violations = [];
  let fileCount = 0;

  for (const r of roots) {
    const dir = path.join(rootDir, r);
    for (const file of walkSourceFiles(dir)) {
      fileCount++;
      const rel = path.relative(rootDir, file).replace(/\\/g, '/');
      const code = stripComments(fs.readFileSync(file, 'utf8'));
      for (const spec of extractModuleSpecifiers(code)) {
        if (
          spec === 'backend' ||
          spec.startsWith('backend/') ||
          spec.includes('/backend/') ||
          spec.startsWith('@backend/')
        ) {
          violations.push(`[backend-boundary] Forbidden backend import '${spec}' in ${rel}`);
        }
      }
    }
  }

  return { fileCount, violations };
}

const contractsCheck = checkPurePackage('contracts', ['@sgsk-wealth/domain', 'packages/domain', '../domain']);
const domainCheck = checkPurePackage('domain');
const backendCheck = checkNoBackendImports();

const allViolations = [
  ...contractsCheck.violations,
  ...domainCheck.violations,
  ...backendCheck.violations,
];

if (allViolations.length > 0) {
  console.error(`Boundary check FAILED with ${allViolations.length} violation(s):`);
  for (const v of allViolations) {
    console.error(`  - ${v}`);
  }
  process.exit(1);
}

console.log(
  `Boundary check PASSED: contracts=${contractsCheck.fileCount} files, domain=${domainCheck.fileCount} files, workspace-backend-check=${backendCheck.fileCount} files.`
);
