import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';

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
    elapsed_ms: number;
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
    { id: 1, user_id: 1, mode: 'daily', date: new Date().toISOString().slice(0, 10), total_score: 494, average_error: 0.2, elapsed_ms: 38500, rounds: [], completed_at: new Date(Date.now() - 3600000 * 2).toISOString() },
    { id: 2, user_id: 2, mode: 'practice', date: new Date().toISOString().slice(0, 10), total_score: 489, average_error: 0.8, elapsed_ms: 42100, rounds: [], completed_at: new Date(Date.now() - 3600000 * 5).toISOString() },
    { id: 3, user_id: 3, mode: 'daily', date: new Date().toISOString().slice(0, 10), total_score: 483, average_error: 1.4, elapsed_ms: 51200, rounds: [], completed_at: new Date(Date.now() - 3600000 * 12).toISOString() },
    { id: 4, user_id: 4, mode: 'practice', date: new Date().toISOString().slice(0, 10), total_score: 477, average_error: 2.1, elapsed_ms: 60800, rounds: [], completed_at: new Date(Date.now() - 3600000 * 18).toISOString() },
    { id: 5, user_id: 5, mode: 'practice', date: new Date().toISOString().slice(0, 10), total_score: 471, average_error: 3.5, elapsed_ms: 74300, rounds: [], completed_at: new Date(Date.now() - 3600000 * 24).toISOString() },
    { id: 6, user_id: 6, mode: 'daily', date: new Date().toISOString().slice(0, 10), total_score: 465, average_error: 4.2, elapsed_ms: 88600, rounds: [], completed_at: new Date(Date.now() - 3600000 * 30).toISOString() },
    { id: 7, user_id: 7, mode: 'practice', date: new Date().toISOString().slice(0, 10), total_score: 458, average_error: 5.6, elapsed_ms: 95100, rounds: [], completed_at: new Date(Date.now() - 3600000 * 36).toISOString() },
    { id: 8, user_id: 8, mode: 'daily', date: new Date().toISOString().slice(0, 10), total_score: 449, average_error: 6.3, elapsed_ms: 103400, rounds: [], completed_at: new Date(Date.now() - 3600000 * 42).toISOString() },
    { id: 9, user_id: 9, mode: 'practice', date: new Date().toISOString().slice(0, 10), total_score: 441, average_error: 7.9, elapsed_ms: 118700, rounds: [], completed_at: new Date(Date.now() - 3600000 * 48).toISOString() },
    { id: 10, user_id: 10, mode: 'practice', date: new Date().toISOString().slice(0, 10), total_score: 432, average_error: 8.8, elapsed_ms: 132900, rounds: [], completed_at: new Date(Date.now() - 3600000 * 60).toISOString() },
  ];

  interface MemoryPuzzleItem {
    id: string;
    name: string;
    category: string;
    actual_measurement_meters: number;
    axis: string;
    svg_url: string;
    view_box: any;
    source: string;
    created_at: string;
    updated_at: string;
  }

  interface MemoryPuzzle {
    id: string;
    reference_item_id: string;
    target_item_id: string;
    category: string;
    puzzle_type: string;
    active_date: string | null;
    created_at: string;
  }

  const memoryPuzzleItems: MemoryPuzzleItem[] = [];
  const memoryPuzzles: MemoryPuzzle[] = [];

  try {
    const candidateItemPaths = [
      path.resolve(process.cwd(), 'src/data/puzzles.json'),
      path.resolve(__dirname, '../../../src/data/puzzles.json'),
      path.resolve(__dirname, '../../src/data/puzzles.json'),
    ];
    const rawItemsPath = candidateItemPaths.find((p) => fs.existsSync(p));
    if (rawItemsPath) {
      const itemsData = JSON.parse(fs.readFileSync(rawItemsPath, 'utf-8'));
      for (const it of itemsData) {
        memoryPuzzleItems.push({
          id: it.id,
          name: it.name,
          category: it.category,
          actual_measurement_meters: it.actualMeasurementMeters,
          axis: it.axis,
          svg_url: it.svgUrl,
          view_box: it.viewBox || { x: 0, y: 0, width: 100, height: 100 },
          source: it.source,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
    }
  } catch (err) {
    console.warn('Could not pre-load memoryPuzzleItems:', (err as Error).message);
  }

  try {
    const candidateSetPaths = [
      path.resolve(process.cwd(), 'src/data/puzzleSets.json'),
      path.resolve(__dirname, '../../../src/data/puzzleSets.json'),
      path.resolve(__dirname, '../../src/data/puzzleSets.json'),
    ];
    const rawPuzzlesPath = candidateSetPaths.find((p) => fs.existsSync(p));
    if (rawPuzzlesPath) {
      const puzzlesData = JSON.parse(fs.readFileSync(rawPuzzlesPath, 'utf-8'));
      for (const p of puzzlesData) {
        memoryPuzzles.push({
          id: p.id,
          reference_item_id: p.referenceId,
          target_item_id: p.targetId,
          category: p.category,
          puzzle_type: p.puzzleType || 'standard',
          active_date: p.activeDate || null,
          created_at: new Date().toISOString(),
        });
      }
    }
  } catch (err) {
    console.warn('Could not pre-load memoryPuzzles:', (err as Error).message);
  }

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
        const colMatch = queryText.match(/INSERT\s+INTO\s+game_results\s*\(([^)]+)\)/i);
        let user_id: any, mode: any, date: any, total_score: any, average_error: any, elapsed_ms: any, rounds: any;
        if (colMatch) {
          const cols = colMatch[1].split(',').map((c) => c.trim().toLowerCase());
          cols.forEach((col, idx) => {
            const val = values[idx];
            if (col === 'user_id') user_id = val;
            else if (col === 'mode') mode = val;
            else if (col === 'date') date = val;
            else if (col === 'total_score') total_score = val;
            else if (col === 'average_error') average_error = val;
            else if (col === 'elapsed_ms') elapsed_ms = val;
            else if (col === 'rounds') rounds = val;
          });
        } else {
          [user_id, mode, date, total_score, average_error, elapsed_ms, rounds] = values;
        }
        const newResult: MemoryGameResult = {
          id: nextResultId++,
          user_id: user_id ? Number(user_id) : null,
          mode: String(mode ?? 'practice'),
          date: date ? String(date) : null,
          total_score: Number(total_score ?? 0),
          average_error: Number(average_error ?? 0),
          elapsed_ms: Number(elapsed_ms ?? 0),
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

        // Stats aggregate query (used by /me route)
        if (normalized.toLowerCase().includes('count(*)::int as games_played')) {
          const gamesPlayed = userResults.length;
          const dailyCompleted = userResults.filter((r) => r.mode === 'daily').length;
          const bestScore = gamesPlayed > 0 ? Math.max(...userResults.map((r) => r.total_score)) : 0;
          const avgScore =
            gamesPlayed > 0
              ? Math.round(userResults.reduce((acc, r) => acc + r.total_score, 0) / gamesPlayed)
              : 0;

          // Personal best by 4-tier tie-breaker
          const sortedBest = [...userResults].sort((a, b) =>
            b.total_score - a.total_score ||
            a.average_error - b.average_error ||
            a.elapsed_ms - b.elapsed_ms ||
            new Date(a.completed_at).getTime() - new Date(b.completed_at).getTime()
          );
          const personalBest = sortedBest[0];

          return {
            rows: [
              {
                games_played: gamesPlayed,
                daily_completed: dailyCompleted,
                best_score: bestScore,
                best_average_error: personalBest?.average_error ?? 0,
                best_elapsed_ms: personalBest?.elapsed_ms ?? 0,
                average_score: avgScore,
              } as unknown as T,
            ],
          };
        }

        return { rows: userResults.slice(0, 20) as unknown as T[] };
      }

      // Rank calculation query (used by /me route with tie-breaker params)
      if (
        normalized.toLowerCase().includes('count(*)::int + 1 as rank') ||
        normalized.toLowerCase().includes('count(distinct user_id)::int + 1 as rank')
      ) {
        const score = Number(values[0]);
        const avgErr = values.length >= 2 ? Number(values[1]) : null;
        const elapsedMs = values.length >= 3 ? Number(values[2]) : null;

        // Per-user best records for rank comparison
        const userBestMap = new Map<number, MemoryGameResult>();
        for (const r of memoryGameResults) {
          if (r.user_id === null || r.user_id === undefined) continue;
          const existing = userBestMap.get(r.user_id);
          if (
            !existing ||
            r.total_score > existing.total_score ||
            (r.total_score === existing.total_score && r.average_error < existing.average_error) ||
            (r.total_score === existing.total_score &&
              r.average_error === existing.average_error &&
              r.elapsed_ms < existing.elapsed_ms) ||
            (r.total_score === existing.total_score &&
              r.average_error === existing.average_error &&
              r.elapsed_ms === existing.elapsed_ms &&
              new Date(r.completed_at) < new Date(existing.completed_at))
          ) {
            userBestMap.set(r.user_id, r);
          }
        }

        let ahead = 0;
        for (const best of userBestMap.values()) {
          const beatsScore = best.total_score > score;
          const beatsByError = avgErr !== null && best.total_score === score && best.average_error < avgErr;
          const beatsByTime =
            elapsedMs !== null &&
            avgErr !== null &&
            best.total_score === score &&
            best.average_error === avgErr &&
            best.elapsed_ms < elapsedMs;
          if (beatsScore || beatsByError || beatsByTime) ahead++;
        }
        return { rows: [{ rank: ahead + 1 } as unknown as T] };
      }

      // Leaderboard query (supporting window query WITH ranked_scores AS (...) and direct joins)
      if (
        normalized.includes('ranked_scores') ||
        (normalized.includes('FROM game_results') && normalized.includes('JOIN users'))
      ) {
        // Per-user best: 4-tier tie-breaker (score DESC, error ASC, elapsed_ms ASC, completed_at ASC)
        const userBestMap = new Map<number, MemoryGameResult>();
        for (const r of memoryGameResults) {
          if (r.user_id === null || r.user_id === undefined) continue;
          const existing = userBestMap.get(r.user_id);
          if (
            !existing ||
            r.total_score > existing.total_score ||
            (r.total_score === existing.total_score && r.average_error < existing.average_error) ||
            (r.total_score === existing.total_score &&
              r.average_error === existing.average_error &&
              r.elapsed_ms < existing.elapsed_ms) ||
            (r.total_score === existing.total_score &&
              r.average_error === existing.average_error &&
              r.elapsed_ms === existing.elapsed_ms &&
              new Date(r.completed_at) < new Date(existing.completed_at))
          ) {
            userBestMap.set(r.user_id, r);
          }
        }

        // Sort by same hierarchy, return top 10 with joined user data
        const topResults = Array.from(userBestMap.values())
          .sort(
            (a, b) =>
              b.total_score - a.total_score ||
              a.average_error - b.average_error ||
              a.elapsed_ms - b.elapsed_ms ||
              new Date(a.completed_at).getTime() - new Date(b.completed_at).getTime(),
          )
          .slice(0, 10)
          .map((r) => {
            const user = memoryUsers.find((u) => u.id === r.user_id);
            return {
              id: r.id,
              total_score: r.total_score,
              average_error: r.average_error,
              elapsed_ms: r.elapsed_ms,
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

      // SELECT ... FROM puzzle_items
      if (normalized.includes('FROM puzzle_items')) {
        if (normalized.includes('WHERE id = $1')) {
          const id = String(values[0]);
          const item = memoryPuzzleItems.find((i) => i.id === id);
          return { rows: item ? [item as unknown as T] : [] };
        }
        if (normalized.includes('WHERE category = $1')) {
          const cat = String(values[0]);
          const filtered = memoryPuzzleItems.filter((i) => i.category === cat);
          return { rows: filtered as unknown as T[] };
        }
        return { rows: memoryPuzzleItems as unknown as T[] };
      }

      // INSERT INTO puzzle_items
      if (normalized.startsWith('INSERT INTO puzzle_items')) {
        const id = String(values[0] ?? '');
        const name = String(values[1] ?? '');
        const category = String(values[2] ?? '');
        const actual_measurement_meters = Number(values[3] ?? 0);
        const axis = String(values[4] ?? 'height');
        const svg_url = String(values[5] ?? '');
        const view_box = typeof values[6] === 'string' ? JSON.parse(values[6]) : values[6];
        const source = String(values[7] ?? '');

        const existingIdx = memoryPuzzleItems.findIndex((i) => i.id === id);
        const item: MemoryPuzzleItem = {
          id,
          name,
          category,
          actual_measurement_meters,
          axis,
          svg_url,
          view_box,
          source,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        if (existingIdx >= 0) {
          memoryPuzzleItems[existingIdx] = item;
        } else {
          memoryPuzzleItems.push(item);
        }
        return { rows: [item as unknown as T] };
      }

      // SELECT ... FROM puzzles
      if (normalized.includes('FROM puzzles')) {
        let results = memoryPuzzles;

        if (normalized.includes('WHERE active_date = $1') || normalized.includes('WHERE p.active_date = $1')) {
          const date = String(values[0]);
          results = results.filter((p) => p.active_date === date);
        } else if (normalized.includes('WHERE category = $1') || normalized.includes('WHERE p.category = $1')) {
          const cat = String(values[0]);
          results = results.filter((p) => p.category === cat);
        } else if (normalized.includes('WHERE id = $1') || normalized.includes('WHERE p.id = $1')) {
          const id = String(values[0]);
          results = results.filter((p) => p.id === id);
        }

        // Map joined objects if query joins puzzle_items
        const joined = results.map((p) => {
          const ref = memoryPuzzleItems.find((i) => i.id === p.reference_item_id);
          const target = memoryPuzzleItems.find((i) => i.id === p.target_item_id);
          return {
            id: p.id,
            category: p.category,
            puzzle_type: p.puzzle_type,
            active_date: p.active_date,
            created_at: p.created_at,
            reference_item_id: p.reference_item_id,
            target_item_id: p.target_item_id,
            ref_name: ref?.name,
            ref_category: ref?.category,
            ref_actual_measurement_meters: ref?.actual_measurement_meters,
            ref_axis: ref?.axis,
            ref_svg_url: ref?.svg_url,
            ref_view_box: ref?.view_box,
            ref_source: ref?.source,
            target_name: target?.name,
            target_category: target?.category,
            target_actual_measurement_meters: target?.actual_measurement_meters,
            target_axis: target?.axis,
            target_svg_url: target?.svg_url,
            target_view_box: target?.view_box,
            target_source: target?.source,
          };
        });

        return { rows: joined as unknown as T[] };
      }

      // INSERT INTO puzzles
      if (normalized.startsWith('INSERT INTO puzzles')) {
        const id = String(values[0] ?? '');
        const reference_item_id = String(values[1] ?? '');
        const target_item_id = String(values[2] ?? '');
        const category = String(values[3] ?? '');
        const puzzle_type = String(values[4] ?? 'standard');
        const active_date = values[5] ? String(values[5]) : null;

        const existingIdx = memoryPuzzles.findIndex((p) => p.id === id);
        const pz: MemoryPuzzle = {
          id,
          reference_item_id,
          target_item_id,
          category,
          puzzle_type,
          active_date,
          created_at: new Date().toISOString(),
        };
        if (existingIdx >= 0) {
          memoryPuzzles[existingIdx] = pz;
        } else {
          memoryPuzzles.push(pz);
        }
        return { rows: [pz as unknown as T] };
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
      elapsed_ms     INTEGER          NOT NULL DEFAULT 0,
      rounds         JSONB            DEFAULT '[]'::jsonb,
      completed_at   TIMESTAMPTZ      NOT NULL DEFAULT NOW()
    );
  `);

  // Non-destructive column addition for existing tables
  await pool.query(`ALTER TABLE game_results ADD COLUMN IF NOT EXISTS elapsed_ms INTEGER NOT NULL DEFAULT 0;`);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS game_results_user_id_idx ON game_results (user_id);
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS game_results_date_idx ON game_results (date);
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS game_results_total_score_idx ON game_results (total_score DESC);
  `);

  // 3. Puzzle items catalog
  await pool.query(`
    CREATE TABLE IF NOT EXISTS puzzle_items (
      id                        TEXT             PRIMARY KEY,
      name                      TEXT             NOT NULL,
      category                  TEXT             NOT NULL,
      actual_measurement_meters DOUBLE PRECISION NOT NULL,
      axis                      TEXT             NOT NULL,
      svg_url                   TEXT             NOT NULL,
      view_box                  JSONB            NOT NULL,
      source                    TEXT             NOT NULL,
      created_at                TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
      updated_at                TIMESTAMPTZ      NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS puzzle_items_category_idx ON puzzle_items (category);
  `);

  // 4. Puzzles pairings
  await pool.query(`
    CREATE TABLE IF NOT EXISTS puzzles (
      id                TEXT        PRIMARY KEY,
      reference_item_id TEXT        NOT NULL REFERENCES puzzle_items(id) ON DELETE CASCADE,
      target_item_id    TEXT        NOT NULL REFERENCES puzzle_items(id) ON DELETE CASCADE,
      category          TEXT        NOT NULL,
      puzzle_type       TEXT        NOT NULL DEFAULT 'standard',
      active_date       TEXT,
      created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS puzzles_category_idx ON puzzles (category);
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS puzzles_active_date_idx ON puzzles (active_date);
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS puzzles_puzzle_type_idx ON puzzles (puzzle_type);
  `);

  // 5. Not Color Blind game scores (5-round matches, score up to 500)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS not_color_blind_scores (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
      player_name TEXT NOT NULL DEFAULT 'Anonymous',
      score INT NOT NULL CHECK (score >= 0 AND score <= 500),
      target_hsb JSONB NOT NULL,
      predicted_hsb JSONB NOT NULL,
      time_taken_seconds NUMERIC(5, 2) NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
    );
  `);

  // Migrate existing check constraint if table was created with score <= 100
  try {
    await pool.query(`
      DO $$
      BEGIN
        ALTER TABLE not_color_blind_scores DROP CONSTRAINT IF EXISTS not_color_blind_scores_score_check;
        ALTER TABLE not_color_blind_scores ADD CONSTRAINT not_color_blind_scores_score_check CHECK (score >= 0 AND score <= 500);
      EXCEPTION
        WHEN others THEN NULL;
      END $$;
    `);
  } catch {
    // Non-fatal if permission restricted or table missing
  }

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_ncb_scores_leaderboard 
      ON not_color_blind_scores (score DESC, time_taken_seconds ASC, created_at ASC);
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_ncb_scores_user 
      ON not_color_blind_scores (user_id);
  `);

  // 6. Seed initial puzzle items and pairings if table is empty
  try {
    const { rows: existingRows } = await pool.query('SELECT count(*)::int as count FROM puzzle_items');
    const count = Number(existingRows?.[0]?.count ?? 0);
    if (count === 0) {
      console.log('📦 Seeding initial puzzle items & pairings into database...');
      const candidateItemPaths = [
        path.resolve(process.cwd(), 'src/data/puzzles.json'),
        path.resolve(__dirname, '../../../src/data/puzzles.json'),
        path.resolve(__dirname, '../../src/data/puzzles.json'),
      ];
      const itemsPath = candidateItemPaths.find((p) => fs.existsSync(p));
      const candidateSetPaths = [
        path.resolve(process.cwd(), 'src/data/puzzleSets.json'),
        path.resolve(__dirname, '../../../src/data/puzzleSets.json'),
        path.resolve(__dirname, '../../src/data/puzzleSets.json'),
      ];
      const setsPath = candidateSetPaths.find((p) => fs.existsSync(p));

      if (itemsPath && setsPath) {
        const items = JSON.parse(fs.readFileSync(itemsPath, 'utf-8'));
        const puzzleSets = JSON.parse(fs.readFileSync(setsPath, 'utf-8'));

        for (const it of items) {
          await pool.query(
            `INSERT INTO puzzle_items (id, name, category, actual_measurement_meters, axis, svg_url, view_box, source)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             ON CONFLICT (id) DO UPDATE SET
               name = EXCLUDED.name,
               category = EXCLUDED.category,
               actual_measurement_meters = EXCLUDED.actual_measurement_meters,
               axis = EXCLUDED.axis,
               svg_url = EXCLUDED.svg_url,
               view_box = EXCLUDED.view_box,
               source = EXCLUDED.source,
               updated_at = NOW()`,
            [
              it.id,
              it.name,
              it.category,
              it.actualMeasurementMeters,
              it.axis,
              it.svgUrl,
              JSON.stringify(it.viewBox),
              it.source,
            ],
          );
        }

        for (const p of puzzleSets) {
          await pool.query(
            `INSERT INTO puzzles (id, reference_item_id, target_item_id, category, puzzle_type, active_date)
             VALUES ($1, $2, $3, $4, $5, $6)
             ON CONFLICT (id) DO UPDATE SET
               reference_item_id = EXCLUDED.reference_item_id,
               target_item_id = EXCLUDED.target_item_id,
               category = EXCLUDED.category,
               puzzle_type = EXCLUDED.puzzle_type,
               active_date = EXCLUDED.active_date`,
            [
              p.id,
              p.referenceId,
              p.targetId,
              p.category,
              p.puzzleType || 'standard',
              p.activeDate || null,
            ],
          );
        }
        console.log(`✅ Automatically seeded ${items.length} items & ${puzzleSets.length} puzzles into database.`);
      }
    }
  } catch (err: any) {
    console.warn('Auto-seed warning:', err.message);
  }

  console.log(`✅ Database tables & indexes verified (${isUsingMemoryStore ? 'In-Memory Mock' : 'Supabase PostgreSQL'}).`);
}

// ---------------------------------------------------------------------------
// Not Color Blind Query Methods & In-Memory Store
// ---------------------------------------------------------------------------

export interface HsbColor {
  h: number;
  s: number;
  b: number;
}

export interface NotColorBlindScoreRecord {
  id: string;
  user_id: string | null;
  player_name: string;
  score: number;
  target_hsb: HsbColor;
  predicted_hsb: HsbColor;
  time_taken_seconds: number;
  created_at: string;
}

export interface SaveNotColorBlindScoreInput {
  userId?: string | null;
  playerName?: string;
  score: number;
  targetHsb: HsbColor;
  predictedHsb: HsbColor;
  timeTakenSeconds: number;
}

const memoryNotColorBlindScores: NotColorBlindScoreRecord[] = [
  {
    id: 'a1111111-1111-4111-8111-111111111111',
    user_id: null,
    player_name: 'ChromaMaster',
    score: 98,
    target_hsb: { h: 210, s: 85, b: 90 },
    predicted_hsb: { h: 211, s: 84, b: 89 },
    time_taken_seconds: 3.42,
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'b2222222-2222-4222-8222-222222222222',
    user_id: null,
    player_name: 'SpectrumAce',
    score: 95,
    target_hsb: { h: 340, s: 75, b: 80 },
    predicted_hsb: { h: 338, s: 76, b: 82 },
    time_taken_seconds: 4.15,
    created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
  {
    id: 'c3333333-3333-4333-8333-333333333333',
    user_id: null,
    player_name: 'HueNinja',
    score: 92,
    target_hsb: { h: 120, s: 60, b: 70 },
    predicted_hsb: { h: 124, s: 58, b: 72 },
    time_taken_seconds: 5.01,
    created_at: new Date(Date.now() - 3600000 * 8).toISOString(),
  },
];

export async function saveNotColorBlindScore(
  scoreData: SaveNotColorBlindScoreInput
): Promise<NotColorBlindScoreRecord> {
  const isUuid = Boolean(
    scoreData.userId &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(scoreData.userId)
  );
  const userId = isUuid ? scoreData.userId! : null;
  const playerName = scoreData.playerName?.trim() || 'Anonymous';
  const timeTaken = Number(Number(scoreData.timeTakenSeconds).toFixed(2));
  const score = Math.round(scoreData.score);

  if (isUsingMemoryStore) {
    const record: NotColorBlindScoreRecord = {
      id: crypto.randomUUID(),
      user_id: userId,
      player_name: playerName,
      score,
      target_hsb: scoreData.targetHsb,
      predicted_hsb: scoreData.predictedHsb,
      time_taken_seconds: timeTaken,
      created_at: new Date().toISOString(),
    };
    memoryNotColorBlindScores.push(record);
    return record;
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO public.not_color_blind_scores (
         user_id, player_name, score, target_hsb, predicted_hsb, time_taken_seconds
       ) VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, user_id, player_name, score, target_hsb, predicted_hsb, time_taken_seconds, created_at`,
      [
        userId,
        playerName,
        score,
        JSON.stringify(scoreData.targetHsb),
        JSON.stringify(scoreData.predictedHsb),
        timeTaken,
      ]
    );

    const row = rows[0];
    return {
      id: row.id,
      user_id: row.user_id,
      player_name: row.player_name,
      score: row.score,
      target_hsb: typeof row.target_hsb === 'string' ? JSON.parse(row.target_hsb) : row.target_hsb,
      predicted_hsb: typeof row.predicted_hsb === 'string' ? JSON.parse(row.predicted_hsb) : row.predicted_hsb,
      time_taken_seconds: Number(row.time_taken_seconds),
      created_at: row.created_at,
    };
  } catch (err) {
    console.warn('PostgreSQL saveNotColorBlindScore failed, falling back to memory store:', (err as Error).message);
    const fallbackRecord: NotColorBlindScoreRecord = {
      id: crypto.randomUUID(),
      user_id: userId,
      player_name: playerName,
      score,
      target_hsb: scoreData.targetHsb,
      predicted_hsb: scoreData.predictedHsb,
      time_taken_seconds: timeTaken,
      created_at: new Date().toISOString(),
    };
    memoryNotColorBlindScores.push(fallbackRecord);
    return fallbackRecord;
  }
}

export async function getNotColorBlindLeaderboard(
  limit = 50
): Promise<NotColorBlindScoreRecord[]> {
  const safeLimit = Math.max(1, Math.min(limit, 100));

  if (isUsingMemoryStore) {
    return [...memoryNotColorBlindScores]
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        if (a.time_taken_seconds !== b.time_taken_seconds) return a.time_taken_seconds - b.time_taken_seconds;
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      })
      .slice(0, safeLimit);
  }

  try {
    const { rows } = await pool.query(
      `SELECT id, user_id, player_name, score, target_hsb, predicted_hsb, time_taken_seconds, created_at
       FROM public.not_color_blind_scores
       ORDER BY score DESC, time_taken_seconds ASC, created_at ASC
       LIMIT $1`,
      [safeLimit]
    );

    return rows.map((row) => ({
      id: row.id,
      user_id: row.user_id,
      player_name: row.player_name,
      score: row.score,
      target_hsb: typeof row.target_hsb === 'string' ? JSON.parse(row.target_hsb) : row.target_hsb,
      predicted_hsb: typeof row.predicted_hsb === 'string' ? JSON.parse(row.predicted_hsb) : row.predicted_hsb,
      time_taken_seconds: Number(row.time_taken_seconds),
      created_at: row.created_at,
    }));
  } catch (err) {
    console.warn('PostgreSQL getNotColorBlindLeaderboard failed, falling back to memory store:', (err as Error).message);
    return [...memoryNotColorBlindScores]
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        if (a.time_taken_seconds !== b.time_taken_seconds) return a.time_taken_seconds - b.time_taken_seconds;
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      })
      .slice(0, safeLimit);
  }
}

export async function getUserNotColorBlindScores(
  userId: string,
  limit = 10
): Promise<NotColorBlindScoreRecord[]> {
  const safeLimit = Math.max(1, Math.min(limit, 100));

  if (isUsingMemoryStore) {
    return memoryNotColorBlindScores
      .filter((s) => s.user_id === userId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, safeLimit);
  }

  try {
    const { rows } = await pool.query(
      `SELECT id, user_id, player_name, score, target_hsb, predicted_hsb, time_taken_seconds, created_at
       FROM public.not_color_blind_scores
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [userId, safeLimit]
    );

    return rows.map((row) => ({
      id: row.id,
      user_id: row.user_id,
      player_name: row.player_name,
      score: row.score,
      target_hsb: typeof row.target_hsb === 'string' ? JSON.parse(row.target_hsb) : row.target_hsb,
      predicted_hsb: typeof row.predicted_hsb === 'string' ? JSON.parse(row.predicted_hsb) : row.predicted_hsb,
      time_taken_seconds: Number(row.time_taken_seconds),
      created_at: row.created_at,
    }));
  } catch (err) {
    console.warn('PostgreSQL getUserNotColorBlindScores failed, falling back to memory store:', (err as Error).message);
    return memoryNotColorBlindScores
      .filter((s) => s.user_id === userId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, safeLimit);
  }
}

export default pool;
