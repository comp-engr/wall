# wall

A 2008-style Facebook Wall: anyone can write a short public message, and new posts appear live for every visitor.

**Live:** https://wall-three-nu.vercel.app

**Stack:** Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · shadcn/ui · Supabase (Postgres + Realtime) · Vercel

## How it works

- **Feed:** `components/Wall.tsx` subscribes to realtime `INSERT` events, then loads the latest 50 posts. Posts are merged by `id`, so a post that arrives from both the insert response and realtime is shown once. After a realtime reconnect, or when a background tab is shown again, it fetches the latest posts again so nothing posted in between is missed.
- **Composer:** `components/PostComposer.tsx` handles the name (remembered in `localStorage`, blank means "Anonymous"), the 280-character counter, Ctrl/⌘+Enter to share, and friendly error messages. Your text is kept if a post fails.
- **Relative times** ("now", "2m", "3h", "2d") refresh every 30 seconds.
- **Escaping:** all user text is rendered as React text nodes. There is no `dangerouslySetInnerHTML`.

## Security

| Layer | Protection |
|---|---|
| Row Level Security (`schema.sql`) | Anyone can read and insert posts. Nobody can update or delete them through the API. |
| Column grants (`hardening.sql`) | Visitors can only set `author_name` and `body`. `id`, `created_at`, and `photo_url` always come from defaults, so posts can't be pinned to the top with a future date. |
| Constraints (`schema.sql`) | Name is 1–50 characters, body is at most 280, and a post can't be blank. Checked by Postgres, not just the UI. |
| Rate limit (`rate_limit.sql`) | 5 posts per minute and 30 per hour per visitor IP. Only an md5 hash of the IP is stored, in a `private` schema the API doesn't expose. |
| HTTP headers (`next.config.ts`) | Content-Security-Policy (connections only to this app and the Supabase project), `frame-ancestors 'none'` / `X-Frame-Options: DENY`, `nosniff`, Referrer-Policy, Permissions-Policy. |
| Keys | The browser only gets the publishable (anon) key. The service-role key is never used. |

## Run locally

1. In the Supabase SQL Editor, run `supabase/schema.sql`, then `supabase/hardening.sql`, then `supabase/rate_limit.sql`.
2. `cp .env.example .env.local` and fill in your Project URL and publishable/anon key.
3. `npm install`, then `npm run dev`.

Replace `public/profile.jpg` with your photo, and edit the profile details at the top of `components/ProfileSidebar.tsx`.

## Known limitations

- `npm audit` reports PostCSS inside `next@15.5.29` (the latest Next 15). It only processes this project's own CSS at build time. The fix requires Next 16.
- Anyone can post without signing in. The rate limit slows down spam but can't stop it entirely. Posts can be removed in the Supabase Table Editor.
