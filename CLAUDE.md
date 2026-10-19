# Claude Code Instructions

@AGENTS.md

---

## Quick-Reference Workflows & Guidelines

**Synapse** is a multi-game cognitive platform featuring games like **ScaleGuess** (spatial scale estimation) and **Not Color Blind** (HSB visual memory recall), powered by a React 19 frontend and an Express 5 backend with PostgreSQL / in-memory fallback.

---

### 1. Standard Commands

Execute all commands from the repository root:

| Command | Description |
| :--- | :--- |
| `npm run dev` | **Development:** Concurrently runs Express API (`:3001`) and Vite client (`:5173`). |
| `npm run build` | **Client Build:** Type-checks and creates production Vite build in `dist/`. |
| `npm run build --prefix server` | **Server Build:** Compiles backend TypeScript to `server/dist/`. |
| `npx tsc -b && npx tsc --noEmit --project server/tsconfig.json` | **Type Checking:** Validates types across client and server workspaces. |
| `npm run lint` | **Code Linter:** Runs `oxlint` across all files for ultra-fast checks. |

---

### 2. Code Style & Architecture Rules

- **Functional React Components:** Use modern React 19 functional components and hooks. Maintain pure rendering without side effects in render functions or `useMemo`.
- **Tailwind CSS Styling:** Use Tailwind CSS v4 utility classes and CSS theme variables (OKLCH color system in `src/styles.css`). Emphasize dark glassmorphism, minimal layouts, and high-contrast typography.
- **Strict TypeScript:** Avoid `any` completely. Define clean, explicit interfaces in `src/types/` or co-located module type files.
- **Minimal UI Copy:** Keep HUD metrics, tooltips, instructions, and button labels brief, confident, and direct. Avoid layout clutter or unrequested decorative widgets.

---

### 3. Strict Agent Guardrails

- **Verification Protocol:** Always run `npm run lint && npx tsc -b` after completing edits. If backend code is modified, run server type checks as well.
- **Zero-Padding SVG Bounding Boxes:** Silhouette SVGs used for scale estimation must have tight `viewBox` coordinates with zero padding (`minX`, `minY`, `width`, `height` tightly enclosing vector paths).
- **No Layout Bloat:** Maintain sleek, minimal interfaces without adding extraneous containers, redundant cards, or noisy elements.
- **In-Memory Store Safety:** Maintain the in-memory fallback in `server/src/db.ts` for database operations unless real Supabase credentials are provided.
- **Skills Preservation:** Never delete, rename, or modify files within `.agents/skills/`.

---

### 4. Claude Code Skills Integration

The repository stores all shared skills in `.agents/skills/`.
Claude Code natively looks for skills in `.claude/skills/`.

To enable native skill discovery:
```bash
mkdir -p .claude && ln -s ../.agents/skills .claude/skills
```
Alternatively, read `.agents/skills/<skill_name>/SKILL.md` directly when executing specialized workflows.
