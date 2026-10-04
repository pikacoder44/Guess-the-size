import { OBJECTS, PUZZLE_POOL, getObjectById } from "./data/objects";
import type { GameResult, GameMode, Puzzle, Statistics } from "./types";

export const TOTAL_ROUNDS = 5;

// ─────────────────────────────── Scoring ─────────────────────────────────────

export function calculateRelativeError(guess: number, actual: number): number {
  return Math.abs(guess - actual) / actual;
}

/**
 * Score formula: exponential decay.
 * Error 0% → 100 pts | Error ~17% → ~50 pts | Error >60% → ~5 pts
 * Full marks (100) awarded within ≈5% error.
 */
export function calculateScore(error: number): number {
  // Decay constant chosen so that error ≈ 0.05 → score ≈ 100
  // and error ≈ 0.5 → score ≈ 10
  return Math.max(0, Math.round(100 * Math.exp(-5 * error)));
}

// ─────────────────────────────── Seeding ─────────────────────────────────────

export function createDailySeed(date = new Date()): number {
  const value = `${date.getUTCFullYear()}-${date.getUTCMonth() + 1}-${date.getUTCDate()}`;
  return value
    .split("")
    .reduce(
      (seed, ch) => (seed * 31 + ch.charCodeAt(0)) >>> 0,
      2166136261,
    );
}

function seededRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

// ─────────────────────────────── Puzzle creation ─────────────────────────────

function createPuzzles(seed: number): Puzzle[] {
  const random = seededRandom(seed);
  // Shuffle puzzle pool
  const pool = [...PUZZLE_POOL].sort(() => random() - 0.5);
  const selected = pool.slice(0, TOTAL_ROUNDS);

  return selected.map(({ referenceId, targetId }) => {
    const reference = getObjectById(referenceId);
    const target = getObjectById(targetId);
    if (!reference || !target) {
      // Fallback: use first two objects
      return { reference: OBJECTS[0], target: OBJECTS[1] };
    }
    return { reference, target };
  });
}

export function getDailyPuzzles(date = new Date()): Puzzle[] {
  return createPuzzles(createDailySeed(date));
}

export function getRandomPracticePuzzles(): Puzzle[] {
  return createPuzzles(Math.floor(Math.random() * 2 ** 32));
}

// ─────────────────────────────── Formatting ──────────────────────────────────

export function formatMeasurement(value: number, unit: string): string {
  if (unit === "km") return `${value.toFixed(0)} km`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)} km`;
  if (value >= 100) return `${value.toFixed(0)} m`;
  if (value >= 10) return `${value.toFixed(1)} m`;
  if (value >= 1) return `${value.toFixed(2)} m`;
  return `${(value * 100).toFixed(0)} cm`;
}

export function getTodayString(): string {
  return new Date().toISOString().slice(0, 10);
}

// ─────────────────────────────── Statistics ──────────────────────────────────

export function defaultStatistics(): Statistics {
  return {
    gamesPlayed: 0,
    dailyGamesCompleted: 0,
    bestScore: 0,
    averageScore: 0,
    currentStreak: 0,
    longestStreak: 0,
    totalRounds: 0,
    perfectRounds: 0,
    dailyHistory: {},
  };
}

export function updateStatistics(
  previous: Statistics,
  result: GameResult,
  mode: GameMode,
): Statistics {
  const gamesPlayed = previous.gamesPlayed + 1;
  const dailyGamesCompleted =
    previous.dailyGamesCompleted + (mode === "daily" ? 1 : 0);

  // Streak: only increment if daily and consecutive
  let currentStreak = previous.currentStreak;
  if (mode === "daily") {
    const today = getTodayString();
    const yesterday = new Date(Date.now() - 86_400_000)
      .toISOString()
      .slice(0, 10);
    if (previous.lastDailyDate === yesterday || previous.lastDailyDate === today) {
      currentStreak = previous.currentStreak + 1;
    } else {
      currentStreak = 1;
    }
  }

  const dailyHistory =
    mode === "daily" && result.date
      ? {
          ...previous.dailyHistory,
          [result.date]: { score: result.totalScore, completed: true },
        }
      : previous.dailyHistory;

  return {
    ...previous,
    gamesPlayed,
    dailyGamesCompleted,
    bestScore: Math.max(previous.bestScore, result.totalScore),
    averageScore: Math.round(
      (previous.averageScore * previous.gamesPlayed + result.totalScore) /
        gamesPlayed,
    ),
    currentStreak,
    longestStreak: Math.max(previous.longestStreak, currentStreak),
    totalRounds: previous.totalRounds + result.rounds.length,
    perfectRounds:
      previous.perfectRounds +
      result.rounds.filter((r) => r.score === 100).length,
    lastDailyDate: mode === "daily" ? result.date : previous.lastDailyDate,
    dailyHistory,
  };
}
