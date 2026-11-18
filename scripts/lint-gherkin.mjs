#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const validatorPath = path.join(
  rootDir,
  '.agent',
  'skills',
  'cucumber-bdd-best-practices',
  'scripts',
  'validate_gherkin.py',
);
const featuresPath = path.join(rootDir, 'e2e', 'src', 'test', 'resources', 'features');

const candidates = [];
if (process.platform === 'win32') {
  const localAppData = process.env.LOCALAPPDATA || '';
  const userProfile = process.env.USERPROFILE || '';
  candidates.push(
    { command: path.join(rootDir, 'backend', '.venv', 'Scripts', 'python.exe'), args: [] },
    { command: path.join(rootDir, '.venv', 'Scripts', 'python.exe'), args: [] },
    { command: path.join(localAppData, 'Programs', 'Python', 'Python314', 'python.exe'), args: [] },
    { command: path.join(localAppData, 'Programs', 'Python', 'Python313', 'python.exe'), args: [] },
    { command: path.join(localAppData, 'Programs', 'Python', 'Python312', 'python.exe'), args: [] },
    { command: path.join(localAppData, 'Programs', 'Python', 'Python311', 'python.exe'), args: [] },
    { command: path.join(userProfile, 'AppData', 'Local', 'Python', 'bin', 'python.exe'), args: [] },
    { command: 'py', args: ['-3'] },
  );
}
candidates.push({ command: 'python', args: [] }, { command: 'python3', args: [] });

for (const { command, args } of candidates) {
  const result = spawnSync(command, [...args, validatorPath, '--strict', featuresPath], {
    cwd: rootDir,
    stdio: 'inherit',
    env: { ...process.env, PYTHONIOENCODING: 'utf-8' },
    shell: process.platform === 'win32' && command === 'py',
  });
  if (result.error?.code === 'ENOENT') continue;
  if (result.error) {
    console.error(`Unable to run Gherkin validation with ${command}: ${result.error.message}`);
    process.exit(1);
  }
  process.exit(result.status ?? 1);
}

console.error('Python was not found. Install Python 3.10+ to run strict Gherkin validation.');
process.exit(1);
