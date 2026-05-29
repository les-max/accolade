-- 032_event_registration.sql
-- Adds event registration: seat cap column, registrations table, and atomic RPC

ALTER TABLE shows ADD COLUMN IF NOT EXISTS registration_capacity integer;

CREATE TABLE IF NOT EXISTS show_registrations (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  show_id    uuid NOT NULL REFERENCES shows(id) ON DELETE CASCADE,
  name       text NOT NULL,
  email      text NOT NULL,
  party_size integer NOT NULL DEFAULT 1 CHECK (party_size >= 1),
  family_id  uuid REFERENCES families(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS show_registrations_show_id_idx
  ON show_registrations (show_id);

ALTER TABLE show_registrations ENABLE ROW LEVEL SECURITY;

-- Public (anon + authenticated) may insert registrations
CREATE POLICY "Anyone can register"
  ON show_registrations FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Atomic capacity check + insert — runs as SECURITY DEFINER to read shows + registrations
-- regardless of RLS, then insert the row. Lock on the show row prevents concurrent overselling.
CREATE OR REPLACE FUNCTION register_for_show(
  p_show_id    uuid,
  p_name       text,
  p_email      text,
  p_party_size integer
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_capacity integer;
  v_claimed  integer;
  v_id       uuid;
BEGIN
  SELECT registration_capacity INTO v_capacity
  FROM shows WHERE id = p_show_id FOR UPDATE;

  IF v_capacity IS NOT NULL THEN
    SELECT COALESCE(SUM(party_size), 0) INTO v_claimed
    FROM show_registrations WHERE show_id = p_show_id;

    IF v_claimed + p_party_size > v_capacity THEN
      RETURN jsonb_build_object(
        'error', 'Not enough seats remaining',
        'remaining', v_capacity - v_claimed
      );
    END IF;
  END IF;

  INSERT INTO show_registrations (show_id, name, email, party_size)
  VALUES (p_show_id, p_name, p_email, p_party_size)
  RETURNING id INTO v_id;

  RETURN jsonb_build_object('id', v_id::text);
END;
$$;
