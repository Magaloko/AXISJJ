-- Atomic waitlist promotion: promotes the first waitlisted booking to confirmed
-- AND decrements all remaining waitlist positions in a single transaction.
-- Returns the promoted booking's profile_id (for notifications) or NULL if no one waitlisted.

CREATE OR REPLACE FUNCTION promote_waitlist(p_session_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_promoted_id UUID;
  v_promoted_profile_id UUID;
BEGIN
  -- Lock the session row to serialize concurrent promotions
  PERFORM 1 FROM class_sessions WHERE id = p_session_id FOR UPDATE;

  -- Find and promote the first waitlisted booking
  SELECT id, profile_id INTO v_promoted_id, v_promoted_profile_id
  FROM bookings
  WHERE session_id = p_session_id AND status = 'waitlisted'
  ORDER BY waitlist_position ASC
  LIMIT 1;

  IF v_promoted_id IS NULL THEN
    RETURN NULL;
  END IF;

  UPDATE bookings
  SET status = 'confirmed', waitlist_position = NULL
  WHERE id = v_promoted_id;

  -- Decrement remaining waitlist positions in a single statement
  UPDATE bookings
  SET waitlist_position = waitlist_position - 1
  WHERE session_id = p_session_id
    AND status = 'waitlisted'
    AND waitlist_position IS NOT NULL;

  RETURN v_promoted_profile_id;
END;
$$;
