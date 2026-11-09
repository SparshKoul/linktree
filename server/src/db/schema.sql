-- ==============================================================================
-- Linktree Platform - Supabase PostgreSQL Schema
-- Run this in your Supabase Dashboard: SQL Editor -> New Query -> Run
-- ==============================================================================

-- 1. Users Table
CREATE TABLE IF NOT EXISTS public.users (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Trees Table
CREATE TABLE IF NOT EXISTS public.trees (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  admin_id BIGINT REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'live',
  title TEXT NOT NULL,
  bio TEXT DEFAULT '',
  avatar_url TEXT,
  theme_id TEXT NOT NULL DEFAULT 'classic-light',
  custom_theme JSONB DEFAULT '{"name":"Classic Clean","backgroundType":"solid","backgroundValue":"#F3F3F1","buttonStyle":"fill","buttonColor":"#FFFFFF","buttonTextColor":"#111111","buttonRadius":9999,"fontFamily":"Inter","textColor":"#111111"}'::jsonb,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Cards Table
CREATE TABLE IF NOT EXISTS public.cards (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  tree_id BIGINT NOT NULL REFERENCES public.trees(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'link',
  title TEXT NOT NULL DEFAULT '',
  subtitle TEXT DEFAULT '',
  url TEXT DEFAULT '',
  thumbnail_url TEXT,
  clicks INTEGER NOT NULL DEFAULT 0,
  position INTEGER NOT NULL DEFAULT 0,
  visible BOOLEAN NOT NULL DEFAULT TRUE,
  layout TEXT NOT NULL DEFAULT 'classic',
  animation TEXT NOT NULL DEFAULT 'none',
  lock_type TEXT NOT NULL DEFAULT 'none',
  lock_value TEXT,
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_trees_slug ON public.trees (slug);
CREATE INDEX IF NOT EXISTS idx_trees_admin_id ON public.trees (admin_id);
CREATE INDEX IF NOT EXISTS idx_cards_tree_id ON public.cards (tree_id);
CREATE INDEX IF NOT EXISTS idx_cards_position ON public.cards (tree_id, position);

-- Enable Row Level Security (RLS) but allow service_role key full bypass
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;

-- Permissive policies for public read and authenticated/service role
CREATE POLICY "Public read active trees" ON public.trees
  FOR SELECT USING (deleted_at IS NULL AND status = 'live');

CREATE POLICY "Public read visible cards" ON public.cards
  FOR SELECT USING (visible = TRUE);

CREATE POLICY "Service role full access on users" ON public.users
  FOR ALL USING (TRUE) WITH CHECK (TRUE);

CREATE POLICY "Service role full access on trees" ON public.trees
  FOR ALL USING (TRUE) WITH CHECK (TRUE);

CREATE POLICY "Service role full access on cards" ON public.cards
  FOR ALL USING (TRUE) WITH CHECK (TRUE);


-- Seed initial default user and tree if not existing
INSERT INTO public.users (email, username, password)
VALUES ('sparshkoul6@gmail.com', 'riyast', 'password123')
ON CONFLICT (username) DO NOTHING;

INSERT INTO public.trees (admin_id, name, slug, status, title, bio, theme_id)
SELECT id, 'Riyast Boutique', 'riyast', 'live', 'riyast', '', 'classic-light'
FROM public.users WHERE username = 'riyast'
ON CONFLICT (slug) DO NOTHING;
