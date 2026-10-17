import { Router } from "express";
import localRouter from "./local.js";
import googleRouter from "./google.js";
import githubRouter from "./github.js";
import profileRouter from "./profile.js";

const authRouter = Router();

// Sub-routers mounted under /api/auth
authRouter.use(localRouter);
authRouter.use(googleRouter);
authRouter.use(githubRouter);
authRouter.use(profileRouter);

export default authRouter;
export * from "./utils.js";
