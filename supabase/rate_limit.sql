-- Run after schema.sql and hardening.sql.
-- Per-visitor rate limit on new posts: at most 5 per minute and 30 per hour.
--
-- The visitor is identified by the IP that Supabase's edge reports in the
-- request headers (cf-connecting-ip, as in the Supabase docs). Only an md5
-- hash is stored, in a schema the Data API does not expose. The log gets one
-- row per successful post and only the last hour is ever read.

create schema if not exists private;

create table if not exists private.post_rate_log (
  ip_hash text not null,
  created_at timestamptz not null default now()
);

create index if not exists post_rate_log_ip_hash_created_at_idx
  on private.post_rate_log (ip_hash, created_at desc);

create or replace function private.enforce_post_rate_limit()
returns trigger
language plpgsql
security definer          -- needs to write private.post_rate_log, which anon cannot touch
set search_path = ''
as $$
declare
  headers   json := nullif(current_setting('request.headers', true), '')::json;
  client_ip text;
  ip_key    text;
  last_min  int;
  last_hour int;
begin
  -- No request headers = not a Data API request (SQL editor, dashboard): no limit.
  if headers is null then
    return new;
  end if;

  client_ip := coalesce(
    headers->>'cf-connecting-ip',
    nullif(trim(split_part(headers->>'x-forwarded-for', ',', 1)), ''),
    'unknown'
  );
  ip_key := md5(client_ip);

  select count(*) filter (where created_at > now() - interval '1 minute'),
         count(*)
    into last_min, last_hour
    from private.post_rate_log
   where ip_hash = ip_key
     and created_at > now() - interval '1 hour';

  if last_min >= 5 or last_hour >= 30 then
    raise exception 'You''re posting too fast. Please wait a minute and try again.'
      using errcode = 'P0001', hint = 'rate_limited';
  end if;

  insert into private.post_rate_log (ip_hash) values (ip_key);
  return new;
end;
$$;

-- Triggers fire without EXECUTE privilege; nobody needs to call this directly.
revoke all on function private.enforce_post_rate_limit() from public, anon, authenticated;

create trigger posts_rate_limit
  before insert on public.posts
  for each row execute function private.enforce_post_rate_limit();
