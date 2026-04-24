-- show_fees_config: admin-set pricing per show/camp
CREATE TABLE show_fees_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  show_id UUID NOT NULL REFERENCES shows(id) ON DELETE CASCADE,
  shirt_price DECIMAL(10,2),          -- NULL = no shirt upsell; for camps, shirt is included so also NULL
  tuition_amount DECIMAL(10,2),       -- camps/workshops only; NULL = use site tiers for shows
  fees_enabled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(show_id)
);

-- show_coupon_codes: single-use discount codes per show
CREATE TABLE show_coupon_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  show_id UUID NOT NULL REFERENCES shows(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  waive_tuition BOOLEAN NOT NULL DEFAULT false,
  waive_shirts BOOLEAN NOT NULL DEFAULT false,
  used_by_family_id UUID REFERENCES families(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(show_id, code)
);

-- show_fee_orders: one per family checkout (may have multiple pending for same family+show)
CREATE TABLE show_fee_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  show_id UUID NOT NULL REFERENCES shows(id),
  family_id UUID NOT NULL REFERENCES families(id),
  total_amount DECIMAL(10,2) NOT NULL,
  stripe_session_id TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled', 'refunded')),
  coupon_code_id UUID REFERENCES show_coupon_codes(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- show_fee_order_items: one row per line item
CREATE TABLE show_fee_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES show_fee_orders(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL CHECK (item_type IN ('tuition', 'shirt', 'ad')),
  label TEXT NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  family_member_id UUID REFERENCES family_members(id),
  shirt_size TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE show_fees_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE show_coupon_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE show_fee_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE show_fee_order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "show_fees_config_public_read" ON show_fees_config;
CREATE POLICY "show_fees_config_public_read" ON show_fees_config
  FOR SELECT USING (fees_enabled = true);

DROP POLICY IF EXISTS "show_fees_config_admin_all" ON show_fees_config;
CREATE POLICY "show_fees_config_admin_all" ON show_fees_config
  FOR ALL USING (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()));

-- Coupon codes: no family read (prevents code fishing); admins only
DROP POLICY IF EXISTS "show_coupon_codes_admin_all" ON show_coupon_codes;
CREATE POLICY "show_coupon_codes_admin_all" ON show_coupon_codes
  FOR ALL USING (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "show_fee_orders_family_read" ON show_fee_orders;
CREATE POLICY "show_fee_orders_family_read" ON show_fee_orders
  FOR SELECT USING (
    family_id = (SELECT id FROM families WHERE user_id = auth.uid() LIMIT 1)
  );

DROP POLICY IF EXISTS "show_fee_orders_admin_all" ON show_fee_orders;
CREATE POLICY "show_fee_orders_admin_all" ON show_fee_orders
  FOR ALL USING (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "show_fee_order_items_family_read" ON show_fee_order_items;
CREATE POLICY "show_fee_order_items_family_read" ON show_fee_order_items
  FOR SELECT USING (
    order_id IN (
      SELECT id FROM show_fee_orders
      WHERE family_id = (SELECT id FROM families WHERE user_id = auth.uid() LIMIT 1)
    )
  );

DROP POLICY IF EXISTS "show_fee_order_items_admin_all" ON show_fee_order_items;
CREATE POLICY "show_fee_order_items_admin_all" ON show_fee_order_items
  FOR ALL USING (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()));
