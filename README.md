# wall

A 2008-style Facebook Wall: anyone can write a short public message or share a photo, and new posts appear live for every visitor.

**Author:** Engr. Marco
**Live:** https://wall-three-nu.vercel.app
**Stack:** Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · shadcn/ui · Supabase (Postgres + Realtime + Storage) · Vercel

![wall on desktop](docs/screenshots/desktop.png)

## Design

The look follows the classic 2008 Facebook profile page: a blue top bar, a narrow profile column on the left, and the wall on the right. Everything is plain and readable, with no extra decoration.

### Layout

```
┌──────────────────────────────────────────────────────────────┐
│ wall                                     (blue top bar)      │
├──────────────┬───────────────────────────────────────────────┤
│ ┌──────────┐ │ Your name                                     │
│ │  photo   │ │ [ name input ......................... ]      │
│ └──────────┘ │ ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐       │
│ Marco Burdeos│   What's on your mind?    (dashed, blue)       │
│ wall         │ └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘       │
│ ┌──────────┐ │ 280 characters remaining                      │
│ │Info      │ │ ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐       │
│ │Networks  │ │    Click to add photo (optional)              │
│ │City      │ │ └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘       │
│ └──────────┘ │                       Posted!  [ Share ]      │
│              │ ───────────────────────────────────────────── │
│   1/4 width  │ Author                                   2m   │
│              │ Message text                                  │
│              │ [ photo, max 480px ]                          │
│              │ ───────────────────────────────────────────── │
├──────────────┴───────────────────────────────────────────────┤
│  Built with React 19, Next.js 15, Supabase, Tailwind CSS, …  │
└──────────────────────────────────────────────────────────────┘
```

- **Desktop:** two columns, profile 1/4 and wall 3/4, centered with a max width of 1152px (`max-w-6xl`).
- **Phone:** the columns stack, profile first, then the composer and the feed. There's no horizontal scrolling at 375px.

<p align="center"><img src="docs/screenshots/mobile.png" alt="wall on a phone" width="300"></p>

### Colors

| Color | Used for |
|---|---|
| `#3b5998` Facebook blue | Top bar, Share button, author names |
| `#2d4373` dark blue | Share button hover |
| `#eceff5` light gray-blue | "Information" header |
| `#eef3fb` light blue | Message box background |
| `#bdc7d8` gray-blue | Dashed borders (message and photo boxes) |
| `#d8dfea` | Line between the composer and the feed |
| Gray 300 | Share button while disabled |
| Green 600 | "Posted!" confirmation |
| Red 600 | Counter under 20 characters, error messages |

### Typography

A 2008-era sans-serif stack: `"Lucida Grande", Tahoma, Verdana, Arial, sans-serif`. Names are bold, times and hints are small and gray, and post text is regular body size.

### Interaction states

| Element | States |
|---|---|
| Share button | Gray with a not-allowed cursor when there's nothing to post, blue when ready, blue with a spinner and "Sharing..." while sending |
| "Posted!" | Shows in green for 2 seconds after a successful post |
| Character counter | Gray, then red and bold under 20 characters remaining |
| Photo box | Highlights on hover or drag-over, then switches to a preview with a remove (✕) button |
| Feed | Skeleton placeholders while loading, an empty-state message, and "Try again" if loading fails |

### Accessibility

Every input has a label. Errors and "Posted!" are announced to screen readers, and the counter is announced only near the limit. Ctrl/⌘+Enter shares. The automated axe-core scan finds 0 violations on desktop and phone.

## How it works

- **Feed:** `components/Wall.tsx` subscribes to realtime `INSERT` events, then loads the latest 50 posts. Posts are merged by `id`, so a post that arrives from both the insert response and realtime is shown once. After a realtime reconnect, or when a background tab is shown again, it fetches the latest posts again so nothing posted in between is missed.
- **Composer:** `components/PostComposer.tsx` handles the name (remembered in `localStorage`, blank means "Anonymous"), the 280-character counter, Ctrl/⌘+Enter to share, and friendly error messages. Your text is kept if a post fails.
- **Photos:** `lib/photos.ts` checks the type (JPG, PNG, GIF) and size (5 MB) in the browser, uploads to the public `wall-photos` bucket under a random UUID name, and saves the public URL in `photo_url`. A post can be just a photo. Photos are shown with `next/image`, at most 480px wide.
- **Relative times** ("now", "2m", "3h", "2d") refresh every 30 seconds.
- **Escaping:** all user text is rendered as React text nodes. There is no `dangerouslySetInnerHTML`.

Components: `ProfileSidebar`, `PostComposer`, `PostFeed`, `PostItem`, plus `Wall`, which owns the shared post list.

## Security

| Layer | Protection |
|---|---|
| Row Level Security (`schema.sql`) | Anyone can read and insert posts. Nobody can update or delete them through the API. |
| Column grants (`hardening.sql`, `storage_hardening.sql`) | Visitors can only set `author_name`, `body`, and `photo_url`. `id` and `created_at` always come from defaults, so posts can't be pinned to the top with a future date. |
| Photo storage (`storage.sql`, `storage_hardening.sql`) | The bucket only accepts JPG, PNG, and GIF up to 5 MB. Upload names must be a UUID plus an image extension. `photo_url` must point into this project's `wall-photos` bucket, so posts can't embed outside images (for example, tracking pixels). |
| Constraints (`schema.sql`) | Name is 1–50 characters, body is at most 280, and a post can't be blank. Checked by Postgres, not just the UI. |
| Rate limit (`rate_limit.sql`) | 5 posts per minute and 30 per hour per visitor IP. Only an md5 hash of the IP is stored, in a `private` schema the API doesn't expose. |
| HTTP headers (`next.config.ts`) | Content-Security-Policy (connections only to this app and the Supabase project), `frame-ancestors 'none'` / `X-Frame-Options: DENY`, `nosniff`, Referrer-Policy, Permissions-Policy. |
| Keys | The browser only gets the publishable (anon) key. The service-role key is never used. |

## Run locally

1. In the Supabase SQL Editor, run in order: `supabase/schema.sql`, `hardening.sql`, `rate_limit.sql`, `storage.sql`, `storage_hardening.sql`. In `storage_hardening.sql`, change the project ref in the `photo_url` check to your own.
2. `cp .env.example .env.local` and fill in your Project URL and publishable/anon key.
3. `npm install`, then `npm run dev`.

Replace `public/profile.jpg` with your photo, and edit the profile details at the top of `components/ProfileSidebar.tsx`.

## Known limitations

- `npm audit` reports PostCSS inside `next@15.5.29` (the latest Next 15). It only processes this project's own CSS at build time. The fix requires Next 16.
- Photo uploads aren't rate limited the way posts are (Storage requests don't pass through the posts trigger). The bucket's 5 MB and type limits still apply. Unused uploads can be removed in the Supabase Storage browser.
- Anyone can post without signing in. The rate limit slows down spam but can't stop it entirely. Posts can be removed in the Supabase Table Editor.

---

Built by **Engr. Marco**.
