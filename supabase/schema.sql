create table public.posts (
  id uuid primary key default gen_random_uuid(),
  author_name text not null default 'Anonymous' check (char_length(author_name) between 1 and 50),
  body text not null default '' check (char_length(body) <= 280),
  photo_url text,
  created_at timestamptz not null default now(),
  constraint post_not_empty check (char_length(trim(body)) > 0 or photo_url is not null)
);

create index posts_created_at_idx on public.posts (created_at desc);

alter table public.posts enable row level security;

create policy "Anyone can read posts"
  on public.posts for select to anon, authenticated using (true);

create policy "Anyone can create posts"
  on public.posts for insert to anon, authenticated with check (true);

alter publication supabase_realtime add table public.posts;
