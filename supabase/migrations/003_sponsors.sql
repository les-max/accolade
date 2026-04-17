-- supabase/migrations/003_sponsors.sql

create table public.sponsors (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  logo_url    text not null,
  website_url text,
  active      boolean not null default true,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);

alter table public.sponsors enable row level security;

-- Anyone can read active sponsors (for the homepage ribbon)
create policy "Public can read sponsors"
  on public.sponsors for select
  using (true);

-- Only authenticated users (admins) can write
create policy "Authenticated users can insert sponsors"
  on public.sponsors for insert
  to authenticated
  with check (true);

create policy "Authenticated users can update sponsors"
  on public.sponsors for update
  to authenticated
  using (true);

create policy "Authenticated users can delete sponsors"
  on public.sponsors for delete
  to authenticated
  using (true);
