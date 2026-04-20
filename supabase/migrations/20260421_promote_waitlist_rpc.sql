-- Atomic waitlist promotion: promotes the first waitlisted booking to confirmed
-- AND decrements all remaining waitlist positions in a single transaction.
-- Returns the promoted booking's profile_id (for notifications) or NULL if no one waitlisted.
--
-- Uses LANGUAGE sql with CTEs instead of PL/pgSQL because the Supabase SQL Editor
-- does not reliably parse multi-line PL/pgSQL function bodies (see .learnings/).

CREATE OR REPLACE FUNCTION public.promote_waitlist(p_session_id uuid)
 RETURNS uuid
 LANGUAGE sql
 SECURITY DEFINER
AS $function$
  WITH promoted AS (
    UPDATE bookings
    SET status = 'confirmed', waitlist_position = NULL
    WHERE id = (
      SELECT id FROM bookings
      WHERE session_id = p_session_id AND status = 'waitlisted'
      ORDER BY waitlist_position ASC NULLS LAST
      LIMIT 1
    )
    RETURNING profile_id
  ),
  decremented AS (
    UPDATE bookings
    SET waitlist_position = waitlist_position - 1
    WHERE session_id = p_session_id
      AND status = 'waitlisted'
      AND waitlist_position IS NOT NULL
      AND EXISTS (SELECT 1 FROM promoted)
    RETURNING 1
  )
  SELECT profile_id FROM promoted
  UNION ALL
  SELECT NULL::uuid WHERE NOT EXISTS (SELECT 1 FROM promoted)
  LIMIT 1;
$function$;
