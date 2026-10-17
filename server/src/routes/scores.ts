import { Router, Request, Response } from 'express';
import pool from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

interface GameResultRow {
  id: number;
  user_id: number | null;
  mode: string;
  date: string | null;
  total_score: number;
  average_error: number;
  rounds: any;
  completed_at: string;
}

// ---------------------------------------------------------------------------
// POST /api/scores
// ---------------------------------------------------------------------------
/**
 * Record a completed game result.
 * Supports both authenticated users (saved to user profile) and guest plays.
 */
router.post('/', async (req: Request, res: Response): Promise<void> => {
  const { mode = 'practice', date, totalScore, averageError, rounds } = req.body ?? {};

  if (typeof totalScore !== 'number' || isNaN(totalScore)) {
    res.status(400).json({ error: 'Valid totalScore is required.' });
    return;
  }

  const cleanTotalScore = Math.max(0, Math.min(500, Math.round(totalScore)));
  const cleanAvgError = typeof averageError === 'number' && !isNaN(averageError) ? averageError : 0;
  const cleanMode = mode === 'daily' ? 'daily' : 'practice';
  const cleanDate = typeof date === 'string' ? date.slice(0, 10) : null;
  const cleanRounds = Array.isArray(rounds) ? rounds : [];
  const userId = req.user?.userId ?? null;

  try {
    const { rows } = await pool.query<GameResultRow>(
      `INSERT INTO game_results (user_id, mode, date, total_score, average_error, rounds)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, user_id, mode, date, total_score, average_error, completed_at`,
      [userId, cleanMode, cleanDate, cleanTotalScore, cleanAvgError, JSON.stringify(cleanRounds)],
    );

    res.status(201).json({
      success: true,
      result: rows[0],
    });
  } catch (err: unknown) {
    console.error('Save score error:', err);
    res.status(500).json({ error: 'Failed to record game score.' });
  }
});

// ---------------------------------------------------------------------------
// GET /api/scores/me
// ---------------------------------------------------------------------------
/**
 * Retrieve current user's games and aggregated statistics.
 * Requires Bearer token.
 */
router.get('/me', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.userId;

  try {
    // 1. Recent games
    const { rows: recentGames } = await pool.query<GameResultRow>(
      `SELECT id, mode, date, total_score, average_error, completed_at
       FROM game_results
       WHERE user_id = $1
       ORDER BY completed_at DESC
       LIMIT 20`,
      [userId],
    );

    // 2. Aggregate stats
    const { rows: statsRows } = await pool.query<{
      games_played: number;
      daily_completed: number;
      best_score: number;
      average_score: number;
    }>(
      `SELECT
         COUNT(*)::int as games_played,
         COUNT(CASE WHEN mode = 'daily' THEN 1 END)::int as daily_completed,
         COALESCE(MAX(total_score), 0)::int as best_score,
         COALESCE(ROUND(AVG(total_score)), 0)::int as average_score
       FROM game_results
       WHERE user_id = $1`,
      [userId],
    );

    const stats = statsRows[0] || {
      games_played: 0,
      daily_completed: 0,
      best_score: 0,
      average_score: 0,
    };

    // 3. Compute global rank if user has scored
    let userRank: number | null = null;
    if (stats.best_score > 0) {
      try {
        const { rows: rankRows } = await pool.query<{ rank: number }>(
          `SELECT COUNT(DISTINCT user_id)::int + 1 as rank
           FROM game_results
           WHERE total_score > $1`,
          [stats.best_score],
        );
        if (rankRows.length > 0 && rankRows[0].rank) {
          userRank = Number(rankRows[0].rank);
        }
      } catch {
        // non-fatal
      }
    }

    res.status(200).json({
      recentGames,
      stats: {
        gamesPlayed: stats.games_played,
        dailyGamesCompleted: stats.daily_completed,
        bestScore: stats.best_score,
        averageScore: stats.average_score,
        rank: userRank,
      },
    });
  } catch (err: unknown) {
    console.error('Get user scores error:', err);
    res.status(500).json({ error: 'Failed to fetch user game statistics.' });
  }
});

// ---------------------------------------------------------------------------
// GET /api/scores/leaderboard
// ---------------------------------------------------------------------------
/**
 * Global leaderboard with top user scores.
 */
router.get('/leaderboard', async (_req: Request, res: Response): Promise<void> => {
  try {
    const { rows } = await pool.query<{
      id: number;
      total_score: number;
      average_error: number;
      mode: string;
      date: string | null;
      completed_at: string;
      user_id: number;
      username: string;
      name: string | null;
      avatar_url: string | null;
    }>(
      `SELECT
         gr.id,
         gr.total_score,
         gr.average_error,
         gr.mode,
         gr.date,
         gr.completed_at,
         u.id as user_id,
         u.username,
         u.name,
         u.avatar_url
       FROM game_results gr
       JOIN users u ON gr.user_id = u.id
       ORDER BY gr.total_score DESC, gr.average_error ASC
       LIMIT 25`,
    );

    res.status(200).json({ leaderboard: rows });
  } catch (err: unknown) {
    console.error('Get leaderboard error:', err);
    res.status(500).json({ error: 'Failed to fetch leaderboard.' });
  }
});

// ---------------------------------------------------------------------------
// GET /api/scores/user/:id
// ---------------------------------------------------------------------------
/**
 * Public profile and score history for a specific player.
 * Only returns safe public fields (id, username, name, avatar_url, member_since).
 * Respects player privacy (is_history_public).
 */
router.get('/user/:id', async (req: Request, res: Response): Promise<void> => {
  const rawParam = req.params.id;
  const param = Array.isArray(rawParam) ? rawParam[0] : (rawParam ?? '');
  const isNumeric = /^\d+$/.test(param);

  try {
    const userQuery = isNumeric
      ? 'SELECT id, username, name, avatar_url, is_history_public, created_at FROM users WHERE id = $1'
      : 'SELECT id, username, name, avatar_url, is_history_public, created_at FROM users WHERE LOWER(username) = LOWER($1)';
    const userVal = isNumeric ? Number(param) : param;

    const { rows: userRows } = await pool.query<{
      id: number;
      username: string;
      name: string | null;
      avatar_url: string | null;
      is_history_public: boolean | null;
      created_at: string;
    }>(userQuery, [userVal]);

    if (!userRows || userRows.length === 0) {
      res.status(404).json({ error: 'Player profile not found.' });
      return;
    }

    const player = userRows[0];
    const isHistoryPublic = player.is_history_public !== false; // public by default

    // Aggregate stats
    const { rows: statsRows } = await pool.query<{
      games_played: number;
      best_score: number;
      average_score: number;
    }>(
      `SELECT
         COUNT(*)::int as games_played,
         COALESCE(MAX(total_score), 0)::int as best_score,
         COALESCE(ROUND(AVG(total_score)), 0)::int as average_score
       FROM game_results
       WHERE user_id = $1`,
      [player.id],
    );

    const stats = statsRows[0] || {
      games_played: 0,
      best_score: 0,
      average_score: 0,
    };

    let recentScores: Array<{
      id: number;
      mode: string;
      total_score: number;
      average_error: number;
      completed_at: string;
    }> = [];

    if (isHistoryPublic) {
      const { rows: scoreRows } = await pool.query<{
        id: number;
        mode: string;
        total_score: number;
        average_error: number;
        completed_at: string;
      }>(
        `SELECT id, mode, total_score, average_error, completed_at
         FROM game_results
         WHERE user_id = $1
         ORDER BY completed_at DESC
         LIMIT 10`,
        [player.id],
      );
      recentScores = scoreRows;
    }

    res.status(200).json({
      user: {
        id: player.id,
        username: player.username,
        name: player.name,
        avatar_url: player.avatar_url,
        member_since: player.created_at,
        is_history_public: isHistoryPublic,
      },
      stats: {
        gamesPlayed: stats.games_played,
        bestScore: stats.best_score,
        averageScore: stats.average_score,
      },
      recentScores,
    });
  } catch (err: unknown) {
    console.error('Get public player profile error:', err);
    res.status(500).json({ error: 'Failed to retrieve player profile.' });
  }
});

export default router;
