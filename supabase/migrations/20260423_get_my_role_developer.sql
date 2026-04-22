-- ============================================================
-- Map `developer` role to `owner` inside get_my_role()
--
-- Rationale: all existing RLS policies check
--   get_my_role() IN ('coach', 'owner')  or  get_my_role() = 'owner'
-- Updating each policy to add 'developer' would require rewriting
-- 30+ policies. Instead we treat 'developer' as an alias of 'owner'
-- at the role-resolution layer, granting full access transparently.
-- ============================================================

CREATE OR REPLACE FUNCTION get_my_role()
RETURNS TEXT AS $$
  SELECT
    CASE
      WHEN role = 'developer' THEN 'owner'
      ELSE role
    END
  FROM profiles
  WHERE id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER STABLE;
