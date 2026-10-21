import { Router, Request, Response } from 'express';
import {
  saveNotColorBlindScore,
  getNotColorBlindLeaderboard,
  getUserNotColorBlindScores,
  HsbColor,
} from '../db.js';

const router = Router();

function isValidHsb(val: unknown): val is HsbColor {
  if (!val || typeof val !== 'object') return false;
  const c = val as Record<string, unknown>;
  return (
    typeof c.h === 'number' &&
    !isNaN(c.h) &&
    typeof c.s === 'number' &&
    !isNaN(c.s) &&
    typeof c.b === 'number' &&
    !isNaN(c.b)
  );
}

/**
 * POST /api/scores/not-color-blind
 * Save a completed Not Color Blind score.
 */
router.post('/', async (req: Request, res: Response): Promise<void> => {
  const { userId, playerName, score, targetHsb, predictedHsb, timeTakenSeconds } = req.body ?? {};

  // Validate score: range [0, 500] (5 rounds x 100 max)
  if (typeof score !== 'number' || isNaN(score) || score < 0 || score > 500) {
    res.status(400).json({ error: 'score must be a valid number between 0 and 500.' });
    return;
  }

  // Validate timeTakenSeconds: non-negative finite number
  if (typeof timeTakenSeconds !== 'number' || isNaN(timeTakenSeconds) || timeTakenSeconds < 0) {
    res.status(400).json({ error: 'timeTakenSeconds must be a non-negative number.' });
    return;
  }

  // Validate non-empty HSB objects
  if (!isValidHsb(targetHsb) || !isValidHsb(predictedHsb)) {
    res.status(400).json({
      error: 'targetHsb and predictedHsb must be valid objects with numeric h, s, and b values.',
    });
    return;
  }

  try {
    const effectiveUserId = typeof userId === 'string' && userId.trim() ? userId.trim() : null;
    const effectivePlayerName =
      typeof playerName === 'string' && playerName.trim() ? playerName.trim() : 'Anonymous';

    const scoreRecord = await saveNotColorBlindScore({
      userId: effectiveUserId,
      playerName: effectivePlayerName,
      score,
      targetHsb,
      predictedHsb,
      timeTakenSeconds,
    });

    res.status(201).json({
      success: true,
      scoreRecord,
    });
  } catch (err: unknown) {
    console.error('Save Not Color Blind score error:', err);
    res.status(500).json({ error: 'Failed to record Not Color Blind score.' });
  }
});

/**
 * GET /api/scores/not-color-blind/leaderboard
 * Fetch top 50 leaderboard entries.
 */
router.get('/leaderboard', async (req: Request, res: Response): Promise<void> => {
  try {
    const limit = req.query.limit ? Number(req.query.limit) : 50;
    const leaderboard = await getNotColorBlindLeaderboard(limit);

    res.status(200).json({
      success: true,
      leaderboard,
    });
  } catch (err: unknown) {
    console.error('Get Not Color Blind leaderboard error:', err);
    res.status(500).json({ error: 'Failed to fetch Not Color Blind leaderboard.' });
  }
});

/**
 * GET /api/scores/not-color-blind/user/:userId
 * Fetch score history for a specific player.
 */
router.get('/user/:userId', async (req: Request, res: Response): Promise<void> => {
  try {
    const rawUserId = req.params.userId;
    const userId = Array.isArray(rawUserId) ? rawUserId[0] : rawUserId;
    if (!userId) {
      res.status(400).json({ error: 'userId parameter is required.' });
      return;
    }
    const limit = req.query.limit ? Number(req.query.limit) : 10;
    const scores = await getUserNotColorBlindScores(userId, limit);

    res.status(200).json({
      success: true,
      scores,
    });
  } catch (err: unknown) {
    console.error('Get user Not Color Blind scores error:', err);
    res.status(500).json({ error: 'Failed to fetch player scores.' });
  }
});

export default router;
