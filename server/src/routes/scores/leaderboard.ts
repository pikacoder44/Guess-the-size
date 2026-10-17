import { Router, Request, Response } from 'express';
import pool from '../../db.js';
import { LeaderboardEntryRow } from './types.js';

const router = Router();

/**
 * GET /api/scores/leaderboard
 * Global leaderboard with top user scores.
 * Enforces one top entry per unique user using a window query ranking each user's personal best,
 * capped at the top 10 players.
 */
router.get('/leaderboard', async (_req: Request, res: Response): Promise<void> => {
  try {
    const { rows } = await pool.query<LeaderboardEntryRow>(
      `WITH ranked_scores AS (
         SELECT
           gr.id,
           gr.total_score,
           gr.average_error,
           gr.mode,
           gr.date,
           gr.completed_at,
           gr.user_id,
           u.username,
           u.name,
           u.avatar_url,
           ROW_NUMBER() OVER (
             PARTITION BY gr.user_id
             ORDER BY gr.total_score DESC, gr.average_error ASC
           ) AS rank_per_user
         FROM game_results gr
         JOIN users u ON gr.user_id = u.id
         WHERE gr.user_id IS NOT NULL
       )
       SELECT
         id,
         total_score,
         average_error,
         mode,
         date,
         completed_at,
         user_id,
         username,
         name,
         avatar_url
       FROM ranked_scores
       WHERE rank_per_user = 1
       ORDER BY total_score DESC, average_error ASC
       LIMIT 10;`,
    );

    res.status(200).json({ leaderboard: rows });
  } catch (err: unknown) {
    console.error('Get leaderboard error:', err);
    res.status(500).json({ error: 'Failed to fetch leaderboard.' });
  }
});

export default router;
