export interface GameResultRow {
  id: number;
  user_id: number | null;
  mode: string;
  date: string | null;
  total_score: number;
  average_error: number;
  /** Total milliseconds spent across all rounds. Null for legacy rows without timing. */
  elapsed_ms: number | null;
  rounds: unknown;
  completed_at: string;
}

export interface LeaderboardEntryRow {
  id: number;
  total_score: number;
  average_error: number;
  /** Total milliseconds spent across all rounds (tie-breaker). */
  elapsed_ms: number | null;
  mode: string;
  date: string | null;
  completed_at: string;
  user_id: number;
  username: string;
  name: string | null;
  avatar_url: string | null;
}

export interface UserStatsSummary {
  gamesPlayed: number;
  dailyGamesCompleted: number;
  bestScore: number;
  bestAverageError: number;
  averageScore: number;
  rank: number | null;
}

export interface PublicPlayerProfile {
  user: {
    id: number;
    username: string;
    name: string | null;
    avatar_url: string | null;
    member_since: string;
    is_history_public: boolean;
  };
  stats: {
    gamesPlayed: number;
    bestScore: number;
    averageScore: number;
    rank?: number | null;
  };
  recentScores: Array<{
    id: number;
    mode: string;
    total_score: number;
    average_error: number;
    elapsed_ms: number | null;
    completed_at: string;
  }>;
}
