# joeski-platform — worklog

Newest entry at the top. Whichever tool you're in, append here before you stop.
This is what survives when a chat gets compacted or you switch tools.

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
