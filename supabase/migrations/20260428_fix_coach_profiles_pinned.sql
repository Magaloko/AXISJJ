-- Add missing is_pinned column + fix RLS so pinned coaches are publicly readable

ALTER TABLE coach_profiles ADD COLUMN IF NOT EXISTS is_pinned boolean NOT NULL DEFAULT false;

-- Drop old narrow policy and replace with one that covers both flags
DROP POLICY IF EXISTS "coach_profiles_public_read" ON coach_profiles;

CREATE POLICY "coach_profiles_public_read" ON coach_profiles
  FOR SELECT USING (show_on_website = true OR is_pinned = true);

-- Ensure standalone Shamsudin entry exists (no linked auth account needed)
-- Use profile_id = NULL for standalone entries; NULL values never conflict on UNIQUE
INSERT INTO coach_profiles (
  profile_id,
  display_name,
  avatar_url,
  belt_name,
  belt_color_hex,
  specialization,
  bio,
  achievements,
  show_on_website,
  is_pinned,
  display_order
)
SELECT
  NULL,
  'Shamsudin Baisarov',
  '/images/coach-portrait.jpg',
  'Black Belt',
  '#111111',
  'Gi & No-Gi · Head Coach',
  'Mit jahrelanger Erfahrung auf internationalem Niveau leitet Shamsudin das Training bei AXIS Jiu-Jitsu. Technik, Disziplin und Respekt — auf und abseits der Matte.',
  'Erster tschetschenischer BJJ Black Belt Österreichs · IBJJF European Silver · Mehrfacher österreichischer Champion',
  true,
  true,
  1
WHERE NOT EXISTS (
  SELECT 1 FROM coach_profiles WHERE display_name = 'Shamsudin Baisarov' AND profile_id IS NULL
);

-- Also pin any existing linked entry for Baisarov so it stays visible
UPDATE coach_profiles
SET show_on_website = true, is_pinned = true
WHERE profile_id IN (
  SELECT id FROM profiles WHERE full_name ILIKE '%Baisarov%'
);
