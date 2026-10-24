/**
 * Scoring and error calculation utilities for ScaleGuess.
 */

/**
 * Calculates absolute percentage error between player guess and ground truth measurement.
 * Formula: (|guess - actual| / actual) * 100, rounded to 1 decimal place.
 */
export function calculatePercentError(guessMeters: number, actualMeters: number): number {
  if (actualMeters <= 0) return 0;
  const error = (Math.abs(guessMeters - actualMeters) / actualMeters) * 100;
  return Number(error.toFixed(1)); // Rounded cleanly to 1 decimal place
}

/**
 * 0–100 score from the ratio between guess and answer.
 * Exact = 100; off by a factor of 2 (either way) or more = 0.
 */
export function calculateScore(guess: number, correct: number): number {
  if (guess <= 0 || correct <= 0) return 0;
  const ratioError = Math.abs(Math.log(guess / correct));
  return Math.round(100 * Math.max(0, 1 - ratioError / Math.LN2));
}

/**
 * Alias for calculatePercentError to ensure platform-wide compatibility.
 */
export const percentError = calculatePercentError;
export default calculatePercentError;
