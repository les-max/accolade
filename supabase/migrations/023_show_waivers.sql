-- Electronic waiver signatures: one row per family per show per waiver type

CREATE TABLE show_waivers (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  show_id      UUID NOT NULL REFERENCES shows(id) ON DELETE CASCADE,
  family_id    UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  waiver_type  TEXT NOT NULL CHECK (waiver_type IN ('liability', 'photo_video')),
  signature    TEXT NOT NULL,
  signed_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address   TEXT NOT NULL,
  UNIQUE(show_id, family_id, waiver_type)
);

ALTER TABLE show_waivers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "show_waivers_family_read" ON show_waivers;
CREATE POLICY "show_waivers_family_read" ON show_waivers
  FOR SELECT USING (
    family_id = (SELECT id FROM families WHERE user_id = auth.uid() LIMIT 1)
  );

DROP POLICY IF EXISTS "show_waivers_admin_all" ON show_waivers;
CREATE POLICY "show_waivers_admin_all" ON show_waivers
  FOR ALL USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );
