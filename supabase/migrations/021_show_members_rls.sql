-- Enable RLS on show_members
-- Also drop the CHECK constraint so show_role can hold any label (Cast A, Cast B, Pit Band, etc.)

ALTER TABLE show_members DROP CONSTRAINT IF EXISTS show_members_show_role_check;

ALTER TABLE show_members ENABLE ROW LEVEL SECURITY;

-- Members can read their own show membership
CREATE POLICY IF NOT EXISTS "show_members_family_read" ON show_members
  FOR SELECT USING (
    family_id = (SELECT id FROM families WHERE user_id = auth.uid() LIMIT 1)
  );

-- Admins can do everything
CREATE POLICY IF NOT EXISTS "show_members_admin_all" ON show_members
  FOR ALL USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );
