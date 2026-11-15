#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..', '..');
const e2eTargetDir = path.join(rootDir, 'e2e', 'target');
const allureResultsDir = path.join(e2eTargetDir, 'allure-results');
const allureReportDir = path.join(e2eTargetDir, 'site', 'allure-maven-plugin');
const historyCacheDir = path.join(e2eTargetDir, 'allure-history-cache');

function getPagesUrl() {
  if (process.env.ALLURE_REPORT_URL) {
    return process.env.ALLURE_REPORT_URL;
  }
  const repo = process.env.GITHUB_REPOSITORY || 'vipatpolk/SGSK-Wealth';
  const [owner, name] = repo.split('/');
  return `https://${owner}.github.io/${name}/`;
}

function copyDirFiles(srcDir, destDir) {
  if (!fs.existsSync(srcDir)) return 0;
  fs.mkdirSync(destDir, { recursive: true });
  let count = 0;
  for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
    if (entry.isFile()) {
      fs.copyFileSync(path.join(srcDir, entry.name), path.join(destDir, entry.name));
      count += 1;
    }
  }
  return count;
}

async function restoreHistoryFromArtifact() {
  const existingFiles = fs.existsSync(historyCacheDir)
    ? fs.readdirSync(historyCacheDir).filter((f) => f.endsWith('.json'))
    : [];

  if (existingFiles.length > 0) {
    console.log(`[allure-ci] History cache already populated (${existingFiles.length} files). Skipping artifact fallback.`);
    return;
  }

  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPOSITORY;
  if (!token || !repo) {
    console.log('[allure-ci] GITHUB_TOKEN or GITHUB_REPOSITORY not set; skipping artifact history fallback.');
    return;
  }

  try {
    const apiHeaders = {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'sgsk-wealth-allure-ci',
    };

    const listUrl = `https://api.github.com/repos/${repo}/actions/artifacts?name=allure-e2e-report&per_page=15`;
    const listRes = await fetch(listUrl, { headers: apiHeaders });
    if (!listRes.ok) {
      console.log(`[allure-ci] Artifact lookup returned HTTP ${listRes.status}; starting with fresh history.`);
      return;
    }

    const payload = await listRes.json();
    const validArtifacts = (payload.artifacts || []).filter((a) => !a.expired);
    const preferred =
      validArtifacts.find((a) => ['main', 'master'].includes(a.workflow_run?.head_branch)) ||
      validArtifacts[0];

    if (!preferred) {
      console.log('[allure-ci] No unexpired allure-e2e-report artifact found; starting with fresh history.');
      return;
    }

    const downloadInit = await fetch(preferred.archive_download_url, {
      headers: apiHeaders,
      redirect: 'manual',
    });

    let zipBuffer;
    if (downloadInit.status >= 300 && downloadInit.status < 400) {
      const signedUrl = downloadInit.headers.get('location');
      if (!signedUrl) {
        console.log('[allure-ci] Missing redirect location for artifact download.');
        return;
      }
      const zipRes = await fetch(signedUrl);
      if (!zipRes.ok) {
        console.log(`[allure-ci] Redirected artifact download failed with HTTP ${zipRes.status}.`);
        return;
      }
      zipBuffer = Buffer.from(await zipRes.arrayBuffer());
    } else if (downloadInit.ok) {
      zipBuffer = Buffer.from(await downloadInit.arrayBuffer());
    } else {
      console.log(`[allure-ci] Artifact download returned HTTP ${downloadInit.status}.`);
      return;
    }

    const tmpZip = path.join(os.tmpdir(), `allure-prev-${Date.now()}.zip`);
    fs.writeFileSync(tmpZip, zipBuffer);
    fs.mkdirSync(historyCacheDir, { recursive: true });

    try {
      execFileSync('unzip', ['-q', '-o', '-j', tmpZip, 'history/*', '-d', historyCacheDir], {
        stdio: 'ignore',
      });
      const restored = fs.readdirSync(historyCacheDir).filter((f) => f.endsWith('.json'));
      console.log(`[allure-ci] Restored ${restored.length} history file(s) from artifact #${preferred.id}.`);
    } catch {
      console.log('[allure-ci] Previous artifact did not contain a history/ directory.');
    } finally {
      fs.rmSync(tmpZip, { force: true });
    }
  } catch (err) {
    console.log(`[allure-ci] Artifact history fallback skipped due to error: ${err.message}`);
  }
}

function buildExecutorMetadata() {
  const serverUrl = process.env.GITHUB_SERVER_URL || 'https://github.com';
  const repo = process.env.GITHUB_REPOSITORY || 'vipatpolk/SGSK-Wealth';
  const runId = process.env.GITHUB_RUN_ID || 'local';
  const runNumber = Number.parseInt(process.env.GITHUB_RUN_NUMBER || '1', 10) || 1;
  const refName = process.env.GITHUB_REF_NAME || 'local';

  return {
    name: 'GitHub Actions',
    type: 'github',
    url: `${serverUrl}/${repo}`,
    buildOrder: runNumber,
    buildName: `CI #${runNumber} (${refName})`,
    buildUrl: runId === 'local' ? `${serverUrl}/${repo}/actions` : `${serverUrl}/${repo}/actions/runs/${runId}`,
    reportName: 'SGSK-Wealth E2E Allure Report',
    reportUrl: getPagesUrl(),
  };
}

function prepareResults() {
  fs.mkdirSync(allureResultsDir, { recursive: true });

  const historyDest = path.join(allureResultsDir, 'history');
  const restoredCount = copyDirFiles(historyCacheDir, historyDest);
  console.log(`[allure-ci] Copied ${restoredCount} history file(s) into ${path.relative(rootDir, historyDest)}.`);

  const runNumber = Number.parseInt(process.env.GITHUB_RUN_NUMBER || '1', 10) || 1;
  const refName = process.env.GITHUB_REF_NAME || 'local';
  const sha = process.env.GITHUB_SHA || 'local';
  const eventName = process.env.GITHUB_EVENT_NAME || 'local';
  const runnerOs = process.env.RUNNER_OS || os.platform();

  fs.writeFileSync(path.join(allureResultsDir, 'executor.json'), `${JSON.stringify(buildExecutorMetadata(), null, 2)}\n`);

  const envLines = [
    `Branch=${refName}`,
    `Commit=${sha.slice(0, 7)}`,
    `Workflow.Run=#${runNumber}`,
    `Event=${eventName}`,
    `Runner.OS=${runnerOs}`,
    'Java.Version=25',
    'Node.Version=26',
    'Browser=Chromium (Playwright)',
  ];
  fs.writeFileSync(path.join(allureResultsDir, 'environment.properties'), `${envLines.join('\n')}\n`);
  console.log('[allure-ci] Wrote executor.json and environment.properties.');
}

function finalizeReport() {
  if (!fs.existsSync(allureReportDir)) {
    console.warn(`[allure-ci] Report directory not found: ${allureReportDir}`);
    return;
  }

  fs.writeFileSync(path.join(allureReportDir, '.nojekyll'), '');

  const mavenStub = path.join(allureReportDir, 'allure-maven.html');
  if (fs.existsSync(mavenStub)) {
    fs.rmSync(mavenStub, { force: true });
  }

  // allure-maven overwrites executor.json with a generic "Maven" executor; restore CI metadata.
  const widgetsExecutorsPath = path.join(allureReportDir, 'widgets', 'executors.json');
  if (fs.existsSync(path.dirname(widgetsExecutorsPath))) {
    fs.writeFileSync(widgetsExecutorsPath, JSON.stringify([buildExecutorMetadata()]));
  }

  const generatedHistoryDir = path.join(allureReportDir, 'history');
  if (fs.existsSync(generatedHistoryDir)) {
    fs.rmSync(historyCacheDir, { recursive: true, force: true });
    const savedCount = copyDirFiles(generatedHistoryDir, historyCacheDir);
    console.log(`[allure-ci] Staged ${savedCount} updated history file(s) in ${path.relative(rootDir, historyCacheDir)}.`);
  }
}

function formatDuration(ms) {
  if (!Number.isFinite(ms) || ms <= 0) return '0s';
  const totalSeconds = Math.round(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
}

function writeStepSummary() {
  const summaryJsonPath = path.join(allureReportDir, 'widgets', 'summary.json');
  if (!fs.existsSync(summaryJsonPath)) {
    console.warn(`[allure-ci] Summary JSON not found: ${summaryJsonPath}`);
    return;
  }

  const summary = JSON.parse(fs.readFileSync(summaryJsonPath, 'utf8'));
  const stats = summary.statistic || {};
  const passed = stats.passed ?? 0;
  const failed = stats.failed ?? 0;
  const broken = stats.broken ?? 0;
  const skipped = stats.skipped ?? 0;
  const unknown = stats.unknown ?? 0;
  const total = stats.total ?? passed + failed + broken + skipped + unknown;
  const passRate = total > 0 ? ((passed / total) * 100).toFixed(1) : '0.0';
  const duration = formatDuration(summary.time?.duration ?? 0);
  const statusEmoji = failed === 0 && broken === 0 && total > 0 ? '✅' : '❌';
  const pagesUrl = getPagesUrl();
  const isDeployBranch =
    ['refs/heads/main', 'refs/heads/master'].includes(process.env.GITHUB_REF || '') &&
    ['push', 'workflow_dispatch'].includes(process.env.GITHUB_EVENT_NAME || '');

  const lines = [
    `## ${statusEmoji} E2E Allure Report Summary`,
    '',
    '| Metric | Count |',
    '|:---|---:|',
    `| **Passed** | ${passed} |`,
    `| **Failed** | ${failed} |`,
    `| **Broken** | ${broken} |`,
    `| **Skipped** | ${skipped} |`,
    `| **Unknown** | ${unknown} |`,
    `| **Total Scenarios** | **${total}** |`,
    `| **Pass Rate** | **${passRate}%** |`,
    `| **Duration** | ${duration} |`,
    '',
    isDeployBranch
      ? `🌐 **Live Allure Report**: [${pagesUrl}](${pagesUrl})`
      : `📦 **PR Artifact**: Download \`allure-e2e-report\` from this workflow run. (Live report updates on \`main\`: [${pagesUrl}](${pagesUrl}))`,
    '',
  ];

  const markdown = lines.join('\n');
  const summaryFile = process.env.GITHUB_STEP_SUMMARY;
  if (summaryFile) {
    fs.appendFileSync(summaryFile, markdown);
    console.log('[allure-ci] Appended scorecard to GITHUB_STEP_SUMMARY.');
  } else {
    process.stdout.write(markdown);
  }
}

const command = process.argv[2];
switch (command) {
  case 'restore-history-from-artifact':
    await restoreHistoryFromArtifact();
    break;
  case 'prepare-results':
    prepareResults();
    break;
  case 'finalize-report':
    finalizeReport();
    break;
  case 'step-summary':
    writeStepSummary();
    break;
  default:
    console.error('Usage: node allure-ci-helper.mjs <restore-history-from-artifact|prepare-results|finalize-report|step-summary>');
    process.exit(1);
}
