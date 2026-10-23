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
