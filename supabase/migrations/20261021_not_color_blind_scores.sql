-- Migration: Create Not Color Blind scores table
-- Target: Supabase / PostgreSQL

CREATE TABLE IF NOT EXISTS public.not_color_blind_scores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  player_name TEXT NOT NULL DEFAULT 'Anonymous',
  score INT NOT NULL CHECK (score >= 0 AND score <= 100),
  target_hsb JSONB NOT NULL, -- { h: number, s: number, b: number }
  predicted_hsb JSONB NOT NULL, -- { h: number, s: number, b: number }
  time_taken_seconds NUMERIC(5, 2) NOT NULL, -- Time used during recall phase
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_ncb_scores_leaderboard 
  ON public.not_color_blind_scores (score DESC, time_taken_seconds ASC, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_ncb_scores_user 
  ON public.not_color_blind_scores (user_id);

-- Explicit Role Grants (Supabase Compliance)
GRANT SELECT ON public.not_color_blind_scores TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.not_color_blind_scores TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.not_color_blind_scores TO service_role;
