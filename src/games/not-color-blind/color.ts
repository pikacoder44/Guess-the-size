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
 * Standard HSB (HSV) to RGB conversion.
 * Supports both object input `hsbToRgb(hsb)` -> `{ r, g, b }`
 * and coordinate tuple input `hsbToRgb(h, s, b)` -> `[r, g, b]`.
 */
export function hsbToRgb(hsb: ColorHSB): { r: number; g: number; b: number };
export function hsbToRgb(h: number, s: number, b: number): [number, number, number];
export function hsbToRgb(
  hOrHsb: number | ColorHSB,
  s?: number,
  b?: number
): { r: number; g: number; b: number } | [number, number, number] {
  if (typeof hOrHsb === "object") {
    const h = ((hOrHsb.h % 360) + 360) % 360;
    const sNorm = Math.max(0, Math.min(100, hOrHsb.s)) / 100;
    const bNorm = Math.max(0, Math.min(100, hOrHsb.b)) / 100;

    const k = (n: number) => (n + h / 60) % 6;
    const f = (n: number) => bNorm * (1 - sNorm * Math.max(0, Math.min(k(n), 4 - k(n), 1)));

    return {
      r: Math.round(f(5) * 255),
      g: Math.round(f(3) * 255),
      b: Math.round(f(1) * 255),
    };
  }

  const h = ((hOrHsb % 360) + 360) % 360;
  const sNorm = Math.max(0, Math.min(100, s ?? 0)) / 100;
  const bNorm = Math.max(0, Math.min(100, b ?? 0)) / 100;

  const k = (n: number) => (n + h / 60) % 6;
  const f = (n: number) => bNorm * (1 - sNorm * Math.max(0, Math.min(k(n), 4 - k(n), 1)));

  return [Math.round(255 * f(5)), Math.round(255 * f(3)), Math.round(255 * f(1))];
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
 * Strict perceptual human color difference calculation (weighted Euclidean RGB distance):
 * Uses human eye perception weights (red-mean weighted metric):
 *   dr = r1 - r2, dg = g1 - g2, db = b1 - b2, rMean = (r1 + r2) / 2
 *   distance = sqrt((2 + rMean/256) * dr^2 + 4 * dg^2 + (2 + (255 - rMean)/256) * db^2)
 *
 * Max distance in weighted RGB space is approx 765.
 * An exponential penalty curve (power 2.5) ensures noticeable perceptual shifts
 * drop scores significantly (e.g., 350° vs 315° & 79% vs 42% S drops to ~50–55 range).
 */
export function calculateColorScore(color1: ColorHSB, color2: ColorHSB): ScoreBreakdown {
  const [r1, g1, b1] = hsbToRgb(color1.h, color1.s, color1.b);
  const [r2, g2, b2] = hsbToRgb(color2.h, color2.s, color2.b);

  // Weighted Euclidean RGB distance for human vision perception
  const rMean = (r1 + r2) / 2;
  const dr = r1 - r2;
  const dg = g1 - g2;
  const db = b1 - b2;

  const distance = Math.sqrt(
    (2 + rMean / 256) * dr * dr +
    4 * dg * dg +
    (2 + (255 - rMean) / 256) * db * db
  );

  // Max distance in weighted RGB space is approx 765
  const maxDistance = 765;
  const normalizedError = distance / maxDistance;

  // Exponential penalty scale so noticeable visual differences drop score significantly
  // A distance like image_08e9bb yields a score in the 40-55 range, not 80.
  const score = Math.max(0, Math.min(100, Math.round(100 * Math.pow(1 - normalizedError, 2.5))));

  // Angular Hue & component deltas for diagnostics/breakdown metrics
  const absHueDiff = Math.abs(color1.h - color2.h);
  const dh = Math.min(absHueDiff, 360 - absHueDiff) / 180;
  const ds = Math.abs(color1.s - color2.s) / 100;
  const dbComponent = Math.abs(color1.b - color2.b) / 100;

  const breakdown: ScoreBreakdown = {
    score,
    dh,
    ds,
    db: dbComponent,
    distance,
    normalizedError,
  };

  Object.defineProperty(breakdown, "valueOf", {
    value: () => score,
    enumerable: false,
  });

  Object.defineProperty(breakdown, Symbol.toPrimitive, {
    value: () => score,
    enumerable: false,
  });

  return breakdown;
}
