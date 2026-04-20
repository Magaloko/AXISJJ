-- Atomic booking function. Uses scalar subqueries instead of SELECT INTO
-- because the Supabase SQL Editor parses SELECT INTO ambiguously in
-- function bodies (treats variables as missing relations).

DROP FUNCTION IF EXISTS public.book_class(uuid, uuid);

CREATE OR REPLACE FUNCTION public.book_class(p_session_id uuid, p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_cap int;
  v_conf int;
  v_existing_id uuid;
  v_existing_status text;
  v_wp int;
  v_status text;
BEGIN
  IF p_user_id <> auth.uid() THEN
    RETURN jsonb_build_object('error', 'Keine Berechtigung.');
  END IF;

  v_cap := (SELECT capacity FROM class_sessions WHERE id = p_session_id AND cancelled = FALSE);
  IF v_cap IS NULL THEN
    RETURN jsonb_build_object('error', 'Klasse nicht gefunden.');
  END IF;

  v_existing_id := (SELECT id FROM bookings WHERE session_id = p_session_id AND profile_id = p_user_id LIMIT 1);
  v_existing_status := (SELECT status FROM bookings WHERE session_id = p_session_id AND profile_id = p_user_id LIMIT 1);

  IF v_existing_id IS NOT NULL AND v_existing_status <> 'cancelled' THEN
    RETURN jsonb_build_object('error', 'Du hast diese Klasse bereits gebucht.');
  END IF;

  v_conf := (SELECT COUNT(*) FROM bookings WHERE session_id = p_session_id AND status = 'confirmed');

  IF v_conf < v_cap THEN
    v_status := 'confirmed';
    v_wp := NULL;
  ELSE
    v_status := 'waitlisted';
    v_wp := (SELECT COALESCE(MAX(waitlist_position), 0) + 1 FROM bookings WHERE session_id = p_session_id AND status = 'waitlisted');
  END IF;

  IF v_existing_id IS NOT NULL THEN
    UPDATE bookings SET status = v_status, waitlist_position = v_wp WHERE id = v_existing_id;
  ELSE
    INSERT INTO bookings (session_id, profile_id, status, waitlist_position)
    VALUES (p_session_id, p_user_id, v_status, v_wp);
  END IF;

  RETURN jsonb_build_object('status', v_status);
END;
$function$;
