# Gemini Instructions

@./AGENTS.md

---

## Quick-Reference Workflows & Guidelines

**Synapse** is a multi-game cognitive training platform featuring modular games such as **ScaleGuess** (spatial scale estimation) and **Not Color Blind** (HSB visual memory recall), backed by an Express 5 API and React 19 client.

---

### 1. Environment & Discovery

* **Gemini CLI:** Reads `GEMINI.md` in the current working directory and automatically expands the `@./AGENTS.md` import inline for persistent context.
* **Antigravity / Google IDEs:** Natively recognize `.agents/skills/` as the Workspace Customizations Root. Skills placed in `.agents/skills/<skill_name>/SKILL.md` are automatically indexed.
* **Other IDEs:** If your environment does not automatically import markdown references, consult `AGENTS.md` directly as the authoritative architectural specification.

---

### 2. Standard Commands

Always run commands from the repository root:

| Command | Description |
| :--- | :--- |
| `npm run dev` | **Development:** Concurrently runs backend server (`:3001`) and Vite client (`:5173`). |
| `npm run build` | **Client Build:** Type-checks and builds production client assets in `dist/`. |
| `npm run build --prefix server` | **Server Build:** Compiles backend TypeScript to `server/dist/`. |
| `npx tsc -b && npx tsc --noEmit --project server/tsconfig.json` | **Type Checking:** Runs comprehensive TypeScript checks across client and server. |
| `npm run lint` | **Code Linter:** Runs `oxlint` across all repository files. |

---

### 3. Code Style & Architecture Rules

- **Functional React Components:** Build components with React 19 functional patterns and hooks. Keep rendering logic strictly pure without side effects in `useMemo` or render bodies.
- **Tailwind CSS Styling:** Apply Tailwind CSS v4 utility classes and CSS custom variables (`src/styles.css`). Follow dark glassmorphic styling, minimal visual hierarchy, and high contrast.
- **Strict TypeScript:** No `any` types. Provide explicit interfaces in `src/types/` or dedicated module type files.
- **Minimal UI Copy:** Deliver clear, concise instructions, tooltips, and labels. Avoid conversational UI bloat or superfluous copy.

---

### 4. Verification Protocol & Strict Guardrails

- **Verification:** Always execute `npm run lint && npx tsc -b` (and `npx tsc --noEmit --project server/tsconfig.json` for server edits) before concluding tasks.
- **Zero-Padding SVG Bounding Boxes:** Silhouette SVGs for scale estimation must have tight `viewBox` coordinates without extra padding, ensuring accurate real-world metric scaling.
- **No Unrequested Layout Bloat:** Keep layouts lean, clean, and purposeful. Avoid extraneous DOM wrappers or decorative cards that distract from game focus.
- **Preservation of Skills:** Never delete, rename, or alter folders and files in `.agents/skills/`.
- **Database Fallback:** Preserve the in-memory fallback in `server/src/db.ts` for zero-configuration local development.
