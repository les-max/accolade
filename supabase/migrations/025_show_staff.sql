-- 1. Drop unused show_id column from admin_users (never referenced in app code)
ALTER TABLE admin_users DROP COLUMN IF EXISTS show_id;

-- 2. Update role check constraint — remove executive_director/stage_manager, add production_manager
ALTER TABLE admin_users DROP CONSTRAINT IF EXISTS admin_users_role_check;
ALTER TABLE admin_users
  ADD CONSTRAINT admin_users_role_check
  CHECK (role IN ('admin', 'director', 'production_manager'));

-- 3. Per-show staff assignment table
CREATE TABLE show_staff (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  show_id        UUID NOT NULL REFERENCES shows(id) ON DELETE CASCADE,
  admin_user_id  UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  role           TEXT NOT NULL CHECK (role IN ('director', 'production_manager')),
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (show_id, admin_user_id)
);

-- 4. RLS for show_staff
ALTER TABLE show_staff ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage show_staff" ON show_staff
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Staff view own assignments" ON show_staff
  FOR SELECT
  USING (
    admin_user_id IN (
      SELECT id FROM admin_users WHERE user_id = auth.uid()
    )
  );

-- 5. Indexes for fast lookups
CREATE INDEX idx_show_staff_show_id ON show_staff(show_id);
CREATE INDEX idx_show_staff_admin_user_id ON show_staff(admin_user_id);
