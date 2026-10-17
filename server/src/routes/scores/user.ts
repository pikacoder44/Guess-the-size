import { Router, Request, Response } from 'express';
import pool from '../../db.js';

const router = Router();

/**
 * GET /api/scores/user/:id
 * Public profile and score history for a specific player (by numeric ID or username).
 * Respects player privacy settings (is_history_public).
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

    // Calculate player's global standing if they have played and scored
    let playerRank: number | null = null;
    if (stats.best_score > 0) {
      try {
        const { rows: rankRows } = await pool.query<{ rank: number }>(
          `SELECT COUNT(DISTINCT user_id)::int + 1 AS rank
           FROM game_results
           WHERE total_score > $1;`,
          [stats.best_score],
        );
        if (rankRows.length > 0 && rankRows[0].rank) {
          playerRank = Number(rankRows[0].rank);
        }
      } catch (rankErr) {
        console.warn('Player rank calculation non-fatal error:', rankErr);
      }
    }

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
        rank: playerRank,
      },
      recentScores,
    });
  } catch (err: unknown) {
    console.error('Get public player profile error:', err);
    res.status(500).json({ error: 'Failed to retrieve player profile.' });
  }
});

export default router;
