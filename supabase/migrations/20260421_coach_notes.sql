-- Coach/Owner private notes about members.
-- Members themselves do NOT see these notes.

CREATE TABLE IF NOT EXISTS coach_notes (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  author_id    UUID REFERENCES profiles(id) ON DELETE SET NULL,
  content      TEXT NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coach_notes_profile ON coach_notes(profile_id, created_at DESC);

ALTER TABLE coach_notes ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "coach_notes_select" ON coach_notes FOR SELECT
    USING (get_my_role() IN ('coach', 'owner'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "coach_notes_insert" ON coach_notes FOR INSERT
    WITH CHECK (get_my_role() IN ('coach', 'owner') AND author_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "coach_notes_update_own" ON coach_notes FOR UPDATE
    USING (author_id = auth.uid() AND get_my_role() IN ('coach', 'owner'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "coach_notes_delete_own" ON coach_notes FOR DELETE
    USING (author_id = auth.uid() AND get_my_role() IN ('coach', 'owner'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Owner can always delete anyone's note
DO $$ BEGIN
  CREATE POLICY "coach_notes_delete_owner" ON coach_notes FOR DELETE
    USING (get_my_role() = 'owner');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
