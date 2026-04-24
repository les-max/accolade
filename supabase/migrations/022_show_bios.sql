-- Playbill bio submissions: one per family member per show

CREATE TABLE show_bios (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  show_id          UUID NOT NULL REFERENCES shows(id) ON DELETE CASCADE,
  family_id        UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  family_member_id UUID NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
  first_name       TEXT NOT NULL,
  last_name        TEXT NOT NULL,
  role             TEXT NOT NULL,
  age              INTEGER NOT NULL,
  grade            TEXT NOT NULL,
  bio              TEXT NOT NULL,
  submitted_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(show_id, family_member_id)
);

ALTER TABLE show_bios ENABLE ROW LEVEL SECURITY;

-- Families can read and write their own bios
DROP POLICY IF EXISTS "show_bios_family_all" ON show_bios;
CREATE POLICY "show_bios_family_all" ON show_bios
  FOR ALL USING (
    family_id = (SELECT id FROM families WHERE user_id = auth.uid() LIMIT 1)
  );

-- Admins can read and write all bios
DROP POLICY IF EXISTS "show_bios_admin_all" ON show_bios;
CREATE POLICY "show_bios_admin_all" ON show_bios
  FOR ALL USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );
