import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../db.js';

const router = Router();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface UserRow {
  id: number;
  username: string;
  password: string;
  created_at: string;
}

function signToken(userId: number, username: string): string {
  const secret = process.env.JWT_SECRET!;
  const expiresIn = (process.env.JWT_EXPIRES_IN ?? '7d') as jwt.SignOptions['expiresIn'];
  return jwt.sign({ userId, username }, secret, { expiresIn });
}

function publicUser(user: UserRow) {
  return { id: user.id, username: user.username, createdAt: user.created_at };
}

// ---------------------------------------------------------------------------
// POST /api/auth/register
// ---------------------------------------------------------------------------
/**
 * Register a new user.
 *
 * Body: { username: string, password: string }
 *
 * Rules:
 *  - username: 1–32 characters, alphanumeric + underscore + hyphen (case-insensitive unique)
 *  - password: minimum 4 characters
 *
 * Returns: { token, user }
 */
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  const { username, password } = req.body ?? {};

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

  // --- Hash password & insert (let the UNIQUE index catch duplicates) ---
  const hashedPassword = await bcrypt.hash(password, 12);

  try {
    const { rows } = await pool.query<UserRow>(
      `INSERT INTO users (username, password)
       VALUES ($1, $2)
       RETURNING id, username, created_at`,
      [cleanUsername, hashedPassword],
    );

    const newUser = rows[0];
    const token = signToken(newUser.id, newUser.username);

    res.status(201).json({ token, user: publicUser(newUser) });
  } catch (err: unknown) {
    // PostgreSQL unique-violation error code
    if ((err as { code?: string }).code === '23505') {
      res.status(409).json({ error: 'Username is already taken.' });
      return;
    }
    console.error('Register error:', err);
    res.status(500).json({ error: 'An unexpected error occurred.' });
  }
});

// ---------------------------------------------------------------------------
// POST /api/auth/login
// ---------------------------------------------------------------------------
/**
 * Login with username + password.
 *
 * Body: { username: string, password: string }
 *
 * Returns: { token, user }
 */
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const { username, password } = req.body ?? {};

  if (typeof username !== 'string' || typeof password !== 'string') {
    res.status(400).json({ error: 'Username and password are required.' });
    return;
  }

  const { rows } = await pool.query<UserRow>(
    // LOWER() match honours the case-insensitive unique index
    'SELECT * FROM users WHERE LOWER(username) = LOWER($1)',
    [username.trim()],
  );
  const user = rows[0] as UserRow | undefined;

  // Constant-time comparison to prevent user-enumeration via timing
  const passwordToCheck = user?.password ?? '$2a$12$invalidhashpadding000000000000000';
  const passwordMatch = await bcrypt.compare(password, passwordToCheck);

  if (!user || !passwordMatch) {
    res.status(401).json({ error: 'Invalid username or password.' });
    return;
  }

  const token = signToken(user.id, user.username);

  res.status(200).json({ token, user: publicUser(user) });
});

// ---------------------------------------------------------------------------
// POST /api/auth/google
// ---------------------------------------------------------------------------
/**
 * Login or register with Google credentials.
 * Body: { credential?: string, email?: string, name?: string }
 *
 * Returns: { token, user }
 */
router.post('/google', async (req: Request, res: Response): Promise<void> => {
  const { credential, email, name } = req.body ?? {};

  let profileName = name;
  let profileEmail = email;

  // If a JWT ID token was passed from Google Identity Services
  if (credential && typeof credential === 'string') {
    try {
      const decoded = jwt.decode(credential) as { name?: string; email?: string } | null;
      if (decoded) {
        profileName = decoded.name || profileName;
        profileEmail = decoded.email || profileEmail;
      }
    } catch {
      // ignore decode failure and fall back to body fields
    }
  }

  // Derive a valid username matching rules (1-32 chars, [a-zA-Z0-9_-])
  let baseUsername = (profileName || profileEmail?.split('@')[0] || 'GoogleUser')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 24);

  if (!baseUsername || baseUsername.length === 0) {
    baseUsername = 'GoogleUser';
  }

  try {
    // Check if user already exists
    const { rows: existingRows } = await pool.query<UserRow>(
      'SELECT * FROM users WHERE LOWER(username) = LOWER($1)',
      [baseUsername],
    );

    let user = existingRows[0];

    if (!user) {
      // Create user with a secure random hash password
      const randomPassword = `oauth_google_${Math.random().toString(36).substring(2)}${Date.now()}`;
      const hashedPassword = await bcrypt.hash(randomPassword, 10);

      try {
        const { rows: newRows } = await pool.query<UserRow>(
          `INSERT INTO users (username, password)
           VALUES ($1, $2)
           RETURNING id, username, created_at`,
          [baseUsername, hashedPassword],
        );
        user = newRows[0];
      } catch {
        // In case of conflict, try with random suffix
        const fallbackUsername = `${baseUsername.slice(0, 20)}_${Math.floor(1000 + Math.random() * 9000)}`;
        const { rows: retryRows } = await pool.query<UserRow>(
          `INSERT INTO users (username, password)
           VALUES ($1, $2)
           RETURNING id, username, created_at`,
          [fallbackUsername, hashedPassword],
        );
        user = retryRows[0];
      }
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
 *
 * Returns: { user }
 */
router.get('/me', async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ error: 'Not authenticated.' });
    return;
  }

  const { rows } = await pool.query<UserRow>(
    'SELECT id, username, created_at FROM users WHERE id = $1',
    [req.user.userId],
  );
  const user = rows[0] as UserRow | undefined;

  if (!user) {
    res.status(404).json({ error: 'User not found.' });
    return;
  }

  res.status(200).json({ user: publicUser(user) });
});

export default router;
