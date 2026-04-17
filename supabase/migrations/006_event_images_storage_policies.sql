-- Storage policies for event-images bucket
create policy "Public read event-images"
  on storage.objects for select
  using (bucket_id = 'event-images');

create policy "Authenticated upload event-images"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'event-images');

create policy "Authenticated delete event-images"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'event-images');
