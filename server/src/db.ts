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
    avatar_url: string | null;
    email_verified: boolean;
    given_name: string | null;
    family_name: string | null;
    locale: string | null;
    created_at: string;
    updated_at: string;
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

  const memoryUsers: MemoryUser[] = [];
  const memoryGameResults: MemoryGameResult[] = [];
  let nextUserId = 1;
  let nextResultId = 1;

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

        const newUser: MemoryUser = {
          id: nextUserId++,
          username: String(username),
          name: name ? String(name) : null,
          email: email ? String(email) : null,
          password: password ? String(password) : null,
          google_id: google_id ? String(google_id) : null,
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
        if (normalized.includes('COUNT(*)::int as games_played')) {
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

      // Leaderboard query
      if (normalized.includes('FROM game_results gr') && normalized.includes('JOIN users u')) {
        const topResults = [...memoryGameResults]
          .filter((r) => r.user_id !== null)
          .sort((a, b) => b.total_score - a.total_score || a.average_error - b.average_error)
          .slice(0, 25)
          .map((r) => {
            const user = memoryUsers.find((u) => u.id === r.user_id);
            return {
              id: r.id,
              total_score: r.total_score,
              average_error: r.average_error,
              mode: r.mode,
              date: r.date,
              completed_at: r.completed_at,
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
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;`);
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;`);
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS given_name TEXT;`);
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS family_name TEXT;`);
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS locale TEXT;`);
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();`);
  
  // Make password nullable for OAuth/Google users
  try {
    await pool.query(`ALTER TABLE users ALTER COLUMN password DROP NOT NULL;`);
  } catch {
    // Ignore if already nullable or unsupported
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
