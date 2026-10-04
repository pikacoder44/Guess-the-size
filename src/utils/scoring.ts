import type { ScaleObject } from "../types";
import type { ScoringResult } from "../types/game";

export function formatDimension(value: number, unit: string): string {
  if (unit === "km") return `${value.toFixed(1)} km`;
  if (value >= 1000) return `${(value / 1000).toFixed(2)} km`;
  if (value >= 100) return `${value.toFixed(0)} m`;
  if (value >= 10) return `${value.toFixed(1)} m`;
  if (value >= 1) return `${value.toFixed(2)} m`;
  return `${(value * 100).toFixed(0)} cm`;
}

export function computeScore(
  guessScale: number,
  reference: ScaleObject,
  target: ScaleObject,
): ScoringResult {
  const guessedDimension = guessScale * reference.dimension;
  const correctDimension = target.dimension;
  const correctScale = target.dimension / reference.dimension;
  
  const diff = guessedDimension - correctDimension;
  const relativeError = Math.abs(diff) / correctDimension;

  // Exponential decay score: 0% error -> 100 pts, ~17% error -> ~50 pts, >60% error -> <5 pts
  const score = Math.max(0, Math.round(100 * Math.exp(-5 * relativeError)));

  const percentDiff = (relativeError * 100).toFixed(1);
  let differenceFormatted = "";
  if (Math.abs(diff) < 0.001) {
    differenceFormatted = "Exact match!";
  } else if (diff > 0) {
    differenceFormatted = `+${percentDiff}% larger than actual`;
  } else {
    differenceFormatted = `-${percentDiff}% smaller than actual`;
  }

  return {
    guessedDimension,
    correctDimension,
    correctScale,
    relativeError,
    score,
    differenceFormatted,
  };
}
