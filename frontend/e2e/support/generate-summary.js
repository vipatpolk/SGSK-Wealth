const fs = require('fs');
const path = require('path');

const summaryPath = path.resolve(__dirname, '../../reports/serenity-js/summary.json');
if (!fs.existsSync(summaryPath)) {
  console.log('No Serenity summary.json found at', summaryPath);
  process.exit(0);
}

try {
  const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
  const run = summary.latestRun || {};
  const totals = run.totals || {};
  const total =
    (totals.passed || 0) +
    (totals.failed || 0) +
    (totals.pending || 0) +
    (totals.skipped || 0) +
    (totals.error || 0);
  const passed = totals.passed || 0;
  const failed = (totals.failed || 0) + (totals.error || 0);
  const skipped = (totals.pending || 0) + (totals.skipped || 0);
  const durationSec = (run.duration ? (run.duration / 1000).toFixed(1) : '0') + 's';
  const passRate =
    summary.scores && summary.scores.passRate !== undefined
      ? summary.scores.passRate
      : total > 0
        ? Math.round((passed / total) * 100)
        : 0;
  const statusIcon = failed === 0 ? '🟢 PASSED' : '🔴 FAILED';

  const repoName = process.env.GITHUB_REPOSITORY || 'vipatpolk/SGSK-Wealth';
  const owner = repoName.split('/')[0];
  const repo = repoName.split('/')[1] || '';
  const ghPagesUrl = `https://${owner}.github.io/${repo}/`;
  const runId = process.env.GITHUB_RUN_ID;
  const serverUrl = process.env.GITHUB_SERVER_URL || 'https://github.com';
  const runUrl = runId ? `${serverUrl}/${repoName}/actions/runs/${runId}` : null;

  let md = `## 🎭 Serenity/JS Living Documentation & Test Report\n\n`;
  md += `### 📊 Execution Scorecard\n\n`;
  md += `| Status | Total Scenarios | Passed | Failed | Skipped | Pass Rate | Duration |\n`;
  md += `| :---: | :---: | :---: | :---: | :---: | :---: | :---: |\n`;
  md += `| **${statusIcon}** | **${total}** | **${passed}** | **${failed}** | **${skipped}** | **${passRate}%** | **${durationSec}** |\n\n`;

  md += `### 🌐 Living Documentation Access\n\n`;
  md += `- 🔗 **[Open Interactive Serenity Living Documentation](${ghPagesUrl})** *(Hosted on GitHub Pages)*\n`;
  if (runUrl) {
    md += `- 📦 **[Download Run Artifacts & Traces](${runUrl})** *(Inspect artifacts under this CI run)*\n`;
  } else {
    md += `- 📦 **Download Raw Report Artifact**: Available in the **Artifacts** section of this workflow run.\n`;
  }
  md += `- 💻 **Local Viewing**: Download the artifact, extract, and run: \`npm run test:e2e:report\`\n\n`;

  if (summary.failureClusters && summary.failureClusters.length > 0) {
    md += `### ⚠️ Failure Clusters\n\n`;
    summary.failureClusters.forEach((c) => {
      md += `- 🔴 **${c.name || 'Failure'}**: ${c.description || JSON.stringify(c)}\n`;
    });
    md += `\n`;
  }

  if (summary.slowest && summary.slowest.length > 0) {
    md += `### ⏱️ Top 5 Longest-Running Scenarios\n\n`;
    md += `| Scenario | Feature / Source | Duration |\n`;
    md += `| :--- | :--- | :---: |\n`;
    summary.slowest.slice(0, 5).forEach((s) => {
      md += `| ${s.name} | \`${s.source}\` | ${(s.duration / 1000).toFixed(2)}s |\n`;
    });
    md += `\n`;
  }

  console.log(md);

  if (process.env.GITHUB_STEP_SUMMARY) {
    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, md);
    console.log('Successfully wrote summary to $GITHUB_STEP_SUMMARY');
  }
} catch (err) {
  console.error('Error generating GitHub Step Summary:', err);
}
