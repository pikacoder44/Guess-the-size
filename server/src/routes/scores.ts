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

    res.status(200).json({
      recentGames,
      stats: {
        gamesPlayed: stats.games_played,
        dailyGamesCompleted: stats.daily_completed,
        bestScore: stats.best_score,
        averageScore: stats.average_score,
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
      username: string;
      avatar_url: string | null;
    }>(
      `SELECT
         gr.id,
         gr.total_score,
         gr.average_error,
         gr.mode,
         gr.date,
         gr.completed_at,
         u.username,
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

export default router;
