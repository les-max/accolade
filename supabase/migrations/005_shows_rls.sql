-- RLS policies for shows and related tables

alter table public.shows enable row level security;
alter table public.audition_slots enable row level security;
alter table public.show_roles enable row level security;
alter table public.auditions enable row level security;
alter table public.families enable row level security;
alter table public.family_members enable row level security;
alter table public.admin_users enable row level security;

-- Shows: public read, authenticated write
create policy "Public can read shows" on public.shows for select using (true);
create policy "Authenticated can insert shows" on public.shows for insert to authenticated with check (true);
create policy "Authenticated can update shows" on public.shows for update to authenticated using (true);
create policy "Authenticated can delete shows" on public.shows for delete to authenticated using (true);

-- Audition slots: public read, authenticated write
create policy "Public can read slots" on public.audition_slots for select using (true);
create policy "Authenticated can insert slots" on public.audition_slots for insert to authenticated with check (true);
create policy "Authenticated can update slots" on public.audition_slots for update to authenticated using (true);
create policy "Authenticated can delete slots" on public.audition_slots for delete to authenticated using (true);

-- Show roles: public read, authenticated write
create policy "Public can read roles" on public.show_roles for select using (true);
create policy "Authenticated can insert roles" on public.show_roles for insert to authenticated with check (true);
create policy "Authenticated can update roles" on public.show_roles for update to authenticated using (true);
create policy "Authenticated can delete roles" on public.show_roles for delete to authenticated using (true);

-- Auditions: authenticated full access, public can insert (to register)
create policy "Public can register" on public.auditions for insert with check (true);
create policy "Authenticated can read auditions" on public.auditions for select to authenticated using (true);
create policy "Authenticated can update auditions" on public.auditions for update to authenticated using (true);
create policy "Authenticated can delete auditions" on public.auditions for delete to authenticated using (true);

-- Families: authenticated full access, anon can insert (to create account on registration)
create policy "Public can create family" on public.families for insert with check (true);
create policy "Family can read own record" on public.families for select using (auth.uid() is not null);
create policy "Authenticated can update families" on public.families for update to authenticated using (true);

-- Family members: same pattern
create policy "Public can create family member" on public.family_members for insert with check (true);
create policy "Authenticated can read family members" on public.family_members for select to authenticated using (true);
create policy "Authenticated can update family members" on public.family_members for update to authenticated using (true);
create policy "Authenticated can delete family members" on public.family_members for delete to authenticated using (true);

-- Admin users: authenticated read only
create policy "Authenticated can read admin users" on public.admin_users for select to authenticated using (true);
