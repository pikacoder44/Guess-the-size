import { Router, Request, Response } from 'express';
import pool from '../../db.js';
import { requireAuth } from '../../middleware/auth.js';
import { GameResultRow } from './types.js';

const router = Router();

/**
 * GET /api/scores/me
 * Retrieve current user's games and aggregated statistics, including their global rank.
 * Requires Bearer token.
 *
 * Global rank compares the user's personal-best attempt against other users'
 * personal-best attempts using the same 4-tier tie-breaker as the leaderboard:
 *   1. total_score DESC
 *   2. average_error ASC
 *   3. elapsed_ms ASC
 *   4. completed_at ASC
 */
router.get('/me', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.userId;

  try {
    // 1. Recent games (up to 20)
    const { rows: recentGames } = await pool.query<GameResultRow>(
      `SELECT id, mode, date, total_score, average_error, elapsed_ms, completed_at
       FROM game_results
       WHERE user_id = $1
       ORDER BY completed_at DESC
       LIMIT 20`,
      [userId],
    );

    // 2. Aggregate stats for this user
    const { rows: statsRows } = await pool.query<{
      games_played: number;
      daily_completed: number;
      best_score: number;
      best_average_error: number;
      best_elapsed_ms: number;
      average_score: number;
    }>(
      `SELECT
         COUNT(*)::int                                          AS games_played,
         COUNT(CASE WHEN mode = 'daily' THEN 1 END)::int       AS daily_completed,
         COALESCE(MAX(total_score), 0)::int                    AS best_score,
         COALESCE(
           (SELECT average_error FROM game_results
            WHERE user_id = $1
            ORDER BY total_score DESC, average_error ASC, elapsed_ms ASC, completed_at ASC
            LIMIT 1), 0
         )                                                     AS best_average_error,
         COALESCE(
           (SELECT elapsed_ms FROM game_results
            WHERE user_id = $1
            ORDER BY total_score DESC, average_error ASC, elapsed_ms ASC, completed_at ASC
            LIMIT 1), 0
         )                                                     AS best_elapsed_ms,
         COALESCE(ROUND(AVG(total_score)), 0)::int             AS average_score
       FROM game_results
       WHERE user_id = $1`,
      [userId],
    );

    const stats = statsRows[0] ?? {
      games_played: 0,
      daily_completed: 0,
      best_score: 0,
      best_average_error: 0,
      best_elapsed_ms: 0,
      average_score: 0,
    };

    // 3. Global rank: count distinct users whose personal-best ranks ahead of this user
    //    Uses the same tie-breaker hierarchy as the leaderboard CTE.
    let userRank: number | null = null;
    if (stats.best_score > 0) {
      try {
        const { rows: rankRows } = await pool.query<{ rank: number }>(
          `WITH user_bests AS (
             SELECT DISTINCT ON (user_id)
               user_id,
               total_score,
               average_error,
               elapsed_ms,
               completed_at
             FROM game_results
             WHERE user_id IS NOT NULL
             ORDER BY
               user_id,
               total_score DESC,
               average_error ASC,
               elapsed_ms ASC,
               completed_at ASC
           )
           SELECT COUNT(*)::int + 1 AS rank
           FROM user_bests
           WHERE
             total_score > $1
             OR (total_score = $1 AND average_error < $2)
             OR (total_score = $1 AND average_error = $2 AND elapsed_ms < $3);`,
          [stats.best_score, stats.best_average_error, stats.best_elapsed_ms],
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
        bestAverageError: Number((stats.best_average_error ?? 0).toFixed(2)),
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
