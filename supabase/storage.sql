insert into storage.buckets (id, name, public)
values ('wall-photos', 'wall-photos', true)
on conflict (id) do nothing;

create policy "Anyone can upload wall photos"
  on storage.objects for insert to anon, authenticated
  with check (bucket_id = 'wall-photos');

create policy "Anyone can view wall photos"
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'wall-photos');
