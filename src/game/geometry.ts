import type { GameObject } from "./types";

/** World units are metres, y axis points up. */
export type Vec = { x: number; y: number };
export type Size = { w: number; h: number };
export type Rect = { minX: number; minY: number; maxX: number; maxY: number };
export type Camera = { cx: number; cy: number; zoom: number }; // zoom = px per metre
export type Viewport = { width: number; height: number };

/** Screen-space gap objects keep from the viewport edge. */
export const VIEW_PADDING = 12;
/** Min zoom as a fraction of the zoom that fits the scene. */
export const MIN_ZOOM_FRACTION = 0.2;
/** Smallest on-screen side length of the target, in px. */
export const MIN_TARGET_PX = 14;

export function aspectOf(obj: GameObject): number {
  const vb = obj.silhouette.viewBox;
  return vb.width / vb.height;
}

/** World dimensions of an object for a given measurement along its axis. */
export function sizeFor(obj: GameObject, measurement: number): Size {
  const aspect = aspectOf(obj);
  return obj.axis === "height"
    ? { w: measurement * aspect, h: measurement }
    : { w: measurement, h: measurement / aspect };
}

/** Inverse of sizeFor: the measurement along the object's axis. */
export function measurementFor(obj: GameObject, size: Size): number {
  return obj.axis === "height" ? size.h : size.w;
}

export function rectFromCenter(c: Vec, s: Size): Rect {
  return { minX: c.x - s.w / 2, maxX: c.x + s.w / 2, minY: c.y - s.h / 2, maxY: c.y + s.h / 2 };
}

export function unionRects(...rects: Rect[]): Rect {
  return rects.reduce((a, b) => ({
    minX: Math.min(a.minX, b.minX),
    minY: Math.min(a.minY, b.minY),
    maxX: Math.max(a.maxX, b.maxX),
    maxY: Math.max(a.maxY, b.maxY),
  }));
}

export function fitZoom(rect: Rect, vp: Viewport, pad = VIEW_PADDING): number {
  const rw = Math.max(rect.maxX - rect.minX, 1e-6);
  const rh = Math.max(rect.maxY - rect.minY, 1e-6);
  return Math.max(1e-6, Math.min((vp.width - 2 * pad) / rw, (vp.height - 2 * pad) / rh));
}

export function fitCamera(rect: Rect, vp: Viewport, margin = 1): Camera {
  return {
    cx: (rect.minX + rect.maxX) / 2,
    cy: (rect.minY + rect.maxY) / 2,
    zoom: fitZoom(rect, vp) * margin,
  };
}

export function zoomLimits(rect: Rect, vp: Viewport): { min: number; max: number } {
  const max = fitZoom(rect, vp);
  return { min: max * MIN_ZOOM_FRACTION, max };
}

/** Moves the camera centre so `rect` stays fully visible at the camera's zoom. */
export function clampCamera(cam: Camera, rect: Rect, vp: Viewport, pad = VIEW_PADDING): Camera {
  const halfW = (vp.width / 2 - pad) / cam.zoom;
  const halfH = (vp.height / 2 - pad) / cam.zoom;
  const clampAxis = (v: number, lo: number, hi: number) =>
    lo > hi ? (lo + hi) / 2 : Math.min(Math.max(v, lo), hi);
  return {
    ...cam,
    cx: clampAxis(cam.cx, rect.maxX - halfW, rect.minX + halfW),
    cy: clampAxis(cam.cy, rect.maxY - halfH, rect.minY + halfH),
  };
}

/** World rect currently visible, inset by padding. */
export function visibleWorldRect(cam: Camera, vp: Viewport, pad = VIEW_PADDING): Rect {
  const halfW = (vp.width / 2 - pad) / cam.zoom;
  const halfH = (vp.height / 2 - pad) / cam.zoom;
  return { minX: cam.cx - halfW, maxX: cam.cx + halfW, minY: cam.cy - halfH, maxY: cam.cy + halfH };
}

/** Clamps a centre so a box of `size` stays inside `bounds`. */
export function clampCenter(c: Vec, size: Size, bounds: Rect): Vec {
  const clampAxis = (v: number, lo: number, hi: number) =>
    lo > hi ? (lo + hi) / 2 : Math.min(Math.max(v, lo), hi);
  return {
    x: clampAxis(c.x, bounds.minX + size.w / 2, bounds.maxX - size.w / 2),
    y: clampAxis(c.y, bounds.minY + size.h / 2, bounds.maxY - size.h / 2),
  };
}

/** Largest uniform scale factor for a box centred at `c` that keeps it inside `bounds`. */
export function maxScaleFactorAt(c: Vec, size: Size, bounds: Rect): number {
  return Math.min(
    (2 * (c.x - bounds.minX)) / size.w,
    (2 * (bounds.maxX - c.x)) / size.w,
    (2 * (c.y - bounds.minY)) / size.h,
    (2 * (bounds.maxY - c.y)) / size.h,
  );
}

/** Screen-space box (px, y down) for a world rect. */
export function rectToScreen(rect: Rect, cam: Camera, vp: Viewport) {
  return {
    left: (rect.minX - cam.cx) * cam.zoom + vp.width / 2,
    top: vp.height / 2 - (rect.maxY - cam.cy) * cam.zoom,
    width: (rect.maxX - rect.minX) * cam.zoom,
    height: (rect.maxY - rect.minY) * cam.zoom,
  };
}
