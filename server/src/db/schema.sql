-- ==============================================================================
-- Linktree / IndiaTaps Platform - Scalable & Modular Supabase Architecture
-- Run this in your Supabase Dashboard: SQL Editor -> New Query -> Run
-- ==============================================================================

-- Enable UUID extension for unique identifiers
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. Users Table (Multi-tenant Accounts & Plans)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.users (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  avatar_url TEXT,
  display_name TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'pro', 'enterprise')),
  account_state TEXT NOT NULL DEFAULT 'active' CHECK (account_state IN ('active', 'locked')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Safe migrations for existing users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS display_name TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'client';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS account_type TEXT NOT NULL DEFAULT 'client';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS tier TEXT NOT NULL DEFAULT 'free';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS account_state TEXT NOT NULL DEFAULT 'active' CHECK (account_state IN ('active', 'locked'));
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Sync any locked/blocked states
UPDATE public.users SET account_state = 'locked' WHERE tier = 'blocked';

-- Super Admin Provisioning
UPDATE public.users SET role = 'super_admin', account_type = 'super_admin' WHERE LOWER(email) = 'sparshkoul6@gmail.com';

-- ------------------------------------------------------------------------------
-- 2. Trees Table (Modular Profiles, Design, Header & Footer Settings)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.trees (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  admin_id BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'live' CHECK (status IN ('live', 'draft', 'archived')),
  title TEXT NOT NULL DEFAULT '',
  bio TEXT DEFAULT '',
  avatar_url TEXT,
  theme_id TEXT NOT NULL DEFAULT 'classic-light',
  custom_theme JSONB NOT NULL DEFAULT '{"name":"Classic Clean","backgroundType":"solid","backgroundValue":"#F3F3F1","buttonStyle":"fill","buttonColor":"#FFFFFF","buttonTextColor":"#111111","buttonRadius":9999,"fontFamily":"Inter","textColor":"#111111"}'::jsonb,
  header_layout TEXT NOT NULL DEFAULT 'classic' CHECK (header_layout IN ('classic', 'hero', 'banner', 'cutout', 'shape')),
  banner_url TEXT,
  hero_url TEXT,
  logo_url TEXT,
  title_style TEXT NOT NULL DEFAULT 'text' CHECK (title_style IN ('text', 'logo')),
  title_font TEXT NOT NULL DEFAULT 'Inter',
  title_color TEXT NOT NULL DEFAULT '#111111',
  alt_font_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  footer_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  footer_text TEXT NOT NULL DEFAULT 'IndiaTaps',
  social_links JSONB NOT NULL DEFAULT '[]'::jsonb,
  seo JSONB NOT NULL DEFAULT '{"title":"","description":"","faviconUrl":""}'::jsonb,
  views_count BIGINT NOT NULL DEFAULT 0,
  clicks_count BIGINT NOT NULL DEFAULT 0,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Safe migrations for existing trees table
ALTER TABLE public.trees ADD COLUMN IF NOT EXISTS header_layout TEXT NOT NULL DEFAULT 'classic';
ALTER TABLE public.trees ADD COLUMN IF NOT EXISTS banner_url TEXT;
ALTER TABLE public.trees ADD COLUMN IF NOT EXISTS hero_url TEXT;
ALTER TABLE public.trees ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE public.trees ADD COLUMN IF NOT EXISTS title_style TEXT NOT NULL DEFAULT 'text';
ALTER TABLE public.trees ADD COLUMN IF NOT EXISTS title_font TEXT NOT NULL DEFAULT 'Inter';
ALTER TABLE public.trees ADD COLUMN IF NOT EXISTS title_color TEXT NOT NULL DEFAULT '#111111';
ALTER TABLE public.trees ADD COLUMN IF NOT EXISTS alt_font_enabled BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.trees ADD COLUMN IF NOT EXISTS footer_enabled BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE public.trees ADD COLUMN IF NOT EXISTS footer_text TEXT NOT NULL DEFAULT 'IndiaTaps';
ALTER TABLE public.trees ADD COLUMN IF NOT EXISTS social_links JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.trees ADD COLUMN IF NOT EXISTS seo JSONB NOT NULL DEFAULT '{"title":"","description":"","faviconUrl":""}'::jsonb;
ALTER TABLE public.trees ADD COLUMN IF NOT EXISTS views_count BIGINT NOT NULL DEFAULT 0;
ALTER TABLE public.trees ADD COLUMN IF NOT EXISTS clicks_count BIGINT NOT NULL DEFAULT 0;

-- ------------------------------------------------------------------------------
-- 3. Cards Table (Modular Link & Interactive Content Blocks)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cards (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  tree_id BIGINT NOT NULL REFERENCES public.trees(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'link' CHECK (type IN ('link', 'header', 'music', 'video', 'contact_form', 'pdf', 'gallery', 'social', 'commerce')),
  title TEXT NOT NULL DEFAULT '',
  subtitle TEXT DEFAULT '',
  url TEXT DEFAULT '',
  thumbnail_url TEXT,
  clicks INTEGER NOT NULL DEFAULT 0,
  position INTEGER NOT NULL DEFAULT 0,
  visible BOOLEAN NOT NULL DEFAULT TRUE,
  layout TEXT NOT NULL DEFAULT 'classic' CHECK (layout IN ('classic', 'featured', 'grid', 'carousel')),
  animation TEXT NOT NULL DEFAULT 'none',
  lock_type TEXT NOT NULL DEFAULT 'none' CHECK (lock_type IN ('none', 'password', 'age', 'email')),
  lock_value TEXT,
  pinned BOOLEAN NOT NULL DEFAULT FALSE,
  group_name TEXT,
  scheduled_start TIMESTAMPTZ,
  scheduled_end TIMESTAMPTZ,
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Safe migrations for existing cards table
ALTER TABLE public.cards ADD COLUMN IF NOT EXISTS pinned BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.cards ADD COLUMN IF NOT EXISTS group_name TEXT;
ALTER TABLE public.cards ADD COLUMN IF NOT EXISTS scheduled_start TIMESTAMPTZ;
ALTER TABLE public.cards ADD COLUMN IF NOT EXISTS scheduled_end TIMESTAMPTZ;

-- ------------------------------------------------------------------------------
-- 4. Analytics Events Table (Time-Series Click & View Telemetry)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  tree_id BIGINT NOT NULL REFERENCES public.trees(id) ON DELETE CASCADE,
  card_id BIGINT REFERENCES public.cards(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('page_view', 'card_click', 'social_click')),
  referrer TEXT,
  user_agent TEXT,
  device_type TEXT,
  ip_hash TEXT,
  country TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 5. Assets Table (Storage Media Ledger & CDN Tracking)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.assets (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  admin_id BIGINT REFERENCES public.users(id) ON DELETE SET NULL,
  tree_id BIGINT REFERENCES public.trees(id) ON DELETE SET NULL,
  bucket TEXT NOT NULL DEFAULT 'linktree-assets',
  file_path TEXT NOT NULL UNIQUE,
  public_url TEXT NOT NULL,
  folder TEXT NOT NULL DEFAULT 'uploads',
  mime_type TEXT,
  size_bytes BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 6. Performance Composite Indexes for Scaling
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_trees_slug ON public.trees (LOWER(slug));
CREATE INDEX IF NOT EXISTS idx_trees_admin_active ON public.trees (admin_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_cards_tree_pos ON public.cards (tree_id, position);
CREATE INDEX IF NOT EXISTS idx_cards_tree_visible_pos ON public.cards (tree_id, visible, position);
CREATE INDEX IF NOT EXISTS idx_analytics_tree_created ON public.analytics_events (tree_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_card_created ON public.analytics_events (card_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_assets_tree ON public.assets (tree_id);
CREATE INDEX IF NOT EXISTS idx_assets_file_path ON public.assets (file_path);

-- ------------------------------------------------------------------------------
-- 7. Automatic Updated-At Trigger
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_trees_updated_at ON public.trees;
CREATE TRIGGER trg_trees_updated_at
  BEFORE UPDATE ON public.trees
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_cards_updated_at ON public.cards;
CREATE TRIGGER trg_cards_updated_at
  BEFORE UPDATE ON public.cards
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_users_updated_at ON public.users;
CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ------------------------------------------------------------------------------
-- 8. Row Level Security (RLS) Policies
-- ------------------------------------------------------------------------------
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;

-- Clean drop existing policies to avoid duplicates on re-run
DROP POLICY IF EXISTS "Public read active trees" ON public.trees;
DROP POLICY IF EXISTS "Public read visible cards" ON public.cards;
DROP POLICY IF EXISTS "Public insert analytics events" ON public.analytics_events;
DROP POLICY IF EXISTS "Service role full access on users" ON public.users;
DROP POLICY IF EXISTS "Service role full access on trees" ON public.trees;
DROP POLICY IF EXISTS "Service role full access on cards" ON public.cards;
DROP POLICY IF EXISTS "Service role full access on analytics" ON public.analytics_events;
DROP POLICY IF EXISTS "Service role full access on assets" ON public.assets;

CREATE POLICY "Public read active trees" ON public.trees
  FOR SELECT USING (deleted_at IS NULL AND status = 'live');

CREATE POLICY "Public read visible cards" ON public.cards
  FOR SELECT USING (visible = TRUE);

CREATE POLICY "Public insert analytics events" ON public.analytics_events
  FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "Service role full access on users" ON public.users
  FOR ALL USING (TRUE) WITH CHECK (TRUE);

CREATE POLICY "Service role full access on trees" ON public.trees
  FOR ALL USING (TRUE) WITH CHECK (TRUE);

CREATE POLICY "Service role full access on cards" ON public.cards
  FOR ALL USING (TRUE) WITH CHECK (TRUE);

CREATE POLICY "Service role full access on analytics" ON public.analytics_events
  FOR ALL USING (TRUE) WITH CHECK (TRUE);

CREATE POLICY "Service role full access on assets" ON public.assets
  FOR ALL USING (TRUE) WITH CHECK (TRUE);

-- ------------------------------------------------------------------------------
-- 9. Supabase Storage Bucket Provisioning & Storage Policies
-- ------------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'linktree-assets',
  'linktree-assets',
  TRUE,
  52428800, -- 50MB limit per file
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp', 'image/svg+xml', 'image/avif', 'application/pdf', 'video/mp4', 'video/webm']
)
ON CONFLICT (id) DO UPDATE SET
  public = TRUE,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp', 'image/svg+xml', 'image/avif', 'application/pdf', 'video/mp4', 'video/webm'];

-- Allow public reads on linktree-assets storage objects
DROP POLICY IF EXISTS "Public Read linktree-assets" ON storage.objects;
CREATE POLICY "Public Read linktree-assets" ON storage.objects
  FOR SELECT USING (bucket_id = 'linktree-assets');

-- Allow service_role & authenticated writes on linktree-assets storage objects
DROP POLICY IF EXISTS "Upload linktree-assets" ON storage.objects;
CREATE POLICY "Upload linktree-assets" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'linktree-assets');

DROP POLICY IF EXISTS "Update linktree-assets" ON storage.objects;
CREATE POLICY "Update linktree-assets" ON storage.objects
  FOR UPDATE USING (bucket_id = 'linktree-assets');

DROP POLICY IF EXISTS "Delete linktree-assets" ON storage.objects;
CREATE POLICY "Delete linktree-assets" ON storage.objects
  FOR DELETE USING (bucket_id = 'linktree-assets');

-- ------------------------------------------------------------------------------
-- 10. Seed Initial User and Tree
-- ------------------------------------------------------------------------------
INSERT INTO public.users (email, username, password, display_name)
VALUES ('sparshkoul6@gmail.com', 'riyast', '$2b$10$bsVZgzpWVq6a4VvV3M9oEeK95z74Wk9f9tJzF3hV9FwD2k3e0u8kO', 'Riyast')
ON CONFLICT (username) DO NOTHING;

INSERT INTO public.trees (admin_id, name, slug, status, title, bio, theme_id, header_layout, footer_enabled, footer_text)
SELECT id, 'Riyast Boutique', 'riyast', 'live', 'riyast', '', 'classic-light', 'classic', TRUE, 'IndiaTaps'
FROM public.users WHERE username = 'riyast'
ON CONFLICT (slug) DO NOTHING;
