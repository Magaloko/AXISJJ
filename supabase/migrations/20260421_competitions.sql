-- Tournament / competition tracking. Members log their participations and results.

CREATE TABLE IF NOT EXISTS competitions (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  date          DATE NOT NULL,
  location      TEXT,
  category      TEXT,           -- e.g. "Gi Adult Black Belt -76kg"
  placement     TEXT,           -- e.g. "1st", "2nd", "3rd", "DNP"
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_competitions_profile_date ON competitions(profile_id, date DESC);

ALTER TABLE competitions ENABLE ROW LEVEL SECURITY;

-- Members can read/write their own, coaches/owners can read/write all
DO $$ BEGIN
  CREATE POLICY "competitions_select_own" ON competitions FOR SELECT
    USING (profile_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "competitions_select_staff" ON competitions FOR SELECT
    USING (get_my_role() IN ('coach', 'owner'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "competitions_insert_own" ON competitions FOR INSERT
    WITH CHECK (profile_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "competitions_insert_staff" ON competitions FOR INSERT
    WITH CHECK (get_my_role() IN ('coach', 'owner'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "competitions_update_own" ON competitions FOR UPDATE
    USING (profile_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "competitions_update_staff" ON competitions FOR UPDATE
    USING (get_my_role() IN ('coach', 'owner'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "competitions_delete_own" ON competitions FOR DELETE
    USING (profile_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "competitions_delete_staff" ON competitions FOR DELETE
    USING (get_my_role() IN ('coach', 'owner'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
