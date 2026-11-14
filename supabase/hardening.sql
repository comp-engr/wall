-- Run after schema.sql.
-- Visitors may only write author_name and body. id, created_at and photo_url
-- always come from column defaults, so nobody can backdate/future-date a post
-- (pinning it to the top of the wall) or attach an arbitrary image URL.
revoke insert on public.posts from anon, authenticated;
grant insert (author_name, body) on public.posts to anon, authenticated;
