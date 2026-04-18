alter table public.shows add column if not exists past_shows_visible boolean not null default false;
alter table public.shows add column if not exists youtube_video_id text;
