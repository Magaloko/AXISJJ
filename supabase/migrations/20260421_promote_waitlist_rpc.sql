-- Atomic waitlist promotion: promotes the first waitlisted booking to confirmed
-- AND decrements all remaining waitlist positions in a single transaction.
-- Returns the promoted booking's profile_id (for notifications) or NULL if no one waitlisted.

CREATE OR REPLACE FUNCTION public.promote_waitlist(p_session_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_session_capacity int;
  v_promoted_profile_id uuid;
BEGIN
  SELECT capacity INTO v_session_capacity
  FROM class_sessions
  WHERE id = p_session_id AND cancelled = FALSE
  FOR UPDATE;

  IF v_session_capacity IS NULL THEN
    RETURN NULL;
  END IF;

  UPDATE bookings
  SET status = 'confirmed', waitlist_position = NULL
  WHERE id = (
    SELECT id FROM bookings
    WHERE session_id = p_session_id AND status = 'waitlisted'
    ORDER BY waitlist_position ASC NULLS LAST
    LIMIT 1
  )
  RETURNING profile_id INTO v_promoted_profile_id;

  IF v_promoted_profile_id IS NULL THEN
    RETURN NULL;
  END IF;

  UPDATE bookings
  SET waitlist_position = waitlist_position - 1
  WHERE session_id = p_session_id
    AND status = 'waitlisted'
    AND waitlist_position IS NOT NULL;

  RETURN v_promoted_profile_id;
END;
$function$;
