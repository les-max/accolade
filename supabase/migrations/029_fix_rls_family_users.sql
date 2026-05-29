-- Fix RLS policies to use family_users instead of families.user_id.
-- The original policies used families.user_id (single-user model).
-- Migration 027 introduced family_users for co-parent support and migrated
-- existing data, so all users have a family_users row. Co-parents were broken
-- under the old policies.

-- show_members: allow any user linked to the family via family_users
DROP POLICY IF EXISTS "show_members_family_read" ON show_members;
CREATE POLICY "show_members_family_read" ON show_members
  FOR SELECT USING (
    family_id IN (
      SELECT family_id FROM family_users WHERE user_id = auth.uid()
    )
  );

-- show_events: allow read if the user's family is in the show via show_members
DROP POLICY IF EXISTS "show_events_select_member" ON show_events;
CREATE POLICY "show_events_select_member" ON show_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM show_members sm
      JOIN family_users fu ON fu.family_id = sm.family_id
      WHERE sm.show_id = show_events.show_id
      AND fu.user_id = auth.uid()
    )
  );
