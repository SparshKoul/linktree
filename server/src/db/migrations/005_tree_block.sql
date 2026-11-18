-- ==============================================================================
-- IndiaTaps migration 005: let the Super Admin block one whole page (tree)
--
-- Until now the only moderation tool was locking an whole account, which takes
-- every page and every card of that client down at once. This adds a per-page
-- switch, so one page (/riyast, /bistro) can be taken off the public site while
-- the same client's other pages keep working.
--
-- The column is deliberately NOT part of what updateTree writes, so a client
-- can never clear the block by saving their own page.
--
-- An earlier draft of this feature put the block on a single card instead. It
-- was the wrong level (a "card" here means the whole page), so that column is
-- removed again if it was created. Run this once in the Supabase dashboard:
-- SQL Editor -> New Query -> Run
-- ==============================================================================

ALTER TABLE public.trees
  ADD COLUMN IF NOT EXISTS blocked BOOLEAN NOT NULL DEFAULT FALSE;

-- Clean up the card-level flag from the first attempt. Nothing reads it now.
ALTER TABLE public.cards
  DROP COLUMN IF EXISTS blocked;

-- The public page asks for one tree by slug; the block is read there.
CREATE INDEX IF NOT EXISTS idx_trees_slug_blocked
  ON public.trees (slug, blocked);
