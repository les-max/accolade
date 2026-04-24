-- Enable RLS on show_performances and set appropriate policies

ALTER TABLE show_performances ENABLE ROW LEVEL SECURITY;

-- Anyone can read performance dates (used on public show pages)
CREATE POLICY "show_performances_public_read" ON show_performances
  FOR SELECT USING (true);

-- Only admins can write
CREATE POLICY "show_performances_admin_all" ON show_performances
  FOR ALL USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );
