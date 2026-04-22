-- ─────────────────────────────────────────────────────────────────────────────
-- Developer Role + Dashboard Modules
--
-- 1. Add 'developer' to the profiles.role CHECK constraint
-- 2. Create dashboard_modules table (per-module on/off toggle for the app)
-- 3. Seed all known modules
-- 4. Update relevant RLS policies to grant developer same rights as owner
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Expand profiles.role constraint to include 'developer'
ALTER TABLE profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('member', 'coach', 'owner', 'developer'));

-- 2. Dashboard modules table
CREATE TABLE dashboard_modules (
  key         TEXT PRIMARY KEY,
  label       TEXT NOT NULL,
  description TEXT,
  enabled     BOOLEAN NOT NULL DEFAULT true,
  sort_order  INT NOT NULL DEFAULT 0,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Auto-update updated_at on any change
CREATE OR REPLACE FUNCTION set_dashboard_modules_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER dashboard_modules_updated_at
  BEFORE UPDATE ON dashboard_modules
  FOR EACH ROW EXECUTE FUNCTION set_dashboard_modules_updated_at();

-- RLS
ALTER TABLE dashboard_modules ENABLE ROW LEVEL SECURITY;

-- Everyone can read (needed by member dashboard)
CREATE POLICY "dashboard_modules_readable_by_all"
  ON dashboard_modules FOR SELECT
  USING (true);

-- Only owner / developer can modify
CREATE POLICY "dashboard_modules_writable_by_owner_dev"
  ON dashboard_modules FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('owner', 'developer')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('owner', 'developer')
    )
  );

-- 3. Seed all modules
INSERT INTO dashboard_modules (key, label, description, enabled, sort_order) VALUES
  ('next_class',        'Nächste Klasse',       'Nächster gebuchter Trainingstermin (Hero-Kachel)', true,  10),
  ('xp',                'XP & Gamification',    'Erfahrungspunkte, Level und Streak-Boni',           true,  20),
  ('training_stats',    'Trainings-KPIs',        'Streak, Trainingsanzahl, Stimmung, Buchungen',      true,  30),
  ('frequency_chart',   'Trainingsfrequenz',     'Wöchentliche Trainingsfrequenz + Ziel-Pace',        true,  40),
  ('mood_chart',        'Stimmungstrend',        'Stimmungsverlauf der letzten Wochen',               true,  50),
  ('skill_radar',       'Skill-Radar',           'Technik-Stärken aus Training-Log Einträgen',        true,  60),
  ('belt_progress',     'Gürtelfortschritt',     'Promotionsbereitschaft und Gürtel-Verlauf',         true,  70),
  ('motivation',        'Motivation',            'Motivations-Widget und persönliches Ziel',          true,  80),
  ('subscription',      'Abo-Status',            'Aktuelle Mitgliedschaft und Laufzeit',              true,  90),
  ('leaderboard',       'Leaderboard',           'Monatliches Ranking nach Trainingsfrequenz',        true, 100),
  ('training_partners', 'Trainings-Partner',     'Mitglieder mit gleichem Gürtel nach Aktivität',    true, 110),
  ('competitions',      'Turniere',              'Turniere und Wettkampf-Anmeldungen',                true, 120),
  ('qr_code',           'QR-Code',               'Check-In QR-Code zum Scannen im Gym',              true, 130),
  ('opening_hours',     'Öffnungszeiten',        'Gym-Öffnungszeiten im Dashboard',                  true, 140)
ON CONFLICT (key) DO NOTHING;

-- 4. Extend gym_settings write policy to also allow developer
DROP POLICY IF EXISTS "gym_settings writable by owner" ON gym_settings;

CREATE POLICY "gym_settings writable by owner or developer"
  ON gym_settings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('owner', 'developer')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('owner', 'developer')
    )
  );
