#!/usr/bin/env node
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const backendDir = path.join(rootDir, 'backend');
const frontendDir = path.join(rootDir, 'frontend');

const isWindows = process.platform === 'win32';
const npmCmd = isWindows ? 'npm.cmd' : 'npm';

// Locate Python executable with uvicorn / tools installed
function getPythonCommand() {
  const localAppData = process.env.LOCALAPPDATA || '';
  const userProfile = process.env.USERPROFILE || '';

  const candidates = [
    // 1. Virtual environments
    path.join(backendDir, '.venv', 'Scripts', 'python.exe'),
    path.join(backendDir, '.venv', 'bin', 'python'),
    path.join(backendDir, 'venv', 'Scripts', 'python.exe'),
    path.join(backendDir, 'venv', 'bin', 'python'),
    path.join(rootDir, '.venv', 'Scripts', 'python.exe'),
    path.join(rootDir, '.venv', 'bin', 'python'),

    // 2. Python Programs installation (with full dev tools)
    path.join(localAppData, 'Programs', 'Python', 'Python314', 'python.exe'),
    path.join(localAppData, 'Programs', 'Python', 'Python313', 'python.exe'),
    path.join(localAppData, 'Programs', 'Python', 'Python312', 'python.exe'),
    path.join(localAppData, 'Programs', 'Python', 'Python311', 'python.exe'),
    path.join(localAppData, 'Programs', 'Python', 'Python310', 'python.exe'),

    // 3. User local Python
    path.join(localAppData, 'Python', 'bin', 'python.exe'),
    path.join(userProfile, 'AppData', 'Local', 'Python', 'bin', 'python.exe'),

    // 4. Fallback system commands
    'python',
    'python3',
    'py',
  ];

  for (const candidate of candidates) {
    if (!candidate) continue;
    if (path.isAbsolute(candidate) && fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return isWindows ? 'python' : 'python3';
}

const pythonCmd = getPythonCommand();

// Parse CLI flags
const args = process.argv.slice(2);
const onlyBackend = args.includes('--only=backend');
const onlyFrontend = args.includes('--only=frontend');
const lintBackend = args.includes('--lint-backend');
const testBackend = args.includes('--test-backend');

// Line-based stream prefixer
function attachPrefixedStream(stream, prefix, colorCode) {
  let buffer = '';
  stream.on('data', (data) => {
    buffer += data.toString();
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      if (line.trim().length > 0) {
        process.stdout.write(`\x1b[${colorCode}m[${prefix}]\x1b[0m ${line}\n`);
      }
    }
  });
  stream.on('end', () => {
    if (buffer.trim().length > 0) {
      process.stdout.write(`\x1b[${colorCode}m[${prefix}]\x1b[0m ${buffer}\n`);
    }
  });
}

// Backend QA commands: lint or test
if (lintBackend) {
  console.log(`\x1b[36m[LINT]\x1b[0m Running Ruff and Mypy on backend using ${pythonCmd}...`);
  const ruff = spawn(pythonCmd, ['-m', 'ruff', 'check', '.'], { cwd: backendDir, stdio: 'inherit' });
  ruff.on('close', (code) => {
    if (code !== 0) process.exit(code ?? 1);
    const mypy = spawn(pythonCmd, ['-m', 'mypy', '.'], { cwd: backendDir, stdio: 'inherit' });
    mypy.on('close', (mCode) => process.exit(mCode ?? 0));
  });
} else if (testBackend) {
  console.log(`\x1b[36m[TEST]\x1b[0m Running Pytest on backend using ${pythonCmd}...`);
  const pytest = spawn(pythonCmd, ['-m', 'pytest', '-m', 'not live_e2e'], { cwd: backendDir, stdio: 'inherit' });
  pytest.on('close', (code) => process.exit(code ?? 0));
} else {
  // Concurrent Dev Server
  const children = [];

  function terminateChildren() {
    for (const child of children) {
      if (!child.killed) {
        try {
          if (isWindows && child.pid) {
            spawn('taskkill', ['/pid', String(child.pid), '/T', '/F']);
          } else {
            child.kill('SIGINT');
          }
        } catch {
          // Ignore termination errors on exit
        }
      }
    }
  }

  process.on('SIGINT', () => {
    console.log('\n\x1b[33mShutting down development servers...\x1b[0m');
    terminateChildren();
    process.exit(0);
  });
  process.on('SIGTERM', () => {
    terminateChildren();
    process.exit(0);
  });

  console.log('\x1b[32m===================================================\x1b[0m');
  console.log('\x1b[32m Starting SGSK-Wealth Monorepo Development Servers \x1b[0m');
  console.log('\x1b[32m===================================================\x1b[0m');

  if (!onlyFrontend) {
    console.log(`\x1b[36m[BACKEND]\x1b[0m FastAPI starting on http://127.0.0.1:8000 (Python: ${pythonCmd})`);
    const backendProc = spawn(
      pythonCmd,
      ['-m', 'uvicorn', 'main:app', '--reload', '--host', '127.0.0.1', '--port', '8000'],
      {
        cwd: backendDir,
        env: { ...process.env, PYTHONUNBUFFERED: '1' },
      }
    );
    attachPrefixedStream(backendProc.stdout, 'BACKEND', '36');
    attachPrefixedStream(backendProc.stderr, 'BACKEND', '36');
    children.push(backendProc);
  }

  if (!onlyBackend) {
    console.log(`\x1b[35m[FRONTEND]\x1b[0m Angular starting on http://localhost:4200 (Proxying /api/backend -> :8000)`);
    const frontendProc = spawn(
      npmCmd,
      ['--prefix', 'frontend', 'start'],
      {
        cwd: rootDir,
        env: { ...process.env, FORCE_COLOR: '1' },
        shell: isWindows,
      }
    );
    attachPrefixedStream(frontendProc.stdout, 'FRONTEND', '35');
    attachPrefixedStream(frontendProc.stderr, 'FRONTEND', '35');
    children.push(frontendProc);
  }
}
