# Joeski remix catalog

`joeski-remixes.json` is Chris's supplied 114-row archive (2026-10-23). Keep its
IDs, store URLs, mix variants and compilation/reissue entries unchanged. These
are external-label releases, not Maya products or members-only edits.

- `joeski-remixes-artwork.json`: website-local cover paths and per-row source
  page/image provenance. All 114 rows currently have covers. They ship in
  `public/images/remixes/`; no third-party image service or catalog API is needed
  at runtime.
- `joeski-remixes-artwork-sources.json`: manually reviewed alternative artwork
  sources for pages the reader could not resolve. Original Traxsource covers
  were inspected in a browser where necessary. Two mixes on the same release
  can share the same cover source. Alternative store sources do not change the
  supplied purchase links.
- `joeski-remixes-overrides.json`: sourced display corrections only. The missing
  title on row 106 is confirmed as **Sundowna** by Boomkat's explicit listing of
  “Sundowna (Joeski's Deep Down Mix).” Original source JSON remains intact.

## Updating

1. Update the source archive with reviewed rows; retain existing IDs.
2. Run `python3 scripts/enrich-remix-artwork.py` from the repository. It uses
   Agent Reach's Jina Reader upstream for public record-store pages, and reuses
   successful local artwork. Reader cache stays in `/tmp`, outside Git.
3. Review unresolved rows. Never use a recommendation/chart image in place of
   the release cover. Record independently checked image/page references in
   `joeski-remixes-artwork-sources.json`, then rerun. Do not solve/bypass store
   verification gates in the importer.
4. Run `npm run test:remixes`, `npm run typecheck`, `npm run build` and test
   search, labels, sorting and store links at `/remixes` on desktop and mobile.
5. Commit source, manifests and cover files together on a feature branch;
   preview through a GitHub PR before merging to `main` for Vercel production.

The six regression tests pin the initial archive's 114 rows / 102 Beatport
links / 81 labels. Update these expectations deliberately when the archive
genuinely expands. The site itself computes counts and year range from data.
No Supabase migration, environment variable, checkout change or new dependency
is required for this feature.

## DJ mix archive

`joeski-mixes.json` replaces the original three illustrative seed mixes with supplied recordings and artwork. Full audio and the ZIP stay outside Git. `joeski-mixes-sources.json` retains relative source filenames, SHA-256 hashes, measured duration, exact public SoundCloud title/URL/published date and match method. Reviewed ID3/filename corrections live in `joeski-mixes-overrides.json`. No upload-date inference is labeled a recording date. Exact duplicate audio files are retained locally but represented once on the site, with aliases recorded in `joeski-mixes-import.json`.

To rebuild after the safe extractor finishes:

```sh
python3 scripts/import-dj-mixes.py --source '/path/to/extracted-folder' --manifest /tmp/mixes-inventory.json
python3 scripts/publish-dj-mixes.py --source '/path/to/extracted-folder' --verified-tracks /path/to/verified-public-soundcloud-tracks.json
npm run test:mixes
```

The extractor must have written `IMPORT-COMPLETE.json`. The publisher refuses incomplete archives; do not bypass this to deploy. Verified track input is an array of `{title, url, date}` read from actual public track pages/listings (date is ISO publication time). Exact normalized titles match automatically; mismatches need a reviewed override pointing to one of those observed URLs. Never derive a SoundCloud slug from a filename. Duplicate stream assignments are rejected for review. Recheck embedded playback, and leave missing/unverifiable sources null: those cards clearly say “SoundCloud link pending”.

SoundCloud uses the official public widget, created only after Listen is clicked; one persistent widget survives site navigation. Selecting a Maya preview closes the widget and vice versa. The widget itself controls play/pause/seek; “Player open” is not an assertion that audio is playing. External SoundCloud links remain available for regional/embed restrictions. No credentials, new hosting service or paid storage are required.

The bundled archive is the fallback while Supabase is unconfigured. The existing admin/backend has **not** been activated. If enabling Supabase later, import this full catalog before adding the first published database mix: existing data-layer behavior switches to published database rows when any exist (it intentionally does not resurrect draft/archived rows from static data). Native hosted audio needs approved durable storage; never put private full-length masters into Git/public assets.
