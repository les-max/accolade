-- Allow multiple auth users (parents/guardians) per family.
-- Each auth user belongs to at most one family.

CREATE TABLE family_users (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id  UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id)
);

CREATE INDEX idx_family_users_family_id ON family_users(family_id);

-- Migrate existing family→user links
INSERT INTO family_users (family_id, user_id, name)
SELECT id, user_id, COALESCE(parent_name, '')
FROM families
WHERE user_id IS NOT NULL;

-- RLS
ALTER TABLE family_users ENABLE ROW LEVEL SECURITY;

-- Each user can see their own row
CREATE POLICY "family_users_select_own" ON family_users
  FOR SELECT USING (user_id = auth.uid());

-- Users can create their own row (account setup flow)
CREATE POLICY "family_users_insert_own" ON family_users
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Admins can do everything
CREATE POLICY "family_users_admin_all" ON family_users
  FOR ALL USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );

-- Update families RLS: co-parents can read and update via family_users
CREATE POLICY "families_select_via_family_users" ON families
  FOR SELECT USING (
    id IN (SELECT family_id FROM family_users WHERE user_id = auth.uid())
  );

CREATE POLICY "families_update_via_family_users" ON families
  FOR UPDATE USING (
    id IN (SELECT family_id FROM family_users WHERE user_id = auth.uid())
  );

-- Update family_members RLS: co-parents can manage kids via family_users
CREATE POLICY "family_members_via_family_users" ON family_members
  FOR ALL USING (
    family_id IN (SELECT family_id FROM family_users WHERE user_id = auth.uid())
  );
