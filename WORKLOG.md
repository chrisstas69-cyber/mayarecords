# joeski-platform — worklog

Newest entry at the top. Whichever tool you're in, append here before you stop.
This is what survives when a chat gets compacted or you switch tools.

---

## 2026-10-22 — supplied Maya release folder

- Branch: `codex/import-maya-release-folder`. Imported 350 AIFF tracks across 210 releases from `~/Downloads/joeski maya`; verified eight WAV copies have identical decoded audio and omitted duplicates.
- Added missing MAYA098, Tete de la Course — Before Sunrise (2 tracks): catalog now 257 releases. Per Chris’s follow-up, Ruben Zurita — X is included with catalog number TBC and stable slug `ruben-zurita-x`; Chris will confirm its MAYA number later.
- Generated 183 missing 60-second MP3 previews and seven missing embedded covers. Preserved existing previews, titles, tracklists and prices. Imported durations, BPM/key and missing genre/date metadata; fixed UTC release-date formatting after browser verification showed the new EP one day early.
- Reusable reviewed manifest: `catalog/imports/joeski-maya.json`; run `scripts/import-release-folder.py` after the Labelworx merge. Original recordings remain in Downloads; ignored `catalog/masters.json` retains their paths for private storage sync.
- Backend confirmed: `/admin/releases/new` manual wizard and `/admin/bulk` exist. Production has zero Vercel environment variables; live `/admin` displays Connect Supabase. No Maya Supabase project appears in the connected account. Backend activation remains pending; no accounts or paid resources created.
- Verified: initial production build passes; all local media references resolve; all 183 previews are 60 seconds; catalog numbers/track positions unique; importer re-run checked for idempotency. Local browser loaded new EP, displayed both tracks/BPM/key, and played its 60-second preview. Initial production build passes, including TypeScript. Rechecking after Chris requested X with a provisional catalog number; Vercel preview/production checks pending.


---

## 2026-09-23: full catalog, Labelworx audio, promoter EPK

- Catalog: 255 releases (Labelworx export = source of truth, Discogs fills gaps, archive has masters).
  Pipeline + gotchas: `.claude/skills/label-catalog-import/SKILL.md` (reusable for other labels).
- Covers: 122 real Labelworx covers (public CDN), rest from Discogs; 4 have none anywhere.
- Previews: Labelworx sample MP3s, linked straight from their public CDN (not stored in git).
- For sale: 20 releases with local WAV masters (placeholder prices). The Buy flow needs Supabase + Stripe.
- `/press` is now a promoter-only EPK: register → instant access; promoters saved (Supabase `promoters`).
  Admin: `/admin/audience` (promoters + fans + members, CSV export).
- `scripts/sync-to-supabase.py` loads everything into Supabase in one command.
- Old fake placeholder catalog removed (seed.sql, SVG sleeves).

**Next:** Chris follows `SETUP-TOMORROW.md` (Supabase → keys in .env.local → Stripe test mode).

---

## 2026-09-22 — Members (Joeski edits) + real Maya catalog

- `scripts/import-archive.py` builds local media from ~/Downloads archives (gitignored: public/media, private-media).
- Site catalog = 26 real releases MAYA156–253 (no buy buttons). Placeholder MYA-xxx releases removed.
- `/members`: $10/mo tier, weekly edit drops (Fridays), full-edit gated download API, demo access until Stripe,
  email capture (Supabase `fans` or private-media/fans.jsonl), vault sections (sample packs, drum kits, stems,
  live sets, early releases — coming soon), tiers 2/3 TBA. Migration 0003_members.sql.
- Not committed/pushed. Media is local only — must move to Supabase Storage before deploying.

**Next:** Supabase setup (HANDOFF.md §4) → Stripe price for STRIPE_MEMBERS_PRICE_ID → /admin/edits uploader.

---

## 2026-08-12 — consolidated into ~/Projects

Moved here from the old-Mac migration. `node_modules` was deliberately not copied
(Intel binaries). Run `npm install` before building.

**Next:** _fill in_
