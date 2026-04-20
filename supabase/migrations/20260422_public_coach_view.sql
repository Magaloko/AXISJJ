-- Replace the broad "profiles_public_coach_read" policy with a narrower
-- VIEW that exposes only name/role/avatar of coach+owner profiles to the
-- public. Email, phone, DOB are NOT leaked.

-- Drop the overly-permissive policy if it exists
DROP POLICY IF EXISTS "profiles_public_coach_read" ON profiles;

-- Public view with only safe fields
CREATE OR REPLACE VIEW public_coaches AS
SELECT id, full_name, role, avatar_url
FROM profiles
WHERE role IN ('coach', 'owner');

-- Grant select on the view to anon+authenticated users
GRANT SELECT ON public_coaches TO anon, authenticated;

-- The existing profiles policies remain:
-- * profiles_select_own (auth.uid() = id)
-- * profiles_select_coach (staff can read all)
-- * profiles_public_coach_read (DROPPED above)
