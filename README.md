# ScaleGuess

ScaleGuess is a fast, minimalist browser game about visual proportion. Resize an original SVG silhouette until it feels right beside a known reference object, then lock in your estimate and see how close you were.

## Stack

- React 19 + TypeScript
- Vite
- Tailwind CSS v4 via `@tailwindcss/vite`
- Motion for lightweight page and result transitions
- SVG silhouettes and static TypeScript puzzle data
- `localStorage` for statistics and completed daily results

## Run locally

```bash
npm install
npm run dev
```

Production builds use:

```bash
npm run build
npm run preview
```

## Game mechanics

Each game contains five puzzles. The reference is fixed at 1.75 m and the player sizes a target object with a range slider, touch input, pointer input, or left/right arrow keys. Locking in reveals the estimate, actual dimension, relative error, and round score.

Relative error is:

`abs(estimate - actual) / actual`

The score is deterministic and intentionally forgiving near the answer:

`round(100 * exp(-4.2 * relativeError))`, clamped to 0-100.

## Daily puzzles

The daily set is created from a UTC date string with a small seeded linear-congruential random generator. The same date therefore produces the same five target objects for every player, without a backend. Completed daily results are stored under a date-specific localStorage key so refreshes do not discard them.

Practice sets use the same selection code with a random seed and do not affect the daily streak.

## Architecture

- `src/App.tsx`: route-aware screen flow and interaction orchestration
- `src/components/ObjectSilhouette.tsx`: original SVG silhouette renderer
- `src/data/objects.ts`: typed object catalog with 30 objects
- `src/game.ts`: puzzle selection, formatting, scoring, and statistics logic
- `src/storage.ts`: localStorage persistence
- `src/share.ts`: Web Share API with clipboard fallback
- `src/types.ts`: shared game and storage contracts

The app uses lightweight history-based client-side routing for `/`, `/daily`, `/practice`, `/how-to-play`, and `/results`. Vite's SPA fallback keeps direct route refreshes working in development and preview deployments that serve `index.html` for unknown paths.

## Performance and accessibility

The silhouette is an inline SVG and the board changes the target height with CSS rather than rendering a large bitmap. The interaction value is kept in a ref-backed update path, while the current measurement is rendered for accessibility and clarity. Buttons and the slider have visible focus states, the resize action works from the keyboard and touch, and reduced-motion preferences shorten transitions.

## Add an object

Add a `ScaleObject` entry to `src/data/objects.ts`. Choose a unique `id`, a sensible real-world `dimension` and `unit`, a `dimensionType`, and one of the silhouette keys supported by `ObjectSilhouette.tsx`. Add a new SVG branch there when a new shape is needed. Daily and practice selection will include it automatically.
