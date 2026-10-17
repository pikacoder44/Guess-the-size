/**
 * Auth Router Entry Point (Backwards Compatibility Shim)
 *
 * Auth routes have been refactored into modular sub-routers located at `./auth/`:
 * - ./auth/local.ts    (POST /register, POST /login, GET /me)
 * - ./auth/google.ts   (POST /google)
 * - ./auth/github.ts   (POST /github, GET /github/callback)
 * - ./auth/profile.ts  (PATCH /profile, PUT /profile)
 * - ./auth/utils.ts    (Shared types, JWT helpers, user mappers)
 */
import authRouter from "./auth/index.js";

export * from "./auth/index.js";
export default authRouter;
