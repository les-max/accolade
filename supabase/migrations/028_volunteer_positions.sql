-- ============================================================
-- Volunteer positions + signups
-- ============================================================

-- Publish flag on shows (flip to true → signup button appears on portal)
ALTER TABLE shows ADD COLUMN IF NOT EXISTS volunteers_published BOOLEAN NOT NULL DEFAULT false;

-- Positions defined per show by an organizer
CREATE TABLE volunteer_positions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  show_id        UUID NOT NULL REFERENCES shows(id) ON DELETE CASCADE,
  name           TEXT NOT NULL,
  description    TEXT,
  capacity       INT NOT NULL DEFAULT 1 CHECK (capacity >= 1),
  position_type  TEXT NOT NULL DEFAULT 'open' CHECK (position_type IN ('open', 'assigned')),
  sort_order     INT NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_volunteer_positions_show_id ON volunteer_positions(show_id);

-- Who has claimed / been assigned to each position
CREATE TABLE volunteer_signups (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  position_id      UUID NOT NULL REFERENCES volunteer_positions(id) ON DELETE CASCADE,
  show_id          UUID NOT NULL REFERENCES shows(id) ON DELETE CASCADE,
  family_id        UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  assigned_by      UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (position_id, family_id)
);

CREATE INDEX idx_volunteer_signups_position_id ON volunteer_signups(position_id);
CREATE INDEX idx_volunteer_signups_family_id   ON volunteer_signups(family_id);
CREATE INDEX idx_volunteer_signups_show_id     ON volunteer_signups(show_id);

-- ── RLS: volunteer_positions ───────────────────────────────────
ALTER TABLE volunteer_positions ENABLE ROW LEVEL SECURITY;

-- Admins full access
CREATE POLICY "vp_admin_all" ON volunteer_positions FOR ALL
  USING (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()));

-- Families can see positions for published shows they are in
CREATE POLICY "vp_family_select" ON volunteer_positions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM shows s
      WHERE s.id = show_id AND s.volunteers_published = true
    )
    AND EXISTS (
      SELECT 1 FROM show_members sm
        JOIN family_users fu ON fu.family_id = sm.family_id
      WHERE sm.show_id = volunteer_positions.show_id
        AND fu.user_id = auth.uid()
    )
  );

-- ── RLS: volunteer_signups ────────────────────────────────────
ALTER TABLE volunteer_signups ENABLE ROW LEVEL SECURITY;

-- Admins full access
CREATE POLICY "vs_admin_all" ON volunteer_signups FOR ALL
  USING (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()));

-- Families can see their own signups
CREATE POLICY "vs_family_select" ON volunteer_signups FOR SELECT
  USING (
    family_id IN (SELECT family_id FROM family_users WHERE user_id = auth.uid())
  );

-- Families can claim open positions (INSERT) when published and eligible
CREATE POLICY "vs_family_insert" ON volunteer_signups FOR INSERT
  WITH CHECK (
    family_id IN (SELECT family_id FROM family_users WHERE user_id = auth.uid())
    AND assigned_by IS NULL
    AND EXISTS (
      SELECT 1 FROM volunteer_positions vp
        JOIN shows s ON s.id = vp.show_id
      WHERE vp.id = position_id
        AND vp.position_type = 'open'
        AND s.volunteers_published = true
    )
    AND EXISTS (
      SELECT 1 FROM show_members sm
        JOIN family_users fu ON fu.family_id = sm.family_id
      WHERE sm.show_id = show_id
        AND fu.user_id = auth.uid()
    )
  );

-- Families can unclaim their own self-claimed signups
CREATE POLICY "vs_family_delete" ON volunteer_signups FOR DELETE
  USING (
    family_id IN (SELECT family_id FROM family_users WHERE user_id = auth.uid())
    AND assigned_by IS NULL
  );
