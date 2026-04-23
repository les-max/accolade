-- ============================================================
-- show_events: rehearsals, tech week, performances, etc.
-- ============================================================
CREATE TABLE show_events (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  show_id    UUID NOT NULL REFERENCES shows(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('rehearsal', 'tech_rehearsal', 'performance', 'event', 'other')),
  title      TEXT NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time   TIMESTAMPTZ,
  location   TEXT,
  notes      TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_show_events_show_id    ON show_events(show_id);
CREATE INDEX idx_show_events_start_time ON show_events(start_time);

ALTER TABLE show_events ENABLE ROW LEVEL SECURITY;

-- Families who are members of the show can read its events
CREATE POLICY "show_events_select_member" ON show_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM show_members sm
      JOIN families f ON f.id = sm.family_id
      WHERE sm.show_id = show_events.show_id
      AND f.user_id = auth.uid()
    )
  );

CREATE POLICY "show_events_all_admin" ON show_events FOR ALL
  USING  (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()));

-- ============================================================
-- calendar_token: secret UUID per family for iCal feed URL
-- ============================================================
ALTER TABLE families
  ADD COLUMN IF NOT EXISTS calendar_token UUID NOT NULL DEFAULT gen_random_uuid();

CREATE UNIQUE INDEX idx_families_calendar_token ON families(calendar_token);
