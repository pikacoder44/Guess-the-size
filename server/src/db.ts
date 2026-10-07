import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set.');
}

/**
 * Shared PostgreSQL connection pool.
 * Supabase connection strings look like:
 *   postgresql://postgres:<password>@db.<project-ref>.supabase.co:5432/postgres
 *
 * For Supabase you MUST enable SSL – the pool is pre-configured for it.
 */
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === 'false' ? false : { rejectUnauthorized: false },
  max: 10,             // maximum connections in the pool
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL pool error:', err.message);
});

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
