-- coach_profiles: public website profiles for coaches
CREATE TABLE IF NOT EXISTS coach_profiles (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id      uuid        UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  specialization  text,
  bio             text,
  achievements    text,
  show_on_website boolean     NOT NULL DEFAULT false,
  display_order   integer     NOT NULL DEFAULT 99,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE coach_profiles ENABLE ROW LEVEL SECURITY;

-- Anyone can read visible profiles (public landing page)
CREATE POLICY "coach_profiles_public_read" ON coach_profiles
  FOR SELECT USING (show_on_website = true);

-- Owners can read ALL profiles (to manage them in admin)
CREATE POLICY "coach_profiles_owner_read" ON coach_profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'owner')
  );

-- Owners can insert, update, delete
CREATE POLICY "coach_profiles_owner_write" ON coach_profiles
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'owner')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'owner')
  );

-- Grant: anon can SELECT for public landing page; authenticated users get full access (RLS limits writes to owners)
GRANT SELECT ON coach_profiles TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON coach_profiles TO authenticated;

-- Seed Shamsudin (finds by name; no-op if already exists)
INSERT INTO coach_profiles (profile_id, specialization, bio, achievements, show_on_website, display_order)
SELECT
  id,
  'Gi & No-Gi · Head Coach',
  'Mit jahrelanger Erfahrung auf internationalem Niveau leitet Shamsudin das Training bei AXIS Jiu-Jitsu. Technik, Disziplin und Respekt — auf und abseits der Matte.',
  'Erster tschetschenischer BJJ Black Belt Österreichs · IBJJF European Silver · Mehrfacher österreichischer Champion',
  true,
  1
FROM profiles
WHERE full_name ILIKE '%Baisarov%'
LIMIT 1
ON CONFLICT (profile_id) DO UPDATE SET
  specialization  = EXCLUDED.specialization,
  bio             = EXCLUDED.bio,
  achievements    = EXCLUDED.achievements,
  show_on_website = EXCLUDED.show_on_website,
  display_order   = EXCLUDED.display_order;
