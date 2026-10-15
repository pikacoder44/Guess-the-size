# Claude Code Instructions

@AGENTS.md

---

## Claude Code Specific Guidance

### 1. Verification Commands
When working in this repository with Claude Code, run the following fast non-destructive validation checks before concluding tasks:

```bash
# Lint the codebase
npm run lint

# Check client TypeScript types
npx tsc -b

# Check server TypeScript types
npx tsc --noEmit --project server/tsconfig.json
```

### 2. Agent Skills Integration
The repository stores all shared skills in `.agents/skills/`.
Claude Code natively looks for project skills in `.claude/skills/`.

To enable Claude Code to discover these skills natively without duplicating files:
* A symbolic link can be created from the project root:
  ```bash
  mkdir -p .claude && ln -s ../.agents/skills .claude/skills
  ```
* Alternatively, reference the relevant skill file directly when prompted by the user (e.g., reading `.agents/skills/<skill>/SKILL.md`).

### 3. Execution Constraints
* Do not install new npm packages or modify dependencies unless explicitly requested.
* Never commit secrets, credentials, or actual `.env` files to git.
* Rely on the database in-memory fallback in `server/src/db.ts` when running local tests without a live PostgreSQL instance.
