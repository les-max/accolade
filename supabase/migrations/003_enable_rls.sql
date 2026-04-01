-- ============================================================
-- Accolade Community Theatre — Migration 003: Enable RLS
-- Project: wxcfxzqlzecyopnqgona
-- Date: 2026-04-01
--
-- CONTEXT:
-- All 7 tables had RLS disabled — publicly accessible to anyone
-- with the project URL. This migration closes that exposure.
--
-- AUTH PATTERN IN THIS APP:
-- - Browser/server client uses SUPABASE_ANON_KEY
-- - When user is logged in: auth.uid() and auth.role() = 'authenticated' are available
-- - When not logged in: auth.uid() is null, auth.role() = 'anon'
-- - No service role key is used in Next.js (all via anon key + auth session)
-- - Google Apps Script check-in dashboard uses Google Sheets only — no Supabase connection
--
-- POLICY DESIGN:
-- shows / audition_slots / show_roles: public read (theater info), authenticated write
-- auditions: public INSERT (anyone can submit audition form), authenticated SELECT/UPDATE/DELETE
-- families: scoped to auth.uid() = user_id (each family sees only their own)
-- family_members: scoped through the families table (same user_id check)
-- admin_users: no anon/authenticated policies — only accessible via service role
-- ============================================================

-- ============================================================
-- shows
-- Public theater info — intentionally readable by everyone.
-- Admin creates/updates shows via authenticated session.
-- ============================================================
ALTER TABLE shows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read shows"
  ON shows FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can manage shows"
  ON shows FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ============================================================
-- audition_slots
-- Public info — displayed on the public auditions page.
-- submitAudition server action reads slots as anon (public form).
-- ============================================================
ALTER TABLE audition_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read audition slots"
  ON audition_slots FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can manage audition slots"
  ON audition_slots FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ============================================================
-- show_roles
-- Public info — role names are displayed on audition pages.
-- ============================================================
ALTER TABLE show_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read show roles"
  ON show_roles FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can manage show roles"
  ON show_roles FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ============================================================
-- auditions
-- Public INSERT: anyone can submit the audition form (no login required).
-- Read/update/delete: authenticated users only (admins, families via /account).
-- ============================================================
ALTER TABLE auditions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can submit auditions"
  ON auditions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Authenticated users can read auditions"
  ON auditions FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update auditions"
  ON auditions FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete auditions"
  ON auditions FOR DELETE
  USING (auth.role() = 'authenticated');

-- ============================================================
-- families
-- HIGH sensitivity — PII. Each family is tied to a Supabase
-- auth user via user_id. Scoped strictly to auth.uid().
-- See: app/(public)/account/setup/actions.ts (creates family with user_id = user.id)
--      app/(public)/account/family/actions.ts (reads family where user_id = user.id)
-- ============================================================
ALTER TABLE families ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own family"
  ON families FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own family"
  ON families FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own family"
  ON families FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- family_members
-- HIGH sensitivity — PII. Linked to families via family_id.
-- Scoped through the families table using the same user_id check.
-- ============================================================
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own family members"
  ON family_members FOR SELECT
  USING (
    family_id IN (
      SELECT id FROM families WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can add family members"
  ON family_members FOR INSERT
  WITH CHECK (
    family_id IN (
      SELECT id FROM families WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own family members"
  ON family_members FOR UPDATE
  USING (
    family_id IN (
      SELECT id FROM families WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own family members"
  ON family_members FOR DELETE
  USING (
    family_id IN (
      SELECT id FROM families WHERE user_id = auth.uid()
    )
  );

-- ============================================================
-- admin_users
-- HIGH sensitivity — auth table. No anon or authenticated policies.
-- Should only be accessed via service role key from admin tooling.
-- ============================================================
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Intentionally no policies. Service role only.

-- ============================================================
-- Fix mutable search_path on helper functions
-- These functions are flagged by Supabase as security warnings.
-- Setting search_path = '' forces explicit schema qualification
-- and prevents search_path injection attacks.
-- ============================================================
CREATE OR REPLACE FUNCTION slot_registration_count(p_slot_id UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.auditions
  WHERE slot_id = p_slot_id
    AND status = 'registered';
$$ LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = '';

CREATE OR REPLACE FUNCTION promote_from_waitlist(p_slot_id UUID)
RETURNS UUID AS $$
DECLARE
  v_audition_id UUID;
BEGIN
  SELECT id INTO v_audition_id
  FROM public.auditions
  WHERE slot_id = p_slot_id
    AND status = 'waitlisted'
  ORDER BY waitlist_position ASC
  LIMIT 1;

  IF v_audition_id IS NOT NULL THEN
    UPDATE public.auditions
    SET status = 'registered', waitlist_position = NULL
    WHERE id = v_audition_id;

    UPDATE public.auditions
    SET waitlist_position = waitlist_position - 1
    WHERE slot_id = p_slot_id
      AND status = 'waitlisted'
      AND waitlist_position > 1;
  END IF;

  RETURN v_audition_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';
