-- Migration 020 enabled RLS on show_performances but the policies were never applied.
-- This migration adds the missing policies.

CREATE POLICY "show_performances_public_read" ON show_performances
  FOR SELECT USING (true);

CREATE POLICY "show_performances_admin_all" ON show_performances
  FOR ALL USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );
