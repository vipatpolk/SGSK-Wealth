import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const sourceSkillsDir = path.join(rootDir, '.agent', 'skills');
const claudeDir = path.join(rootDir, '.claude');
const claudeSkillsLink = path.join(claudeDir, 'skills');

if (!fs.existsSync(sourceSkillsDir)) {
  console.error(`[setup-agents] Missing single source of truth: ${sourceSkillsDir}`);
  process.exit(1);
}

fs.mkdirSync(claudeDir, { recursive: true });

let needsLink = true;
try {
  const stat = fs.lstatSync(claudeSkillsLink);
  if (stat.isSymbolicLink()) {
    const resolved = fs.realpathSync(claudeSkillsLink);
    if (resolved === fs.realpathSync(sourceSkillsDir)) {
      needsLink = false;
    } else {
      fs.unlinkSync(claudeSkillsLink);
    }
  } else {
    // Already exists as a directory or junction pointing elsewhere
    const resolved = fs.realpathSync(claudeSkillsLink);
    if (resolved === fs.realpathSync(sourceSkillsDir)) {
      needsLink = false;
    }
  }
} catch {
  // Does not exist yet
}

if (needsLink) {
  const linkType = process.platform === 'win32' ? 'junction' : 'dir';
  const target = process.platform === 'win32' ? sourceSkillsDir : path.relative(claudeDir, sourceSkillsDir);
  fs.symlinkSync(target, claudeSkillsLink, linkType);
  console.log(`[setup-agents] Linked .claude/skills -> .agent/skills (${linkType})`);
} else {
  console.log('[setup-agents] .claude/skills adapter is already linked to .agent/skills');
}
