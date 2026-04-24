create table public.venues (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  address    text,
  city       text,
  state      text,
  zip        text,
  created_at timestamptz not null default now()
);

alter table public.shows
  add column if not exists venue_id uuid references public.venues(id) on delete set null;

-- RLS
alter table public.venues enable row level security;

create policy "Public can read venues"
  on public.venues for select using (true);

create policy "Authenticated can manage venues"
  on public.venues for all to authenticated using (true) using (true) with check (true);
