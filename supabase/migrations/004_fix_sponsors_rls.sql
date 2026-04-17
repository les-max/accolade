-- supabase/migrations/004_fix_sponsors_rls.sql
-- Fix: restrict public read to active sponsors only; admins see all

-- Drop the overly-permissive policy
drop policy if exists "Public can read sponsors" on public.sponsors;

-- Public (anon) can only read active sponsors
create policy "Anon can read active sponsors"
  on public.sponsors for select
  to anon
  using (active = true);

-- Authenticated users (admins) can read all sponsors
create policy "Authenticated can read all sponsors"
  on public.sponsors for select
  to authenticated
  using (true);
