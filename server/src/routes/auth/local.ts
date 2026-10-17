import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import pool from "../../db.js";
import { UserRow, signToken, publicUser } from "./utils.js";

const router = Router();

// ---------------------------------------------------------------------------
// POST /register
// ---------------------------------------------------------------------------
/**
 * Register a new user with username and password.
 * Profile picture, name, and email are completely optional.
 * Body: { username: string, password: string, email?: string, name?: string, avatarUrl?: string }
 */
router.post("/register", async (req: Request, res: Response): Promise<void> => {
  const { username, password, email, name, avatarUrl } = req.body ?? {};

  // --- Validation ---
  if (typeof username !== "string" || username.trim().length === 0) {
    res.status(400).json({ error: "Username is required." });
    return;
  }
  const cleanUsername = username.trim();
  if (cleanUsername.length > 32) {
    res.status(400).json({ error: "Username must be 32 characters or fewer." });
    return;
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(cleanUsername)) {
    res.status(400).json({
      error:
        "Username may only contain letters, numbers, underscores, and hyphens.",
    });
    return;
  }
  if (typeof password !== "string" || password.length < 4) {
    res.status(400).json({ error: "Password must be at least 4 characters." });
    return;
  }

  let cleanEmail: string | null = null;
  if (typeof email === "string" && email.trim().length > 0) {
    cleanEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      res.status(400).json({ error: "Please enter a valid email address." });
      return;
    }
  }

  const cleanName: string | null =
    typeof name === "string" && name.trim().length > 0
      ? name.trim().slice(0, 60)
      : null;

  let cleanAvatarUrl: string | null = null;
  if (typeof avatarUrl === "string" && avatarUrl.trim().length > 0) {
    cleanAvatarUrl = avatarUrl.trim();
  }

  // --- Hash password & insert ---
  const hashedPassword = await bcrypt.hash(password, 12);

  try {
    const { rows } = await pool.query<UserRow>(
      `INSERT INTO users (username, password, email, name, avatar_url)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, username, name, email, avatar_url, google_id, github_id, email_verified, created_at`,
      [cleanUsername, hashedPassword, cleanEmail, cleanName, cleanAvatarUrl],
    );

    const newUser = rows[0];
    const token = signToken(newUser.id, newUser.username);

    res.status(201).json({ token, user: publicUser(newUser) });
  } catch (err: unknown) {
    const errObj = err as {
      code?: string;
      message?: string;
      constraint?: string;
    };
    // PostgreSQL unique-violation error code
    if (errObj.code === "23505") {
      const msg = (errObj.message || "") + (errObj.constraint || "");
      if (msg.includes("email") || msg.includes("users_email_lower_idx")) {
        res.status(409).json({ error: "This email is already registered." });
        return;
      }
      res.status(409).json({ error: "Username is already taken." });
      return;
    }
    console.error("Register error:", err);
    res.status(500).json({ error: "An unexpected database error occurred." });
  }
});

// ---------------------------------------------------------------------------
// POST /login
// ---------------------------------------------------------------------------
/**
 * Login with username OR email + password.
 * Body: { username: string, password: string }
 */
router.post("/login", async (req: Request, res: Response): Promise<void> => {
  const { username, password } = req.body ?? {};

  if (typeof username !== "string" || typeof password !== "string") {
    res
      .status(400)
      .json({ error: "Username/email and password are required." });
    return;
  }

  const queryIdentifier = username.trim();

  const { rows } = await pool.query<UserRow>(
    `SELECT * FROM users
     WHERE LOWER(username) = LOWER($1)
        OR (email IS NOT NULL AND LOWER(email) = LOWER($1))`,
    [queryIdentifier],
  );
  const user = rows[0] as UserRow | undefined;

  // If user signed up via OAuth without a local password
  if (user && !user.password) {
    const provider = user.google_id ? "Google" : user.github_id ? "GitHub" : "OAuth";
    res.status(400).json({
      error:
        `This account was created with ${provider}. Please use "Continue with ${provider}" to sign in.`,
    });
    return;
  }

  // Constant-time comparison to prevent user-enumeration via timing
  const passwordToCheck =
    user?.password ?? "$2a$12$invalidhashpadding000000000000000";
  const passwordMatch = await bcrypt.compare(password, passwordToCheck);

  if (!user || !passwordMatch) {
    res.status(401).json({ error: "Invalid username/email or password." });
    return;
  }

  const token = signToken(user.id, user.username);
  res.status(200).json({ token, user: publicUser(user) });
});

// ---------------------------------------------------------------------------
// GET /me
// ---------------------------------------------------------------------------
/**
 * Return the currently authenticated user's profile.
 * Requires a valid Bearer token.
 */
router.get("/me", async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ error: "Not authenticated." });
    return;
  }

  try {
    const { rows } = await pool.query<UserRow>(
      "SELECT * FROM users WHERE id = $1",
      [req.user.userId],
    );
    const user = rows[0] as UserRow | undefined;

    if (!user) {
      res.status(404).json({ error: "User not found." });
      return;
    }

    res.status(200).json({ user: publicUser(user) });
  } catch (err: unknown) {
    console.error("Get /me error:", err);
    res.status(500).json({ error: "Database query failed." });
  }
});

export default router;
