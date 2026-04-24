-- ============================================================
-- Portal roles + show membership
-- ============================================================

-- Role level on family accounts (admin_users handles L3/L4)
ALTER TABLE families ADD COLUMN IF NOT EXISTS portal_role TEXT
  CHECK (portal_role IN ('user', 'organizer'))
  NOT NULL DEFAULT 'user';

-- Links family accounts to specific shows
CREATE TABLE show_members (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  show_id    UUID NOT NULL REFERENCES shows(id) ON DELETE CASCADE,
  family_id  UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  show_role  TEXT CHECK (show_role IN ('cast', 'crew', 'parent')) NOT NULL DEFAULT 'parent',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(show_id, family_id)
);

CREATE INDEX idx_show_members_show_id   ON show_members(show_id);
CREATE INDEX idx_show_members_family_id ON show_members(family_id);

-- ── RLS: families ─────────────────────────────────────────────
ALTER TABLE families ENABLE ROW LEVEL SECURITY;

CREATE POLICY "families_select_own" ON families FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "families_update_own" ON families FOR UPDATE
  USING (auth.uid() = user_id);

-- Admins can do everything
CREATE POLICY "families_all_admin" ON families FOR ALL
  USING (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()));

-- ── RLS: show_members ─────────────────────────────────────────
ALTER TABLE show_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "show_members_select_own" ON show_members FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM families WHERE id = family_id AND user_id = auth.uid())
  );

CREATE POLICY "show_members_all_admin" ON show_members FOR ALL
  USING (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()));
