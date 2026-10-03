import type { GameResult, Statistics } from "./types";
import { defaultStatistics } from "./game";

const STATS_KEY = "scaleguess:statistics";
const RESULT_KEY = "scaleguess:last-result";
const DAILY_KEY = "scaleguess:daily-result";

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

export function saveGameResult(result: GameResult, statistics: Statistics) {
  localStorage.setItem(STATS_KEY, JSON.stringify(statistics));
  localStorage.setItem(RESULT_KEY, JSON.stringify(result));
  if (result.mode === "daily" && result.date)
    localStorage.setItem(`${DAILY_KEY}:${result.date}`, JSON.stringify(result));
}

export function loadLastResult() {
  try {
    const saved = localStorage.getItem(RESULT_KEY);
    return saved ? (JSON.parse(saved) as GameResult) : null;
  } catch {
    return null;
  }
}

export function loadDailyResult(date: string) {
  try {
    const saved = localStorage.getItem(`${DAILY_KEY}:${date}`);
    return saved ? (JSON.parse(saved) as GameResult) : null;
  } catch {
    return null;
  }
}
