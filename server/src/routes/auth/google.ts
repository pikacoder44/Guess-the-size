import { Router, Request, Response } from "express";
import { OAuth2Client } from "google-auth-library";
import pool from "../../db.js";
import { UserRow, signToken, publicUser, sanitizeUsername } from "./utils.js";

const router = Router();

const googleClientId =
  process.env.GOOGLE_CLIENT_ID ||
  process.env.CLIENT_ID ||
  process.env.VITE_GOOGLE_CLIENT_ID ||
  "39468790277-loh0ppihjm67q0n2mq3f6925s75hlahe.apps.googleusercontent.com";
const googleClient = new OAuth2Client(googleClientId);

// ---------------------------------------------------------------------------
// POST /google (or POST /)
// ---------------------------------------------------------------------------
/**
 * Cryptographically verify Google OAuth ID token (or access token) and authenticate user.
 * Stores username, name, avatar/profile picture, google_id, and other Google credentials.
 * Body: { credential?: string, access_token?: string, name?: string, email?: string }
 */
export async function handleGoogleAuth(req: Request, res: Response): Promise<void> {
  const { credential, access_token } = req.body ?? {};

  if (!credential && !access_token) {
    res.status(400).json({
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
      res.status(400).json({ error: "Invalid Google credential token provided." });
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
        res.status(401).json({
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
      const baseUsername = sanitizeUsername(
        profileName || profileEmail?.split("@")[0] || "Player"
      );

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
         RETURNING id, username, name, email, google_id, github_id, avatar_url, email_verified, given_name, family_name, locale, created_at`,
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
      res.status(500).json({
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
        res.status(409).json({
          error: "This email is already associated with an existing account.",
        });
        return;
      }
      if (msg.includes("google_id") || msg.includes("users_google_id_idx")) {
        res.status(409).json({
          error: "This Google account is already linked to another user.",
        });
        return;
      }
      res.status(409).json({
        error: "Account or username collision occurred during Google sign in.",
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
}

router.post("/google", handleGoogleAuth);
router.post("/", handleGoogleAuth);

export default router;
