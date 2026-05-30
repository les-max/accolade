-- ticket_option_groups: one group per ticket_performance (e.g. "Meal Choice")
CREATE TABLE ticket_option_groups (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_performance_id UUID NOT NULL REFERENCES ticket_performances(id) ON DELETE CASCADE,
  name                 TEXT NOT NULL,
  required             BOOLEAN NOT NULL DEFAULT true,
  sort_order           INTEGER NOT NULL DEFAULT 0,
  created_at           TIMESTAMPTZ DEFAULT now()
);

-- ticket_options: individual choices within a group (e.g. "Chicken")
CREATE TABLE ticket_options (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id   UUID NOT NULL REFERENCES ticket_option_groups(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ticket_order_item_options: what was selected per order item
CREATE TABLE ticket_order_item_options (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_order_item_id  UUID NOT NULL REFERENCES ticket_order_items(id) ON DELETE CASCADE,
  ticket_option_id      UUID NOT NULL REFERENCES ticket_options(id),
  quantity              INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at            TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE ticket_option_groups     ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_options           ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_order_item_options ENABLE ROW LEVEL SECURITY;

-- Public read for checkout flow (uses service client, but add policy for safety)
CREATE POLICY "service role full access" ON ticket_option_groups
  USING (true) WITH CHECK (true);
CREATE POLICY "service role full access" ON ticket_options
  USING (true) WITH CHECK (true);
CREATE POLICY "service role full access" ON ticket_order_item_options
  USING (true) WITH CHECK (true);
