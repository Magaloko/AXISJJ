-- Atomic booking function to prevent race conditions on capacity checks.
-- Uses FOR UPDATE on class_sessions to serialize concurrent requests for the same session.
CREATE OR REPLACE FUNCTION book_class(
  p_session_id UUID,
  p_user_id    UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_capacity        INT;
  v_confirmed       INT;
  v_has_space       BOOLEAN;
  v_status          TEXT;
  v_waitlist_pos    INT;
  v_existing_id     UUID;
  v_existing_status TEXT;
BEGIN
  -- Reject if caller is not the authenticated user
  IF p_user_id != auth.uid() THEN
    RETURN json_build_object('error', 'Keine Berechtigung.');
  END IF;

  -- Lock this session row — all concurrent bookings for the same session will queue here
  SELECT capacity INTO v_capacity
  FROM class_sessions
  WHERE id = p_session_id AND cancelled = FALSE
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object('error', 'Klasse nicht gefunden.');
  END IF;

  -- Check for existing non-cancelled booking
  SELECT id, status INTO v_existing_id, v_existing_status
  FROM bookings
  WHERE session_id = p_session_id AND profile_id = p_user_id;

  IF FOUND AND v_existing_status != 'cancelled' THEN
    RETURN json_build_object('error', 'Du hast diese Klasse bereits gebucht.');
  END IF;

  -- Count confirmed bookings — safe now because we hold the lock
  SELECT COUNT(*) INTO v_confirmed
  FROM bookings
  WHERE session_id = p_session_id AND status = 'confirmed';

  v_has_space := v_confirmed < v_capacity;
  v_status    := CASE WHEN v_has_space THEN 'confirmed' ELSE 'waitlisted' END;

  IF NOT v_has_space THEN
    SELECT COALESCE(MAX(waitlist_position), 0) + 1 INTO v_waitlist_pos
    FROM bookings
    WHERE session_id = p_session_id AND status = 'waitlisted';
  END IF;

  IF v_existing_id IS NOT NULL THEN
    UPDATE bookings
    SET status            = v_status,
        waitlist_position = CASE WHEN v_has_space THEN NULL ELSE v_waitlist_pos END
    WHERE id = v_existing_id;
  ELSE
    INSERT INTO bookings (session_id, profile_id, status, waitlist_position)
    VALUES (
      p_session_id,
      p_user_id,
      v_status,
      CASE WHEN v_has_space THEN NULL ELSE v_waitlist_pos END
    );
  END IF;

  RETURN json_build_object('status', v_status);
END;
$$;
