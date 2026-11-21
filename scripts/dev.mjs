#!/usr/bin/env node
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { StringDecoder } from 'node:string_decoder';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const backendDir = path.join(rootDir, 'backend');
const webDir = path.join(rootDir, 'web');
const e2eTargetDir = path.join(rootDir, 'e2e', 'target');
const e2eLogPath = path.join(e2eTargetDir, 'e2e-live.log');

const isWindows = process.platform === 'win32';
const npmCmd = isWindows ? 'npm.cmd' : 'npm';

// Locate Cargo executable and ensure Rust + MinGW toolchain directories are on PATH
function getCargoCommand() {
  const userProfile = process.env.USERPROFILE || process.env.HOME || '';
  const cargoBinDir = userProfile ? path.join(userProfile, '.cargo', 'bin') : '';
  const candidates = [
    cargoBinDir ? path.join(cargoBinDir, isWindows ? 'cargo.exe' : 'cargo') : '',
    'cargo',
  ];

  for (const candidate of candidates) {
    if (!candidate) continue;
    if (path.isAbsolute(candidate) && fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return 'cargo';
}

function getBackendEnv(extra = {}) {
  const pathKey = Object.keys(process.env).find((k) => k.toUpperCase() === 'PATH') || 'PATH';
  const currentPath = process.env[pathKey] || '';
  const extraDirs = [];

  const userProfile = process.env.USERPROFILE || process.env.HOME || '';
  if (userProfile) {
    const cargoBin = path.join(userProfile, '.cargo', 'bin');
    if (fs.existsSync(cargoBin)) extraDirs.push(cargoBin);
  }

  if (isWindows) {
    const wingetPkgs = path.join(process.env.LOCALAPPDATA || '', 'Microsoft', 'WinGet', 'Packages');
    if (fs.existsSync(wingetPkgs)) {
      for (const entry of fs.readdirSync(wingetPkgs)) {
        if (entry.startsWith('BrechtSanders.WinLibs')) {
          const mingwBin = path.join(wingetPkgs, entry, 'mingw64', 'bin');
          if (fs.existsSync(mingwBin)) extraDirs.push(mingwBin);
        }
      }
    }
  }

  const sep = isWindows ? ';' : ':';
  const prefix = extraDirs.filter((d) => !currentPath.includes(d)).join(sep);
  return {
    ...process.env,
    [pathKey]: prefix ? `${prefix}${sep}${currentPath}` : currentPath,
    ...extra,
  };
}

const cargoCmd = getCargoCommand();
const backendEnv = getBackendEnv();

// Parse CLI flags
const args = process.argv.slice(2);
const onlyBackend = args.includes('--only=backend');
const onlyFrontend = args.includes('--only=frontend') || args.includes('--only=web');
const withMobile = args.includes('--mobile');
const lintBackend = args.includes('--lint-backend');
const testBackend = args.includes('--test-backend');
const runE2e = args.includes('--e2e');
const noE2eLogs = args.includes('--no-e2e-logs');

function terminateProcessTree(child) {
  if (!child || child.killed) return;
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

// Line-based prefixed writer shared by child process streams and log file tailer
function createPrefixedLineWriter(prefix, colorCode) {
  const decoder = new StringDecoder('utf8');
  let buffer = '';
  return {
    push(data) {
      buffer += typeof data === 'string' ? data : decoder.write(data);
      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop() ?? '';
      for (const line of lines) {
        if (line.trim().length > 0) {
          process.stdout.write(`\x1b[${colorCode}m[${prefix}]\x1b[0m ${line}\n`);
        }
      }
    },
    flush() {
      buffer += decoder.end();
      if (buffer.trim().length > 0) {
        process.stdout.write(`\x1b[${colorCode}m[${prefix}]\x1b[0m ${buffer}\n`);
      }
      buffer = '';
    },
  };
}

function attachPrefixedStream(stream, prefix, colorCode) {
  const writer = createPrefixedLineWriter(prefix, colorCode);
  stream.on('data', (data) => writer.push(data));
  stream.on('end', () => writer.flush());
}

function startE2eLogTailer(logFilePath) {
  const writer = createPrefixedLineWriter('E2E', '33');
  let offset = 0;
  try {
    if (fs.existsSync(logFilePath)) {
      offset = fs.statSync(logFilePath).size;
    }
  } catch {
    offset = 0;
  }

  const pollNewBytes = () => {
    try {
      if (!fs.existsSync(logFilePath)) {
        offset = 0;
        return;
      }
      const stats = fs.statSync(logFilePath);
      if (stats.size < offset) {
        writer.flush();
        offset = 0;
      }
      if (stats.size === offset) return;

      const fd = fs.openSync(logFilePath, 'r');
      try {
        const chunkSize = 65536;
        while (offset < stats.size) {
          const toRead = Math.min(chunkSize, stats.size - offset);
          const buf = Buffer.allocUnsafe(toRead);
          const bytesRead = fs.readSync(fd, buf, 0, toRead, offset);
          if (bytesRead <= 0) break;
          offset += bytesRead;
          writer.push(bytesRead === toRead ? buf : buf.subarray(0, bytesRead));
        }
      } finally {
        fs.closeSync(fd);
      }
    } catch {
      // Ignore transient read errors while Maven/target directory is updating
    }
  };

  const timer = setInterval(pollNewBytes, 250);
  console.log(`\x1b[33m[E2E]\x1b[0m Streaming E2E logs from ${path.relative(rootDir, logFilePath)} (run "npm run test:e2e*" to trigger)`);
  return () => {
    clearInterval(timer);
    pollNewBytes();
    writer.flush();
  };
}

// Backend QA commands: lint or test, or E2E runner with live log teeing
if (lintBackend) {
  console.log(`\x1b[36m[LINT]\x1b[0m Running cargo fmt and clippy on backend using ${cargoCmd}...`);
  const fmt = spawn(cargoCmd, ['fmt', '--all', '--', '--check'], {
    cwd: backendDir,
    stdio: 'inherit',
    env: backendEnv,
  });
  fmt.on('close', (code) => {
    if (code !== 0) process.exit(code ?? 1);
    const clippy = spawn(cargoCmd, ['clippy', '--all-targets', '--', '-D', 'warnings'], {
      cwd: backendDir,
      stdio: 'inherit',
      env: backendEnv,
    });
    clippy.on('close', (cCode) => process.exit(cCode ?? 0));
  });
} else if (testBackend) {
  console.log(`\x1b[36m[TEST]\x1b[0m Running cargo test on backend using ${cargoCmd}...`);
  const cargoTest = spawn(cargoCmd, ['test'], {
    cwd: backendDir,
    stdio: 'inherit',
    env: backendEnv,
  });
  cargoTest.on('close', (code) => process.exit(code ?? 0));
} else if (runE2e) {
  fs.mkdirSync(e2eTargetDir, { recursive: true });
  fs.writeFileSync(e2eLogPath, '');
  const logStream = fs.createWriteStream(e2eLogPath, { flags: 'a' });

  const tagsFlag = args.find((a) => a.startsWith('--tags='));
  const extraArgs = args.filter((a) => a !== '--e2e' && !a.startsWith('--tags='));
  const mvnArgs = ['-f', 'e2e/pom.xml', 'test'];
  if (tagsFlag) {
    mvnArgs.push(`-Dcucumber.filter.tags=${tagsFlag.slice('--tags='.length)}`);
  }
  mvnArgs.push(...extraArgs);

  const headerLine = `=== E2E Run Started (${new Date().toISOString()}): mvn ${mvnArgs.join(' ')} ===\n`;
  logStream.write(headerLine);

  const mvnChild = isWindows
    ? spawn('cmd.exe', ['/d', '/s', '/c', 'mvn', ...mvnArgs], { cwd: rootDir })
    : spawn('mvn', mvnArgs, { cwd: rootDir });

  mvnChild.stdout.on('data', (chunk) => {
    process.stdout.write(chunk);
    logStream.write(chunk);
  });
  mvnChild.stderr.on('data', (chunk) => {
    process.stderr.write(chunk);
    logStream.write(chunk);
  });

  const handleAbort = (signal) => {
    terminateProcessTree(mvnChild);
    logStream.end(`\n=== E2E Run Aborted (${signal}) ===\n`, () => process.exit(1));
  };
  process.on('SIGINT', () => handleAbort('SIGINT'));
  process.on('SIGTERM', () => handleAbort('SIGTERM'));

  mvnChild.on('close', (code) => {
    logStream.end(`\n=== E2E Run Finished (exit code ${code ?? 1}) ===\n`, () => {
      process.exit(code ?? 1);
    });
  });
} else {
  // Concurrent Dev Server
  const children = [];
  let stopE2eTailer = () => {};

  function terminateChildren() {
    stopE2eTailer();
    for (const child of children) {
      terminateProcessTree(child);
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
    console.log(`\x1b[36m[BACKEND]\x1b[0m Rust Axum starting on http://127.0.0.1:8000 (Cargo: ${cargoCmd})`);
    const backendProc = spawn(
      cargoCmd,
      ['run', '--bin', 'sgsk-backend'],
      {
        cwd: backendDir,
        env: getBackendEnv({ HOST: '127.0.0.1', PORT: '8000' }),
      }
    );
    attachPrefixedStream(backendProc.stdout, 'BACKEND', '36');
    attachPrefixedStream(backendProc.stderr, 'BACKEND', '36');
    backendProc.on('error', (err) => {
      console.error(`\x1b[31m[BACKEND] Failed to start Rust backend (${cargoCmd}): ${err.message}\x1b[0m`);
    });
    backendProc.on('close', (code, signal) => {
      if (code !== null && code !== 0) {
        console.error(
          `\x1b[31m[BACKEND] Rust backend exited with code ${code} (is port 8000 already in use?). Proxy requests at /api/backend will fail until port 8000 is listening.\x1b[0m`
        );
      } else if (signal) {
        console.log(`\x1b[33m[BACKEND] Rust backend terminated by signal ${signal}\x1b[0m`);
      }
    });
    children.push(backendProc);
  }

  if (!onlyBackend) {
    console.log(`\x1b[35m[WEB]\x1b[0m Angular starting on http://localhost:4200 (Proxying /api/backend -> :8000)`);
    const frontendProc = spawn(
      npmCmd,
      ['--prefix', 'web', 'start'],
      {
        cwd: rootDir,
        env: { ...process.env, FORCE_COLOR: '1' },
        shell: isWindows,
      }
    );
    attachPrefixedStream(frontendProc.stdout, 'WEB', '35');
    attachPrefixedStream(frontendProc.stderr, 'WEB', '35');
    children.push(frontendProc);

    if (withMobile) {
      console.log(`\x1b[32m[MOBILE]\x1b[0m Ionic Capacitor starting on http://localhost:4201 (Proxying /api/backend -> :8000)`);
      const mobileProc = spawn(
        npmCmd,
        ['--prefix', 'mobile', 'start'],
        {
          cwd: rootDir,
          env: { ...process.env, FORCE_COLOR: '1' },
          shell: isWindows,
        }
      );
      attachPrefixedStream(mobileProc.stdout, 'MOBILE', '32');
      attachPrefixedStream(mobileProc.stderr, 'MOBILE', '32');
      children.push(mobileProc);
    }
  }

  if (!noE2eLogs) {
    stopE2eTailer = startE2eLogTailer(e2eLogPath);
  }
}
