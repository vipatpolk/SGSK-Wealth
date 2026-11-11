# Claude Code Adapter

`.claude/skills` is linked (symlink on macOS/Linux, directory junction on Windows) to `../.agent/skills/`, which is the single source of truth for all agent skills (`dividend-payments`, `cucumber-bdd-best-practices`).

If `.claude/skills` is not present after cloning, run:

```bash
npm run setup:agents
```
