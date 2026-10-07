import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { optionalAuth } from './middleware/auth.js';
import authRouter from './routes/auth.js';
import { initDb } from './db.js';

const app = express();
const PORT = Number(process.env.PORT ?? 3001);

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------

app.use(cors({
  // In dev allow the Vite dev server; tighten in production
  origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  credentials: true,
}));

app.use(express.json());

// Decode JWT when present (but never block unauthenticated requests here)
app.use(optionalAuth);

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

app.use('/api/auth', authRouter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ---------------------------------------------------------------------------
// 404 catch-all
// ---------------------------------------------------------------------------
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found.' });
});

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------
(async () => {
  try {
    await initDb();
  } catch (err: unknown) {
    console.warn('⚠️  Database initialization warning:', (err as Error).message);
  }

  app.listen(PORT, () => {
    console.log(`\n🚀 GuessTheSize API running on http://localhost:${PORT}`);
    console.log(`   Health: http://localhost:${PORT}/api/health`);
    console.log(`   Auth:   http://localhost:${PORT}/api/auth/register | /login | /google | /me\n`);
  });
})();

export default app;
