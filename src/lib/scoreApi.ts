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
}

export interface LeaderboardEntry {
  id: number;
  total_score: number;
  average_error: number;
  mode: string;
  date: string | null;
  completed_at: string;
  username: string;
  name: string | null;
  avatar_url: string | null;
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
