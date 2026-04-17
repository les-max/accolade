-- Run this in the Supabase SQL editor after creating the sponsor-logos bucket

-- Allow authenticated users to upload to sponsor-logos
create policy "Authenticated upload to sponsor-logos"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'sponsor-logos');

-- Allow public read from sponsor-logos
create policy "Public read sponsor-logos"
  on storage.objects for select
  using (bucket_id = 'sponsor-logos');

-- Allow authenticated delete from sponsor-logos
create policy "Authenticated delete from sponsor-logos"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'sponsor-logos');
