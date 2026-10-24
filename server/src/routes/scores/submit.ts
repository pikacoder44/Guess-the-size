import { Router, Request, Response } from 'express';
import pool from '../../db.js';
import { requireAuth } from '../../middleware/auth.js';
import { GameResultRow } from './types.js';

const router = Router();

/**
 * Logarithmic ratio scoring formula — mirrored exactly from `src/game/scoring.ts`.
 * 100 = perfect, 0 = off by a factor of 2× or more in either direction.
 */
function calculateScore(guess: number, correct: number): number {
  if (guess <= 0 || correct <= 0) return 0;
  const ratioError = Math.abs(Math.log(guess / correct));
  return Math.round(100 * Math.max(0, 1 - ratioError / Math.LN2));
}

interface RoundGuess {
  guess: number;
  correct: number;
  elapsedMs?: number;
}

/**
 * POST /api/scores and POST /api/scores/scale-guess
 * Record a completed game result. Requires authenticated user.
 * Accepts an array of per-round guesses and RECALCULATES all scores server-side,
 * ignoring any client-submitted totalScore to prevent score tampering.
 */
router.post(['/', '/scale-guess'], requireAuth, async (req: Request, res: Response): Promise<void> => {
  const { mode = 'practice', date, rounds } = req.body ?? {};

  // Validate that rounds is a non-empty array of up to 5 entries
  if (!Array.isArray(rounds) || rounds.length === 0 || rounds.length > 5) {
    res.status(400).json({ error: 'rounds must be an array of 1–5 round guesses.' });
    return;
  }

  // Validate each round has numeric guess and correct fields
  const validRounds: RoundGuess[] = [];
  for (const r of rounds) {
    const guess = typeof r?.guess === 'number' ? r.guess : NaN;
    const correct = typeof r?.correct === 'number' ? r.correct : NaN;
    const elapsedMs = typeof r?.elapsedMs === 'number' ? r.elapsedMs : 0;

    if (!isFinite(guess) || !isFinite(correct) || guess < 0 || correct <= 0) {
      res.status(400).json({ error: 'Each round must have a valid numeric guess and correct value.' });
      return;
    }
    validRounds.push({ guess, correct, elapsedMs: Math.max(0, elapsedMs) });
  }

  // Server-side score recalculation
  const roundScores = validRounds.map((r) => calculateScore(r.guess, r.correct));
  const totalScore = Math.min(500, roundScores.reduce((sum, s) => sum + s, 0));

  // Average percent error (absolute, matches client-side percentError)
  const roundErrors = validRounds.map((r) =>
    r.correct > 0 ? Math.abs(((r.guess - r.correct) / r.correct) * 100) : 0,
  );
  const averageError = roundErrors.reduce((sum, e) => sum + e, 0) / roundErrors.length;

  // Total elapsed time across all rounds (sum of per-round elapsedMs)
  const totalElapsedMs = validRounds.reduce((sum, r) => sum + (r.elapsedMs ?? 0), 0);

  const cleanMode = ['daily', 'classic', 'practice'].includes(mode) ? mode : 'practice';
  const cleanDate = typeof date === 'string' ? date.slice(0, 10) : null;
  const userId = req.user!.userId;

  // Merge server-calculated scores back into round records for storage
  const enrichedRounds = (req.body.rounds as Record<string, unknown>[]).map(
    (r: Record<string, unknown>, i: number) => ({
      ...r,
      score: roundScores[i],
      errorPercent: Number(roundErrors[i].toFixed(2)),
    }),
  );

  try {
    const { rows } = await pool.query<GameResultRow>(
      `INSERT INTO game_results
         (user_id, mode, date, total_score, average_error, elapsed_ms, rounds)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, user_id, mode, date, total_score, average_error, elapsed_ms, completed_at`,
      [
        userId,
        cleanMode,
        cleanDate,
        totalScore,
        Number(averageError.toFixed(4)),
        totalElapsedMs,
        JSON.stringify(enrichedRounds),
      ],
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
