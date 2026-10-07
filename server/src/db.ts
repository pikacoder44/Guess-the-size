import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set.');
}

interface DbPool {
  query<T = any>(queryText: string, values?: any[]): Promise<{ rows: T[] }>;
}

let pool: DbPool;

const isPlaceholderUrl = !process.env.DATABASE_URL ||
  process.env.DATABASE_URL.includes('<password>') ||
  process.env.DATABASE_URL.includes('<project-ref>') ||
  process.env.DATABASE_URL.includes('<') ||
  process.env.DATABASE_URL.includes('>');

if (isPlaceholderUrl) {
  console.warn('\n⚠️  Notice: DATABASE_URL in server/.env has placeholder values.');
  console.warn('   Running with in-memory store for local testing.');
  console.warn('   Provide real Supabase / PostgreSQL credentials in server/.env for persistence.\n');

  interface MemoryUser {
    id: number;
    username: string;
    password: string;
    created_at: string;
  }

  const memoryUsers: MemoryUser[] = [];
  let nextId = 1;

  pool = {
    async query<T = any>(queryText: string, values: any[] = []): Promise<{ rows: T[] }> {
      const normalized = queryText.trim().replace(/\s+/g, ' ');

      // Schema initialization queries
      if (normalized.startsWith('CREATE TABLE') || normalized.startsWith('CREATE UNIQUE INDEX')) {
        return { rows: [] };
      }

      // INSERT INTO users
      if (normalized.startsWith('INSERT INTO users')) {
        const [username, password] = values;
        const exists = memoryUsers.some((u) => u.username.toLowerCase() === String(username).toLowerCase());
        if (exists) {
          const err: any = new Error('duplicate key value violates unique constraint');
          err.code = '23505';
          throw err;
        }
        const newUser: MemoryUser = {
          id: nextId++,
          username: String(username),
          password: String(password),
          created_at: new Date().toISOString(),
        };
        memoryUsers.push(newUser);
        return { rows: [newUser as unknown as T] };
      }

      // SELECT * FROM users WHERE LOWER(username) = LOWER($1)
      if (normalized.includes('LOWER(username) = LOWER($1)')) {
        const username = values[0];
        const user = memoryUsers.find((u) => u.username.toLowerCase() === String(username).toLowerCase());
        return { rows: user ? [user as unknown as T] : [] };
      }

      // SELECT id, username, created_at FROM users WHERE id = $1
      if (normalized.includes('FROM users WHERE id = $1')) {
        const id = Number(values[0]);
        const user = memoryUsers.find((u) => u.id === id);
        return { rows: user ? [user as unknown as T] : [] };
      }

      return { rows: [] };
    },
  };
} else {
  const pgPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_SSL === 'false' ? false : { rejectUnauthorized: false },
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
  });

  pgPool.on('error', (err) => {
    console.error('Unexpected PostgreSQL pool error:', err.message);
  });

  pool = pgPool;
}

/**
 * Bootstrap: create tables if they don't exist yet.
 * Called once on server start.
 */
export async function initDb(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id         SERIAL      PRIMARY KEY,
      username   TEXT        NOT NULL UNIQUE,
      password   TEXT        NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  // Case-insensitive unique index on username (lowercased)
  await pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS users_username_lower_idx
      ON users (LOWER(username));
  `);

  console.log('✅ Database tables verified.');
}

export default pool;
