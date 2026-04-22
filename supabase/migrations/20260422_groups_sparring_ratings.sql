-- ============================================================
-- Training Groups, Session Ratings, Sparring & External Organizers
-- ============================================================

-- ── 1. Training Groups ──────────────────────────────────────

CREATE TABLE IF NOT EXISTS training_groups (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  description TEXT,
  coach_id    UUID REFERENCES profiles(id) ON DELETE SET NULL,
  color       TEXT NOT NULL DEFAULT '#dc2626',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS training_group_members (
  group_id    UUID NOT NULL REFERENCES training_groups(id) ON DELETE CASCADE,
  profile_id  UUID NOT NULL REFERENCES profiles(id)        ON DELETE CASCADE,
  joined_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (group_id, profile_id)
);

-- ── 2. Session Ratings (1–10) ────────────────────────────────

CREATE TABLE IF NOT EXISTS session_ratings (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  UUID NOT NULL REFERENCES class_sessions(id) ON DELETE CASCADE,
  profile_id  UUID NOT NULL REFERENCES profiles(id)       ON DELETE CASCADE,
  rating      INT  NOT NULL CHECK (rating BETWEEN 1 AND 10),
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (session_id, profile_id)
);

-- ── 3. Sparring ──────────────────────────────────────────────

-- Mark a class_session as a sparring session
ALTER TABLE class_sessions
  ADD COLUMN IF NOT EXISTS is_sparring BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS sparring_pairings (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id    UUID NOT NULL REFERENCES class_sessions(id) ON DELETE CASCADE,
  profile_a_id  UUID NOT NULL REFERENCES profiles(id),
  profile_b_id  UUID NOT NULL REFERENCES profiles(id),
  -- outcome is relative to profile_a: 'a_wins' | 'b_wins' | 'draw'
  outcome       TEXT CHECK (outcome IN ('a_wins', 'b_wins', 'draw')),
  rounds        INT NOT NULL DEFAULT 1 CHECK (rounds >= 1),
  notes         TEXT,
  recorded_by   UUID REFERENCES profiles(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT no_self_sparring CHECK (profile_a_id <> profile_b_id)
);

-- ── 4. External Organizers (slot rental) ────────────────────

CREATE TABLE IF NOT EXISTS external_organizers (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  contact_email TEXT,
  contact_phone TEXT,
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE class_sessions
  ADD COLUMN IF NOT EXISTS external_organizer_id UUID
    REFERENCES external_organizers(id) ON DELETE SET NULL;

-- ── 5. RLS ──────────────────────────────────────────────────

ALTER TABLE training_groups         ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_group_members  ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_ratings         ENABLE ROW LEVEL SECURITY;
ALTER TABLE sparring_pairings       ENABLE ROW LEVEL SECURITY;
ALTER TABLE external_organizers     ENABLE ROW LEVEL SECURITY;

-- training_groups: coaches/owners read & write; members read their own
CREATE POLICY "staff read training_groups"
  ON training_groups FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('coach', 'owner', 'developer')
    )
  );

CREATE POLICY "owner manage training_groups"
  ON training_groups FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('owner', 'developer')
    )
  );

-- group members: staff can manage; members can see groups they belong to
CREATE POLICY "staff manage group_members"
  ON training_group_members FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('coach', 'owner', 'developer')
    )
  );

CREATE POLICY "member read own group membership"
  ON training_group_members FOR SELECT
  USING (profile_id = auth.uid());

-- session_ratings: each user manages their own; staff read all
CREATE POLICY "user manage own rating"
  ON session_ratings FOR ALL
  USING (profile_id = auth.uid());

CREATE POLICY "staff read all ratings"
  ON session_ratings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('coach', 'owner', 'developer')
    )
  );

-- sparring_pairings: staff manage; participants can read own
CREATE POLICY "staff manage sparring"
  ON sparring_pairings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('coach', 'owner', 'developer')
    )
  );

CREATE POLICY "participant read own sparring"
  ON sparring_pairings FOR SELECT
  USING (profile_a_id = auth.uid() OR profile_b_id = auth.uid());

-- external_organizers: owner only
CREATE POLICY "owner manage external_organizers"
  ON external_organizers FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('owner', 'developer')
    )
  );

-- ── 6. Indexes ───────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_tgm_profile  ON training_group_members (profile_id);
CREATE INDEX IF NOT EXISTS idx_tgm_group    ON training_group_members (group_id);
CREATE INDEX IF NOT EXISTS idx_sr_session   ON session_ratings (session_id);
CREATE INDEX IF NOT EXISTS idx_sr_profile   ON session_ratings (profile_id);
CREATE INDEX IF NOT EXISTS idx_sp_session   ON sparring_pairings (session_id);
CREATE INDEX IF NOT EXISTS idx_sp_a         ON sparring_pairings (profile_a_id);
CREATE INDEX IF NOT EXISTS idx_sp_b         ON sparring_pairings (profile_b_id);
