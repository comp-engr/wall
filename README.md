# wall

A 2008-style Facebook Wall: anyone can write a short public message, and new posts appear live for every visitor.

**Stack:** Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · shadcn/ui · Supabase (Postgres + Realtime)

## How it works

- `supabase/schema.sql` creates the `posts` table. Row Level Security allows anyone to read and insert posts, but not to edit or delete them. Database constraints enforce the 50-character name, the 280-character body, and non-empty posts.
- `components/Wall.tsx` subscribes to realtime `INSERT` events, then loads the latest 50 posts. Posts are merged by `id`, so a post that arrives from both the insert response and realtime is shown once.
- `components/PostComposer.tsx` handles the name (remembered in `localStorage`, blank means "Anonymous"), the 280-character counter, and insert errors. Your text is kept if the insert fails.
- Relative times ("now", "2m", "3h", "2d") refresh every 30 seconds.
- All user text is rendered as React text nodes. There is no `dangerouslySetInnerHTML`.

## Run locally

1. Run `supabase/schema.sql` in the Supabase SQL Editor.
2. `cp .env.example .env.local` and fill in your Project URL and publishable/anon key (never the service_role key).
3. `npm install`, then `npm run dev`.

Replace `public/profile.jpg` with your photo, and edit the profile details at the top of `components/ProfileSidebar.tsx`.
