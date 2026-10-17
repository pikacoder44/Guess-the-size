import { Router, Request, Response } from 'express';
import pool from '../../db.js';
import { GameResultRow } from './types.js';

const router = Router();

/**
 * POST /api/scores
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
  const cleanMode = ['daily', 'classic'].includes(mode) ? mode : 'practice';
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

export default router;
