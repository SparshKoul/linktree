-- ==============================================================================
-- IndiaTaps migration 002: atomic counters
--
-- Counting clicks and views by reading the number and writing it back loses
-- updates when two visitors click at the same time. These functions do the
-- increment inside the database, so no update is ever lost.
--
-- Run this once in the Supabase dashboard: SQL Editor -> New Query -> Run
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.increment_card_clicks(p_card_id BIGINT)
RETURNS BIGINT
LANGUAGE sql
AS $$
  UPDATE public.cards
     SET clicks = clicks + 1
   WHERE id = p_card_id
  RETURNING clicks;
$$;

CREATE OR REPLACE FUNCTION public.increment_tree_views(p_tree_id BIGINT)
RETURNS BIGINT
LANGUAGE sql
AS $$
  UPDATE public.trees
     SET views_count = views_count + 1
   WHERE id = p_tree_id
  RETURNING views_count;
$$;

CREATE OR REPLACE FUNCTION public.increment_tree_clicks(p_tree_id BIGINT)
RETURNS BIGINT
LANGUAGE sql
AS $$
  UPDATE public.trees
     SET clicks_count = clicks_count + 1
   WHERE id = p_tree_id
  RETURNING clicks_count;
$$;

-- The server calls these with the service role key, which bypasses row level
-- security, so the functions do not need SECURITY DEFINER.
