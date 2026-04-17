-- ============================================================
-- Accolade Community Theatre — Initial Schema
-- ============================================================

-- ── Families ─────────────────────────────────────────────────
-- One account per family unit (parent/guardian login)
CREATE TABLE families (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email      TEXT UNIQUE NOT NULL,
  parent_name TEXT NOT NULL,
  phone      TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Family Members ────────────────────────────────────────────
-- Children linked to a family account
CREATE TABLE family_members (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id  UUID REFERENCES families(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  age        INTEGER,
  grade      TEXT,
  photo_url  TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Shows ─────────────────────────────────────────────────────
CREATE TABLE shows (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug           TEXT UNIQUE NOT NULL,
  title          TEXT NOT NULL,
  show_image     TEXT,
  description    TEXT,
  audition_type  TEXT CHECK (audition_type IN ('window', 'slot')) NOT NULL DEFAULT 'slot',
  age_min        INTEGER,
  age_max        INTEGER,
  status         TEXT CHECK (status IN ('draft', 'active', 'closed')) NOT NULL DEFAULT 'draft',
  -- field_config controls which optional fields appear on the registration form
  -- shape: { show_grade: bool, show_headshot_upload: bool, custom_questions: [{id, label, type, required}] }
  field_config   JSONB DEFAULT '{"show_grade": false, "show_headshot_upload": false, "custom_questions": []}',
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ── Audition Slots ────────────────────────────────────────────
-- Works for both window-based and specific time slot auditions
CREATE TABLE audition_slots (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  show_id          UUID REFERENCES shows(id) ON DELETE CASCADE,
  label            TEXT NOT NULL,         -- e.g. "Saturday 10am–11:30am" or "9:17am"
  start_time       TIMESTAMPTZ,
  end_time         TIMESTAMPTZ,
  capacity         INTEGER NOT NULL DEFAULT 10,
  waitlist_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ── Show Roles ────────────────────────────────────────────────
CREATE TABLE show_roles (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  show_id    UUID REFERENCES shows(id) ON DELETE CASCADE,
  role_name  TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Auditions ─────────────────────────────────────────────────
CREATE TABLE auditions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  show_id             UUID REFERENCES shows(id) ON DELETE CASCADE,
  slot_id             UUID REFERENCES audition_slots(id) ON DELETE SET NULL,
  family_id           UUID REFERENCES families(id) ON DELETE SET NULL,
  family_member_id    UUID REFERENCES family_members(id) ON DELETE SET NULL,
  status              TEXT CHECK (status IN ('registered', 'waitlisted', 'cancelled')) NOT NULL DEFAULT 'registered',
  waitlist_position   INTEGER,            -- null if registered; 1 = next in line
  -- Auditioner info (stored directly for guest submissions too)
  auditioner_name     TEXT NOT NULL,
  auditioner_age      INTEGER,
  auditioner_grade    TEXT,
  -- Contact info (parent fields; empty for 18+ auditioners who use their own)
  parent_name         TEXT,
  parent_email        TEXT NOT NULL,      -- always required — either parent or auditioner
  parent_phone        TEXT,
  is_adult            BOOLEAN NOT NULL DEFAULT false,
  -- Show-specific fields
  role_preference     TEXT,
  accept_other_roles  BOOLEAN DEFAULT true,
  conflicts           TEXT,
  extra_fields        JSONB DEFAULT '{}', -- director custom questions
  -- GHL integration
  ghl_contact_id      TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ── Admin Users ───────────────────────────────────────────────
-- Separate from member accounts — staff/director access
CREATE TABLE admin_users (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role       TEXT CHECK (role IN ('admin', 'executive_director', 'director', 'stage_manager')) NOT NULL,
  show_id    UUID REFERENCES shows(id) ON DELETE SET NULL, -- NULL = access to all shows
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX idx_auditions_show_id   ON auditions(show_id);
CREATE INDEX idx_auditions_slot_id   ON auditions(slot_id);
CREATE INDEX idx_auditions_status    ON auditions(status);
CREATE INDEX idx_auditions_family_id ON auditions(family_id);
CREATE INDEX idx_slots_show_id       ON audition_slots(show_id);
CREATE INDEX idx_roles_show_id       ON show_roles(show_id);
CREATE INDEX idx_family_members_family_id ON family_members(family_id);

-- ============================================================
-- Helper: count confirmed registrations for a slot
-- Used to enforce capacity on the server side
-- ============================================================
CREATE OR REPLACE FUNCTION slot_registration_count(p_slot_id UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER
  FROM auditions
  WHERE slot_id = p_slot_id
    AND status = 'registered';
$$ LANGUAGE SQL STABLE;

-- ============================================================
-- Helper: promote next waitlisted person when a spot opens
-- Call this after cancelling a registration
-- ============================================================
CREATE OR REPLACE FUNCTION promote_from_waitlist(p_slot_id UUID)
RETURNS UUID AS $$
DECLARE
  v_audition_id UUID;
BEGIN
  -- Find the next person on the waitlist (lowest position)
  SELECT id INTO v_audition_id
  FROM auditions
  WHERE slot_id = p_slot_id
    AND status = 'waitlisted'
  ORDER BY waitlist_position ASC
  LIMIT 1;

  IF v_audition_id IS NOT NULL THEN
    -- Promote them to registered
    UPDATE auditions
    SET status = 'registered', waitlist_position = NULL
    WHERE id = v_audition_id;

    -- Reorder remaining waitlist positions
    UPDATE auditions
    SET waitlist_position = waitlist_position - 1
    WHERE slot_id = p_slot_id
      AND status = 'waitlisted'
      AND waitlist_position > 1;
  END IF;

  RETURN v_audition_id; -- returns the promoted audition id, or NULL if none
END;
$$ LANGUAGE plpgsql;
