import type { ColorHSB } from "@/games/not-color-blind/types";

const API_BASE = import.meta.env.VITE_API_URL || "";
const STORAGE_LOCAL_SCORES_KEY = "not_color_blind_local_scores";
const STORAGE_PENDING_SCORES_KEY = "not_color_blind_pending_scores";
const STORAGE_BEST_SCORE_KEY = "not_color_blind_best_score";

export interface NotColorBlindScorePayload {
  userId?: string | null;
  playerName?: string;
  score: number;
  targetHsb: ColorHSB;
  predictedHsb: ColorHSB;
  timeTakenSeconds: number;
}

export interface NotColorBlindScoreRecord {
  id: string;
  user_id: string | null;
  player_name: string;
  score: number;
  target_hsb: ColorHSB;
  predicted_hsb: ColorHSB;
  time_taken_seconds: number;
  created_at: string;
}

export interface SubmitNotColorBlindResponse {
  success: boolean;
  scoreRecord: NotColorBlindScoreRecord;
  isPersonalBest: boolean;
  offlineFallback?: boolean;
}

export interface NotColorBlindLeaderboardResponse {
  success: boolean;
  leaderboard: NotColorBlindScoreRecord[];
}

/**
 * Retrieve personal best score from localStorage.
 */
export function getNotColorBlindPersonalBest(): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = localStorage.getItem(STORAGE_BEST_SCORE_KEY);
    const num = Number(raw);
    return !isNaN(num) && num >= 0 ? num : 0;
  } catch {
    return 0;
  }
}

/**
 * Update personal best score in localStorage if the new score is higher.
 * Returns true if a new personal best was established.
 */
export function recordPersonalBest(score: number): boolean {
  if (typeof window === "undefined") return false;
  try {
    const currentBest = getNotColorBlindPersonalBest();
    if (score > currentBest) {
      localStorage.setItem(STORAGE_BEST_SCORE_KEY, String(score));
      return true;
    }
  } catch {
    // Ignore storage quota/security errors
  }
  return false;
}

/**
 * Get all cached/offline scores from localStorage.
 */
export function getLocalNotColorBlindScores(): NotColorBlindScoreRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_LOCAL_SCORES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Save a score record to local storage history.
 */
function saveLocalScoreRecord(record: NotColorBlindScoreRecord): void {
  if (typeof window === "undefined") return;
  try {
    const existing = getLocalNotColorBlindScores();
    const updated = [record, ...existing.filter((s) => s.id !== record.id)].slice(0, 100);
    localStorage.setItem(STORAGE_LOCAL_SCORES_KEY, JSON.stringify(updated));
  } catch {
    // Ignore storage errors
  }
}

/**
 * Queue a score payload in localStorage when network is unavailable.
 */
function queuePendingScore(payload: NotColorBlindScorePayload): void {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(STORAGE_PENDING_SCORES_KEY);
    const queue = raw ? JSON.parse(raw) : [];
    queue.push({ payload, queuedAt: new Date().toISOString() });
    localStorage.setItem(STORAGE_PENDING_SCORES_KEY, JSON.stringify(queue.slice(-20)));
  } catch {
    // Ignore storage errors
  }
}

/**
 * Submit a completed Not Color Blind score.
 * Sends POST /api/scores/not-color-blind.
 * Gracefully falls back to localStorage if offline or network fails.
 */
export async function submitNotColorBlindScore(
  payload: NotColorBlindScorePayload,
  token?: string | null
): Promise<SubmitNotColorBlindResponse> {
  const safeScore = Math.max(0, Math.min(100, Math.round(payload.score)));
  const safeTimeTaken = Number(Math.max(0, payload.timeTakenSeconds).toFixed(2));
  const safePlayerName = payload.playerName?.trim() || "Anonymous";
  const safeUserId = payload.userId?.trim() || null;

  const sanitizedPayload: NotColorBlindScorePayload = {
    userId: safeUserId,
    playerName: safePlayerName,
    score: safeScore,
    targetHsb: {
      h: Math.round(payload.targetHsb.h),
      s: Math.round(payload.targetHsb.s),
      b: Math.round(payload.targetHsb.b),
    },
    predictedHsb: {
      h: Math.round(payload.predictedHsb.h),
      s: Math.round(payload.predictedHsb.s),
      b: Math.round(payload.predictedHsb.b),
    },
    timeTakenSeconds: safeTimeTaken,
  };

  // Check personal best before updating
  const prevBest = getNotColorBlindPersonalBest();
  const isPersonalBest = safeScore > prevBest;
  if (isPersonalBest) {
    recordPersonalBest(safeScore);
  }

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE}/api/scores/not-color-blind`, {
      method: "POST",
      headers,
      body: JSON.stringify(sanitizedPayload),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData?.error || `Server responded with HTTP ${res.status}`);
    }

    const data = await res.json();
    const scoreRecord: NotColorBlindScoreRecord = data.scoreRecord;

    // Cache locally as well
    saveLocalScoreRecord(scoreRecord);

    return {
      success: true,
      scoreRecord,
      isPersonalBest,
      offlineFallback: false,
    };
  } catch (err: unknown) {
    console.warn("Not Color Blind: Network submission failed, falling back to local storage:", err);

    const fallbackRecord: NotColorBlindScoreRecord = {
      id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      user_id: safeUserId,
      player_name: safePlayerName,
      score: safeScore,
      target_hsb: sanitizedPayload.targetHsb,
      predicted_hsb: sanitizedPayload.predictedHsb,
      time_taken_seconds: safeTimeTaken,
      created_at: new Date().toISOString(),
    };

    saveLocalScoreRecord(fallbackRecord);
    queuePendingScore(sanitizedPayload);

    return {
      success: true,
      scoreRecord: fallbackRecord,
      isPersonalBest,
      offlineFallback: true,
    };
  }
}

/**
 * Fetch top entries from GET /api/scores/not-color-blind/leaderboard.
 * Falls back to locally recorded scores if offline.
 */
export async function fetchNotColorBlindLeaderboard(
  limit = 50
): Promise<NotColorBlindLeaderboardResponse> {
  const safeLimit = Math.max(1, Math.min(100, limit));

  try {
    const res = await fetch(`${API_BASE}/api/scores/not-color-blind/leaderboard?limit=${safeLimit}`);
    if (!res.ok) {
      throw new Error(`Failed to fetch leaderboard: HTTP ${res.status}`);
    }
    const data = await res.json();
    const serverEntries: NotColorBlindScoreRecord[] = Array.isArray(data.leaderboard)
      ? data.leaderboard
      : [];

    return {
      success: true,
      leaderboard: serverEntries,
    };
  } catch (err: unknown) {
    console.warn("Not Color Blind: Leaderboard fetch failed, using local store:", err);

    // Fallback: load local scores and sort deterministically
    const local = getLocalNotColorBlindScores();
    const sorted = [...local]
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.time_taken_seconds - b.time_taken_seconds;
      })
      .slice(0, safeLimit);

    return {
      success: true,
      leaderboard: sorted,
    };
  }
}
