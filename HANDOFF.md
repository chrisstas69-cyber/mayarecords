# HANDOFF — Joeski / Maya Records Platform

Everything you need to run, finish, and operate this project.
Written July 8, 2026. Companion to [README.md](README.md) (technical setup detail lives there).

---

## 1. What this is

Two tightly connected applications sharing one backend:

1. **Public site** — the Joeski / Maya Records brand site: home (live-show hero), releases catalog, release pages with audio player, DJ mixes, artists, store (merch + MP3/WAV downloads), about, press kit, contact.
2. **Label Portal** (`/admin` on the same site) — the internal system where releases, mixes, merch, and media get uploaded and managed. Phone-first design; installable as a home-screen app.

Tech: Next.js 15 · TypeScript · Tailwind CSS v4 · Supabase (database, login, file storage) · Stripe (payments).

## 2. Where everything lives

| Thing | Location |
|---|---|
| Code (source of truth) | `github.com/chrisstas69-cyber/mayarecords` |
| Live site | Vercel (auto-deploys every push to `main`) |
| Original working copy | Chris's Mac: `Desktop/joeski website/joeski-platform` |
| Database / auth / files | Supabase (project must be created — see §4) |
| Payments | Stripe (account must be connected — see §4) |
| Teaser videos | `marketing/teasers/` in this repo |
| Teaser generator skill | `.claude/skills/release-teaser/` (Claude Code picks it up automatically) |
| Database schema | `supabase/migrations/0001_init.sql` + `0002_commerce.sql` |
| Starter content | `supabase/seed.sql` (15 releases, 6 artists, 3 mixes, 6 merch items) |
| Brand assets | `public/images/` (logos, press pics, film shoot, live shots, placeholder covers) |
| Press PDFs | `public/press/` (bio + tech rider, served on the site) |

## 3. Current status

**Done and verified:**
- Full public site with real photography, real bio, blueprint-based positioning copy
- Complete admin: dashboard, 4-step phone release wizard (autosaving drafts, duplicate cat-# detection), desktop releases table with bulk actions, CSV bulk importer, mixes manager, merch manager, media library, drafts, settings
- Store with cart → Stripe Checkout → instant MP3/WAV delivery via expiring signed links (masters stay in a private bucket)
- Database schema with roles (admin/artist), row-level security, audit log, publish states (draft → scheduled → published → archived)
- Installable app manifest (Add to Home Screen → full-screen portal)
- `release-teaser` skill — validated on two releases
- Production build green; deployed to Vercel

**Not done (blocks go-live):**
- Supabase project not created → admin shows a setup screen until then
- Stripe key not set → checkout shows "not connected yet"
- Real content: actual cover art (current sleeves are generated placeholders), preview audio, master files for sale, mix recordings, product photos
- Real booking/demo emails (placeholders point at Armigé)
- Custom domain

## 4. Go-live checklist (in order)

1. **Supabase** (~15 min): create project at supabase.com → SQL Editor → run `0001_init.sql`, then `0002_commerce.sql`, then `seed.sql` → copy Project URL + anon key + service_role key from Settings → API.
2. **Vercel env vars**: add `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SITE_URL` (the live URL) → Redeploy.
3. **Admin account**: sign up at `/admin/login`, then in Supabase SQL Editor:
   `update public.profiles set role = 'admin' where email = 'the-email-used';`
4. **Install the app**: open `/admin` on the phone → Share → Add to Home Screen.
5. **Stripe** (when ready to sell): add `STRIPE_SECRET_KEY` to Vercel → redeploy.
6. **Domain**: Vercel → Settings → Domains → add it; update `NEXT_PUBLIC_SITE_URL`; set the same URL in Supabase → Authentication → URL Configuration.
7. **Content**: see §5.

## 5. Operating manual (the admin, section by section)

All at `/admin`. Bottom tabs on phone, sidebar on desktop.

- **Dashboard** — stats, recent releases, audit trail, and the two big buttons.
- **New Release** — the monthly workflow. 4 steps: (1) artist, title, cat #, date, genre, description → (2) cover art upload, video link, credits → (3) preview audio, tracklist with BPM/key, **price + master WAV/ZIP if selling on the site**, streaming links → (4) review → Publish. Autosaves a draft 1.5 s after you type a title; warns if the cat # already exists.
- **Releases** — the whole catalog. Filter by artist/year/status, bulk publish/archive, edit anything (this is where placeholder covers get swapped for real art).
- **Mixes** — upload the full MP3 recording and it streams on the site; or paste a SoundCloud link until the file is ready.
- **Merch** — products, prices, sizes (comma-separated), photos, show/hide toggle.
- **Bulk Upload** — the back catalog: export a spreadsheet as CSV (one row per release; any column names), drop it in, match columns, fix flagged rows, import. Everything lands as **drafts** — nothing auto-publishes.
- **Media Library** — any file; click a tile to copy its URL.
- **Drafts** — unfinished work and paused imports.
- **Settings** — homepage hero headline + hero image/video URL (an `.mp4` becomes a looping background video), booking/demo emails.

**Roles:** new signups have no power until promoted. `admin` = everything. `artist` = can create and edit their own artist's drafts, can't publish. Promote via the SQL in §4.3.

## 6. Monthly release + weekly teaser workflow

1. Add the release in **New Release** (phone is fine). Publish on release day, or save as draft until then.
2. In Claude Code, in this repo, say: *"make a teaser for MYA-1XX"* — the `release-teaser` skill generates the 15-second vertical video (animated cover, title overlay, link-in-bio end card) into `marketing/teasers/`.
3. **The teaser is silent by design** — layer a snippet of the actual track over it in any phone editor before posting.
4. Post to Reels/TikTok/Stories; point the bio link at `<site>/releases/<slug>`.
5. Teaser length is intentionally fixed at ~15 s for now. To lengthen later: `MOTION_SECONDS` in `.claude/skills/release-teaser/scripts/build_teaser.py` (and match the `duration` in the skill's generate-video step). Everything else recalculates.

## 7. Environment variables (complete list)

| Variable | Where to get it | Needed for |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API | everything admin/db |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | same | everything admin/db |
| `SUPABASE_SERVICE_ROLE_KEY` | same (keep secret) | order recording + download links |
| `STRIPE_SECRET_KEY` | Stripe dashboard → API keys | store checkout |
| `NEXT_PUBLIC_SITE_URL` | your live URL | SEO, sitemap, Stripe redirects |

Locally these go in `.env.local` (copy `.env.example`); in production they go in Vercel → Settings → Environment Variables. **Never commit them** — `.gitignore` already blocks `.env*`.

## 8. How the site behaves before/after content exists

The public site falls back to a built-in seed catalog (`src/lib/data/seed.ts`) whenever Supabase is missing **or empty**, so it never looks broken. As soon as published releases exist in the database, the database wins. The admin never uses seed data — it's real-backend only.

## 9. Known gaps / nice-to-haves (agreed but not built)

- **"Coming Soon" homepage block** driven by the `scheduled` release state (teaser hook on the site itself) — discussed, approved in spirit, not built yet.
- Real product photography for merch (currently logo placeholder cards).
- Move `marketing/teasers/` out of git (to Supabase Storage) once there are more than a handful of videos — git will get slow otherwise.
- Optional Stripe webhook for fulfillment redundancy (currently the success page fulfills orders; fine at this scale).
- EPK one-pager route for agents/promoters.

## 10. If something breaks

- **Admin shows the setup screen** → env vars missing/wrong in Vercel, or you didn't redeploy after adding them.
- **"You don't have permission"** in admin → the account's role isn't `admin` (§4.3).
- **Checkout button shows "not connected"** → `STRIPE_SECRET_KEY` missing.
- **Buyer can't download** → that release has no master file uploaded (release editor, step 3), or `SUPABASE_SERVICE_ROLE_KEY` is missing.
- **A cover renders blank** → if it's a placeholder SVG that was hand-edited: `&` must be written `&amp;` *after* any uppercasing, never `&AMP;`.
- Anything else: open this repo in Claude Code and describe the problem — the codebase, this doc, and the README carry the full context.
