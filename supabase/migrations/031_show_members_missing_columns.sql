-- These columns exist in the live database but were never formally migrated.
-- This migration documents and ensures their presence.

ALTER TABLE show_members
  ADD COLUMN IF NOT EXISTS person_name    TEXT,
  ADD COLUMN IF NOT EXISTS email         TEXT,
  ADD COLUMN IF NOT EXISTS family_member_id UUID REFERENCES family_members(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS show_part     TEXT;
