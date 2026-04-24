alter table public.shows add column if not exists parent_show_id uuid references public.shows(id) on delete set null;
