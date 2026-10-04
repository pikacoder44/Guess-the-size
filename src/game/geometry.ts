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
/** Max zoom multiplier over the zoom that fits the scene. */
export const MAX_ZOOM_MULTIPLIER = 4;
/** Smallest on-screen side length of the target, in px. */
export const MIN_TARGET_PX = 14;

/** Converts a point from viewport screen pixels (y down, origin at top-left) to world metres (y up). */
export function screenToWorld(pt: Vec, camera: Camera, vp: Viewport): Vec {
  return {
    x: camera.cx + (pt.x - vp.width / 2) / camera.zoom,
    y: camera.cy - (pt.y - vp.height / 2) / camera.zoom,
  };
}

/** Converts a point from world metres (y up) to viewport screen pixels (y down, origin at top-left). */
export function worldToScreen(pt: Vec, camera: Camera, vp: Viewport): Vec {
  return {
    x: vp.width / 2 + (pt.x - camera.cx) * camera.zoom,
    y: vp.height / 2 - (pt.y - camera.cy) * camera.zoom,
  };
}

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

/** Smallest measurement scale so the object's smallest screen dimension is at least `minPx`. */
export function minScaleForPx(
  scale: number,
  size: Size,
  zoom: number,
  minPx = MIN_TARGET_PX,
): number {
  const minSidePx = Math.min(size.w, size.h) * zoom;
  if (minSidePx <= 1e-6) return scale;
  return (scale * minPx) / minSidePx;
}

export function rectFromCenter(c: Vec, s: Size): Rect {
  return { minX: c.x - s.w / 2, maxX: c.x + s.w / 2, minY: c.y - s.h / 2, maxY: c.y + s.h / 2 };
}

/** Computes the minimal bounding box enclosing all provided rectangles. */
export function unionRects(first: Rect, ...rest: Rect[]): Rect;
export function unionRects(...rects: Rect[]): Rect;
export function unionRects(...rects: Rect[]): Rect {
  if (rects.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
  }
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
  const fit = fitZoom(rect, vp);
  return { min: fit * MIN_ZOOM_FRACTION, max: fit * MAX_ZOOM_MULTIPLIER };
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
  if (size.w <= 0 || size.h <= 0) return 0;
  const factor = Math.min(
    (2 * (c.x - bounds.minX)) / size.w,
    (2 * (bounds.maxX - c.x)) / size.w,
    (2 * (c.y - bounds.minY)) / size.h,
    (2 * (bounds.maxY - c.y)) / size.h,
  );
  return Math.max(0, factor);
}

/** Screen-space box (px, y down) for a world rect. */
export function rectToScreen(rect: Rect, cam: Camera, vp: Viewport) {
  const topLeft = worldToScreen({ x: rect.minX, y: rect.maxY }, cam, vp);
  return {
    left: topLeft.x,
    top: topLeft.y,
    width: (rect.maxX - rect.minX) * cam.zoom,
    height: (rect.maxY - rect.minY) * cam.zoom,
  };
}
