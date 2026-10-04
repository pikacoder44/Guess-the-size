/** Signed percentage error of a guess relative to the correct value. */
export function percentError(guess: number, correct: number): number {
  return ((guess - correct) / correct) * 100;
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

export function formatMeasurement(metres: number): string {
  return metres < 1 ? `${Math.round(metres * 100)} cm` : `${metres.toFixed(2)} m`;
}
