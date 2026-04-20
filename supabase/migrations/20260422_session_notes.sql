-- Lesson planning / reflection notes for each class session.
-- Written by coaches, visible to all coaches + owner.

CREATE TABLE IF NOT EXISTS session_notes (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id  UUID NOT NULL REFERENCES class_sessions(id) ON DELETE CASCADE,
  author_id   UUID REFERENCES profiles(id) ON DELETE SET NULL,
  plan        TEXT,
  reflection  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(session_id, author_id)
);

CREATE INDEX IF NOT EXISTS idx_session_notes_session ON session_notes(session_id);

ALTER TABLE session_notes ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "session_notes_staff_read" ON session_notes FOR SELECT
    USING (get_my_role() IN ('coach', 'owner'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "session_notes_staff_insert" ON session_notes FOR INSERT
    WITH CHECK (get_my_role() IN ('coach', 'owner') AND author_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "session_notes_update_own" ON session_notes FOR UPDATE
    USING (author_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "session_notes_owner_delete" ON session_notes FOR DELETE
    USING (get_my_role() = 'owner' OR author_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
