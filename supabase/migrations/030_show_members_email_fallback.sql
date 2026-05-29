-- Allow family_id to be null on show_members.
-- CSV imports and admin-added members without a portal account won't have a family link.
-- Access falls back to email matching in the RLS policies below.
ALTER TABLE show_members ALTER COLUMN family_id DROP NOT NULL;

-- show_members: readable if family matches OR email matches the logged-in user
DROP POLICY IF EXISTS "show_members_family_read" ON show_members;
CREATE POLICY "show_members_family_read" ON show_members
  FOR SELECT USING (
    family_id IN (
      SELECT family_id FROM family_users WHERE user_id = auth.uid()
    )
    OR email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- show_events: readable via family chain OR via email match on show_members
DROP POLICY IF EXISTS "show_events_select_member" ON show_events;
CREATE POLICY "show_events_select_member" ON show_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM show_members sm
      JOIN family_users fu ON fu.family_id = sm.family_id
      WHERE sm.show_id = show_events.show_id
      AND fu.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM show_members sm
      WHERE sm.show_id = show_events.show_id
      AND sm.email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );
