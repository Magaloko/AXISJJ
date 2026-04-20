-- Tournaments + registrations
CREATE TABLE IF NOT EXISTS tournaments (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name                  text NOT NULL,
  date                  date NOT NULL,
  end_date              date,
  location              text NOT NULL,
  type                  text NOT NULL DEFAULT 'external' CHECK (type IN ('internal','external')),
  description           text,
  registration_deadline date,
  coach_id              uuid REFERENCES profiles(id) ON DELETE SET NULL,
  status                text NOT NULL DEFAULT 'pending_approval'
                        CHECK (status IN ('pending_approval','approved','cancelled')),
  created_at            timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tournament_registrations (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id   uuid NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  profile_id      uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  weight_category text,
  gi_nogi         text CHECK (gi_nogi IN ('gi','nogi','both')),
  notes           text,
  status          text NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','approved','denied')),
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tournament_id, profile_id)
);

CREATE INDEX IF NOT EXISTS tournaments_date_idx ON tournaments (date);
CREATE INDEX IF NOT EXISTS tournaments_status_idx ON tournaments (status);
CREATE INDEX IF NOT EXISTS tournament_registrations_tournament_idx ON tournament_registrations (tournament_id);
CREATE INDEX IF NOT EXISTS tournament_registrations_profile_idx ON tournament_registrations (profile_id);

-- RLS
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_registrations ENABLE ROW LEVEL SECURITY;

-- Public (anon + authenticated) can SELECT approved future tournaments
CREATE POLICY "tournaments_public_read" ON tournaments
  FOR SELECT USING (status = 'approved' AND date >= CURRENT_DATE);

-- Coaches and owners can SELECT all tournaments
CREATE POLICY "tournaments_staff_read" ON tournaments
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('coach','owner'))
  );

-- Coaches can INSERT tournaments (status will be set by application)
CREATE POLICY "tournaments_staff_insert" ON tournaments
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('coach','owner'))
  );

-- Coaches can UPDATE their own pending tournaments; owners can UPDATE any
CREATE POLICY "tournaments_coach_update_own" ON tournaments
  FOR UPDATE USING (
    (coach_id = auth.uid() AND status = 'pending_approval')
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'owner')
  )
  WITH CHECK (
    (coach_id = auth.uid() AND status = 'pending_approval')
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'owner')
  );

-- Owner can DELETE
CREATE POLICY "tournaments_owner_delete" ON tournaments
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'owner')
  );

-- Registration RLS
CREATE POLICY "tournament_regs_own_read" ON tournament_registrations
  FOR SELECT USING (profile_id = auth.uid());

CREATE POLICY "tournament_regs_staff_read" ON tournament_registrations
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('coach','owner'))
  );

CREATE POLICY "tournament_regs_public_approved" ON tournament_registrations
  FOR SELECT USING (
    status = 'approved'
    AND EXISTS (
      SELECT 1 FROM tournaments t
      WHERE t.id = tournament_id AND t.status = 'approved' AND t.date >= CURRENT_DATE
    )
  );

CREATE POLICY "tournament_regs_own_insert" ON tournament_registrations
  FOR INSERT WITH CHECK (profile_id = auth.uid());

CREATE POLICY "tournament_regs_own_update" ON tournament_registrations
  FOR UPDATE USING (profile_id = auth.uid() AND status IN ('pending','denied'))
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "tournament_regs_staff_update" ON tournament_registrations
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('coach','owner'))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('coach','owner'))
  );

-- Grants
GRANT SELECT ON tournaments TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON tournaments TO authenticated;
GRANT SELECT ON tournament_registrations TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON tournament_registrations TO authenticated;
