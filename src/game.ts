import { OBJECTS, REFERENCE_OBJECT } from "./data/objects";
import type { GameResult, Puzzle, Statistics } from "./types";

export const TOTAL_ROUNDS = 5;
export const REFERENCE = REFERENCE_OBJECT;

export function calculateRelativeError(guess: number, actual: number) {
  return Math.abs(guess - actual) / actual;
}

export function calculateScore(error: number) {
  return Math.max(0, Math.round(100 * Math.exp(-4.2 * error)));
}

export function createDailySeed(date = new Date()) {
  const value = `${date.getUTCFullYear()}-${date.getUTCMonth() + 1}-${date.getUTCDate()}`;
  return value
    .split("")
    .reduce(
      (seed, character) => (seed * 31 + character.charCodeAt(0)) >>> 0,
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

function createPuzzles(seed: number): Puzzle[] {
  const random = seededRandom(seed);
  const candidates = OBJECTS.filter((object) => object.id !== REFERENCE.id);
  const shuffled = [...candidates].sort(() => random() - 0.5);
  return shuffled
    .slice(0, TOTAL_ROUNDS)
    .map((target) => ({ reference: REFERENCE, target }));
}

export function getDailyPuzzles(date = new Date()) {
  return createPuzzles(createDailySeed(date));
}

export function getRandomPracticePuzzles() {
  return createPuzzles(Math.floor(Math.random() * 2 ** 32));
}

export function formatMeasurement(value: number, unit: string) {
  const decimals = value >= 100 ? 0 : value >= 10 ? 1 : 2;
  return `${value.toFixed(decimals)} ${unit}`;
}

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
  };
}

export function updateStatistics(
  previous: Statistics,
  result: GameResult,
): Statistics {
  const gamesPlayed = previous.gamesPlayed + 1;
  const dailyGamesCompleted =
    previous.dailyGamesCompleted + (result.mode === "daily" ? 1 : 0);
  const currentStreak =
    result.mode === "daily"
      ? previous.currentStreak + 1
      : previous.currentStreak;
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
      result.rounds.filter((round) => round.score === 100).length,
    lastDailyDate:
      result.mode === "daily" ? result.date : previous.lastDailyDate,
  };
}
