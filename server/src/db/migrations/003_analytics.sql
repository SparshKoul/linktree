-- ==============================================================================
-- IndiaTaps migration 003: what the analytics screen needs
--
-- - visitor_hash: a hash of the visitor number, so that people can be counted
--   apart from views without keeping anything that identifies a person.
-- - indexes for the questions the dashboard asks every time it is opened.
--
-- Run this once in the Supabase dashboard: SQL Editor -> New Query -> Run
-- ==============================================================================

ALTER TABLE public.analytics_events
  ADD COLUMN IF NOT EXISTS visitor_hash TEXT;

-- The dashboard asks for the events of one tree over a period of time.
CREATE INDEX IF NOT EXISTS idx_analytics_tree_type_created
  ON public.analytics_events (tree_id, event_type, created_at DESC);

-- The dashboard asks for the clicks of one card.
CREATE INDEX IF NOT EXISTS idx_analytics_card_created
  ON public.analytics_events (card_id, created_at DESC);
