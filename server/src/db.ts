import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'node:path';

dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export interface DbPool {
  query<T = any>(queryText: string, values?: any[]): Promise<{ rows: T[] }>;
}

let pool: DbPool;

const databaseUrl = process.env.DATABASE_URL || '';
export const isPlaceholderUrl = !databaseUrl ||
  databaseUrl.includes('<password>') ||
  databaseUrl.includes('<project-ref>') ||
  databaseUrl.includes('<') ||
  databaseUrl.includes('>');

export const isUsingMemoryStore = isPlaceholderUrl;

if (isPlaceholderUrl) {
  console.warn('\n⚠️  Notice: DATABASE_URL in server/.env has placeholder or missing values.');
  console.warn('   Running with in-memory store for local testing.');
  console.warn('   To persist to Supabase PostgreSQL, set real credentials in server/.env:\n' +
               '   DATABASE_URL=postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres\n');

  interface MemoryUser {
    id: number;
    username: string;
    name: string | null;
    email: string | null;
    password: string | null;
    google_id: string | null;
    github_id: string | null;
    avatar_url: string | null;
    email_verified: boolean;
    given_name: string | null;
    family_name: string | null;
    locale: string | null;
    created_at: string;
    updated_at: string;
    is_history_public?: boolean;
  }

  interface MemoryGameResult {
    id: number;
    user_id: number | null;
    mode: string;
    date: string | null;
    total_score: number;
    average_error: number;
    rounds: any[];
    completed_at: string;
  }

  const memoryUsers: MemoryUser[] = [
    { id: 1, username: 'ApexEstimator', name: 'Kai Sterling', email: 'kai@example.com', password: null, google_id: null, github_id: null, avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80', email_verified: true, given_name: 'Kai', family_name: 'Sterling', locale: 'en', created_at: new Date(Date.now() - 86400000 * 30).toISOString(), updated_at: new Date().toISOString(), is_history_public: true },
    { id: 2, username: 'QuantumScale', name: 'Elena Rostova', email: 'elena@example.com', password: null, google_id: null, github_id: null, avatar_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=80', email_verified: true, given_name: 'Elena', family_name: 'Rostova', locale: 'en', created_at: new Date(Date.now() - 86400000 * 25).toISOString(), updated_at: new Date().toISOString(), is_history_public: true },
    { id: 3, username: 'PixelMaster', name: 'Marcus Chen', email: 'marcus@example.com', password: null, google_id: null, github_id: null, avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80', email_verified: true, given_name: 'Marcus', family_name: 'Chen', locale: 'en', created_at: new Date(Date.now() - 86400000 * 20).toISOString(), updated_at: new Date().toISOString(), is_history_public: true },
    { id: 4, username: 'MetricWhiz', name: 'Sophia Lin', email: 'sophia@example.com', password: null, google_id: null, github_id: null, avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80', email_verified: true, given_name: 'Sophia', family_name: 'Lin', locale: 'en', created_at: new Date(Date.now() - 86400000 * 18).toISOString(), updated_at: new Date().toISOString(), is_history_public: true },
    { id: 5, username: 'VoxelVision', name: 'David Novak', email: 'david@example.com', password: null, google_id: null, github_id: null, avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80', email_verified: true, given_name: 'David', family_name: 'Novak', locale: 'en', created_at: new Date(Date.now() - 86400000 * 15).toISOString(), updated_at: new Date().toISOString(), is_history_public: true },
    { id: 6, username: 'ScalePro99', name: 'Aria Thorne', email: 'aria@example.com', password: null, google_id: null, github_id: null, avatar_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=120&auto=format&fit=crop&q=80', email_verified: true, given_name: 'Aria', family_name: 'Thorne', locale: 'en', created_at: new Date(Date.now() - 86400000 * 12).toISOString(), updated_at: new Date().toISOString(), is_history_public: true },
    { id: 7, username: 'ChronoGauge', name: 'Lucas Meyer', email: 'lucas@example.com', password: null, google_id: null, github_id: null, avatar_url: null, email_verified: true, given_name: 'Lucas', family_name: 'Meyer', locale: 'en', created_at: new Date(Date.now() - 86400000 * 10).toISOString(), updated_at: new Date().toISOString(), is_history_public: false },
    { id: 8, username: 'NovaPrecision', name: 'Zoe Vance', email: 'zoe@example.com', password: null, google_id: null, github_id: null, avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80', email_verified: true, given_name: 'Zoe', family_name: 'Vance', locale: 'en', created_at: new Date(Date.now() - 86400000 * 8).toISOString(), updated_at: new Date().toISOString(), is_history_public: true },
    { id: 9, username: 'SpatialSense', name: 'Jordan Reed', email: 'jordan@example.com', password: null, google_id: null, github_id: null, avatar_url: null, email_verified: true, given_name: 'Jordan', family_name: 'Reed', locale: 'en', created_at: new Date(Date.now() - 86400000 * 5).toISOString(), updated_at: new Date().toISOString(), is_history_public: true },
    { id: 10, username: 'ByteSize', name: 'Samira Patel', email: 'samira@example.com', password: null, google_id: null, github_id: null, avatar_url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=120&auto=format&fit=crop&q=80', email_verified: true, given_name: 'Samira', family_name: 'Patel', locale: 'en', created_at: new Date(Date.now() - 86400000 * 3).toISOString(), updated_at: new Date().toISOString(), is_history_public: true },
  ];

  const memoryGameResults: MemoryGameResult[] = [
    { id: 1, user_id: 1, mode: 'daily', date: new Date().toISOString().slice(0, 10), total_score: 494, average_error: 0.2, rounds: [], completed_at: new Date(Date.now() - 3600000 * 2).toISOString() },
    { id: 2, user_id: 2, mode: 'practice', date: new Date().toISOString().slice(0, 10), total_score: 489, average_error: 0.8, rounds: [], completed_at: new Date(Date.now() - 3600000 * 5).toISOString() },
    { id: 3, user_id: 3, mode: 'daily', date: new Date().toISOString().slice(0, 10), total_score: 483, average_error: 1.4, rounds: [], completed_at: new Date(Date.now() - 3600000 * 12).toISOString() },
    { id: 4, user_id: 4, mode: 'practice', date: new Date().toISOString().slice(0, 10), total_score: 477, average_error: 2.1, rounds: [], completed_at: new Date(Date.now() - 3600000 * 18).toISOString() },
    { id: 5, user_id: 5, mode: 'practice', date: new Date().toISOString().slice(0, 10), total_score: 471, average_error: 3.5, rounds: [], completed_at: new Date(Date.now() - 3600000 * 24).toISOString() },
    { id: 6, user_id: 6, mode: 'daily', date: new Date().toISOString().slice(0, 10), total_score: 465, average_error: 4.2, rounds: [], completed_at: new Date(Date.now() - 3600000 * 30).toISOString() },
    { id: 7, user_id: 7, mode: 'practice', date: new Date().toISOString().slice(0, 10), total_score: 458, average_error: 5.6, rounds: [], completed_at: new Date(Date.now() - 3600000 * 36).toISOString() },
    { id: 8, user_id: 8, mode: 'daily', date: new Date().toISOString().slice(0, 10), total_score: 449, average_error: 6.3, rounds: [], completed_at: new Date(Date.now() - 3600000 * 42).toISOString() },
    { id: 9, user_id: 9, mode: 'practice', date: new Date().toISOString().slice(0, 10), total_score: 441, average_error: 7.9, rounds: [], completed_at: new Date(Date.now() - 3600000 * 48).toISOString() },
    { id: 10, user_id: 10, mode: 'practice', date: new Date().toISOString().slice(0, 10), total_score: 432, average_error: 8.8, rounds: [], completed_at: new Date(Date.now() - 3600000 * 60).toISOString() },
  ];

  let nextUserId = 11;
  let nextResultId = 11;

  pool = {
    async query<T = any>(queryText: string, values: any[] = []): Promise<{ rows: T[] }> {
      const normalized = queryText.trim().replace(/\s+/g, ' ');

      // Schema DDL queries
      if (
        normalized.startsWith('CREATE TABLE') ||
        normalized.startsWith('CREATE INDEX') ||
        normalized.startsWith('CREATE UNIQUE INDEX') ||
        normalized.startsWith('ALTER TABLE')
      ) {
        return { rows: [] };
      }

      // Ping / health check query
      if (normalized.startsWith('SELECT 1')) {
        return { rows: [{ ok: 1 } as unknown as T] };
      }

      // INSERT INTO users
      if (normalized.startsWith('INSERT INTO users')) {
        let username = '';
        let password: string | null = null;
        let email: string | null = null;
        let name: string | null = null;
        let google_id: string | null = null;
        let github_id: string | null = null;
        let avatar_url: string | null = null;
        let email_verified = false;
        let given_name: string | null = null;
        let family_name: string | null = null;
        let locale: string | null = null;

        const colMatch = queryText.match(/INSERT\s+INTO\s+users\s*\(([^)]+)\)/i);
        if (colMatch) {
          const cols = colMatch[1].split(',').map((c) => c.trim().toLowerCase());
          cols.forEach((col, idx) => {
            const val = values[idx];
            if (col === 'username') username = String(val ?? '');
            else if (col === 'password') password = val ? String(val) : null;
            else if (col === 'email') email = val ? String(val) : null;
            else if (col === 'name') name = val ? String(val) : null;
            else if (col === 'google_id') google_id = val ? String(val) : null;
            else if (col === 'github_id') github_id = val ? String(val) : null;
            else if (col === 'avatar_url') avatar_url = val ? String(val) : null;
            else if (col === 'email_verified') email_verified = Boolean(val);
            else if (col === 'given_name') given_name = val ? String(val) : null;
            else if (col === 'family_name') family_name = val ? String(val) : null;
            else if (col === 'locale') locale = val ? String(val) : null;
          });
        } else {
          username = String(values[0] ?? '');
          password = values[1] ? String(values[1]) : null;
        }

        const usernameExists = memoryUsers.some(
          (u) => u.username.toLowerCase() === String(username).toLowerCase()
        );
        if (usernameExists) {
          const err: any = new Error('duplicate key value violates unique constraint "users_username_lower_idx"');
          err.code = '23505';
          throw err;
        }

        if (email) {
          const emailExists = memoryUsers.some(
            (u) => u.email && u.email.toLowerCase() === String(email).toLowerCase()
          );
          if (emailExists) {
            const err: any = new Error('duplicate key value violates unique constraint "users_email_lower_idx"');
            err.code = '23505';
            throw err;
          }
        }

        if (google_id) {
          const googleIdExists = memoryUsers.some(
            (u) => u.google_id && u.google_id === String(google_id)
          );
          if (googleIdExists) {
            const err: any = new Error('duplicate key value violates unique constraint "users_google_id_idx"');
            err.code = '23505';
            throw err;
          }
        }

        if (github_id) {
          const githubIdExists = memoryUsers.some(
            (u) => u.github_id && u.github_id === String(github_id)
          );
          if (githubIdExists) {
            const err: any = new Error('duplicate key value violates unique constraint "users_github_id_idx"');
            err.code = '23505';
            throw err;
          }
        }

        const newUser: MemoryUser = {
          id: nextUserId++,
          username: String(username),
          name: name ? String(name) : null,
          email: email ? String(email) : null,
          password: password ? String(password) : null,
          google_id: google_id ? String(google_id) : null,
          github_id: github_id ? String(github_id) : null,
          avatar_url: avatar_url ? String(avatar_url) : null,
          email_verified: Boolean(email_verified),
          given_name: given_name ? String(given_name) : null,
          family_name: family_name ? String(family_name) : null,
          locale: locale ? String(locale) : null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        memoryUsers.push(newUser);
        return { rows: [newUser as unknown as T] };
      }

      // SELECT * FROM users WHERE google_id = $1
      if (normalized.includes('WHERE google_id = $1')) {
        const gid = String(values[0]);
        const user = memoryUsers.find((u) => u.google_id === gid);
        return { rows: user ? [user as unknown as T] : [] };
      }

      // SELECT * FROM users WHERE github_id = $1
      if (normalized.includes('WHERE github_id = $1')) {
        const ghId = String(values[0]);
        const user = memoryUsers.find((u) => u.github_id === ghId);
        return { rows: user ? [user as unknown as T] : [] };
      }

      // SELECT * FROM users WHERE LOWER(username) = LOWER($1) OR (email IS NOT NULL AND LOWER(email) = LOWER($1))
      if (
        normalized.includes('LOWER(username) = LOWER($1) OR (email IS NOT NULL AND LOWER(email) = LOWER($1))') ||
        normalized.includes('LOWER(username) = LOWER($1)')
      ) {
        const queryTerm = String(values[0]).toLowerCase();
        const user = memoryUsers.find(
          (u) =>
            u.username.toLowerCase() === queryTerm ||
            (u.email && u.email.toLowerCase() === queryTerm)
        );
        return { rows: user ? [user as unknown as T] : [] };
      }

      // SELECT * FROM users WHERE email IS NOT NULL AND LOWER(email) = LOWER($1)
      if (normalized.includes('email IS NOT NULL AND LOWER(email) = LOWER($1)')) {
        const em = String(values[0]).toLowerCase();
        const user = memoryUsers.find((u) => u.email && u.email.toLowerCase() === em);
        return { rows: user ? [user as unknown as T] : [] };
      }

      // SELECT ... FROM users WHERE id = $1
      if (normalized.includes('FROM users WHERE id = $1')) {
        const id = Number(values[0]);
        const user = memoryUsers.find((u) => u.id === id);
        return { rows: user ? [user as unknown as T] : [] };
      }

      // UPDATE users SET ... WHERE id = ...
      if (normalized.startsWith('UPDATE users SET')) {
        const idMatch = normalized.match(/WHERE\s+id\s*=\s*\$(\d+)/i);
        let id = Number(values[values.length - 1]);
        if (idMatch) {
          const paramIdx = Number(idMatch[1]) - 1;
          id = Number(values[paramIdx]);
        }
        const user = memoryUsers.find((u) => u.id === id);
        if (user) {
          const setClauseMatch = normalized.match(/SET\s+(.*?)\s+WHERE/i);
          if (setClauseMatch) {
            const setClause = setClauseMatch[1];
            const assignments = setClause.split(',').map((s) => s.trim());
            assignments.forEach((assignment) => {
              const paramRef = assignment.match(/\$(\d+)/);
              if (paramRef) {
                const valIdx = Number(paramRef[1]) - 1;
                const val = values[valIdx];

                if (assignment.startsWith('name')) {
                  user.name = val ? String(val) : null;
                } else if (assignment.startsWith('avatar_url')) {
                  user.avatar_url = val ? String(val) : null;
                } else if (assignment.startsWith('google_id')) {
                  if (val !== undefined && val !== null) user.google_id = String(val);
                } else if (assignment.startsWith('github_id')) {
                  if (val !== undefined && val !== null) user.github_id = String(val);
                } else if (assignment.startsWith('email_verified')) {
                  if (val !== undefined && val !== null) user.email_verified = Boolean(val);
                } else if (assignment.startsWith('email')) {
                  if (val !== undefined && val !== null) user.email = String(val);
                } else if (assignment.startsWith('given_name')) {
                  if (val !== undefined && val !== null) user.given_name = String(val);
                } else if (assignment.startsWith('family_name')) {
                  if (val !== undefined && val !== null) user.family_name = String(val);
                } else if (assignment.startsWith('locale')) {
                  if (val !== undefined && val !== null) user.locale = String(val);
                }
              }
            });
          }
          user.updated_at = new Date().toISOString();
          return { rows: [user as unknown as T] };
        }
        return { rows: [] };
      }

      // INSERT INTO game_results
      if (normalized.startsWith('INSERT INTO game_results')) {
        const [user_id, mode, date, total_score, average_error, rounds] = values;
        const newResult: MemoryGameResult = {
          id: nextResultId++,
          user_id: user_id ? Number(user_id) : null,
          mode: String(mode),
          date: date ? String(date) : null,
          total_score: Number(total_score),
          average_error: Number(average_error),
          rounds: Array.isArray(rounds) ? rounds : [],
          completed_at: new Date().toISOString(),
        };
        memoryGameResults.push(newResult);
        return { rows: [newResult as unknown as T] };
      }

      // SELECT ... FROM game_results WHERE user_id = $1
      if (normalized.includes('FROM game_results WHERE user_id = $1')) {
        const userId = Number(values[0]);
        const userResults = memoryGameResults
          .filter((r) => r.user_id === userId)
          .sort((a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime());

        // Stats aggregate query
        if (normalized.toLowerCase().includes('count(*)::int as games_played')) {
          const gamesPlayed = userResults.length;
          const dailyCompleted = userResults.filter((r) => r.mode === 'daily').length;
          const bestScore = gamesPlayed > 0 ? Math.max(...userResults.map((r) => r.total_score)) : 0;
          const avgScore =
            gamesPlayed > 0
              ? Math.round(userResults.reduce((acc, r) => acc + r.total_score, 0) / gamesPlayed)
              : 0;

          return {
            rows: [
              {
                games_played: gamesPlayed,
                daily_completed: dailyCompleted,
                best_score: bestScore,
                average_score: avgScore,
              } as unknown as T,
            ],
          };
        }

        return { rows: userResults.slice(0, 20) as unknown as T[] };
      }

      // Rank calculation query
      if (normalized.toLowerCase().includes('count(distinct user_id)::int + 1 as rank')) {
        const score = Number(values[0]);
        const higherUsers = new Set(
          memoryGameResults
            .filter((r) => r.total_score > score && r.user_id !== null)
            .map((r) => r.user_id),
        );
        return { rows: [{ rank: higherUsers.size + 1 } as unknown as T] };
      }

      // Leaderboard query (supporting window query WITH ranked_scores AS (...) and direct joins)
      if (
        normalized.includes('ranked_scores') ||
        (normalized.includes('FROM game_results') && normalized.includes('JOIN users'))
      ) {
        // Group results by user_id, selecting each user's single highest total_score attempt
        const userBestMap = new Map<number, MemoryGameResult>();
        for (const r of memoryGameResults) {
          if (r.user_id === null || r.user_id === undefined) continue;
          const existing = userBestMap.get(r.user_id);
          if (!existing) {
            userBestMap.set(r.user_id, r);
          } else {
            // Pick higher score, or lower average error if tied, or earlier completion
            if (
              r.total_score > existing.total_score ||
              (r.total_score === existing.total_score && r.average_error < existing.average_error) ||
              (r.total_score === existing.total_score &&
                r.average_error === existing.average_error &&
                new Date(r.completed_at) < new Date(existing.completed_at))
            ) {
              userBestMap.set(r.user_id, r);
            }
          }
        }

        // Sort by total_score descending, tie-break by average_error ascending, limit to top 10
        const topResults = Array.from(userBestMap.values())
          .sort((a, b) => b.total_score - a.total_score || a.average_error - b.average_error)
          .slice(0, 10)
          .map((r) => {
            const user = memoryUsers.find((u) => u.id === r.user_id);
            return {
              id: r.id,
              total_score: r.total_score,
              average_error: r.average_error,
              mode: r.mode,
              date: r.date,
              completed_at: r.completed_at,
              user_id: user?.id ?? r.user_id,
              username: user?.username ?? 'Anonymous',
              name: user?.name ?? null,
              avatar_url: user?.avatar_url ?? null,
            };
          });

        return { rows: topResults as unknown as T[] };
      }

      return { rows: [] };
    },
  };
} else {
  // Real Supabase PostgreSQL Connection Pool
  const pgPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_SSL === 'false' ? false : { rejectUnauthorized: false },
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  });

  pgPool.on('error', (err) => {
    console.error('Unexpected PostgreSQL pool error:', err.message);
  });

  pool = pgPool;
}

/**
 * Health check helper for PostgreSQL / Supabase
 */
export async function checkDbHealth(): Promise<{
  ok: boolean;
  type: string;
  latencyMs: number;
  error?: string;
}> {
  const start = Date.now();
  try {
    await pool.query('SELECT 1 as ping');
    return {
      ok: true,
      type: isUsingMemoryStore ? 'in-memory-mock' : 'supabase-postgresql',
      latencyMs: Date.now() - start,
    };
  } catch (err: unknown) {
    return {
      ok: false,
      type: isUsingMemoryStore ? 'in-memory-mock' : 'supabase-postgresql',
      latencyMs: Date.now() - start,
      error: (err as Error).message,
    };
  }
}

/**
 * Bootstrap: create and migrate tables idempotently.
 * Called once on server start.
 */
export async function initDb(): Promise<void> {
  // 1. Users table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id             SERIAL      PRIMARY KEY,
      username       TEXT        NOT NULL UNIQUE,
      name           TEXT,
      email          TEXT,
      password       TEXT,
      google_id      TEXT,
      avatar_url     TEXT,
      email_verified BOOLEAN     DEFAULT FALSE,
      given_name     TEXT,
      family_name    TEXT,
      locale         TEXT,
      created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  // Non-destructive column additions in case table pre-exists
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS name TEXT;`);
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT;`);
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id TEXT;`);
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS github_id TEXT;`);
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;`);
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;`);
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS given_name TEXT;`);
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS family_name TEXT;`);
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS locale TEXT;`);
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();`);
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_history_public BOOLEAN DEFAULT TRUE;`);
  
  // Make password nullable for OAuth/Google users
  try {
    await pool.query(`ALTER TABLE users ALTER COLUMN password DROP NOT NULL;`);
  } catch {
    // Ignore if already nullable or unsupported
  }

  // Ensure avatar_url is explicitly TEXT (not VARCHAR(255)) so base64 uploads never truncate
  try {
    await pool.query(`ALTER TABLE users ALTER COLUMN avatar_url TYPE TEXT;`);
  } catch {
    // Ignore if already TEXT or unsupported
  }

  // Case-insensitive unique indexes
  await pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS users_username_lower_idx
      ON users (LOWER(username));
  `);

  await pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_idx
      ON users (LOWER(email))
      WHERE email IS NOT NULL;
  `);

  await pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS users_google_id_idx
      ON users (google_id)
      WHERE google_id IS NOT NULL;
  `);

  await pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS users_github_id_idx
      ON users (github_id)
      WHERE github_id IS NOT NULL;
  `);

  // 2. Game results / scores table for ScaleGuess
  await pool.query(`
    CREATE TABLE IF NOT EXISTS game_results (
      id             SERIAL           PRIMARY KEY,
      user_id        INTEGER          REFERENCES users(id) ON DELETE CASCADE,
      mode           TEXT             NOT NULL DEFAULT 'practice',
      date           TEXT,
      total_score    INTEGER          NOT NULL,
      average_error  DOUBLE PRECISION NOT NULL,
      rounds         JSONB            DEFAULT '[]'::jsonb,
      completed_at   TIMESTAMPTZ      NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS game_results_user_id_idx ON game_results (user_id);
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS game_results_date_idx ON game_results (date);
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS game_results_total_score_idx ON game_results (total_score DESC);
  `);

  console.log(`✅ Database tables & indexes verified (${isUsingMemoryStore ? 'In-Memory Mock' : 'Supabase PostgreSQL'}).`);
}

export default pool;
