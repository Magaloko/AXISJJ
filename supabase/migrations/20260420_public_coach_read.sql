-- Allow public (unauthenticated) read of coach and owner profiles
-- so the public schedule widget can display trainer names.
CREATE POLICY "profiles_public_coach_read"
  ON profiles FOR SELECT
  USING (role IN ('coach', 'owner'));
