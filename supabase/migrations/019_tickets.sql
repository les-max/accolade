-- Ticket system: per-performance capacity/price, orders, and line items

-- One row per performance date that has tickets enabled
CREATE TABLE ticket_performances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  show_performance_id UUID NOT NULL REFERENCES show_performances(id) ON DELETE CASCADE,
  capacity INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  sales_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(show_performance_id)
);

-- One row per purchase transaction
CREATE TABLE ticket_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  show_id UUID NOT NULL REFERENCES shows(id),
  buyer_name TEXT NOT NULL,
  buyer_email TEXT NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  stripe_session_id TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'paid', 'cancelled', 'refunded')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Line items within an order
CREATE TABLE ticket_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES ticket_orders(id) ON DELETE CASCADE,
  ticket_performance_id UUID NOT NULL REFERENCES ticket_performances(id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE ticket_performances ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_order_items ENABLE ROW LEVEL SECURITY;

-- ticket_performances: public read for enabled rows, admin write
CREATE POLICY "ticket_performances_public_read" ON ticket_performances
  FOR SELECT USING (sales_enabled = true);

CREATE POLICY "ticket_performances_admin_all" ON ticket_performances
  FOR ALL USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );

-- ticket_orders: anyone can insert (guest checkout), buyer can read own, admin reads all
CREATE POLICY "ticket_orders_insert" ON ticket_orders
  FOR INSERT WITH CHECK (true);

CREATE POLICY "ticket_orders_buyer_read" ON ticket_orders
  FOR SELECT USING (buyer_email = (
    SELECT email FROM families WHERE user_id = auth.uid() LIMIT 1
  ));

CREATE POLICY "ticket_orders_admin_all" ON ticket_orders
  FOR ALL USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );

-- ticket_order_items: admin reads all; join through order for buyer access
CREATE POLICY "ticket_order_items_admin_all" ON ticket_order_items
  FOR ALL USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );

CREATE POLICY "ticket_order_items_insert" ON ticket_order_items
  FOR INSERT WITH CHECK (true);
