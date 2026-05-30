-- 034_ticket_coupons.sql
-- Extend show_coupon_codes for ticket discounts (fees columns are untouched)
ALTER TABLE show_coupon_codes
  ADD COLUMN IF NOT EXISTS discount_type TEXT CHECK (discount_type IN ('percent', 'amount')),
  ADD COLUMN IF NOT EXISTS discount_value DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS max_uses INTEGER,           -- NULL = unlimited
  ADD COLUMN IF NOT EXISTS use_count INTEGER NOT NULL DEFAULT 0;

-- Add coupon tracking to ticket_orders
ALTER TABLE ticket_orders
  ADD COLUMN IF NOT EXISTS coupon_code_id UUID REFERENCES show_coupon_codes(id),
  ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0;

-- Helper function for atomic use_count increment (used by checkout API)
CREATE OR REPLACE FUNCTION increment_coupon_use_count(coupon_id UUID)
RETURNS void LANGUAGE sql AS $$
  UPDATE show_coupon_codes SET use_count = use_count + 1 WHERE id = coupon_id;
$$;
