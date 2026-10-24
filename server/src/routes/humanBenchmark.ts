import { Router, Request, Response } from 'express';
import {
  saveHumanBenchmarkScore,
  getHumanBenchmarkLeaderboard,
  getUserHumanBenchmarkScores,
} from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

/**
 * POST /api/scores/human-benchmark
 * Save a completed Human Benchmark 5-round reaction speed result. Requires authenticated user.
 */
router.post('/', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const { averageReactionMs, rounds } = req.body ?? {};

  // Validate rounds array
  if (!Array.isArray(rounds) || rounds.length === 0 || rounds.length > 5) {
    res.status(400).json({ error: 'rounds must be an array of 1 to 5 numeric reaction times in milliseconds.' });
    return;
  }

  const validRounds: number[] = [];
  for (const r of rounds) {
    const val = typeof r === 'number' ? Math.round(r) : NaN;
    if (isNaN(val) || val <= 0 || val > 10000) {
      res.status(400).json({ error: 'Each round must be a valid positive latency in milliseconds (<= 10000ms).' });
      return;
    }
    validRounds.push(val);
  }

  // Recalculate average on server to ensure score integrity
  const calculatedAverage = Math.round(validRounds.reduce((acc, val) => acc + val, 0) / validRounds.length);
  const effectiveAverage = typeof averageReactionMs === 'number' && !isNaN(averageReactionMs)
    ? Math.round(averageReactionMs)
    : calculatedAverage;

  try {
    const effectiveUserId = String(req.user!.userId);
    const effectivePlayerName = req.user!.username || 'Player';

    const scoreRecord = await saveHumanBenchmarkScore({
      userId: effectiveUserId,
      playerName: effectivePlayerName,
      averageReactionMs: effectiveAverage,
      rounds: validRounds,
    });

    res.status(201).json({
      success: true,
      scoreRecord,
    });
  } catch (err: unknown) {
    console.error('Save Human Benchmark score error:', err);
    res.status(500).json({ error: 'Failed to record Human Benchmark score.' });
  }
});

/**
 * GET /api/scores/human-benchmark/leaderboard
 * Fetch top fastest reaction time entries (ranked by lowest average_reaction_ms).
 */
router.get('/leaderboard', async (req: Request, res: Response): Promise<void> => {
  try {
    const limit = req.query.limit ? Number(req.query.limit) : 50;
    const leaderboard = await getHumanBenchmarkLeaderboard(limit);

    res.status(200).json({
      success: true,
      leaderboard,
    });
  } catch (err: unknown) {
    console.error('Get Human Benchmark leaderboard error:', err);
    res.status(500).json({ error: 'Failed to fetch Human Benchmark leaderboard.' });
  }
});

/**
 * GET /api/scores/human-benchmark/user/:userId
 * Fetch reaction history for a specific player.
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
    const scores = await getUserHumanBenchmarkScores(userId, limit);

    res.status(200).json({
      success: true,
      scores,
    });
  } catch (err: unknown) {
    console.error('Get user Human Benchmark scores error:', err);
    res.status(500).json({ error: 'Failed to fetch player reaction history.' });
  }
});

export default router;
