/**
 * Scores Router Entry Point (Backwards Compatibility Shim)
 *
 * Scores routes have been refactored into modular sub-routers located at `./scores/`:
 * - ./scores/submit.ts       (POST /)
 * - ./scores/me.ts           (GET /me)
 * - ./scores/leaderboard.ts  (GET /leaderboard)
 * - ./scores/user.ts         (GET /user/:id)
 * - ./scores/types.ts        (Shared types and interfaces)
 */
import scoresRouter from './scores/index.js';

export * from './scores/index.js';
export default scoresRouter;
