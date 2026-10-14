import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import pool from '../db.js';

const router = Router();

const googleClientId = process.env.GOOGLE_CLIENT_ID || process.env.CLIENT_ID;
const googleClient = new OAuth2Client(googleClientId);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export interface UserRow {
  id: number;
  username: string;
  email: string | null;
  password: string | null;
  google_id: string | null;
  avatar_url: string | null;
  email_verified?: boolean | null;
  created_at: string;
  updated_at?: string;
}

const JWT_FALLBACK_SECRET = 'scaleguess-jwt-development-secret-key-change-in-production';

function getJwtSecret(): string {
  return process.env.JWT_SECRET || JWT_FALLBACK_SECRET;
}

function signToken(userId: number, username: string): string {
  const secret = getJwtSecret();
  const expiresIn = (process.env.JWT_EXPIRES_IN ?? '7d') as jwt.SignOptions['expiresIn'];
  return jwt.sign({ userId, username }, secret, { expiresIn });
}

function publicUser(user: UserRow) {
  return {
    id: user.id,
    username: user.username,
    email: user.email || undefined,
    avatarUrl: user.avatar_url || undefined,
    emailVerified: Boolean(user.email_verified),
    createdAt: user.created_at,
  };
}

// ---------------------------------------------------------------------------
// POST /api/auth/register
// ---------------------------------------------------------------------------
/**
 * Register a new user with username, password, and optional email.
 * Body: { username: string, password: string, email?: string }
 */
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  const { username, password, email } = req.body ?? {};

  // --- Validation ---
  if (typeof username !== 'string' || username.trim().length === 0) {
    res.status(400).json({ error: 'Username is required.' });
    return;
  }
  const cleanUsername = username.trim();
  if (cleanUsername.length > 32) {
    res.status(400).json({ error: 'Username must be 32 characters or fewer.' });
    return;
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(cleanUsername)) {
    res.status(400).json({
      error: 'Username may only contain letters, numbers, underscores, and hyphens.',
    });
    return;
  }
  if (typeof password !== 'string' || password.length < 4) {
    res.status(400).json({ error: 'Password must be at least 4 characters.' });
    return;
  }

  let cleanEmail: string | null = null;
  if (typeof email === 'string' && email.trim().length > 0) {
    cleanEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      res.status(400).json({ error: 'Please enter a valid email address.' });
      return;
    }
  }

  // --- Hash password & insert ---
  const hashedPassword = await bcrypt.hash(password, 12);

  try {
    const { rows } = await pool.query<UserRow>(
      `INSERT INTO users (username, password, email)
       VALUES ($1, $2, $3)
       RETURNING id, username, email, avatar_url, created_at`,
      [cleanUsername, hashedPassword, cleanEmail],
    );

    const newUser = rows[0];
    const token = signToken(newUser.id, newUser.username);

    res.status(201).json({ token, user: publicUser(newUser) });
  } catch (err: unknown) {
    const errObj = err as { code?: string; message?: string; constraint?: string };
    // PostgreSQL unique-violation error code
    if (errObj.code === '23505') {
      const msg = (errObj.message || '') + (errObj.constraint || '');
      if (msg.includes('email') || msg.includes('users_email_lower_idx')) {
        res.status(409).json({ error: 'This email is already registered.' });
        return;
      }
      res.status(409).json({ error: 'Username is already taken.' });
      return;
    }
    console.error('Register error:', err);
    res.status(500).json({ error: 'An unexpected database error occurred.' });
  }
});

// ---------------------------------------------------------------------------
// POST /api/auth/login
// ---------------------------------------------------------------------------
/**
 * Login with username OR email + password.
 * Body: { username: string, password: string }
 */
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const { username, password } = req.body ?? {};

  if (typeof username !== 'string' || typeof password !== 'string') {
    res.status(400).json({ error: 'Username/email and password are required.' });
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
      error: 'This account was created with Google. Please use "Continue with Google" to sign in.',
    });
    return;
  }

  // Constant-time comparison to prevent user-enumeration via timing
  const passwordToCheck = user?.password ?? '$2a$12$invalidhashpadding000000000000000';
  const passwordMatch = await bcrypt.compare(password, passwordToCheck);

  if (!user || !passwordMatch) {
    res.status(401).json({ error: 'Invalid username/email or password.' });
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
 * Body: { credential?: string, access_token?: string }
 */
router.post('/google', async (req: Request, res: Response): Promise<void> => {
  const { credential, access_token } = req.body ?? {};

  if (!credential && !access_token) {
    res.status(400).json({ error: 'Google ID token credential or access token is required.' });
    return;
  }

  let googleId: string;
  let profileEmail: string | null = null;
  let profileName: string | null = null;
  let avatarUrl: string | null = null;
  let emailVerified = false;

  // 1. Verify Google ID Token (standard GIS / @react-oauth/google credential)
  if (credential) {
    if (typeof credential !== 'string' || !credential.trim()) {
      res.status(400).json({ error: 'Invalid Google credential token provided.' });
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
        res.status(401).json({ error: 'Invalid Google token payload.' });
        return;
      }

      googleId = String(payload.sub).trim();
      profileEmail = payload.email ? payload.email.trim().toLowerCase() : null;
      profileName = payload.name ? payload.name.trim() : null;
      avatarUrl = payload.picture ? payload.picture.trim() : null;
      emailVerified = Boolean(payload.email_verified);
    } catch (tokenErr: unknown) {
      console.error('Google ID token verification failed:', tokenErr);
      const tokenMsg = tokenErr instanceof Error ? tokenErr.message : 'Cryptographic verification failed.';
      res.status(401).json({ error: `Google token verification failed: ${tokenMsg}` });
      return;
    }
  } else if (access_token) {
    // 2. Alternative verification via Google UserInfo API (for OAuth2 access tokens)
    if (typeof access_token !== 'string' || !access_token.trim()) {
      res.status(400).json({ error: 'Invalid Google access token provided.' });
      return;
    }

    try {
      const userinfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${access_token.trim()}` },
      });

      if (!userinfoRes.ok) {
        res.status(401).json({ error: 'Failed to verify Google access token with Google services.' });
        return;
      }

      const userInfo = (await userinfoRes.json()) as {
        sub?: string;
        email?: string;
        name?: string;
        picture?: string;
        email_verified?: boolean;
      };

      if (!userInfo || !userInfo.sub) {
        res.status(401).json({ error: 'Invalid Google userinfo response.' });
        return;
      }

      googleId = String(userInfo.sub).trim();
      profileEmail = userInfo.email ? userInfo.email.trim().toLowerCase() : null;
      profileName = userInfo.name ? userInfo.name.trim() : null;
      avatarUrl = userInfo.picture ? userInfo.picture.trim() : null;
      emailVerified = Boolean(userInfo.email_verified);
    } catch (err: unknown) {
      console.error('Google access token verification error:', err);
      res.status(401).json({ error: 'Unable to contact Google to verify access token.' });
      return;
    }
  } else {
    res.status(400).json({ error: 'Missing Google authentication token.' });
    return;
  }

  // Validate email format if Google returned an email
  if (profileEmail) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(profileEmail)) {
      res.status(400).json({ error: 'Invalid email address provided by Google.' });
      return;
    }
  }

  try {
    let user: UserRow | undefined;

    // 1. Search by verified googleId
    if (googleId) {
      const { rows: idRows } = await pool.query<UserRow>(
        'SELECT * FROM users WHERE google_id = $1',
        [googleId],
      );
      user = idRows[0];

      // Refresh avatar and verification status if user already exists
      if (user) {
        const { rows: updatedRows } = await pool.query<UserRow>(
          `UPDATE users
           SET avatar_url = COALESCE($1, avatar_url),
               email_verified = COALESCE($2, email_verified),
               updated_at = NOW()
           WHERE id = $3
           RETURNING *`,
          [avatarUrl, emailVerified, user.id],
        );
        user = updatedRows[0] || user;
      }
    }

    // 2. If not found by google_id, check by verified email
    if (!user && profileEmail) {
      const { rows: emailRows } = await pool.query<UserRow>(
        'SELECT * FROM users WHERE email IS NOT NULL AND LOWER(email) = LOWER($1)',
        [profileEmail],
      );
      user = emailRows[0];

      // If existing user found by email, link their google_id, avatar, and verified status
      if (user) {
        const { rows: updatedRows } = await pool.query<UserRow>(
          `UPDATE users
           SET google_id = $1,
               avatar_url = COALESCE(avatar_url, $2),
               email_verified = COALESCE($3, email_verified),
               updated_at = NOW()
           WHERE id = $4
           RETURNING *`,
          [googleId, avatarUrl, emailVerified, user.id],
        );
        user = updatedRows[0] || user;
      }
    }

    // 3. If user still does not exist, create a new record
    if (!user) {
      // Derive a clean, valid username
      let baseUsername = (profileName || profileEmail?.split('@')[0] || 'Player')
        .replace(/[^a-zA-Z0-9_-]/g, '_')
        .replace(/^_+|_+$/g, '')
        .slice(0, 20);

      if (!baseUsername || baseUsername.length === 0) {
        baseUsername = 'Player';
      }

      // Check if username already exists to prevent collision
      const { rows: existingUsernames } = await pool.query<UserRow>(
        'SELECT id FROM users WHERE LOWER(username) = LOWER($1)',
        [baseUsername],
      );

      let finalUsername = baseUsername;
      if (existingUsernames.length > 0) {
        finalUsername = `${baseUsername.slice(0, 16)}_${Math.floor(1000 + Math.random() * 9000)}`;
      }

      const { rows: newRows } = await pool.query<UserRow>(
        `INSERT INTO users (username, email, google_id, avatar_url, email_verified)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, username, email, avatar_url, email_verified, created_at`,
        [finalUsername, profileEmail || null, googleId, avatarUrl, emailVerified],
      );
      user = newRows[0];
    }

    if (!user) {
      res.status(500).json({ error: 'Failed to create or retrieve user profile for Google authentication.' });
      return;
    }

    const token = signToken(user.id, user.username);
    res.status(200).json({ token, user: publicUser(user) });
  } catch (err: unknown) {
    console.error('Google login error:', err);
    const errObj = err as { code?: string; message?: string; constraint?: string };

    if (errObj.code === '23505') {
      const msg = (errObj.message || '') + (errObj.constraint || '');
      if (msg.includes('email') || msg.includes('users_email_lower_idx')) {
        res.status(409).json({ error: 'This email is already associated with an existing account.' });
        return;
      }
      if (msg.includes('google_id') || msg.includes('users_google_id_idx')) {
        res.status(409).json({ error: 'This Google account is already linked to another user.' });
        return;
      }
      res.status(409).json({ error: 'Account or username collision occurred during Google sign in.' });
      return;
    }

    const exactReason = errObj.message || (err instanceof Error ? err.message : 'Failed to authenticate with Google.');
    res.status(500).json({ error: exactReason });
  }
});

// ---------------------------------------------------------------------------
// GET /api/auth/me
// ---------------------------------------------------------------------------
/**
 * Return the currently authenticated user's profile.
 * Requires a valid Bearer token.
 */
router.get('/me', async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ error: 'Not authenticated.' });
    return;
  }

  try {
    const { rows } = await pool.query<UserRow>(
      'SELECT id, username, email, avatar_url, email_verified, created_at FROM users WHERE id = $1',
      [req.user.userId],
    );
    const user = rows[0] as UserRow | undefined;

    if (!user) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    res.status(200).json({ user: publicUser(user) });
  } catch (err: unknown) {
    console.error('Get /me error:', err);
    res.status(500).json({ error: 'Database query failed.' });
  }
});

export default router;
