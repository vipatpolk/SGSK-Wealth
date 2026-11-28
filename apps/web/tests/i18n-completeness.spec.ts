import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { en } from '../app/i18n/en';
import { th } from '../app/i18n/th';

const APP_DIR = path.resolve(__dirname, '../app');

function collectSourceFiles(dir: string, out: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'i18n') collectSourceFiles(full, out);
    } else if (full.endsWith('.vue') || full.endsWith('.ts')) {
      out.push(full);
    }
  }
  return out;
}

describe('i18n dictionary & template completeness', () => {
  it('has 1:1 key and placeholder parity between EN and TH dictionaries', () => {
    const enKeys = Object.keys(en).sort();
    const thKeys = Object.keys(th).sort();
    expect(thKeys).toEqual(enKeys);

    for (const key of enKeys) {
      const enVal = en[key as keyof typeof en];
      const thVal = th[key as keyof typeof th];
      expect(enVal.trim().length, `Empty EN value for ${key}`).toBeGreaterThan(0);
      expect(thVal.trim().length, `Empty TH value for ${key}`).toBeGreaterThan(0);

      const enParams = [...enVal.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
      const thParams = [...thVal.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
      expect(thParams, `Placeholder mismatch for ${key}`).toEqual(enParams);
    }
  });

  it('resolves every static t(...) and labelKey reference across apps/web/app in both EN and TH', () => {
    const files = collectSourceFiles(APP_DIR);
    const missing: string[] = [];

    for (const file of files) {
      const src = fs.readFileSync(file, 'utf8');
      const rel = path.relative(APP_DIR, file);

      for (const m of src.matchAll(/\bt\(\s*['"]([^'"]+)['"]/g)) {
        const key = m[1]!;
        if (!(key in en) || !(key in th)) {
          missing.push(`${rel}: t('${key}')`);
        }
      }

      for (const m of src.matchAll(/labelKey\s*:\s*['"]([^'"]+)['"]/g)) {
        const key = m[1]!;
        if (!(key in en) || !(key in th)) {
          missing.push(`${rel}: labelKey '${key}'`);
        }
      }
    }

    expect(missing).toEqual([]);
  });
});
