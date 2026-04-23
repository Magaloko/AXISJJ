-- Add 'trainer' role to the role system.
-- trainer has the same staff access as coach, focused on training report authorship.
-- We extend the CHECK constraint and update get_my_role() to map trainer→coach
-- so all existing coach policies automatically apply to trainers.

-- 1. Expand profiles.role constraint
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('member', 'coach', 'trainer', 'owner', 'developer'));

-- 2. Update get_my_role() to include trainer→coach mapping (same pattern as developer→owner)
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT
    CASE
      WHEN role = 'developer' THEN 'owner'
      WHEN role = 'trainer'   THEN 'coach'
      ELSE role
    END
  FROM profiles
  WHERE id = auth.uid()
$$;
