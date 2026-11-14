-- Run after storage.sql.

-- 1. The bucket itself rejects anything that isn't a JPG/PNG/GIF up to 5 MB,
--    no matter what the browser sends.
update storage.buckets
   set file_size_limit = 5242880,
       allowed_mime_types = array['image/jpeg', 'image/png', 'image/gif']
 where id = 'wall-photos';

-- 2. Uploads to wall-photos must use the app's naming scheme: a UUID plus an
--    image extension, in the bucket root. (Restrictive = ANDed with the
--    permissive upload policy; other buckets are unaffected.)
create policy "Wall photo uploads use safe image names"
  on storage.objects as restrictive for insert to anon, authenticated
  with check (
    bucket_id <> 'wall-photos'
    or name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|jpeg|png|gif)$'
  );

-- 3. Visitors may now set photo_url (hardening.sql only allowed author_name
--    and body), but only to a file in this project's wall-photos bucket.
grant insert (photo_url) on public.posts to anon, authenticated;

alter table public.posts
  add constraint photo_url_in_wall_bucket check (
    photo_url is null
    or photo_url ~ '^https://fejcoosvmhtptotaacmc\.supabase\.co/storage/v1/object/public/wall-photos/[0-9a-f-]{36}\.(jpg|jpeg|png|gif)$'
  );
