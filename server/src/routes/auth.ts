import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../db.js';

const router = Router();

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
 * Login or register with Google OAuth credentials.
 * Body: { credential?: string, email?: string, name?: string, googleId?: string, picture?: string }
 */
router.post('/google', async (req: Request, res: Response): Promise<void> => {
  const { credential, email, name, googleId: directGoogleId, picture } = req.body ?? {};

  let profileName = name;
  let profileEmail = email;
  let googleId: string | null = directGoogleId ? String(directGoogleId) : null;
  let avatarUrl: string | null = picture ? String(picture) : null;

  // Decode JWT ID token from Google Identity Services if present
  if (credential && typeof credential === 'string') {
    try {
      const decoded = jwt.decode(credential) as {
        sub?: string;
        name?: string;
        email?: string;
        picture?: string;
      } | null;

      if (decoded) {
        googleId = decoded.sub || googleId;
        profileName = decoded.name || profileName;
        profileEmail = decoded.email || profileEmail;
        avatarUrl = decoded.picture || avatarUrl;
      }
    } catch {
      // ignore decode failure and fall back to body fields
    }
  }

  try {
    let user: UserRow | undefined;

    // 1. First, search by stable Google ID if available
    if (googleId) {
      const { rows: idRows } = await pool.query<UserRow>(
        'SELECT * FROM users WHERE google_id = $1',
        [googleId],
      );
      user = idRows[0];
    }

    // 2. If not found by google_id, check by verified email
    if (!user && profileEmail) {
      const { rows: emailRows } = await pool.query<UserRow>(
        'SELECT * FROM users WHERE email IS NOT NULL AND LOWER(email) = LOWER($1)',
        [profileEmail.trim()],
      );
      user = emailRows[0];

      // If existing user found by email, link their google_id and avatar
      if (user && googleId) {
        const { rows: updatedRows } = await pool.query<UserRow>(
          `UPDATE users
           SET google_id = $1,
               avatar_url = COALESCE(avatar_url, $2),
               updated_at = NOW()
           WHERE id = $3
           RETURNING *`,
          [googleId, avatarUrl, user.id],
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
        `INSERT INTO users (username, email, google_id, avatar_url)
         VALUES ($1, $2, $3, $4)
         RETURNING id, username, email, avatar_url, created_at`,
        [finalUsername, profileEmail ? profileEmail.trim().toLowerCase() : null, googleId, avatarUrl],
      );
      user = newRows[0];
    }

    const token = signToken(user.id, user.username);
    res.status(200).json({ token, user: publicUser(user) });
  } catch (err: unknown) {
    console.error('Google login error:', err);
    res.status(500).json({ error: 'Failed to authenticate with Google.' });
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
      'SELECT id, username, email, avatar_url, created_at FROM users WHERE id = $1',
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
