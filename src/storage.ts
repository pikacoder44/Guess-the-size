import type { GameResult, Statistics } from "./types";
import { defaultStatistics } from "./game";

const STATS_KEY = "scaleguess:statistics:v2";
const DAILY_KEY = "scaleguess:daily:v2";

export function loadStatistics(): Statistics {
  try {
    const saved = localStorage.getItem(STATS_KEY);
    return saved
      ? { ...defaultStatistics(), ...(JSON.parse(saved) as Statistics) }
      : defaultStatistics();
  } catch {
    return defaultStatistics();
  }
}

export function saveStatistics(stats: Statistics): void {
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch {
    // Storage may be full or disabled
  }
}

export function saveGameResult(result: GameResult, statistics: Statistics): void {
  saveStatistics(statistics);
  if (result.mode === "daily" && result.date) {
    try {
      localStorage.setItem(
        `${DAILY_KEY}:${result.date}`,
        JSON.stringify(result),
      );
    } catch {
      // ignore
    }
  }
}

export function loadDailyResult(date: string): GameResult | null {
  try {
    const saved = localStorage.getItem(`${DAILY_KEY}:${date}`);
    return saved ? (JSON.parse(saved) as GameResult) : null;
  } catch {
    return null;
  }
}

export function hasDailyBeenCompleted(date: string): boolean {
  return localStorage.getItem(`${DAILY_KEY}:${date}`) !== null;
}
