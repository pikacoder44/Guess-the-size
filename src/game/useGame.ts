import { useReducer } from "react";
import {
  clampCamera,
  clampCenter,
  fitCamera,
  fitZoom,
  maxScaleFactorAt,
  minScaleForPx,
  rectFromCenter,
  sizeFor,
  unionRects,
  visibleWorldRect,
  zoomLimits,
  type Camera,
  type Rect,
  type Vec,
  type Viewport,
} from "./geometry";
import type { GamePhase, Puzzle } from "./types";

const INITIAL_MARGIN = 0.6;
const FIT_MARGIN = 0.9;
const REFERENCE_GAP = 0.25; // fraction of reference width between objects

export type GameState = {
  puzzle: Puzzle;
  phase: GamePhase;
  viewport: Viewport;
  camera: Camera;
  referenceCenter: Vec;
  targetCenter: Vec;
  /** Player-controlled measurement (metres) along the target's axis. */
  guessScale: number;
  /** Captured on Lock In; never overwritten. */
  finalGuessScale: number | null;
};

type Action =
  | { type: "init"; puzzle: Puzzle; viewport: Viewport }
  | { type: "viewport"; viewport: Viewport }
  | { type: "moveTarget"; center: Vec }
  | { type: "resizeTarget"; scale: number }
  | { type: "zoom"; factor: number }
  | { type: "fit" }
  | { type: "lockIn" };

/* ---------- derived scene geometry (pure) ---------- */

export function referenceRect(s: GameState): Rect {
  const ref = s.puzzle.reference;
  return rectFromCenter(s.referenceCenter, sizeFor(ref, ref.actualMeasurement));
}

export function guessRect(s: GameState): Rect {
  return rectFromCenter(s.targetCenter, sizeFor(s.puzzle.target, s.finalGuessScale ?? s.guessScale));
}

/** Correct object shares the guess's bottom-centre anchor. */
export function correctRect(s: GameState): Rect {
  const size = sizeFor(s.puzzle.target, s.puzzle.target.actualMeasurement);
  const g = guessRect(s);
  return rectFromCenter({ x: s.targetCenter.x, y: g.minY + size.h / 2 }, size);
}

export function sceneRect(s: GameState): Rect {
  const rects = [referenceRect(s), guessRect(s)];
  if (s.phase === "RESULT") rects.push(correctRect(s));
  return unionRects(...rects);
}

function createInitialState(puzzle: Puzzle, viewport: Viewport): GameState {
  const refSize = sizeFor(puzzle.reference, puzzle.reference.actualMeasurement);
  // Start the target at the same on-screen height as the reference: a neutral, non-hinting guess.
  const startSize = sizeFor(puzzle.target, puzzle.target.axis === "height" ? refSize.h : 1);
  const guessScale =
    puzzle.target.axis === "height" ? refSize.h : refSize.h * (startSize.w / startSize.h);
  const targetSize = sizeFor(puzzle.target, guessScale);
  const gap = refSize.w * REFERENCE_GAP;
  const base: GameState = {
    puzzle,
    phase: "PLAYING",
    viewport,
    camera: { cx: 0, cy: 0, zoom: 1 },
    referenceCenter: { x: 0, y: refSize.h / 2 },
    targetCenter: { x: refSize.w / 2 + gap + targetSize.w / 2, y: targetSize.h / 2 },
    guessScale,
    finalGuessScale: null,
  };
  return { ...base, camera: fitCamera(sceneRect(base), viewport, INITIAL_MARGIN) };
}

function reducer(state: GameState | null, action: Action): GameState | null {
  if (action.type === "init") return createInitialState(action.puzzle, action.viewport);
  if (!state) return state;

  switch (action.type) {
    case "viewport": {
      const { width, height } = action.viewport;
      if (width === state.viewport.width && height === state.viewport.height) return state;
      // Keep the same framing: scale zoom with the viewport width if valid.
      const zoom =
        state.viewport.width > 0 && width > 0
          ? state.camera.zoom * (width / state.viewport.width)
          : state.camera.zoom;
      const next = { ...state, viewport: action.viewport, camera: { ...state.camera, zoom } };
      return { ...next, camera: clampCamera(next.camera, sceneRect(next), next.viewport) };
    }
    case "moveTarget": {
      if (state.phase !== "PLAYING") return state;
      const bounds = visibleWorldRect(state.camera, state.viewport);
      const size = sizeFor(state.puzzle.target, state.guessScale);
      return { ...state, targetCenter: clampCenter(action.center, size, bounds) };
    }
    case "resizeTarget": {
      if (state.phase !== "PLAYING") return state;
      const target = state.puzzle.target;
      const current = sizeFor(target, state.guessScale);
      const bounds = visibleWorldRect(state.camera, state.viewport);
      const maxScale = state.guessScale * maxScaleFactorAt(state.targetCenter, current, bounds);
      const minScale = minScaleForPx(state.guessScale, current, state.camera.zoom);
      const scale = Math.min(Math.max(action.scale, minScale), Math.max(maxScale, minScale));
      return { ...state, guessScale: scale };
    }
    case "zoom": {
      const scene = sceneRect(state);
      const { min, max } = zoomLimits(scene, state.viewport);
      const zoom = Math.min(Math.max(state.camera.zoom * action.factor, min), max);
      return { ...state, camera: clampCamera({ ...state.camera, zoom }, scene, state.viewport) };
    }
    case "fit":
      return { ...state, camera: fitCamera(sceneRect(state), state.viewport, FIT_MARGIN) };
    case "lockIn": {
      if (state.phase !== "PLAYING") return state;
      const locked: GameState = { ...state, phase: "RESULT", finalGuessScale: state.guessScale };
      return { ...locked, camera: fitCamera(sceneRect(locked), locked.viewport, FIT_MARGIN) };
    }
  }
}

export function useGame() {
  const [state, dispatch] = useReducer(reducer, null);
  const zoomInfo = state ? zoomLimits(sceneRect(state), state.viewport) : null;
  const fitBaseZoom = state ? fitZoom(sceneRect(state), state.viewport) : null;
  return {
    state,
    canZoomIn: !!state && !!zoomInfo && state.camera.zoom < zoomInfo.max * 0.999,
    canZoomOut: !!state && !!zoomInfo && state.camera.zoom > zoomInfo.min * 1.001,
    zoomPercent: state && fitBaseZoom ? Math.round((state.camera.zoom / fitBaseZoom) * 100) : 0,
    init: (puzzle: Puzzle, viewport: Viewport) => dispatch({ type: "init", puzzle, viewport }),
    setViewport: (viewport: Viewport) => dispatch({ type: "viewport", viewport }),
    moveTarget: (center: Vec) => dispatch({ type: "moveTarget", center }),
    resizeTarget: (scale: number) => dispatch({ type: "resizeTarget", scale }),
    zoomIn: () => dispatch({ type: "zoom", factor: 1.25 }),
    zoomOut: () => dispatch({ type: "zoom", factor: 0.8 }),
    fitBoth: () => dispatch({ type: "fit" }),
    lockIn: () => dispatch({ type: "lockIn" }),
  };
}

export type GameApi = ReturnType<typeof useGame>;
