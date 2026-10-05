import { useReducer } from "react";
import {
  clampCamera,
  clampCenter,
  fitZoom,
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

const INITIAL_MARGIN = 0.85;
const FIT_MARGIN = 0.9;
const REFERENCE_GAP = 0.25; // fraction of reference width between objects
const FLOOR_BOTTOM_PADDING_PX = 32; // Exact pixel clearance from bottom border

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

/* ---------- Floor-Anchored Camera Helper ---------- */

/**
 * Fits the scene horizontally & vertically while aligning y = 0
 * to sit `FLOOR_BOTTOM_PADDING_PX` above the bottom edge of the viewport.
 */
function fitCameraToFloor(rect: Rect, vp: Viewport, margin = FIT_MARGIN): Camera {
  // Available height excluding bottom floor margin and top breathing room
  const availH = Math.max(1, vp.height - FLOOR_BOTTOM_PADDING_PX - 40);
  const availW = Math.max(1, vp.width * margin);
  
  const zoomW = availW / Math.max(0.1, rect.maxX - rect.minX);
  const zoomH = availH / Math.max(0.1, rect.maxY - 0); // Ground baseline is at y = 0
  const zoom = Math.min(zoomW, zoomH);

  // In screen space: yScreen = (vp.h / 2) - (yWorld - cy) * zoom
  // We want yWorld = 0 to land at yScreen = (vp.h - FLOOR_BOTTOM_PADDING_PX):
  // vp.h - FLOOR_BOTTOM_PADDING_PX = (vp.h / 2) + cy * zoom
  // cy * zoom = (vp.h / 2) - FLOOR_BOTTOM_PADDING_PX
  const cy = (vp.height / 2 - FLOOR_BOTTOM_PADDING_PX) / zoom;
  const cx = (rect.minX + rect.maxX) / 2;

  return { cx, cy, zoom };
}

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
    // Both objects sit flush on the baseline y = 0
    referenceCenter: { x: 0, y: refSize.h / 2 },
    targetCenter: { x: refSize.w / 2 + gap + targetSize.w / 2, y: targetSize.h / 2 },
    guessScale,
    finalGuessScale: null,
  };

  return { ...base, camera: fitCameraToFloor(sceneRect(base), viewport, INITIAL_MARGIN) };
}

function reducer(state: GameState | null, action: Action): GameState | null {
  if (action.type === "init") return createInitialState(action.puzzle, action.viewport);
  if (!state) return state;

  switch (action.type) {
    case "viewport": {
      const { width, height } = action.viewport;
      if (width === state.viewport.width && height === state.viewport.height) return state;
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
      // Keep object on or above the baseline (y >= 0)
      const clamped = clampCenter(action.center, size, bounds);
      return { ...state, targetCenter: { x: clamped.x, y: clamped.y } };
    }
    case "resizeTarget": {
      if (state.phase !== "PLAYING") return state;
      const target = state.puzzle.target;
      const current = sizeFor(target, state.guessScale);
      const bounds = visibleWorldRect(state.camera, state.viewport);
      
      // Bottom remains fixed to the baseline during resize
      const bottomY = Math.max(0, state.targetCenter.y - current.h / 2);
      const maxFactorY = current.h > 0 ? Math.max(0, (bounds.maxY - bottomY) / current.h) : 1;
      const maxFactorX = current.w > 0
        ? Math.max(0, Math.min(
            (2 * (state.targetCenter.x - bounds.minX)) / current.w,
            (2 * (bounds.maxX - state.targetCenter.x)) / current.w
          ))
        : 1;

      const maxScale = state.guessScale * Math.min(maxFactorY, maxFactorX);
      const minScale = minScaleForPx(state.guessScale, current, state.camera.zoom);
      const scale = Math.min(Math.max(action.scale, minScale), Math.max(maxScale, minScale));
      const nextSize = sizeFor(target, scale);
      
      const nextCenter = clampCenter(
        { x: state.targetCenter.x, y: bottomY + nextSize.h / 2 },
        nextSize,
        bounds
      );
      return { ...state, guessScale: scale, targetCenter: nextCenter };
    }
    case "zoom": {
      const scene = sceneRect(state);
      const { min, max } = zoomLimits(scene, state.viewport);
      const zoom = Math.min(Math.max(state.camera.zoom * action.factor, min), max);
      return { ...state, camera: clampCamera({ ...state.camera, zoom }, scene, state.viewport) };
    }
    case "fit":
      return { ...state, camera: fitCameraToFloor(sceneRect(state), state.viewport, FIT_MARGIN) };
    case "lockIn": {
      if (state.phase !== "PLAYING") return state;
      const locked: GameState = { ...state, phase: "RESULT", finalGuessScale: state.guessScale };
      return { ...locked, camera: fitCameraToFloor(sceneRect(locked), locked.viewport, FIT_MARGIN) };
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