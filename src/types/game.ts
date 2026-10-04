import type { ScaleObject } from "../types";

export type GamePhase = "PLAYING" | "RESULT";

export interface Position {
  x: number;
  y: number;
}

export interface RoundState {
  phase: GamePhase;
  reference: ScaleObject;
  target: ScaleObject;
  // Live target transform during PLAYING
  targetPosition: Position;
  targetScale: number;
  // Captured result data after Lock In
  capturedGuessScale: number | null;
  guessedDimension: number | null;
  correctDimension: number;
  correctScale: number;
  score: number | null;
  relativeError: number | null;
}

export interface ScoringResult {
  guessedDimension: number;
  correctDimension: number;
  correctScale: number;
  relativeError: number;
  score: number;
  differenceFormatted: string;
}
