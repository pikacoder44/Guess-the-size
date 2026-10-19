# AGENTS.md — System Architecture & Rules for AI Agents

This document is the canonical source of truth for AI agents (including Claude Code, Gemini CLI, Antigravity, and other coding assistants) and human developers working on the **Synapse** platform.

---

## 1. Platform Purpose & Cognitive Multi-Game Architecture

**Synapse** is a full-stack, multi-game cognitive training platform designed to sharpen mental agility, spatial intuition, and perceptual memory through rapid, calibrated micro-games. The architecture is built around an extensible multi-game workspace sharing core platform services (authentication, user profiles, scores, global leaderboards, and puzzle catalogs).

### Active Games

| Game | Workspace Path / Route | Cognitive Domain | Description |
| :--- | :--- | :--- | :--- |
| **ScaleGuess** | `/games/scale-guess`<br>`/scaleGuess` | Spatial Estimation | Players drag, pan, zoom, and resize 2D SVG silhouettes to estimate real-world dimensions against calibrated reference objects. Driven by real-world metric scales (meters) and logarithmic scoring curves. |
| **Not Color Blind** | `/games/not-color-blind`<br>`/notColorBlind` | HSB Visual Memory Recall | Players observe dynamic target color swatches across hue, saturation, and brightness (HSB) color spaces before they decay, reconstructing the exact color parameters from visual memory. |

### Architectural Vision for Additional Games
Each game in Synapse is structured to be modular and self-contained:
- **Game Engine Isolation:** Game state machines, coordinate math, and mechanics live strictly within their dedicated domain directory.
- **Shared Contracts:** Games integrate with shared platform abstractions for authentication, session submission, score storage, and leaderboard aggregation.
- **Future Expansions:** Modular foundation accommodates upcoming titles such as `SequenceMind` (working memory grid sequencing) and `FlashCount` (subitizing and sensory perception).

### Technology Stack

- **Frontend:**
  - **Framework:** React 19 (`react`, `react-dom`) with TypeScript.
  - **Bundler & Dev Server:** Vite 8 (`@vitejs/plugin-react`).
  - **Styling:** Tailwind CSS v4 (`@tailwindcss/vite`), custom CSS variables (OKLCH color system) in `src/styles.css`.
  - **Animation & Motion:** Motion (`motion`) for layout and physics-based transitions.
  - **Icons:** Lucide React (`lucide-react`).
  - **Auth & Storage Client:** `@supabase/supabase-js` (avatar storage & Supabase sync) and `@react-oauth/google`.
- **Backend:**
  - **Framework:** Express 5 (`express`) on Node.js.
  - **Language & Runtime:** TypeScript (`tsx` for dev watch mode, `tsc` for production build).
  - **Database:** PostgreSQL (`pg` `Pool`) with automatic in-memory SQL mock fallback when `DATABASE_URL` is unconfigured.
  - **Auth & Security:** `bcryptjs` (password hashing with 10 salt rounds), `jsonwebtoken` (JWT bearer tokens), `google-auth-library` (Google ID token validation), `cors`.
- **Tooling:**
  - **Linter:** `oxlint` (configured via `.oxlintrc.json`).
  - **Process Runner:** `concurrently` (runs server and Vite client concurrently).

---

## 2. Directory Layout & Multi-Game Workspace Organization

```
.
├── .agents/skills/            # Curated AI agent skills library (DO NOT delete or modify existing skills)
├── .claude/                   # Claude Code integration files and skills symlinks
├── public/                    # Static assets served as-is by Vite (e.g., SVG silhouettes)
│   └── silhouettes/           # Calibrated zero-padded SVG silhouette assets
├── server/                    # Express backend application
│   ├── src/
│   │   ├── index.ts           # Express server entry point, CORS, routing, and /api/health
│   │   ├── db.ts              # PostgreSQL connection pool & mock in-memory fallback store
│   │   ├── middleware/        # Express middlewares (auth.ts: optionalAuth & requireAuth)
│   │   └── routes/            # Modular API endpoints
│   │       ├── auth/          # Authentication routes (login, register, google, github, me)
│   │       ├── scores/        # Scores & leaderboard endpoints (submit, me, leaderboard, user)
│   │       └── puzzles.ts     # Puzzles & catalog endpoints (session, daily, items)
│   ├── scripts/               # Puzzle data pipeline & silhouette normalizers
│   │   ├── fetchWikidataPuzzles.ts # SPARQL & Wikidata automated puzzle pipeline
│   │   ├── generateSilhouettes.ts  # Silhouette generation runner
│   │   └── normalizeSvg.ts         # Zero-padding bounding-box normalization algorithm
│   ├── package.json           # Server dependencies and scripts (CommonJS)
│   └── tsconfig.json          # Server TypeScript configuration
├── src/                       # React client application (ESM, path alias: "@/")
│   ├── App.tsx                # Platform application shell, navigation state, and topbar
│   ├── main.tsx               # React DOM root render, Google OAuth provider
│   ├── styles.css             # Tailwind v4 stylesheet and OKLCH color tokens
│   ├── components/            # UI components organized by domain:
│   │   ├── auth/              # Login, registration, and OAuth modal/pages
│   │   ├── game/              # ScaleGuess canvas UI (GameBoard, Silhouette, CameraControls, ResultPanel)
│   │   ├── home/              # Synapse hub sections (HeroSection, PlayerStats, GameSection, Footer)
│   │   ├── leaderboard/       # Leaderboard modals and ranking displays
│   │   ├── profile/           # User profile settings and avatar management
│   │   └── ui/                # Reusable primitives (button, dialog, input, label, card, etc.)
│   ├── context/               # Global state providers (AuthContext.tsx)
│   ├── data/                  # Game catalog definitions, puzzle sets, and mock metrics
│   ├── game/                  # ScaleGuess game engine & coordinate mathematics:
│   │   ├── geometry.ts        # World meters-to-canvas pixel transforms, zoom, and viewport math
│   │   ├── puzzles.tsx        # Puzzle pairing configurations & SVG shape data
│   │   ├── scoring.ts         # Logarithmic scoring algorithms and percentage error calculations
│   │   ├── types.ts           # ScaleGuess engine interfaces
│   │   └── useGame.ts         # useReducer state machine managing the active game loop
│   ├── games/                 # Multi-game modular engine workspace:
│   │   ├── scale-guess/       # Dedicated ScaleGuess game modules and views
│   │   └── not-color-blind/   # Dedicated Not Color Blind HSB color memory game modules
│   ├── hooks/                 # Reusable React hooks (useCamera, useTheme, etc.)
│   ├── lib/                   # Shared client utilities & API clients (authApi.ts, supabase.ts, utils.ts)
│   ├── pages/                 # Full-page platform route views:
│   │   ├── HomePage.tsx       # Main Synapse game hub
│   │   ├── ScaleGuessPage.tsx # ScaleGuess game view
│   │   ├── LeaderboardPage.tsx# Global rankings and performance statistics
│   │   ├── ProfilePage.tsx    # Authenticated user settings & stats
│   │   └── PublicProfilePage.tsx # Public player profiles
│   └── types/                 # Shared TypeScript interfaces (auth.ts, puzzle.ts, etc.)
├── package.json               # Root and client dependencies and scripts
└── vite.config.ts             # Vite configuration with proxy /api -> :3001
```

### Modular Code Placement Guidelines

1. **New Game Implementations:** Place game-specific logic under `src/games/<game-name>/` or co-located engine folders. Keep state machines, scoring algorithms, and rendering pipelines fully isolated.
2. **Shared Services:** Place cross-cutting logic in `src/lib/`, `src/components/ui/`, or `server/src/`. Never import game-specific internals into platform-wide hubs.
3. **SVG Assets:** Store raw and normalized SVG silhouettes in `public/silhouettes/` with corresponding entries in `puzzle_items`.
4. **Backend Endpoints:** Add modular sub-routers under `server/src/routes/` and mount them in `server/src/index.ts`.

---

## 3. Key Shared Platform Services

### 3.1 Database Schema (`server/src/db.ts`)
The persistence layer operates in **dual-mode**:
- **PostgreSQL / Supabase:** Production and staging environments use a pooled connection (`pg.Pool`) with SSL.
- **In-Memory SQL Mock Store:** When `DATABASE_URL` is omitted or contains placeholder values (`<password>`, `<project-ref>`), the server boots with an in-memory SQL mock store containing seeded profiles, puzzles, and test results.

#### Core Tables:
- **`users`:** Identity records containing `username`, `name`, `email`, `password` (bcrypt hash, nullable for OAuth), `google_id`, `github_id`, `avatar_url` (TEXT for arbitrary URLs or base64 data), `email_verified`, `is_history_public`, and timestamps. Case-insensitive unique indexes on `LOWER(username)` and `LOWER(email)`.
- **`game_results`:** Historical game records storing `user_id` (foreign key to `users(id)`), `mode` (`daily` vs `practice`), `date` (`YYYY-MM-DD`), `total_score` (0–500), `average_error` (percentage error), `elapsed_ms` (time taken in milliseconds), `rounds` (JSONB round breakdowns), and `completed_at`.
- **`puzzle_items`:** Object catalog storing `id`, `name`, `category` (`macro`, `micro`, `everyday`, `cosmic`), `actual_measurement_meters` (ground-truth metric size), `axis` (`height`, `width`, `length`, `diameter`), `svg_url`, `view_box` (JSONB `{ x, y, width, height }`), `source`, and timestamps.
- **`puzzles`:** Puzzle pairings containing `id`, `reference_item_id` (FK to `puzzle_items`), `target_item_id` (FK to `puzzle_items`), `category`, `puzzle_type` (`standard`, `daily`), and `active_date`.

### 3.2 Global Leaderboard System
The leaderboard system ranks player performances across game modes with strict determinism.

- **Ranking Hierarchy (4-Tier Tie-Breaker):**
  1. `total_score DESC` — Highest cumulative score wins.
  2. `average_error ASC` — Lowest average error percentage breaks score ties.
  3. `elapsed_ms ASC` — Faster completion breaks precision ties.
  4. `completed_at ASC` — Earliest submission wins final tie-breaker.
- **Aggregation:** Provides daily challenge leaderboards, all-time global rankings, and personal best metrics (`/api/scores/leaderboard`).

### 3.3 REST APIs

| Endpoint | Method | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `/api/health` | GET | Database connectivity, latency, and system health | No |
| `/api/auth/register` | POST | Register with username, password, and optional email | No |
| `/api/auth/login` | POST | Login with username/email and password, returns JWT | No |
| `/api/auth/google` | POST | Exchange Google ID token for authenticated session | No |
| `/api/auth/github` | POST | Authenticate with GitHub OAuth code | No |
| `/api/auth/me` | GET / PUT | Fetch or update current user profile & avatar | Optional / Required |
| `/api/scores` | POST | Submit game session results (`totalScore`, `averageError`, `elapsedMs`, `rounds`) | Optional |
| `/api/scores/me` | GET | Fetch authenticated player's personal score history | Required |
| `/api/scores/leaderboard` | GET | Retrieve global rankings filtered by `mode` or `date` | No |
| `/api/scores/user/:id` | GET | Fetch public player profile and recent match history | No |
| `/api/puzzles/session` | GET | Retrieve a set of 5 randomized calibrated puzzle pairs | No |
| `/api/puzzles/daily` | GET | Retrieve today's deterministic daily challenge set | No |
| `/api/puzzles/items` | GET | List catalogued reference and target items | No |

### 3.4 UI Design Standards

Synapse enforces a signature aesthetic:
- **Dark Glassmorphism:** Semi-transparent card layers (`bg-card/40`, `backdrop-blur-md`, `border-border/40`), subtle glowing drop-shadows, and refined radial background gradients.
- **Minimal Layout & Low Cognitive Load:** Clean typography, uncrowded canvases, high visual hierarchy, and distraction-free HUDs. Essential game controls remain intuitive and accessible.
- **High Contrast & Calibrated Palettes:** Modern OKLCH color tokens ensuring crisp contrast and legibility across dark surfaces:
  - Backgrounds: Dark neutral canvas (`oklch(0.12 0.01 240)`).
  - Accent Colors: Radiant amber (`oklch(0.82 0.15 75)`) for spatial estimation, cyber violet (`oklch(0.72 0.18 270)`) for working memory, and mint emerald (`oklch(0.75 0.19 165)`) for perception.
  - Text & Accents: Crisp foreground typography (`oklch(0.98 0 0)`) with muted secondary labels (`oklch(0.65 0.02 240)`).

---

## 4. Development, Build, Lint & Verification Commands

All development commands must be executed from the repository root:

| Workflow | Command | Purpose / Target |
| :--- | :--- | :--- |
| **Development (Full Stack)** | `npm run dev` | Runs Express server (`:3001`) and Vite client (`:5173`) concurrently. |
| **Development (Frontend Only)** | `npx vite` | Runs Vite dev server with proxying of `/api` to port `3001`. |
| **Development (Backend Only)** | `npm run dev --prefix server` | Runs Express server with `nodemon` and `tsx` auto-reload. |
| **Development (Backend Simple)**| `npm run dev:simple --prefix server` | Runs Express server directly via `npx tsx src/index.ts`. |
| **Client Build** | `npm run build` | Runs `tsc -b && vite build`. Production bundle outputs to `dist/`. |
| **Server Build** | `npm run build --prefix server` | Compiles server TypeScript into `server/dist/`. |
| **Type Checking (Client & Server)** | `npx tsc -b && npx tsc --noEmit --project server/tsconfig.json` | Validates TypeScript types across both frontend and backend workspaces. |
| **Code Linter** | `npm run lint` | Runs `oxlint` across all workspace files. Zero-config and sub-second execution. |
| **Preview Client** | `npm run preview` | Starts local HTTP preview server for the compiled client build. |

> [!NOTE]
> There is currently no unit test framework installed (Vitest/Jest). Do not install test packages without explicit user instructions. Code verification is performed via `npm run lint`, `npx tsc -b`, server type-checking, and runtime health probes.

---

## 5. Strict Agent Guidelines & Quality Rules

All AI agents must strictly follow these non-negotiable guidelines:

### 1. Zero-Padding SVG Bounding-Box Requirements
- **Exact Geometric Bounds:** All silhouette SVGs used in estimation games must be normalized so that the `viewBox` coordinates (`minX`, `minY`, `width`, `height`) tightly bound the visible vector path with **zero padding**.
- **No Letterboxing or White Margins:** Artificial margins, internal padding, or oversized viewports distort real-world physical scale calculations (`meters-to-pixels` transformations).
- **Automated Normalization:** Use `server/scripts/normalizeSvg.ts` to compute exact quadratic and cubic Bezier curve extrema and rewrite the SVG `viewBox` and path offsets when ingesting new silhouettes.

### 2. No Unrequested Layout Bloat
- **Restraint and Focus:** Keep interfaces sleek, purposeful, and lightweight. Never introduce unrequested banners, duplicate action buttons, excessive wrapper containers, or non-functional decorative widgets.
- **Minimal UI Copy:** Keep instructions, labels, and toast messages short, confident, and direct. Avoid chatty or redundant explanation blocks inside game loops.

### 3. TypeScript & Lint Verification Protocol
- **Continuous Validation:** After modifying any TypeScript or component file, agents must immediately run:
  ```bash
  npm run lint && npx tsc -b
  ```
- **Strict Typing:** Never use `any` as an escape hatch. Create well-defined interfaces in `src/types/` or modular type files.
- **Server Verification:** When server code is touched, also verify server types:
  ```bash
  npx tsc --noEmit --project server/tsconfig.json
  ```

### 4. Preservation of Curated Skills (`.agents/skills/`)
- The repository contains a library of specialized agent skills under `.agents/skills/`.
- **CRITICAL:** Never delete, rename, overwrite, or move existing skill folders or their `SKILL.md` files.

### 5. Database Safety & Fallbacks
- Always maintain and test against the in-memory fallback in `server/src/db.ts` when live database credentials are not present.
- Never write destructive migrations or drop columns without explicit user instructions.

---

## 6. Coding Conventions & Standards

### React 19 & Frontend
- **Functional Components:** Write clean functional components using modern React 19 hooks.
- **Pure Rendering:** Render paths and `useMemo` hooks must remain free of side effects. Side effects, timer triggers, and DOM manipulations belong strictly inside `useEffect` or event callbacks.
- **State Updates:** Avoid synchronous `setState` inside `useEffect` bodies when values can be derived during render or driven by user interaction.
- **Fast Refresh Compliance:** Never export non-component functions or constants from files containing React components.

### Styling & Design System
- **Tailwind CSS v4:** Utilize Tailwind utility classes with CSS theme variables (`bg-background`, `bg-card`, `text-foreground`, `border-border`, `text-primary`).
- **Semantic Tokens:** Do not introduce arbitrary hardcoded hex color codes when semantic tokens exist.
- **Active Stylesheet:** The active stylesheet is `src/styles.css` (imported in `src/main.tsx`).

### Security & Authentication
- **Password Hashing:** Passwords must be hashed using `bcryptjs` with 10 salt rounds prior to persistence.
- **Parameterized Queries:** Always use parameterized SQL placeholders (`$1, $2, ...`) to prevent SQL injection.
- **Secret Hygiene:** Never hardcode secrets in client bundles or commit `.env` files to source control.
