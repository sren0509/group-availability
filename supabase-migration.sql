-- ============================================================
-- MIGRATION: Add multi-event support
-- Run in Supabase SQL Editor
-- ============================================================

-- Backups (safety net — drop these once you've verified)
CREATE TABLE IF NOT EXISTS responses_backup AS SELECT * FROM responses;
CREATE TABLE IF NOT EXISTS notes_backup AS SELECT * FROM notes;

DO $$
DECLARE
  existing_event_id uuid;
BEGIN

  -- Step 1: Create events table
  CREATE TABLE IF NOT EXISTS events (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    created_by text,
    created_at timestamptz DEFAULT now()
  );

  -- Step 2: Insert the one existing event
  INSERT INTO events (name) VALUES ('Alaska trip')
  RETURNING id INTO existing_event_id;

  -- Step 3: Add nullable event_id to both tables
  ALTER TABLE responses ADD COLUMN IF NOT EXISTS event_id uuid REFERENCES events(id) ON DELETE CASCADE;
  ALTER TABLE notes    ADD COLUMN IF NOT EXISTS event_id uuid REFERENCES events(id) ON DELETE CASCADE;

  -- Step 4: Backfill all existing rows
  UPDATE responses SET event_id = existing_event_id WHERE event_id IS NULL;
  UPDATE notes    SET event_id = existing_event_id WHERE event_id IS NULL;

  -- Step 5: Make event_id NOT NULL (safe now that backfill is done)
  ALTER TABLE responses ALTER COLUMN event_id SET NOT NULL;
  ALTER TABLE notes    ALTER COLUMN event_id SET NOT NULL;

  -- Step 6: Replace unique(name) with unique(event_id, name)
  ALTER TABLE responses DROP CONSTRAINT IF EXISTS responses_name_key;
  ALTER TABLE responses ADD  CONSTRAINT responses_event_id_name_key UNIQUE (event_id, name);

  -- Step 7: Indexes
  CREATE INDEX IF NOT EXISTS idx_responses_event_id ON responses(event_id);
  CREATE INDEX IF NOT EXISTS idx_notes_event_id    ON notes(event_id);

END $$;

-- Step 8: RLS on events (open, no-auth model — same as responses/notes)
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "events_select" ON events FOR SELECT USING (true);
CREATE POLICY "events_insert" ON events FOR INSERT WITH CHECK (true);
CREATE POLICY "events_update" ON events FOR UPDATE USING (true) WITH CHECK (true);
-- No DELETE policy intentionally

-- ============================================================
-- VERIFICATION: row counts should match backup
-- ============================================================
SELECT
  (SELECT count(*) FROM responses)        AS responses_after,
  (SELECT count(*) FROM responses_backup) AS responses_before,
  (SELECT count(*) FROM notes)            AS notes_after,
  (SELECT count(*) FROM notes_backup)     AS notes_before,
  (SELECT id::text FROM events WHERE name = 'Alaska trip' LIMIT 1) AS existing_event_id;
