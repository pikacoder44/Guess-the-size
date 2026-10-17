const API_BASE = import.meta.env.VITE_API_URL || "";

export interface GameResult {
  id: number;
  mode: string;
  date: string | null;
  total_score: number;
  average_error: number;
  completed_at: string;
}

export interface UserStats {
  gamesPlayed: number;
  dailyGamesCompleted: number;
  bestScore: number;
  averageScore: number;
  rank?: number | null;
}

export interface LeaderboardEntry {
  id: number;
  total_score: number;
  average_error: number;
  mode: string;
  date: string | null;
  completed_at: string;
  user_id?: number | null;
  username: string;
  name: string | null;
  avatar_url: string | null;
}

export interface PublicPlayerProfile {
  user: {
    id: number;
    username: string;
    name: string | null;
    avatar_url: string | null;
    member_since?: string;
    is_history_public: boolean;
  };
  stats: {
    gamesPlayed: number;
    bestScore: number;
    averageScore: number;
  };
  recentScores: Array<{
    id: number;
    mode: string;
    total_score: number;
    average_error: number;
    completed_at: string;
  }>;
}

async function handleResponse<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || "Request failed.");
  return data as T;
}

export async function submitScore(
  token: string,
  payload: {
    totalScore: number;
    averageError: number;
    mode?: string;
    rounds?: unknown[];
  }
): Promise<{ success: boolean; result: GameResult }> {
  const res = await fetch(`${API_BASE}/api/scores`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function getMyScores(token: string): Promise<{
  recentGames: GameResult[];
  stats: UserStats;
}> {
  const res = await fetch(`${API_BASE}/api/scores/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse(res);
}

export async function getLeaderboard(): Promise<{ leaderboard: LeaderboardEntry[] }> {
  const res = await fetch(`${API_BASE}/api/scores/leaderboard`);
  return handleResponse(res);
}

export async function getPublicPlayerProfile(
  userIdOrUsername: number | string
): Promise<PublicPlayerProfile> {
  const res = await fetch(`${API_BASE}/api/scores/user/${encodeURIComponent(userIdOrUsername)}`);
  return handleResponse<PublicPlayerProfile>(res);
}
