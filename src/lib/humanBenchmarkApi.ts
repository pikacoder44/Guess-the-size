const API_BASE = import.meta.env.VITE_API_URL || "";
const STORAGE_LOCAL_SCORES_KEY = "human_benchmark_local_scores";
const STORAGE_PENDING_SCORES_KEY = "human_benchmark_pending_scores";
const STORAGE_BEST_SCORE_KEY = "human_benchmark_best_score";

export interface HumanBenchmarkScorePayload {
  userId?: string | null;
  playerName?: string;
  averageReactionMs: number;
  rounds: number[];
}

export interface HumanBenchmarkScoreRecord {
  id: string;
  user_id: string | null;
  player_name: string;
  average_reaction_ms: number;
  rounds: number[];
  created_at: string;
}

export interface SubmitHumanBenchmarkResponse {
  success: boolean;
  scoreRecord: HumanBenchmarkScoreRecord;
  isPersonalBest: boolean;
  offlineFallback?: boolean;
}

export interface HumanBenchmarkLeaderboardResponse {
  success: boolean;
  leaderboard: HumanBenchmarkScoreRecord[];
}

/**
 * Retrieve personal best (lowest average ms) from localStorage.
 * Returns 0 if none recorded.
 */
export function getHumanBenchmarkPersonalBest(): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = localStorage.getItem(STORAGE_BEST_SCORE_KEY);
    const num = Number(raw);
    return !isNaN(num) && num > 0 ? num : 0;
  } catch {
    return 0;
  }
}

/**
 * Update personal best reaction time in localStorage if the new latency is faster (lower ms).
 * Returns true if a new personal best was established.
 */
export function recordPersonalBest(averageMs: number): boolean {
  if (typeof window === "undefined" || averageMs <= 0) return false;
  try {
    const currentBest = getHumanBenchmarkPersonalBest();
    if (currentBest === 0 || averageMs < currentBest) {
      localStorage.setItem(STORAGE_BEST_SCORE_KEY, String(averageMs));
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
export function getLocalHumanBenchmarkScores(): HumanBenchmarkScoreRecord[] {
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
function saveLocalScoreRecord(record: HumanBenchmarkScoreRecord): void {
  if (typeof window === "undefined") return;
  try {
    const existing = getLocalHumanBenchmarkScores();
    const updated = [record, ...existing.filter((s) => s.id !== record.id)].slice(0, 100);
    localStorage.setItem(STORAGE_LOCAL_SCORES_KEY, JSON.stringify(updated));
  } catch {
    // Ignore storage errors
  }
}

/**
 * Queue a score payload in localStorage when network is unavailable.
 */
function queuePendingScore(payload: HumanBenchmarkScorePayload): void {
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
 * Submit a completed Human Benchmark 5-round score.
 * Sends POST /api/scores/human-benchmark.
 * Gracefully falls back to localStorage if offline or network fails.
 */
export async function submitHumanBenchmarkScore(
  payload: HumanBenchmarkScorePayload,
  token?: string | null
): Promise<SubmitHumanBenchmarkResponse> {
  const safeRounds = Array.isArray(payload.rounds)
    ? payload.rounds.map((r) => Math.max(1, Math.round(r)))
    : [];
  const safeAvg = safeRounds.length > 0
    ? Math.round(safeRounds.reduce((a, b) => a + b, 0) / safeRounds.length)
    : Math.max(1, Math.round(payload.averageReactionMs));
  const safePlayerName = payload.playerName?.trim() || "Anonymous";
  const safeUserId = payload.userId?.trim() || null;

  const sanitizedPayload: HumanBenchmarkScorePayload = {
    userId: safeUserId,
    playerName: safePlayerName,
    averageReactionMs: safeAvg,
    rounds: safeRounds,
  };

  // Check personal best before updating
  const prevBest = getHumanBenchmarkPersonalBest();
  const isPersonalBest = prevBest === 0 || safeAvg < prevBest;
  if (isPersonalBest) {
    recordPersonalBest(safeAvg);
  }

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE}/api/scores/human-benchmark`, {
      method: "POST",
      headers,
      body: JSON.stringify(sanitizedPayload),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData?.error || `Server responded with HTTP ${res.status}`);
    }

    const data = await res.json();
    const scoreRecord: HumanBenchmarkScoreRecord = data.scoreRecord;

    // Cache locally as well
    saveLocalScoreRecord(scoreRecord);

    return {
      success: true,
      scoreRecord,
      isPersonalBest,
      offlineFallback: false,
    };
  } catch (err: unknown) {
    console.warn("Human Benchmark: Network submission failed, falling back to local storage:", err);

    const fallbackRecord: HumanBenchmarkScoreRecord = {
      id: `local-hb-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      user_id: safeUserId,
      player_name: safePlayerName,
      average_reaction_ms: safeAvg,
      rounds: safeRounds,
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

export const FALLBACK_HUMAN_BENCHMARK_CHAMPIONS: HumanBenchmarkScoreRecord[] = [
  {
    id: "hb-champ-1",
    user_id: "901",
    player_name: "VoltReflex",
    average_reaction_ms: 158,
    rounds: [152, 162, 155, 160, 161],
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: "hb-champ-2",
    user_id: "902",
    player_name: "SynapseStriker",
    average_reaction_ms: 169,
    rounds: [165, 172, 168, 170, 170],
    created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    id: "hb-champ-3",
    user_id: "903",
    player_name: "NeuralFlash",
    average_reaction_ms: 178,
    rounds: [175, 180, 176, 181, 178],
    created_at: new Date(Date.now() - 3600000 * 8).toISOString(),
  },
  {
    id: "hb-champ-4",
    user_id: "904",
    player_name: "ApexImpulse",
    average_reaction_ms: 187,
    rounds: [184, 192, 186, 188, 185],
    created_at: new Date(Date.now() - 3600000 * 14).toISOString(),
  },
  {
    id: "hb-champ-5",
    user_id: "905",
    player_name: "ChronoTrigger",
    average_reaction_ms: 198,
    rounds: [194, 204, 197, 201, 194],
    created_at: new Date(Date.now() - 3600000 * 21).toISOString(),
  },
  {
    id: "hb-champ-6",
    user_id: "906",
    player_name: "QuantumTwitch",
    average_reaction_ms: 210,
    rounds: [208, 214, 210, 212, 206],
    created_at: new Date(Date.now() - 3600000 * 30).toISOString(),
  },
  {
    id: "hb-champ-7",
    user_id: "907",
    player_name: "CyberSynapse",
    average_reaction_ms: 222,
    rounds: [218, 226, 220, 224, 222],
    created_at: new Date(Date.now() - 3600000 * 40).toISOString(),
  },
  {
    id: "hb-champ-8",
    user_id: "908",
    player_name: "OpticSurge",
    average_reaction_ms: 235,
    rounds: [230, 240, 234, 238, 233],
    created_at: new Date(Date.now() - 3600000 * 52).toISOString(),
  },
  {
    id: "hb-champ-9",
    user_id: "909",
    player_name: "SwiftSynapse",
    average_reaction_ms: 248,
    rounds: [244, 252, 246, 250, 248],
    created_at: new Date(Date.now() - 3600000 * 64).toISOString(),
  },
  {
    id: "hb-champ-10",
    user_id: "910",
    player_name: "RapidRetina",
    average_reaction_ms: 260,
    rounds: [256, 265, 258, 263, 258],
    created_at: new Date(Date.now() - 3600000 * 76).toISOString(),
  },
];

/**
 * Sort entries by averageReactionMs ASC (fastest latency first), then created_at ASC.
 */
export function sortHumanBenchmarkEntries(
  items: HumanBenchmarkScoreRecord[]
): HumanBenchmarkScoreRecord[] {
  return [...items].sort((a, b) => {
    if (a.average_reaction_ms !== b.average_reaction_ms) {
      return a.average_reaction_ms - b.average_reaction_ms;
    }
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  });
}

/**
 * Fetch top entries from GET /api/scores/human-benchmark/leaderboard.
 * Falls back to locally recorded scores and seeded champions if empty or offline.
 */
export async function fetchHumanBenchmarkLeaderboard(
  limit = 50
): Promise<HumanBenchmarkLeaderboardResponse> {
  const safeLimit = Math.max(1, Math.min(100, limit));

  try {
    const res = await fetch(`${API_BASE}/api/scores/human-benchmark/leaderboard?limit=${safeLimit}`);
    if (!res.ok) {
      throw new Error(`Failed to fetch leaderboard: HTTP ${res.status}`);
    }
    const data = await res.json();
    const serverEntries: HumanBenchmarkScoreRecord[] = Array.isArray(data.leaderboard)
      ? data.leaderboard
      : [];

    const local = getLocalHumanBenchmarkScores();
    const seenIds = new Set<string>(serverEntries.map((e) => e.id));
    const merged = [...serverEntries];

    for (const loc of local) {
      if (!seenIds.has(loc.id)) {
        seenIds.add(loc.id);
        merged.push(loc);
      }
    }

    if (merged.length < 10) {
      for (const champ of FALLBACK_HUMAN_BENCHMARK_CHAMPIONS) {
        if (!seenIds.has(champ.id)) {
          seenIds.add(champ.id);
          merged.push(champ);
        }
      }
    }

    const sorted = sortHumanBenchmarkEntries(merged).slice(0, safeLimit);

    return {
      success: true,
      leaderboard: sorted,
    };
  } catch (err: unknown) {
    console.warn("Human Benchmark: Leaderboard fetch failed, using local store:", err);

    const local = getLocalHumanBenchmarkScores();
    const seenIds = new Set<string>(local.map((e) => e.id));
    const merged = [...local];

    for (const champ of FALLBACK_HUMAN_BENCHMARK_CHAMPIONS) {
      if (!seenIds.has(champ.id)) {
        seenIds.add(champ.id);
        merged.push(champ);
      }
    }

    const sorted = sortHumanBenchmarkEntries(merged).slice(0, safeLimit);

    return {
      success: true,
      leaderboard: sorted,
    };
  }
}

export interface UserHumanBenchmarkStats {
  gamesPlayed: number;
  bestAverageMs: number;
  allTimeFastestRoundMs: number;
  recentScores: HumanBenchmarkScoreRecord[];
}

/**
 * Fetch scores for a specific user ID, combining remote records and local storage.
 */
export async function fetchUserHumanBenchmarkScores(
  userId?: string | null,
  limit = 50
): Promise<HumanBenchmarkScoreRecord[]> {
  const localScores = getLocalHumanBenchmarkScores();
  let serverScores: HumanBenchmarkScoreRecord[] = [];

  if (userId) {
    try {
      const res = await fetch(
        `${API_BASE}/api/scores/human-benchmark/user/${encodeURIComponent(userId)}?limit=${limit}`
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
  const combined: HumanBenchmarkScoreRecord[] = [];
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
 * Compute user stats for Human Benchmark (games played, fastest 5-round average, fastest single round).
 */
export async function getUserHumanBenchmarkStats(
  userId?: string | null
): Promise<UserHumanBenchmarkStats> {
  const scores = await fetchUserHumanBenchmarkScores(userId, 100);
  const storedBest = getHumanBenchmarkPersonalBest();

  const gamesPlayed = scores.length > 0 ? scores.length : storedBest > 0 ? 1 : 0;
  const bestAverageMs = scores.reduce(
    (min, s) => (min === 0 ? s.average_reaction_ms : Math.min(min, s.average_reaction_ms)),
    storedBest
  );

  let allTimeFastestRoundMs = bestAverageMs;
  for (const s of scores) {
    if (Array.isArray(s.rounds)) {
      for (const r of s.rounds) {
        if (r > 0) {
          allTimeFastestRoundMs = allTimeFastestRoundMs === 0 ? r : Math.min(allTimeFastestRoundMs, r);
        }
      }
    }
  }

  return {
    gamesPlayed,
    bestAverageMs,
    allTimeFastestRoundMs,
    recentScores: scores.slice(0, 10),
  };
}
