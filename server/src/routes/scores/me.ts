import { Router, Request, Response } from 'express';
import pool from '../../db.js';
import { requireAuth } from '../../middleware/auth.js';
import { GameResultRow } from './types.js';

const router = Router();

/**
 * GET /api/scores/me
 * Retrieve current user's games and aggregated statistics, including their global rank.
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
          `SELECT COUNT(DISTINCT user_id)::int + 1 AS rank
           FROM game_results
           WHERE total_score > $1;`,
          [stats.best_score],
        );
        if (rankRows.length > 0 && rankRows[0].rank) {
          userRank = Number(rankRows[0].rank);
        }
      } catch (rankErr) {
        console.warn('Rank calculation non-fatal error:', rankErr);
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

export default router;
