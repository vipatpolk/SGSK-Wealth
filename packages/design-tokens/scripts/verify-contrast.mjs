#!/usr/bin/env node
/**
 * WCAG 2.2 AA contrast verification for @sgsk-wealth/design-tokens.
 * Parses primitives, semantic, financial, assets, and components CSS tokens
 * and asserts >= 4.5:1 contrast for all normal-text foreground/background pairs
 * in both Dark and Light themes.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const srcDir = path.resolve(__dirname, '..', 'src');

function readCss(name) {
  return fs.readFileSync(path.join(srcDir, name), 'utf8');
}

function parseBlockVars(css, selectorPattern) {
  const vars = {};
  const blockRegex = /([^{}]+)\{([^{}]+)\}/g;
  let match;
  while ((match = blockRegex.exec(css)) !== null) {
    const selector = match[1].trim();
    const body = match[2];
    if (selectorPattern.test(selector)) {
      const varRegex = /(--[a-z0-9-]+)\s*:\s*([^;]+);/gi;
      let vm;
      while ((vm = varRegex.exec(body)) !== null) {
        vars[vm[1]] = vm[2].trim();
      }
    }
  }
  return vars;
}

function resolveValue(token, map, depth = 0) {
  if (depth > 10) throw new Error(`Circular CSS var reference for ${token}`);
  const val = map[token];
  if (!val) throw new Error(`Missing CSS token: ${token}`);
  const varMatch = /^var\(\s*(--[a-z0-9-]+)\s*\)$/i.exec(val);
  if (varMatch) {
    return resolveValue(varMatch[1], map, depth + 1);
  }
  return val;
}

function luminance(hex) {
  const clean = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4]
    .map((i) => parseInt(clean.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(fgHex, bgHex) {
  const l1 = luminance(fgHex);
  const l2 = luminance(bgHex);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

const cssFiles = ['primitives.css', 'semantic.css', 'financial.css', 'assets.css', 'components.css'];
const rawAll = cssFiles.map(readCss).join('\n');

const primitives = parseBlockVars(readCss('primitives.css'), /^:root$/);
const darkTokens = {
  ...primitives,
  ...parseBlockVars(rawAll, /data-theme="dark"/),
};
const lightTokens = {
  ...primitives,
  ...parseBlockVars(rawAll, /data-theme="light"/),
};

const REQUIRED_PAIRS = [
  ['--color-text-primary', '--color-surface', 4.5],
  ['--color-text-primary', '--color-surface-raised', 4.5],
  ['--color-text-secondary', '--color-surface', 4.5],
  ['--color-text-secondary', '--color-surface-raised', 4.5],
  ['--color-text-muted', '--color-surface', 4.5],
  ['--color-text-muted', '--color-surface-raised', 4.5],
  ['--color-primary', '--color-surface', 4.5],
  ['--color-primary', '--color-surface-raised', 4.5],
  ['--color-secondary', '--color-surface', 4.5],
  ['--color-secondary', '--color-surface-raised', 4.5],
  ['--color-pl-positive', '--color-surface', 4.5],
  ['--color-pl-positive', '--color-surface-raised', 4.5],
  ['--color-pl-negative', '--color-surface', 4.5],
  ['--color-pl-negative', '--color-surface-raised', 4.5],
  ['--color-financial-warning', '--color-surface', 4.5],
  ['--color-financial-warning', '--color-surface-raised', 4.5],
  ['--color-financial-dividend', '--color-surface', 4.5],
  ['--color-financial-dividend', '--color-surface-raised', 4.5],
  ['--color-component-primary-btn-text', '--color-component-primary-btn', 4.5],
  ['--color-asset-us-stocks', '--color-surface-raised', 4.5],
  ['--color-asset-thai-stocks', '--color-surface-raised', 4.5],
  ['--color-asset-mutual-funds', '--color-surface-raised', 4.5],
  ['--color-asset-provident-fund', '--color-surface-raised', 4.5],
  ['--color-asset-crypto', '--color-surface-raised', 4.5],
  ['--color-asset-cash-fixed-income', '--color-surface-raised', 4.5],
  ['--color-asset-gold', '--color-surface-raised', 4.5],
];

const failures = [];
let checked = 0;

for (const [themeName, tokens] of [
  ['dark', darkTokens],
  ['light', lightTokens],
]) {
  for (const [fgTok, bgTok, minRatio] of REQUIRED_PAIRS) {
    const fgHex = resolveValue(fgTok, tokens);
    const bgHex = resolveValue(bgTok, tokens);
    const ratio = contrastRatio(fgHex, bgHex);
    checked++;
    if (ratio < minRatio) {
      failures.push(
        `[${themeName}] ${fgTok} (${fgHex}) on ${bgTok} (${bgHex}) = ${ratio.toFixed(2)}:1 (min ${minRatio}:1)`
      );
    }
  }
}

if (failures.length > 0) {
  console.error('WCAG 2.2 AA contrast verification FAILED:\n' + failures.join('\n'));
  process.exit(1);
}

console.log(`WCAG 2.2 AA contrast verification PASSED (${checked} pairs across dark & light themes).`);
