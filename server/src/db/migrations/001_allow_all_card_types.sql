-- ==============================================================================
-- IndiaTaps migration 001: allow every card type the editor can create
--
-- The cards table only allowed 8 types, so almost every card the editor
-- makes (maps, menu, product, events, whatsapp, ...) was rejected by the
-- database and never saved. The lock type 'code' (passcode) was rejected too.
--
-- Run this once in the Supabase dashboard: SQL Editor -> New Query -> Run
-- ==============================================================================

BEGIN;

-- 1. Show what is in the table right now. If a type is missing from the list
--    in step 4, add it there and run this file again.
SELECT type, count(*) AS cards
FROM public.cards
GROUP BY type
ORDER BY type;

-- 2. Drop the old check constraints on cards.type, cards.lock_type and
--    cards.layout (the constraint names differ per database, so they are
--    looked up instead of hardcoded).
DO $$
DECLARE
  constraint_name TEXT;
BEGIN
  FOR constraint_name IN
    SELECT con.conname
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_attribute att
      ON att.attrelid = con.conrelid AND att.attnum = ANY (con.conkey)
    WHERE rel.relname = 'cards'
      AND con.contype = 'c'
      AND att.attname IN ('type', 'lock_type', 'layout')
  LOOP
    EXECUTE format('ALTER TABLE public.cards DROP CONSTRAINT %I', constraint_name);
  END LOOP;
END $$;

-- 3. The lock gates: none, 18+ gate, email gate and passcode.
ALTER TABLE public.cards
  ADD CONSTRAINT cards_lock_type_check
  CHECK (lock_type IN ('none', 'password', 'age', 'email', 'code'));

-- 4. Every card type the editor can produce, plus the ones already in use.
--    If you add a new card type to the editor, add it here too.
ALTER TABLE public.cards
  ADD CONSTRAINT cards_type_check
  CHECK (type IN (
    'booking', 'collapsible', 'collection', 'commerce', 'contact',
    'contact_form', 'custom_html', 'email', 'email_signup', 'events',
    'folder', 'gallery', 'header', 'instagram', 'link', 'mail', 'maps',
    'menu', 'music', 'pdf', 'phone', 'product', 'resume', 'reviews',
    'social', 'store', 'text', 'tip_jar', 'video', 'whatsapp'
  ));

-- 5. The card layouts.
ALTER TABLE public.cards
  ADD CONSTRAINT cards_layout_check
  CHECK (layout IN ('classic', 'featured', 'grid', 'carousel'));

COMMIT;
