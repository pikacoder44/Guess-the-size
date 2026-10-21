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
  const safeScore = Math.max(0, Math.min(500, Math.round(payload.score)));
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

export const FALLBACK_NOT_COLOR_BLIND_CHAMPIONS: NotColorBlindScoreRecord[] = [
  {
    id: "ncb-champ-1",
    user_id: "901",
    player_name: "SpectrumSage",
    score: 488,
    target_hsb: { h: 214, s: 78, b: 92 },
    predicted_hsb: { h: 215, s: 76, b: 91 },
    time_taken_seconds: 2.84,
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: "ncb-champ-2",
    user_id: "902",
    player_name: "ChromaNinja",
    score: 476,
    target_hsb: { h: 48, s: 82, b: 95 },
    predicted_hsb: { h: 46, s: 80, b: 93 },
    time_taken_seconds: 3.12,
    created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    id: "ncb-champ-3",
    user_id: "903",
    player_name: "PrismaVision",
    score: 465,
    target_hsb: { h: 334, s: 70, b: 88 },
    predicted_hsb: { h: 338, s: 68, b: 85 },
    time_taken_seconds: 3.65,
    created_at: new Date(Date.now() - 3600000 * 9).toISOString(),
  },
  {
    id: "ncb-champ-4",
    user_id: "904",
    player_name: "HueWhisperer",
    score: 445,
    target_hsb: { h: 165, s: 64, b: 82 },
    predicted_hsb: { h: 171, s: 61, b: 80 },
    time_taken_seconds: 4.10,
    created_at: new Date(Date.now() - 3600000 * 14).toISOString(),
  },
  {
    id: "ncb-champ-5",
    user_id: "905",
    player_name: "RetinalMaster",
    score: 430,
    target_hsb: { h: 275, s: 58, b: 76 },
    predicted_hsb: { h: 281, s: 55, b: 77 },
    time_taken_seconds: 4.45,
    created_at: new Date(Date.now() - 3600000 * 20).toISOString(),
  },
  {
    id: "ncb-champ-6",
    user_id: "906",
    player_name: "OpticAce",
    score: 418,
    target_hsb: { h: 92, s: 85, b: 74 },
    predicted_hsb: { h: 99, s: 80, b: 72 },
    time_taken_seconds: 4.90,
    created_at: new Date(Date.now() - 3600000 * 28).toISOString(),
  },
  {
    id: "ncb-champ-7",
    user_id: "907",
    player_name: "TintTuner",
    score: 405,
    target_hsb: { h: 18, s: 92, b: 85 },
    predicted_hsb: { h: 26, s: 86, b: 82 },
    time_taken_seconds: 5.25,
    created_at: new Date(Date.now() - 3600000 * 36).toISOString(),
  },
  {
    id: "ncb-champ-8",
    user_id: "908",
    player_name: "ShadeShifter",
    score: 390,
    target_hsb: { h: 198, s: 52, b: 96 },
    predicted_hsb: { h: 210, s: 47, b: 91 },
    time_taken_seconds: 5.60,
    created_at: new Date(Date.now() - 3600000 * 44).toISOString(),
  },
  {
    id: "ncb-champ-9",
    user_id: "909",
    player_name: "ToneTracker",
    score: 370,
    target_hsb: { h: 312, s: 62, b: 68 },
    predicted_hsb: { h: 325, s: 55, b: 70 },
    time_taken_seconds: 6.10,
    created_at: new Date(Date.now() - 3600000 * 52).toISOString(),
  },
  {
    id: "ncb-champ-10",
    user_id: "910",
    player_name: "ColorCraft",
    score: 350,
    target_hsb: { h: 122, s: 76, b: 86 },
    predicted_hsb: { h: 138, s: 69, b: 81 },
    time_taken_seconds: 6.80,
    created_at: new Date(Date.now() - 3600000 * 64).toISOString(),
  },
];

/**
 * Sort entries by Score DESC, then Time ASC.
 */
export function sortNotColorBlindEntries(
  items: NotColorBlindScoreRecord[]
): NotColorBlindScoreRecord[] {
  return [...items].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.time_taken_seconds - b.time_taken_seconds;
  });
}

/**
 * Fetch top entries from GET /api/scores/not-color-blind/leaderboard.
 * Falls back to locally recorded scores and seeded champions if empty or offline.
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

    const local = getLocalNotColorBlindScores();
    const seenIds = new Set<string>(serverEntries.map((e) => e.id));
    const merged = [...serverEntries];

    for (const loc of local) {
      if (!seenIds.has(loc.id)) {
        seenIds.add(loc.id);
        merged.push(loc);
      }
    }

    if (merged.length < 10) {
      for (const champ of FALLBACK_NOT_COLOR_BLIND_CHAMPIONS) {
        if (!seenIds.has(champ.id)) {
          seenIds.add(champ.id);
          merged.push(champ);
        }
      }
    }

    const sorted = sortNotColorBlindEntries(merged).slice(0, safeLimit);

    return {
      success: true,
      leaderboard: sorted,
    };
  } catch (err: unknown) {
    console.warn("Not Color Blind: Leaderboard fetch failed, using local store:", err);

    const local = getLocalNotColorBlindScores();
    const seenIds = new Set<string>(local.map((e) => e.id));
    const merged = [...local];

    for (const champ of FALLBACK_NOT_COLOR_BLIND_CHAMPIONS) {
      if (!seenIds.has(champ.id)) {
        seenIds.add(champ.id);
        merged.push(champ);
      }
    }

    const sorted = sortNotColorBlindEntries(merged).slice(0, safeLimit);

    return {
      success: true,
      leaderboard: sorted,
    };
  }
}

export interface UserNotColorBlindStats {
  gamesPlayed: number;
  bestScore: number;
  averageAccuracy: number;
  recentScores: NotColorBlindScoreRecord[];
}

/**
 * Fetch scores for a specific user ID, combining remote records and local storage.
 */
export async function fetchUserNotColorBlindScores(
  userId?: string | null,
  limit = 50
): Promise<NotColorBlindScoreRecord[]> {
  const localScores = getLocalNotColorBlindScores();
  let serverScores: NotColorBlindScoreRecord[] = [];

  if (userId) {
    try {
      const res = await fetch(
        `${API_BASE}/api/scores/not-color-blind/user/${encodeURIComponent(userId)}?limit=${limit}`
      );
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.scores)) {
          serverScores = data.scores;
        }
      }
    } catch {
      // Ignore network errors, fall back to local
    }
  }

  const seen = new Set<string>();
  const combined: NotColorBlindScoreRecord[] = [];
  for (const item of [...serverScores, ...localScores]) {
    if (!seen.has(item.id)) {
      seen.add(item.id);
      combined.push(item);
    }
  }

  return combined.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

/**
 * Compute user stats for Not Color Blind (games played, high score, average recall accuracy).
 */
export async function getUserNotColorBlindStats(
  userId?: string | null
): Promise<UserNotColorBlindStats> {
  const scores = await fetchUserNotColorBlindScores(userId, 100);
  const storedBest = getNotColorBlindPersonalBest();

  const gamesPlayed = scores.length > 0 ? scores.length : storedBest > 0 ? 1 : 0;
  const bestScore = scores.reduce((max, s) => Math.max(max, s.score), storedBest);

  const averageAccuracy =
    scores.length > 0
      ? Number(
          (scores.reduce((sum, s) => sum + s.score, 0) / scores.length).toFixed(1)
        )
      : bestScore > 0
      ? bestScore
      : 0;

  return {
    gamesPlayed,
    bestScore,
    averageAccuracy,
    recentScores: scores.slice(0, 10),
  };
}
