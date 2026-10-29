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

## Artist homepage

`src/app/(site)/page.tsx` renders the selected artist-first Figma landing page. The full catalog remains at `/releases`. Latest releases and the featured verified SoundCloud mix come from the existing guarded catalog functions; edit cards expose names only and link to `/members`. `data/site-promotion.json` and the existing Settings promotion control also drive the hero card (CMS still needs Supabase activation). Six numbered destinations are in `src/lib/homepage.ts`.

The three exported portraits stay in their hero/mix/story slots under `public/images/portraits/`. Asset hashes/provenance: `data/homepage-assets.json`. The full, explicitly approved Mixmag issue80 feature is public at `/press/joeski-mixmag-80-2024.pdf`; this does not change the promoter-only `/press` page or private EPK APIs. Test with `npm run test:homepage`.

## Public press archive

The public `/coverage` page imports `data/joeski-press.json` directly. To update coverage, replace only that JSON array and commit/deploy normally; counts, outlets, type choices and dated year range are derived at build time. No runtime fetching or backend setup. All seven record fields are strings (`date`, `outlet`, `headline`, `type`, `summary`, `url`, `status`). Article links must be absolute public HTTP(S) URLs, preserved exactly; an empty URL produces no READ button. New types/statuses require no code changes.

Dates retain supplied precision (year, month or full day). Non-date values such as `n/a (living profile)` stay unchanged under an Undated group at the end. Sort reverses year-group order only: items inside a year remain newest first. Non-Live source statuses are displayed, not silently treated as verified live pages. The supplied bibliography has not been independently re-researched by this feature. The separate promoter-only `/press`, EPK assets, header/footer styling, catalog and commerce remain unchanged. Run `npm run test:coverage` for data, link, date, sort and render checks.

### Press card artwork

`joeski-press-artwork.json` optionally maps an exact article URL to `src`, `alt`, and `source` (provenance/approval). Keep approved local card images in `public/press/`. The original seven-field press JSON stays unchanged. Unmapped articles (or failed images) display original typographic outlet artwork, not an invented article cover. Currently only the supplied, publication-approved Mixmag Issue80 cover is mapped. Add actual article images only after confirming the correct story and usable rights/permission. No runtime scraping or remote hotlinking.

### Joe’s Maya focus shortlist

`joeski-press-maya-focus.json` contains the eight exact URLs explicitly listed in Section5 of Chris’s2026-10-24 handoff: six Maya-focused picks plus the two broader craft/career pieces with Maya material. The album items remain in the full archive but are not inferred into this URL shortlist. The filter intersects search/type/sort, resets with Clear filters, and adds no fields to the seven-field source records. Only records with status exactly `Live` and a nonempty URL expose READ; offline originals remain visible with `Original page offline` and no link. The canonical Sep8,2023 Night Bazaar playlist replaces the old MyHouseRadio repost; do not add both.

### Editorial Press layout (2026-10-25)

Selected Figma Make export provenance is in `press-editorial-design.json`. Featured stories are three shortcuts to existing Live records, not extra archive records. Exact exported Mixmag WebP is used in feature/thumbnail slots. The original PNG and approved full PDF remain unchanged for existing homepage/download links. Data-derived year filtering includes Undated and intersects search/type/Maya/sort. Shared site navigation/footer/player/cart are not replaced by prototype mockups.

### Radio and broadcast recordings

Use the same seven-field press records for verified broadcast coverage. `Radio` is a data-derived type, not a separate page. Canonical SoundCloud/Mixcloud URLs display Listen instead of Read (safe new-tab link; no auto-playing embeds or media downloads). Enrich existing coverage rather than duplicating it when an actual recording is found. Preserve provenance and original corroborating links in `joeski-press-radio-sources.json`. Dates must state their basis: Global572 uses its Mixcloud publication date, not an assumed broadcast date. Maya focus now includes Joe’s eight original picks plus this verified Maya label spotlight.

## Micasa vinyl archive

`micasa-releases.json` is the static, informational catalog at `/labels/micasa`.
Data was retrieved from Discogs label 13754 and individual public release API
records on 2026-10-28; provenance and reconciliation decisions are in
`micasa-sources.json`. One entry per catalog number; promos/alternate pressings
are secondary links, not duplicate catalog cards. Preserve the exact primary
Discogs URL. Do not connect these historical records to Maya checkout or imply
digital audio exists. Future monthly releases require separate supplied data.

Restored artwork is supplied by Chris, optimized as local WebP derivatives in
`public/images/labels/micasa/`. Originals remain on his Desktop. The images
originally named MICASA009 show *El Ritual*, matching Discogs MICASA008; only
website derivative names were corrected. No MICASA009 record is invented.
015 and 016 intentionally have an honest missing-artwork state. The original
photographed side is not inferred from the folder's SideA/SideB naming; controls
say Printed label / Other side. The reconstructed emblem uses Chris's approved
outline; emerald is a selected web color, not an authenticated print standard.

Regression: `node --test scripts/test-micasa.cjs`.

## Big Chief archive and release-first previews

`big-chief-releases.json` powers `/labels/big-chief` through the same archive
component as Micasa. Source: Discogs label5300 and selected individual release
API records (2026-10-28). See `big-chief-sources.json` for decisions and exact
source URLs. One card per BC001–BC025; alternate pressings are secondary links.
The unrelated-looking, undated CB-1 listing is not in the supported BC-numbered
archive; excluded pending owner confirmation, not declared a Discogs error.
40 derivative WebPs come from Chris's restored folder; originals and three
alternate restorations are unchanged. No new photo/logo reconstruction performed.

`src/lib/release-showcase.ts` defines two explicitly illustrative campaigns from
existing historical entries: Big Chief BC007 and Micasa MICASA002. It does not
modify the historical records. `/new-releases` is a release-first preview hub,
with the real current Maya catalog selected through the existing guarded data
layer; `/showcase/[slug]` demonstrates full-release and per-track purchase layout.
All demo buttons are disabled; no audio/video, dates, stock or support quotes are
invented. Sample prices are illustrative, not offers. No cart IDs, checkout,
Supabase inserts or Stripe calls are attached. Demo routes and the current demo
hub are noindex and excluded from the sitemap. The two archive pages remain
independently usable and indexable. Replacing the mock campaign with real new
releases requires cleared assets, real dates/prices and backend activation.

The Joeski homepage primary action now opens `/new-releases`; its numbered Maya
Catalog destination still opens the original `/releases` archive. Label-family
links on the hub reach Maya, Micasa and Big Chief. No separate app or checkout.

Regression: `node --test scripts/test-label-showcase.cjs scripts/test-micasa.cjs`.
