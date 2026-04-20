-- Training reports: coach/owner/trainer posts about training sessions.
-- Can optionally link to a class_sessions row, but stands alone otherwise.
-- Media (photos) are stored in the Supabase Storage bucket 'training-uploads'.

CREATE TABLE IF NOT EXISTS training_reports (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id         UUID REFERENCES class_sessions(id) ON DELETE SET NULL,
  author_id          UUID REFERENCES profiles(id) ON DELETE SET NULL,
  title              TEXT NOT NULL DEFAULT '',
  hashtags           TEXT[] NOT NULL DEFAULT '{}',
  notes_raw          TEXT NOT NULL DEFAULT '',
  summary            TEXT NOT NULL DEFAULT '',
  body_md            TEXT NOT NULL DEFAULT '',
  instagram_caption  TEXT NOT NULL DEFAULT '',
  status             TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')),
  media              JSONB NOT NULL DEFAULT '[]'::jsonb,
  published_at       TIMESTAMPTZ,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_training_reports_author  ON training_reports(author_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_training_reports_session ON training_reports(session_id);
CREATE INDEX IF NOT EXISTS idx_training_reports_status  ON training_reports(status, created_at DESC);

ALTER TABLE training_reports ENABLE ROW LEVEL SECURITY;

-- Staff (coach, trainer, owner) can read all reports.
DO $$ BEGIN
  CREATE POLICY "training_reports_select_staff" ON training_reports FOR SELECT
    USING (get_my_role() IN ('coach','trainer','owner'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Staff can insert as themselves.
DO $$ BEGIN
  CREATE POLICY "training_reports_insert_staff" ON training_reports FOR INSERT
    WITH CHECK (get_my_role() IN ('coach','trainer','owner') AND author_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Authors can update their own reports; owner can update any.
DO $$ BEGIN
  CREATE POLICY "training_reports_update_own" ON training_reports FOR UPDATE
    USING (author_id = auth.uid() OR get_my_role() = 'owner');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Authors can delete their own reports; owner can delete any.
DO $$ BEGIN
  CREATE POLICY "training_reports_delete_own" ON training_reports FOR DELETE
    USING (author_id = auth.uid() OR get_my_role() = 'owner');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Keep updated_at fresh.
CREATE OR REPLACE FUNCTION training_reports_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_training_reports_updated_at ON training_reports;
CREATE TRIGGER trg_training_reports_updated_at
BEFORE UPDATE ON training_reports
FOR EACH ROW EXECUTE FUNCTION training_reports_set_updated_at();
