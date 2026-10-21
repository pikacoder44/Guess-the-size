export interface ColorHSB {
  h: number; // 0 - 360 degrees
  s: number; // 0 - 100 percentage
  b: number; // 0 - 100 percentage
}

export type GamePhase = "MEMORIZE" | "RECALL" | "RESULT" | "ROUND_RESULT" | "MATCH_SUMMARY";

export interface ScoreBreakdown {
  score: number; // 0 - 100
  dh: number; // Angular Hue difference / 180 (0 - 1)
  ds: number; // Saturation difference / 100 (0 - 1)
  db: number; // Brightness difference / 100 (0 - 1)
  distance?: number;
  normalizedError?: number;
}

export interface NotColorBlindRoundRecord {
  round: number; // 1 to 5
  targetHsb: ColorHSB;
  predictedHsb: ColorHSB;
  score: number; // 0 to 100
  scoreBreakdown: ScoreBreakdown;
  timeTakenSeconds: number;
}

