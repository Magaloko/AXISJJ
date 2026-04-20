-- Backfill missing profiles for auth.users who have no row in public.profiles.
-- This fixes existing users (e.g. signed up via magic link before auto-create
-- was implemented) so they appear in /admin/mitglieder.

INSERT INTO profiles (id, full_name, email, role, language)
SELECT
  u.id,
  COALESCE(
    (u.raw_user_meta_data->>'full_name'),
    (u.raw_user_meta_data->>'name'),
    split_part(u.email, '@', 1)
  ) AS full_name,
  u.email,
  'member' AS role,
  'de' AS language
FROM auth.users u
LEFT JOIN profiles p ON p.id = u.id
WHERE p.id IS NULL
  AND u.email IS NOT NULL
ON CONFLICT (id) DO NOTHING;
