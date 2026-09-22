# joeski-platform — worklog

Newest entry at the top. Whichever tool you're in, append here before you stop.
This is what survives when a chat gets compacted or you switch tools.

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
