# Joeski / Maya Records Platform

Two tightly connected applications sharing one backend:

1. **Public site** — premium, image-first artist/label experience (Home, Releases, Release detail, Mixes, Artists, Store, About, Press, Contact) with a site-wide audio player and a cart.
2. **Label Portal** (`/admin`) — the internal release-management system: phone-first single-release wizard, desktop catalog table with bulk actions, CSV bulk importer, mixes & merch management, media library, drafts, settings.

Built with Next.js 15 (App Router) · TypeScript · Tailwind CSS v4 · Supabase (Postgres, Auth, Storage, RLS) · Stripe Checkout.

---

## Quick start (no Supabase needed)

```bash
npm install
npm run dev
```

Open http://localhost:3000. The public site renders from the built-in seed catalog (real Joeski/Maya history, placeholder sleeves). `/admin` shows a setup screen until Supabase is connected.

## Full setup (Supabase)

1. Create a project at [supabase.com](https://supabase.com).
2. In the SQL editor, run `supabase/migrations/0001_init.sql`, then `supabase/migrations/0002_commerce.sql` (store, mixes, orders, download tokens), then optionally `supabase/seed.sql` (starter catalog + mixes + merch).
3. `cp .env.example .env.local` and fill in:
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Project Settings → API)
   - `SUPABASE_SERVICE_ROLE_KEY` (server-only)
   - `NEXT_PUBLIC_SITE_URL` (deployed URL)
4. Restart `npm run dev`, open `/admin/login`, create your account.
5. Promote yourself to admin in the SQL editor:
   ```sql
   update public.profiles set role = 'admin' where email = 'you@example.com';
   ```

Once the `releases` table has published rows, the public site automatically serves the database instead of the seed catalog.

## Store & payments (Stripe)

1. Get keys at [dashboard.stripe.com/apikeys](https://dashboard.stripe.com/apikeys) and set `STRIPE_SECRET_KEY` in `.env.local`. Until then, the Checkout button shows a clear "not connected yet" message — everything else works.
2. **Merch** is managed at `/admin/merch` (name, price, sizes, image, visibility).
3. **Digital sales**: on any release's edit page (step 3, "Sell on the site"), set a price and upload the sale master (WAV/ZIP). Masters go to the **private** `masters` bucket — never public.
4. **Delivery**: after payment, the success page records the order and mints download tokens (7-day expiry, 5 downloads each). `/api/download/[token]` exchanges a token for a 10-minute signed URL. Requires `SUPABASE_SERVICE_ROLE_KEY`.
5. Prices are always re-validated server-side against the catalog — the client cart can't set its own prices.

## Mixes

Managed at `/admin/mixes`. Upload the full recording (public `mixes` bucket) and it streams in the site player at `/mixes`; without a hosted file, the external SoundCloud/Mixcloud link is shown instead.

## Install the portal as an app

The Label Portal is installable on phone and desktop (no separate app needed):

- **iPhone**: open `https://<your-domain>/admin` in Safari → Share → **Add to Home Screen**. It launches full-screen with the Maya icon.
- **Android**: open the same URL in Chrome → menu → **Add to Home screen** / **Install app**.
- **Desktop (Chrome/Edge)**: visit `/admin` → click the install icon in the address bar.

## Roles & permissions (RLS)

| Ability | anon | artist | admin |
|---|---|---|---|
| Read published releases/artists | ✓ | ✓ | ✓ |
| Read drafts | | ✓ | ✓ |
| Create releases / upload media | | ✓ (own artist) | ✓ |
| Edit drafts | | ✓ (own artist) | ✓ |
| Publish / archive / delete | | | ✓ |
| Manage artists, settings, roles | | | ✓ |

Artist accounts are linked to an artist via `profiles.artist_id` (set by an admin).

## Key flows

- **New release (phone-first)** — `/admin/releases/new`: 4 steps (Basic info → Cover & media → Audio & links → Review & publish), autosaves a draft 1.5s after you type, duplicate cat-# warning on blur, clear success state.
- **Bulk import (desktop)** — `/admin/bulk`: drop a CSV → map columns (auto-guessed) → validate (missing fields, bad dates, duplicate cat #s in-file and against the catalog) → fix rows inline → commit. Everything lands as **drafts**; nothing auto-publishes.
- **Hero media** — `/admin/settings`: paste a Media Library URL. `.mp4/.webm` becomes a looping background video; images get the slow-drift + parallax treatment.

## Project layout

```
supabase/              migrations + seed SQL
src/middleware.ts      session refresh + /admin guard
src/lib/
  types.ts             domain types (mirror of the schema)
  data/seed.ts         built-in catalog (fallback content)
  data/catalog.ts      public data layer (Supabase → seed fallback)
  actions/             server actions: releases, imports, settings
  supabase/            browser/server/service clients
  uploads.ts           client → storage upload + media_assets record
src/app/(site)/        public pages
src/app/admin/         portal pages
src/components/site/   hero, nav, player, catalog browser, cards
src/components/admin/  wizard, tables, importer, uploaders, ui kit
```

## Remaining TODOs (assets/credentials)

- Real cover art + preview audio per release (admin → Media Library / release editor) — placeholder SVG sleeves ship in `public/images/covers/`.
- Hero video of Joeski DJing (Settings → hero media URL). Two live crowd stills are already wired.
- Confirm booking/demo emails in `src/lib/data/seed.ts` (`BOOKING`) or admin Settings.
- Optional: point `NEXT_PUBLIC_SITE_URL` at the production domain before launch for correct SEO metadata/sitemap.
