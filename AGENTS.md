# AGENTS.md — Shared AI Developer & Agent Instructions

This document is the canonical source of truth for AI agents (including Claude Code, Gemini CLI, Antigravity, and other coding assistants) and human developers working in the **Synapse / GuessTheSize** repository.

---

## 1. Project Purpose & Architecture Overview

**Synapse** is a full-stack web application featuring **ScaleGuess**—an interactive spatial estimation game where players drag and resize 2D SVG silhouettes against known real-world reference objects. The project also provides user authentication, profile customization (avatar/display name), and game score recording.

### Technology Stack

* **Frontend:**
  * **Framework:** React 19 (`react`, `react-dom`) with TypeScript.
  * **Bundler & Dev Server:** Vite 8 (`@vitejs/plugin-react`).
  * **Styling:** Tailwind CSS v4 (`@tailwindcss/vite`), custom CSS variables (OKLCH color system) in `src/styles.css`.
  * **Animation & Motion:** Motion (`motion`) for layout and result transitions.
  * **Icons:** Lucide React (`lucide-react`).
  * **Auth/Storage Client:** `@supabase/supabase-js` (avatar storage & Supabase sync) and `@react-oauth/google`.
* **Backend:**
  * **Framework:** Express 5 (`express`) running on Node.js.
  * **Language & Runtime:** TypeScript (`tsx` for dev watch mode, `tsc` for production build).
  * **Database:** PostgreSQL (`pg` `Pool`) with automatic in-memory fallback when `DATABASE_URL` is unconfigured.
  * **Auth & Security:** `bcryptjs` (password hashing), `jsonwebtoken` (JWT bearer tokens), `google-auth-library` (Google ID token validation), `cors`.
* **Tooling:**
  * **Linter:** `oxlint` (configured via `.oxlintrc.json`).
  * **Process Runner:** `concurrently` (runs server and Vite client simultaneously).

---

## 2. Directory Layout & Code Placement

```
.
├── .agents/skills/       # Curated AI agent skills library (DO NOT delete or modify existing skills)
├── public/               # Static assets served as-is by Vite
├── server/               # Express backend application
│   ├── src/
│   │   ├── index.ts      # Express server entry point, CORS, routing, and /api/health
│   │   ├── db.ts         # PostgreSQL pool connection & mock in-memory fallback store
│   │   ├── middleware/   # Express middlewares (auth.ts: optionalAuth & requireAuth)
│   │   └── routes/       # API endpoints (auth.ts, scores.ts)
│   ├── package.json      # Server dependencies and scripts (CommonJS)
│   └── tsconfig.json     # Server TypeScript configuration
├── src/                  # React client application (ESM, path alias: "@/")
│   ├── App.tsx           # Top-level client router and application shell
│   ├── main.tsx          # React DOM root render, Google OAuth provider
│   ├── styles.css        # Primary Tailwind v4 stylesheet and OKLCH color tokens
│   ├── components/       # UI components organized by domain:
│   │   ├── auth/         # Login, registration, and Google auth components
│   │   ├── game/         # Interactive game canvas (GameBoard, Silhouette, CameraControls, ResultPanel)
│   │   ├── home/         # Home screen sections (HeroSection, PlayerStats, GameSection, Footer)
│   │   ├── profile/      # Profile settings and avatar update modal
│   │   └── ui/           # Reusable primitives (button, dialog, input, label, etc.)
│   ├── context/          # Global React state (AuthContext.tsx)
│   ├── game/             # ScaleGuess active engine:
│   │   ├── geometry.ts   # Metres-to-pixels transformations, zoom, and viewport math
│   │   ├── puzzles.tsx   # Puzzle pairs and SVG silhouette shape definitions
│   │   ├── scoring.ts    # Logarithmic score and percentage error calculations
│   │   ├── types.ts      # Core game engine interfaces
│   │   └── useGame.ts    # useReducer state machine managing the active game loop
│   ├── lib/              # Client libraries & API clients (authApi.ts, supabase.ts, utils.ts)
│   ├── pages/            # Page-level containers (HomePage.tsx, ScaleGuessPage.tsx)
│   └── types/            # Client TypeScript interfaces (auth.ts, etc.)
├── package.json          # Root/client dependencies and scripts
└── vite.config.ts        # Vite configuration with proxy to backend /api -> :3001
```

### Where New Code Belongs

* **New game puzzles or silhouettes:** Add SVG shape and puzzle pairing to `src/game/puzzles.tsx`.
* **Coordinate or canvas scaling logic:** Modify `src/game/geometry.ts` (preserve metre-based world coordinates).
* **New frontend API calls:** Add functions to `src/lib/authApi.ts` using standard `fetch` with error handling.
* **New backend endpoints:** Add Express route files to `server/src/routes/` and mount them in `server/src/index.ts`.
* **Shared types:** Add frontend interfaces to `src/types/` or `src/game/types.ts`. Server-specific interfaces belong in `server/src/`.

---

## 3. Development, Build, Lint & Verification Commands

Always run commands from the repository root:

| Task | Command | Notes |
| :--- | :--- | :--- |
| **Run full stack (dev)** | `npm run dev` | Runs backend on `http://localhost:3001` and Vite on `http://localhost:5173` concurrently. |
| **Run frontend only** | `npx vite` | Starts Vite dev server. Backend API calls to `/api` proxy to `:3001`. |
| **Run backend only** | `npm run dev --prefix server` | Runs backend with `nodemon` and `tsx` auto-reloading on TS edits. |
| **Run backend (simple)** | `npm run dev:simple --prefix server` | Runs `npx tsx src/index.ts` without nodemon. |
| **Client Type-Check** | `npx tsc -b` | Checks TypeScript across client apps without emitting files. |
| **Server Type-Check** | `npx tsc --noEmit --project server/tsconfig.json` | Checks TypeScript across server code without emitting files. |
| **Client Build** | `npm run build` | Runs `tsc -b && vite build`. Output is in `dist/`. |
| **Server Build** | `npm run build --prefix server` | Compiles server TypeScript to `server/dist/`. |
| **Lint** | `npm run lint` | Runs `oxlint` across 89+ files in the repository. Fast and zero-config. |
| **Preview Client** | `npm run preview` | Previews production client bundle. |

*Note on Testing:* There is currently no unit test runner (Vitest/Jest) configured. Do not install one without user approval. Verification must be performed using `npm run lint`, `npx tsc -b`, server type-checking, and runtime health verification (`/api/health`).

---

## 4. Coding Conventions & Quality Standards

### TypeScript
* **Strict Type Safety:** Avoid using `any` wherever possible. Define explicit interfaces in `src/types/` or co-located type files.
* **Imports:** Use the `@/` path alias for frontend imports (e.g., `import { Button } from "@/components/ui/button"`).
* **Module Systems:** The frontend uses ES Modules (`"type": "module"` in root `package.json`). The server runs in CommonJS mode (`"type": "commonjs"` in `server/package.json`). Keep `require` / `module.exports` or `import` / `export` consistent within their respective sub-trees.

### React 19 Guidelines
* **Fast Refresh Safety:** Do not export non-component constants or helper functions from files containing React components (e.g., place variant configs or hooks in dedicated files if flagged by oxlint).
* **Pure Rendering:** Never execute impure side effects (e.g. `Math.random()`, direct `window.location` mutations) inside render functions or `useMemo`. Perform side effects inside `useEffect` or event handlers.
* **State Updates in Effects:** Avoid synchronous `setState` calls directly within `useEffect` bodies when the state can be derived or handled through user events.

### Styling & CSS
* **Tailwind CSS v4:** Styled using Tailwind v4 utility classes and CSS variables. Avoid hardcoded hex colors where theme semantic tokens exist (e.g., `bg-background`, `text-foreground`, `text-primary`, `border-border`).
* **Active Stylesheet:** The active styling entry point is `src/styles.css` (imported in `src/main.tsx`). `src/App.css` is legacy and not currently imported.

---

## 5. Architecture Boundaries & Data Flow

1. **Client-Side Routing:**
   * The app uses HTML5 History API routing without external router libraries (`react-router` is not installed).
   * Valid routes: `"home"` (`/`), `"scaleGuess"` (`/scaleGuess`), `"login"` (`/login`), `"register"` (`/register`).
   * Navigate using `navigateTo(route)` in `App.tsx` or `history.pushState(null, "", path)` followed by `popstate` dispatch.
2. **API Communication:**
   * Vite dev server proxies all `/api/*` requests to `http://localhost:3001` (configured in `vite.config.ts`).
   * In production, the client calls `VITE_API_URL` or relative `/api`.
3. **Database Dual-Mode:**
   * When `DATABASE_URL` is set to a valid PostgreSQL/Supabase URL, `server/src/db.ts` uses `pg.Pool` with SSL.
   * If `DATABASE_URL` is missing or contains `<password>` / `<project-ref>` placeholders, the server automatically switches to an in-memory SQL mock store. Development and testing can proceed seamlessly without a live database.

---

## 6. Security, Authentication & Secret Management

* **Passwords:** Hashed with `bcryptjs` with 10 salt rounds before storage. Plaintext passwords must never be logged or stored.
* **Input Validation:**
  * Usernames: 1–32 characters, alphanumeric, underscores, hyphens only (`/^[a-zA-Z0-9_-]+$/`).
  * Passwords: Minimum 4 characters.
  * Frontend validation in `src/lib/authApi.ts` must match server validation in `server/src/routes/auth.ts`.
* **SQL Injection Prevention:** Always use parameterized SQL queries with placeholders (`$1, $2, ...`). Never concatenate user input directly into SQL statements.
* **Secrets & Environment Variables:**
  * Secrets belong in `server/.env` (`JWT_SECRET`, `DATABASE_URL`, `CLIENT_SECRET`).
  * Public client variables belong in `.env.local` (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_GOOGLE_CLIENT_ID`).
  * **NEVER** commit `.env`, `.env.local`, or any file containing real credentials to Git. Use `.env.example` as a template.

---

## 7. Working with `.agents/skills/`

* The repository contains an established skills directory at `.agents/skills/` with 34 specialized skills.
* **Preservation Rule:** Do NOT delete, rename, overwrite, or move existing skill folders or their `SKILL.md` files.
* **Format:** Existing skills use standard YAML frontmatter (`name`, `description`).
* **Tool Discovery:**
  * **Antigravity IDE:** Natively discovers `.agents/skills/` from the workspace root.
  * **Claude Code:** Discovers skills in `.claude/skills/` or `~/.claude/skills/`. To avoid duplicating files, a symlink can point `.claude/skills` to `.agents/skills` (`ln -s ../.agents/skills .claude/skills`).
  * **Gemini CLI:** Follows project context imported via `GEMINI.md`.

---

## 8. Safe Bug Investigation & Feature Workflow

1. **Inspect First:** Read relevant code files, types, and configurations before modifying anything.
2. **Plan Complex Edits:** For changes involving `src/game/geometry.ts`, `server/src/db.ts`, or authentication flows, formulate a clear plan before modifying code.
3. **Run Checks Immediately:** After any change, run:
   ```bash
   npm run lint
   npx tsc -b
   npx tsc --noEmit --project server/tsconfig.json
   ```
4. **Destructive Operations Rule:** Never delete files, change package dependencies, run migrations, or alter database schemas without explicit user consent.
5. **Final Report:** Conclude every task with a concise report of:
   * Files created or modified with rationale.
   * Checks executed and their exact exit status.
   * Any edge cases, known limitations, or remaining items.
