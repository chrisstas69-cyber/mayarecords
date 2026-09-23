---
name: label-catalog-import
description: Import a record label's full back catalog (metadata, cover art, preview audio, sale masters) into this platform from Discogs, a Labelworx export, the Labelworx web portal and a local archive folder. Use when onboarding a new label (e.g. Harry Romero's imprint) or refreshing Maya Records' catalog.
---

# Label catalog import

The pipeline that built Maya Records' 255-release catalog. Each step is safe to re-run.

## Inputs (gather these first)
1. **Labelworx export**: in the Labelworx portal, open Release List → Export → Download. You get an `.xlsx` with every track: dates, ISRC, credits.
2. **Labelworx login**: the scraper opens its own Chrome profile and the user logs in once. Never type the credentials yourself.
3. **Discogs label ID** (optional, fills gaps for old releases): taken from `discogs.com/label/<ID>-<name>`, plus a personal token the user generates and revokes afterwards.
4. **Local archive** (optional): folders named `<CAT>/Artwork/*.jpg` and `<CAT>/WAV/*.wav`. These are the only source of **full masters** for sale. Labelworx exposes preview clips only.

## Steps (from the repo root)
| # | Command | What it does |
|---|---|---|
| 1 | `python3 scripts/import-archive.py` | Local archive → covers + 90s previews + edits (edit the `RELEASES`/`EDIT_LIST` tables in the script for a new label) |
| 2 | `DISCOGS_TOKEN=… python3 scripts/discogs-fetch.py` | Discogs label → `catalog/discogs/` (change `LABEL_ID`) |
| 3 | `python3 scripts/merge-catalog.py` | Discogs + archive → `src/lib/data/archive.generated.ts` |
| 4 | Pull Labelworx covers | Public CDN: `https://cdn.label-worx.com/media/covers/<ACCOUNT_ID>-<release_id>_1400.jpg`. Get `release_id` values from the Release List links; Maya's account ID is 19928. Fall back to `_1000`/`_600`. Many old drafts have no art. |
| 5 | `python3 scripts/labelworx-scrape-audio.py` | Walks every track page and records the sample MP3 URL (`catalog/labelworx-audio/manifest.json`), about 10 s/track. `ONLY=CAT1,CAT2` to test. |
| 6 | `python3 scripts/merge-labelworx.py path/to/export.xlsx` | Labelworx wins on metadata; previews from step 5; price set only where a local master exists (change `LABEL_NAME`) |
| 7 | `python3 scripts/sync-to-supabase.py [--masters]` | Everything → Supabase (needs `.env.local`) |

## Gotchas learned the hard way
- Labelworx pagination state is **server-side per session**. URL params don't reset it, so click the page links.
- The track "Update & Upload Files" links are `onclick="upd_trk(track_id, release_id)"`, **not** hrefs.
- jPlayer ignores play clicks until it has initialised. Wait for `load` and retry the click.
- Don't point Playwright at the user's everyday Chrome profile while Chrome is running (profile lock). Use a dedicated profile dir.
- Discogs dates use `YYYY-00-00` for unknown month/day.
- Normalize catalog numbers to `MAYA###` (the user's rule, never `MYA`). Adjust `normalize_cat()` for other labels' prefixes.
- Discogs artist strings like "Joeski Feat. X": split case-insensitively on feat/ft/&/+/and/vs, or every collab becomes its own artist page.
- Supabase Free caps files at 50 MB. WAV masters need Pro with a raised upload limit.
