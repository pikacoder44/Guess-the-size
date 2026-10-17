import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import pool from "../db.js";

import dotenv from "dotenv";
import path from "node:path";

dotenv.config();
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
dotenv.config({ path: path.resolve(__dirname, "../../../.env.local") });
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

const router = Router();

const googleClientId =
  process.env.GOOGLE_CLIENT_ID ||
  process.env.CLIENT_ID ||
  process.env.VITE_GOOGLE_CLIENT_ID ||
  "39468790277-loh0ppihjm67q0n2mq3f6925s75hlahe.apps.googleusercontent.com";
const googleClient = new OAuth2Client(googleClientId);

// ---------------------------------------------------------------------------
// Helpers & Types
// ---------------------------------------------------------------------------

export interface UserRow {
  id: number;
  username: string;
  name?: string | null;
  email: string | null;
  password: string | null;
  google_id: string | null;
  avatar_url: string | null;
  email_verified?: boolean | null;
  given_name?: string | null;
  family_name?: string | null;
  locale?: string | null;
  created_at: string;
  updated_at?: string;
}

const JWT_FALLBACK_SECRET =
  "scaleguess-jwt-development-secret-key-change-in-production";

function getJwtSecret(): string {
  return process.env.JWT_SECRET || JWT_FALLBACK_SECRET;
}

function signToken(userId: number, username: string): string {
  const secret = getJwtSecret();
  const expiresIn = (process.env.JWT_EXPIRES_IN ??
    "7d") as jwt.SignOptions["expiresIn"];
  return jwt.sign({ userId, username }, secret, { expiresIn });
}

function publicUser(user: UserRow) {
  return {
    id: user.id,
    username: user.username,
    name: user.name || undefined,
    email: user.email || undefined,
    avatarUrl: user.avatar_url || undefined,
    profilePicture: user.avatar_url || undefined,
    googleId: user.google_id || undefined,
    emailVerified: Boolean(user.email_verified),
    givenName: user.given_name || undefined,
    familyName: user.family_name || undefined,
    locale: user.locale || undefined,
    createdAt: user.created_at,
  };
}

// ---------------------------------------------------------------------------
// POST /api/auth/register
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
       RETURNING id, username, name, email, avatar_url, google_id, email_verified, created_at`,
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
// POST /api/auth/login
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

  // If user signed up via Google/OAuth without a local password
  if (user && !user.password) {
    res.status(400).json({
      error:
        'This account was created with Google. Please use "Continue with Google" to sign in.',
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
// POST /api/auth/google
// ---------------------------------------------------------------------------
/**
 * Cryptographically verify Google OAuth ID token (or access token) and authenticate user.
 * Stores username, name, avatar/profile picture, google_id, and other Google credentials.
 * Body: { credential?: string, access_token?: string, name?: string, email?: string }
 */
router.post("/google", async (req: Request, res: Response): Promise<void> => {
  const { credential, access_token } = req.body ?? {};

  if (!credential && !access_token) {
    res
      .status(400)
      .json({
        error: "Google ID token credential or access token is required.",
      });
    return;
  }

  let googleId: string;
  let profileEmail: string | null = null;
  let profileName: string | null = null;
  let avatarUrl: string | null = null;
  let emailVerified = false;
  let givenName: string | null = null;
  let familyName: string | null = null;
  let locale: string | null = null;

  // 1. Verify Google ID Token (standard GIS / @react-oauth/google credential)
  if (credential) {
    if (typeof credential !== "string" || !credential.trim()) {
      res
        .status(400)
        .json({ error: "Invalid Google credential token provided." });
      return;
    }

    try {
      const allowedAudiences = [
        googleClientId,
        process.env.GOOGLE_CLIENT_ID,
        process.env.CLIENT_ID,
        process.env.VITE_GOOGLE_CLIENT_ID,
      ].filter(Boolean) as string[];

      const ticket = await googleClient.verifyIdToken({
        idToken: credential.trim(),
        audience: allowedAudiences.length > 0 ? allowedAudiences : undefined,
      });

      const payload = ticket.getPayload();
      if (!payload || !payload.sub) {
        res.status(401).json({ error: "Invalid Google token payload." });
        return;
      }

      googleId = String(payload.sub).trim();
      profileEmail = payload.email ? payload.email.trim().toLowerCase() : null;
      profileName = payload.name ? payload.name.trim() : null;
      avatarUrl = payload.picture ? payload.picture.trim() : null;
      emailVerified = Boolean(payload.email_verified);
      givenName = payload.given_name ? payload.given_name.trim() : null;
      familyName = payload.family_name ? payload.family_name.trim() : null;
      locale = (payload as any).locale
        ? String((payload as any).locale).trim()
        : null;
    } catch (tokenErr: unknown) {
      console.error("Google ID token verification failed:", tokenErr);
      const tokenMsg =
        tokenErr instanceof Error
          ? tokenErr.message
          : "Cryptographic verification failed.";
      res
        .status(401)
        .json({ error: `Google token verification failed: ${tokenMsg}` });
      return;
    }
  } else if (access_token) {
    // 2. Alternative verification via Google UserInfo API (for OAuth2 access tokens)
    if (typeof access_token !== "string" || !access_token.trim()) {
      res.status(400).json({ error: "Invalid Google access token provided." });
      return;
    }

    try {
      const userinfoRes = await fetch(
        "https://www.googleapis.com/oauth2/v3/userinfo",
        {
          headers: { Authorization: `Bearer ${access_token.trim()}` },
        },
      );

      if (!userinfoRes.ok) {
        res
          .status(401)
          .json({
            error: "Failed to verify Google access token with Google services.",
          });
        return;
      }

      const userInfo = (await userinfoRes.json()) as {
        sub?: string;
        email?: string;
        name?: string;
        picture?: string;
        email_verified?: boolean;
        given_name?: string;
        family_name?: string;
        locale?: string;
      };

      if (!userInfo || !userInfo.sub) {
        res.status(401).json({ error: "Invalid Google userinfo response." });
        return;
      }

      googleId = String(userInfo.sub).trim();
      profileEmail = userInfo.email
        ? userInfo.email.trim().toLowerCase()
        : null;
      profileName = userInfo.name ? userInfo.name.trim() : null;
      avatarUrl = userInfo.picture ? userInfo.picture.trim() : null;
      emailVerified = Boolean(userInfo.email_verified);
      givenName = userInfo.given_name ? userInfo.given_name.trim() : null;
      familyName = userInfo.family_name ? userInfo.family_name.trim() : null;
      locale = userInfo.locale ? userInfo.locale.trim() : null;
    } catch (err: unknown) {
      console.error("Google access token verification error:", err);
      res
        .status(401)
        .json({ error: "Unable to contact Google to verify access token." });
      return;
    }
  } else {
    res.status(400).json({ error: "Missing Google authentication token." });
    return;
  }

  // Optional overrides from body if provided
  if (!profileName && req.body.name) {
    profileName = String(req.body.name).trim();
  }
  if (!profileEmail && req.body.email) {
    profileEmail = String(req.body.email).trim().toLowerCase();
  }

  // Validate email format if Google returned an email
  if (profileEmail) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(profileEmail)) {
      res
        .status(400)
        .json({ error: "Invalid email address provided by Google." });
      return;
    }
  }

  try {
    let user: UserRow | undefined;

    // 1. Search by verified googleId
    if (googleId) {
      const { rows: idRows } = await pool.query<UserRow>(
        "SELECT * FROM users WHERE google_id = $1",
        [googleId],
      );
      user = idRows[0];

      // Refresh name, email, and verification status if user already exists, but preserve custom avatar
      if (user) {
        console.log(
          `[Google Auth] Refreshing existing user id=${user.id} (${user.username}). Incoming avatarUrl:`,
          avatarUrl,
        );
        const { rows: updatedRows } = await pool.query<UserRow>(
          `UPDATE users
           SET name = COALESCE($1, name),
               avatar_url = CASE WHEN avatar_url IS NULL OR avatar_url = '' THEN $2 ELSE avatar_url END,
               email = COALESCE($3, email),
               email_verified = COALESCE($4, email_verified),
               given_name = COALESCE($5, given_name),
               family_name = COALESCE($6, family_name),
               locale = COALESCE($7, locale),
               updated_at = NOW()
           WHERE id = $8
           RETURNING *`,
          [
            profileName,
            avatarUrl,
            profileEmail,
            emailVerified,
            givenName,
            familyName,
            locale,
            user.id,
          ],
        );
        user = updatedRows[0] || user;
        console.log(
          `[Google Auth] User refreshed. Persisted avatar_url:`,
          user.avatar_url,
        );
      }
    }

    // 2. If not found by google_id, check by verified email
    if (!user && profileEmail) {
      const { rows: emailRows } = await pool.query<UserRow>(
        "SELECT * FROM users WHERE email IS NOT NULL AND LOWER(email) = LOWER($1)",
        [profileEmail],
      );
      user = emailRows[0];

      // If existing user found by email, link their google_id, name, and verified status, but preserve custom avatar
      if (user) {
        console.log(
          `[Google Auth] Linking Google credentials to existing user id=${user.id} (${user.username}). Incoming avatarUrl:`,
          avatarUrl,
        );
        const { rows: updatedRows } = await pool.query<UserRow>(
          `UPDATE users
           SET google_id = $1,
               name = COALESCE($2, name),
               avatar_url = CASE WHEN avatar_url IS NULL OR avatar_url = '' THEN $3 ELSE avatar_url END,
               email_verified = COALESCE($4, email_verified),
               given_name = COALESCE($5, given_name),
               family_name = COALESCE($6, family_name),
               locale = COALESCE($7, locale),
               updated_at = NOW()
           WHERE id = $8
           RETURNING *`,
          [
            googleId,
            profileName,
            avatarUrl,
            emailVerified,
            givenName,
            familyName,
            locale,
            user.id,
          ],
        );
        user = updatedRows[0] || user;
        console.log(
          `[Google Auth] User linked. Persisted avatar_url:`,
          user.avatar_url,
        );
      }
    }

    // 3. If user still does not exist, create a new record
    if (!user) {
      // Derive a clean, valid username
      let baseUsername = (
        profileName ||
        profileEmail?.split("@")[0] ||
        "Player"
      )
        .replace(/[^a-zA-Z0-9_-]/g, "_")
        .replace(/^_+|_+$/g, "")
        .slice(0, 20);

      if (!baseUsername || baseUsername.length === 0) {
        baseUsername = "Player";
      }

      // Check if username already exists to prevent collision
      const { rows: existingUsernames } = await pool.query<UserRow>(
        "SELECT id FROM users WHERE LOWER(username) = LOWER($1)",
        [baseUsername],
      );

      let finalUsername = baseUsername;
      if (existingUsernames.length > 0) {
        finalUsername = `${baseUsername.slice(0, 16)}_${Math.floor(1000 + Math.random() * 9000)}`;
      }

      const { rows: newRows } = await pool.query<UserRow>(
        `INSERT INTO users (username, name, email, google_id, avatar_url, email_verified, given_name, family_name, locale)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING id, username, name, email, google_id, avatar_url, email_verified, given_name, family_name, locale, created_at`,
        [
          finalUsername,
          profileName,
          profileEmail || null,
          googleId,
          avatarUrl,
          emailVerified,
          givenName,
          familyName,
          locale,
        ],
      );
      user = newRows[0];
    }

    if (!user) {
      res
        .status(500)
        .json({
          error:
            "Failed to create or retrieve user profile for Google authentication.",
        });
      return;
    }

    const token = signToken(user.id, user.username);
    res.status(200).json({ token, user: publicUser(user) });
  } catch (err: unknown) {
    console.error("Google login error:", err);
    const errObj = err as {
      code?: string;
      message?: string;
      constraint?: string;
    };

    if (errObj.code === "23505") {
      const msg = (errObj.message || "") + (errObj.constraint || "");
      if (msg.includes("email") || msg.includes("users_email_lower_idx")) {
        res
          .status(409)
          .json({
            error: "This email is already associated with an existing account.",
          });
        return;
      }
      if (msg.includes("google_id") || msg.includes("users_google_id_idx")) {
        res
          .status(409)
          .json({
            error: "This Google account is already linked to another user.",
          });
        return;
      }
      res
        .status(409)
        .json({
          error:
            "Account or username collision occurred during Google sign in.",
        });
      return;
    }

    const exactReason =
      errObj.message ||
      (err instanceof Error
        ? err.message
        : "Failed to authenticate with Google.");
    res.status(500).json({ error: exactReason });
  }
});

// ---------------------------------------------------------------------------
// PATCH & PUT /api/auth/profile
// ---------------------------------------------------------------------------
/**
 * Update authenticated user's profile settings (name and profile picture / avatar_url).
 * Body: { name?: string | null, avatarUrl?: string | null, profilePicture?: string | null }
 */
async function handleUpdateProfile(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: "Not authenticated." });
    return;
  }

  const { name, avatarUrl, profilePicture } = req.body ?? {};
  const requestedAvatar = avatarUrl !== undefined ? avatarUrl : profilePicture;

  console.log(`[handleUpdateProfile] User ID: ${req.user.userId}`);
  console.log(`[handleUpdateProfile] Incoming payload:`, {
    name,
    hasAvatarUrl: avatarUrl !== undefined,
    hasProfilePicture: profilePicture !== undefined,
    avatarPreview:
      typeof requestedAvatar === "string"
        ? `${requestedAvatar.slice(0, 50)}... (${requestedAvatar.length} chars)`
        : requestedAvatar,
  });

  // Validate name if provided
  let cleanName: string | null = null;
  if (name !== undefined) {
    if (typeof name === "string" && name.trim().length > 0) {
      if (name.trim().length > 60) {
        res
          .status(400)
          .json({ error: "Display name must be 60 characters or fewer." });
        return;
      }
      cleanName = name.trim();
    } else {
      cleanName = null;
    }
  }

  // Validate avatar if provided
  let cleanAvatar: string | null = null;
  if (requestedAvatar !== undefined) {
    if (
      typeof requestedAvatar === "string" &&
      requestedAvatar.trim().length > 0
    ) {
      const trimmed = requestedAvatar.trim();
      // Allow base64 data URIs or http/https URLs
      if (
        !trimmed.startsWith("data:image/") &&
        !/^https?:\/\//i.test(trimmed)
      ) {
        res
          .status(400)
          .json({
            error: "Profile picture must be a valid image URL or image file.",
          });
        return;
      }
      cleanAvatar = trimmed;
    } else {
      cleanAvatar = null;
    }
  }

  try {
    const { rows: currentRows } = await pool.query<UserRow>(
      "SELECT * FROM users WHERE id = $1",
      [req.user.userId],
    );
    const currentUser = currentRows[0];
    if (!currentUser) {
      console.warn(
        `[handleUpdateProfile] User not found with ID ${req.user.userId}`,
      );
      res.status(404).json({ error: "User not found." });
      return;
    }

    const finalName = name !== undefined ? cleanName : currentUser.name;
    const finalAvatar =
      requestedAvatar !== undefined ? cleanAvatar : currentUser.avatar_url;

    console.log(
      `[handleUpdateProfile] Executing SQL UPDATE for user ${req.user.userId}. finalAvatar:`,
      typeof finalAvatar === "string"
        ? `${finalAvatar.slice(0, 50)}... (${finalAvatar.length} chars)`
        : finalAvatar,
    );

    const { rows: updatedRows } = await pool.query<UserRow>(
      `UPDATE users
       SET name = $1,
           avatar_url = $2,
           updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [finalName, finalAvatar, req.user.userId],
    );

    if (!updatedRows || updatedRows.length === 0) {
      console.error(
        `[handleUpdateProfile] UPDATE returned 0 rows for user ID ${req.user.userId}`,
      );
      res
        .status(500)
        .json({ error: "Failed to update profile settings in database." });
      return;
    }

    const updatedUser = updatedRows[0];
    console.log(
      `[handleUpdateProfile] Successfully updated user ID ${updatedUser.id}. Persisted avatar_url:`,
      updatedUser.avatar_url
        ? `${updatedUser.avatar_url.slice(0, 50)}...`
        : null,
    );
    res.status(200).json({ user: publicUser(updatedUser) });
  } catch (err: unknown) {
    console.error("Update profile error:", err);
    res.status(500).json({ error: "Failed to update profile settings." });
  }
}

router.patch("/profile", handleUpdateProfile);
router.put("/profile", handleUpdateProfile);

// ---------------------------------------------------------------------------
// GET /api/auth/me
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
