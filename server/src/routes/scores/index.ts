import { Router } from 'express';
import submitRouter from './submit.js';
import meRouter from './me.js';
import leaderboardRouter from './leaderboard.js';
import userRouter from './user.js';

const scoresRouter = Router();

// Sub-routers mounted under /api/scores
scoresRouter.use(submitRouter);
scoresRouter.use(meRouter);
scoresRouter.use(leaderboardRouter);
scoresRouter.use(userRouter);

export default scoresRouter;
export * from './types.js';
