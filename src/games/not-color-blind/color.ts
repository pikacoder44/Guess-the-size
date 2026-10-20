import type { ColorHSB, ScoreBreakdown } from "./types";

/**
 * Generate a random target HSB color for the memorization stage:
 * h: 0–360 degrees, s: 20–100%, b: 20–100%.
 */
export function randomTargetHsb(): ColorHSB {
  return {
    h: Math.floor(Math.random() * 361),
    s: Math.floor(Math.random() * 81) + 20,
    b: Math.floor(Math.random() * 81) + 20,
  };
}

/**
 * Generate random starting prediction sliders for the recall stage:
 * h: 0–360 degrees, s: 0–100%, b: 0–100%.
 */
export function randomPredictionHsb(): ColorHSB {
  return {
    h: Math.floor(Math.random() * 361),
    s: Math.floor(Math.random() * 101),
    b: Math.floor(Math.random() * 101),
  };
}

/**
 * Standard HSB (HSV) to RGB conversion:
 * h: [0, 360], s: [0, 100], b: [0, 100] -> r, g, b in [0, 255].
 */
export function hsbToRgb(hsb: ColorHSB): { r: number; g: number; b: number } {
  const h = ((hsb.h % 360) + 360) % 360;
  const s = Math.max(0, Math.min(100, hsb.s)) / 100;
  const b = Math.max(0, Math.min(100, hsb.b)) / 100;

  const k = (n: number) => (n + h / 60) % 6;
  const f = (n: number) => b * (1 - s * Math.max(0, Math.min(k(n), 4 - k(n), 1)));

  return {
    r: Math.round(f(5) * 255),
    g: Math.round(f(3) * 255),
    b: Math.round(f(1) * 255),
  };
}

/**
 * Convert HSB to CSS rgb string: "rgb(r, g, b)".
 */
export function hsbToCss(hsb: ColorHSB): string {
  const { r, g, b } = hsbToRgb(hsb);
  return `rgb(${r}, ${g}, ${b})`;
}

/**
 * Convert HSB to CSS hex string: "#RRGGBB".
 */
export function hsbToHex(hsb: ColorHSB): string {
  const { r, g, b } = hsbToRgb(hsb);
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`.toUpperCase();
}

/**
 * Compute perceived luminance to pick high-contrast text styles.
 */
export function getPerceivedLuminance(hsb: ColorHSB): number {
  const { r, g, b } = hsbToRgb(hsb);
  return (r * 299 + g * 587 + b * 114) / 1000;
}

/**
 * Check if color is light (perceived luminance > 135) to determine text contrast.
 */
export function isLightColor(hsb: ColorHSB): boolean {
  return getPerceivedLuminance(hsb) > 135;
}

/**
 * Compute match score (0 - 100 scale):
 * dh = min(|h1 - h2|, 360 - |h1 - h2|) / 180
 * ds = |s1 - s2| / 100
 * db = |b1 - b2| / 100
 * Score = Math.max(0, Math.round(100 * (1 - (0.5 * dh + 0.25 * ds + 0.25 * db))))
 */
export function calculateColorScore(target: ColorHSB, prediction: ColorHSB): ScoreBreakdown {
  const absHueDiff = Math.abs(target.h - prediction.h);
  const dh = Math.min(absHueDiff, 360 - absHueDiff) / 180;
  const ds = Math.abs(target.s - prediction.s) / 100;
  const db = Math.abs(target.b - prediction.b) / 100;

  const weightedError = 0.5 * dh + 0.25 * ds + 0.25 * db;
  const score = Math.max(0, Math.min(100, Math.round(100 * (1 - weightedError))));

  return { score, dh, ds, db };
}
