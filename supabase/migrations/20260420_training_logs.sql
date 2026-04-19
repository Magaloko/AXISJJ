-- supabase/migrations/20260420_training_logs.sql
CREATE TABLE training_logs (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  session_id   UUID REFERENCES class_sessions(id) ON DELETE SET NULL,
  mood_before  INT NOT NULL CHECK (mood_before BETWEEN 1 AND 5),
  mood_after   INT CHECK (mood_after BETWEEN 1 AND 5),
  energy       INT CHECK (energy BETWEEN 1 AND 5),
  technique    INT CHECK (technique BETWEEN 1 AND 5),
  conditioning INT CHECK (conditioning BETWEEN 1 AND 5),
  mental       INT CHECK (mental BETWEEN 1 AND 5),
  focus_areas  TEXT[] NOT NULL DEFAULT '{}',
  notes        TEXT,
  next_goal    TEXT,
  logged_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE training_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "training_logs_own_all"
  ON training_logs FOR ALL
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "training_logs_coach_read"
  ON training_logs FOR SELECT
  USING (get_my_role() IN ('coach', 'owner'));

CREATE INDEX idx_training_logs_profile_logged
  ON training_logs(profile_id, logged_at DESC);
