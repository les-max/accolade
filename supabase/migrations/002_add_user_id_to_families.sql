-- Add user_id to families so each family account is linked to a Supabase Auth user
ALTER TABLE families ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE UNIQUE INDEX IF NOT EXISTS idx_families_user_id ON families(user_id);
