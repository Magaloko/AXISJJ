-- Allow standalone coach_profiles entries (no auth account linked)
ALTER TABLE coach_profiles ALTER COLUMN profile_id DROP NOT NULL;

-- Fallback display fields for coaches without a linked profile
ALTER TABLE coach_profiles ADD COLUMN IF NOT EXISTS display_name text;
ALTER TABLE coach_profiles ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE coach_profiles ADD COLUMN IF NOT EXISTS belt_name text;
ALTER TABLE coach_profiles ADD COLUMN IF NOT EXISTS belt_color_hex text;

-- Seed Shamsudin as a standalone pinned coach (no account needed)
INSERT INTO coach_profiles (
  profile_id, display_name, avatar_url, belt_name, belt_color_hex,
  specialization, bio, achievements, show_on_website, is_pinned, display_order
) VALUES (
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
)
ON CONFLICT DO NOTHING;
