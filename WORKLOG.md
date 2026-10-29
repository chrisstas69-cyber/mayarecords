# joeski-platform — worklog

Newest entry at the top. Whichever tool you're in, append here before you stop.
This is what survives when a chat gets compacted or you switch tools.

---


## 2026-10-25 — verified Hall of Fame recording and Carl Cox radio coverage

- Branch `codex/press-radio-recordings`: user supplied SoundCloud Hall of Fame and Carl Cox Global572 links for Press. Agent Reach/Jina + public publisher API verify metadata; short SoundCloud link resolved in browser to exact recording on verified djjoeski profile.
- Update existing BBC Hall of Fame entry to actual canonical SoundCloud listening destination (retain broadcast date Apr25,2014 and previous MixesDB corroboration in source audit). Do not duplicate. Add one Radio record for Carl Cox Global572 featuring Global Lowdown: Maya Records,NYC. Use verified Mixcloud publication date Mar10,2014; do not call it the broadcast date or a Joeski guest mix (guest is Joseph Capriati).
- Dynamic Listen action on SoundCloud/Mixcloud destinations, including featured BBC shortcut. New Radio filter and35 total records derived from JSON; exact Maya focus shortlist grows to9 with the verified label spotlight. Original seven-field schema maintained, no playback downloads/autoplay/SDK/hosting changes. Source provenance in data/joeski-press-radio-sources.json. Gated Press Kit/layout unchanged. Build/TypeScript/coverage15/homepage6/remix6/catalog8 pass. Local Radio1/35 and Radio+Maya1/35, exact platform hrefs, one BBC record (Hall of Fame search also correctly matches Mixmag summary),390px reachable Listen/no overflow, zero errors. Preview/live deployment verification tracked in shared record.

## 2026-10-25 — selected Figma editorial press layout

- Branch `codex/editorial-press-layout`: use user-supplied current Figma Make ZIP after official resource reads failed. Inspect only source/assets; do not execute its scripts or import its AGENTS instructions. Target is published /coverage with large Mixmag feature, two stacked highlights and thumbnail-first horizontal archive rows. No comparison/mockup screens imported.
- Exact exported WebP cover imported with hash provenance. Reuse existing homepage Cormorant/DM Sans fonts and real shared header/footer/cart/player; no fake badge/hash navigation or prototype-only dates/sort bugs. Preserve source34 records/33 Live links and offline iDJ behavior. Add data-derived year filter (including Undated) to existing search/type/Maya/sort/reset controls.
- Highlights are shortcuts from the actual Live dataset (not duplicate archive records) and degrade safely if source records disappear. Desktop landscape thumbnails precede text; on phone thumbnail stays beside headline with READ underneath. Preserve actual magazine cover proportions. Homepage section05 retains full PDF/download and gains Explore all press link; other homepage sections untouched.
- Production build/TypeScript/coverage14/homepage6/remix6/catalog8 pass. Local desktop1440: all three featured READ actions above900px,34 archive rows; exact cover loads. Phone390: no overflow, all READ targets>=44px/reachable,34 thumbnails precede text; Maya+2022 returns2, adding Interview+ElectronicGroove returns1/reset34; zero errors. No press dataset, gated page, shared header/footer or private EPK changes. Final preview/live verification tracked separately.

## 2026-10-24 — reconcile complete press handoff

- Existing PR8 (public archive) and PR9 (image cards) both merged; extend existing /coverage rather than duplicate. Keep all card design/tokens, actual Mixmag cover/branded fallbacks, existing header/footer and promoter-only /press byte-identical.
- Reconcile supplied Section4 data: replace the sole MyHouseRadio playlist with canonical Night Bazaar Sep8,2023 record (updated outlet/headline/summary/URL/date); all other source records unchanged,34 total. Counts remain data-derived (28 outlets after consolidating the Night Bazaar outlet).
- Add Maya Records focus checkbox using an external exact-URL shortlist of all eight explicit Section5 links (six Maya picks plus two broader craft/career pieces); no fields added to records and no inferred album duplicates. Filter composes with search/type/year sorting and clear/reset.
- READ now only for exact Live/nonempty URL; offline iDJ entry retained with Original page offline note and no link. Coverage12 regressions/build/TypeScript/homepage6/remix6 pass. Local browser:34 cards/33 links, Maya8→Interview6→Electronic Groove1, reset, ascending years/within-year descending dates, offline search1/no link,390px reachable READ/no overflow/zero errors. Gated page/private assets/nav/footer git diff unchanged. Acceptance and deployment verification tracked in shared record after checks.

## 2026-10-24 — press image cards

- Branch `codex/press-image-cards`: Chris requested starting the image-card redesign now despite low remaining usage. Responsive 1/2/3-column cards retain all34 records, year groups, search/type/sorts/exact READ links and status/date precision. Promoter `/press` unchanged.
- Use approved actual Mixmag Issue80 cover. Remaining entries get explicitly branded outlet/type/date artwork, not unrelated photos or fabricated interview screenshots. Optional URL-keyed local artwork manifest keeps original source JSON unchanged; future actual article images require correct-story/rights verification. Failed image loads fall back gracefully. No scraping, dependencies, backend or service changes.
- Local production build/TypeScript and coverage10/homepage6/mixes6 + Python8 tests pass. Local browser:34 cards, actual Mixmag cover loads, search3/type intersection1/reset34;390px all READ targets>=44px/reachable and no horizontal overflow; zero console errors. PR preview/production results tracked in shared project record after deployment.

## 2026-10-24 — public press archive

- Branch `codex/public-press-archive`. Add static `/coverage`, matching existing Remixes page tokens, typography, controls and container; main nav gets separate Press and unchanged Press Kit destinations. Do not edit `/press`, promoter APIs/private EPK assets, shared footer or existing homepage design.
- Supplied JSON actually has34 records (not prompt's28), an undated living profile and an additional offline status. Copy source bytes unchanged into data/joeski-press.json; no research assertions or guessed replacement URLs. Group undated items separately after dated years; show original status for non-live sources. Counts/types/year range derived only from JSON; partial dates retain their precision. Oldest sort changes year-group order, never reverses within-year newest-first order.
- Implemented static JSON boundary validation, accent-insensitive multiword search, data-derived type filter/stats/year range, grouped date sorting, live result count, reset/empty state and exact safe new-tab READ links.9 tests cover growing/replacement data, all record/URL preservation, empty URLs, partial/invalid/undated dates, both sorts and safe rendering. 34 pieces,29 outlets,dated2001–2024. No claim of independent article verification; supplied offline status is visible.
- Production build and TypeScript pass; /coverage statically prerenders (3.09kB). Homepage6/remix6/catalog8/mix6 + Python8 and commerce9/fulfillment24/PostgreSQL63 pass. Local desktop1280:34 rows/34 exact READ links, Electronic Groove search3→Interview intersection1→empty0/reset34, ascending year groups with within-year descending dates and Undated last. Mobile390: all READ targets>=44px/reachable, no overflow, distinct Press/Press Kit menu URLs, unchanged gated /press shows Get access, navigation back works, zero browser errors. Supplied JSON copied byte-for-byte, promoter page/private EPK/shared footer unchanged. No backend, dependencies, env vars, fonts/colors or services added. PR/preview and final production verification recorded separately after deploy.

## 2026-10-24 — selected Figma artist homepage

- Branch `codex/artist-homepage`. Chris selected the finished Direction A in the existing Figma Make file. Official context enumerated source/resources; downloaded exact code/assets via Figma Files → Download code after resource reads failed. Export preserved outside Git; no Make scripts executed. Using the three exact local WebP portraits in their intended hero/mix/story slots.
- Replace only `/` with the artist-first landing page and clickable six-destination index. Keep `/releases`, 257 releases, 114 remixes, 108 mixes, persistent cart/player and gated member/EPK flows. Wire real latest content and existing validated promotion configuration instead of prototype placeholders.
- Chris explicitly approved publishing the supplied full Mixmag PDF; public press feature is separate from the promoter-only `/press` EPK. Preserve original PDF bytes and photographer credits. No backend/payment activation or new services.
- Implemented the exact seated portrait hero, original Cormorant Garamond/DM Sans typography, subtle CSS push-in/static reduced-motion alternative, six numbered working destinations, real latest released records, public edit names with member links, latest verified SoundCloud mix, warm artist portrait, full Mixmag feature/read/download and Remixes CTA. Homepage-specific header/footer retain existing site cart/menu/player; interior pages keep their current chrome. Promo uses existing validated release/presale/merch/campaign settings, including mobile; no invented forthcoming item or checkout.
- Verification: production build/TypeScript and six new homepage render/data/asset tests pass; existing catalog8, remix6, mix6 + Python8, commerce9/fulfillment24/PostgreSQL63 checks pass. Exact three portrait hashes and approved PDF provenance recorded in data/homepage-assets.json. PDF HTTP200/application/pdf matches original SHA256 byte-for-byte. Local 1280 desktop,390/320 mobile: no horizontal overflow, all six destinations confirmed after navigation, press anchor aligns below header, real SoundCloud widget opens and persists home→catalog→home, menu closes on navigation, all photos load in intended slots and zero console errors. Production deploy pending PR/preview verification.

## 2026-10-23 — real DJ mix library / SoundCloud playback

- Branch `codex/dj-mixes-library`. Chris chose SoundCloud playback. Completed authorized WeTransfer download/extraction: 452 ZIP entries, 19,793,370,973 validated bytes, 113 audio files with 113 paired covers, zero inspection errors. All full audio stays in `~/Downloads/Joeski DJ Mixes 2026-10-23`, outside Git; no new storage, account, paid resource, env var, database or Stripe activation.
- Published dataset has 108 distinct recordings/artworks, 2012–2026, over 135 hours. Five byte-identical duplicates represented once, aliases and SHA-256 proof in `data/joeski-mixes-import.json`. Removed the original three illustrative seed sets. Source filenames/metadata and reviewed ID3 corrections are preserved separately; no invented recording dates.
- 75 exact public SoundCloud links verified against original Joeski/publisher pages and official oEmbed. 33 missing/private/unverified sources remain explicitly “SoundCloud link pending”; do not imply all recordings can stream. Link-research handoff saved in chat outputs/dj-mixes-links-needed.md. Do not guess slugs, substitute other episodes, or use the deleted Flow Podcast URL.
- Responsive `/mixes`: supplied artwork, full titles, honest recorded/published/archive date labels, measured runtimes, search, year and length filters, four sorts, paginated grid and derived counts. Latest verified stream in spotlight. Full-length official SoundCloud widget loads only after Listen, persists across site navigation, external source fallback and close. SoundCloud/native Maya previews are mutually exclusive; no fake “playing” status. Long mobile titles and 390px controls fit without horizontal overflow.
- Repeatable safe importer/publisher, exact source manifest and audited verified-link input in `data/`; full audio never copied into public or Git. Supabase guards/fallback unchanged; before future backend activation import the complete archive before publishing the first database mix. Notes in `data/README.md`.
- Verification: six JS mix tests plus four importer/four publisher tests pass, including incomplete-publication refusal, duplicates, unsafe/unknown links, date semantics, filters/sorts/pages and configured/unconfigured/empty/error backend. Existing eight catalog, six remix and commerce/fulfillment/PostgreSQL tests pass. TypeScript passes. Local browser verified actual official-widget Play→Pause, route persistence, native/SC exclusivity, search/empty reset/pagination and phone layout. Production build passes (`/mixes` route3.94kB). Optimized local browser also traversed all9 pages:108 unique cards; empty-state reset and final phone check pass with zero console errors. PR #6 https://github.com/chrisstas69-cyber/mayarecords/pull/6; feature989f5ce preview dpl_58cQa1dW5vVTLBdN6JHJdoJXEMhf READY, authenticated HTML verifies all108 artwork references and75 exact source URLs without changing protection. Final docs-only preview and production merge/live results are recorded in the shared project record after verification.

## 2026-10-23 — supplied DJ mixes and artwork (in progress)

- Branch `codex/dj-mixes-library`. Chris supplied a WeTransfer “DJ Mixes & Art” archive, 17.7 GB. Explicit approval received to accept WeTransfer’s Terms for this download. Chrome download is running in ~/Downloads; full recordings remain local/outside Git.
- Inspect the supplied files, import real titles/dates/durations/artwork, and replace the current placeholder Mixes section with the actual archive. Playback choice pending: existing SoundCloud streams versus separately hosted full recordings. Do not provision paid storage or publish a nonfunctional audio catalog as complete.
- Files likely touched: Mixes page/browser, catalog data fallback, media/import scripts and tests; preserve the current releases, Remixes, shop/cart and catalog homepage.
- Safe streaming extraction validates arriving ZIP members and ignores Mac metadata; no scripts from the archive are run. Importer `scripts/import-dj-mixes.py` reads actual ffprobe durations/tagged titles, preserves filename dates as archive dates (not a claimed recording date), pairs artwork and rejects incomplete publication. Four importer regression tests pass. Current inspected subset: 14 mixes, 14 covers; the complete archive is still downloading. No website changes or deployment yet.

## 2026-10-23 — promotion player artwork follow-up

- Guard custom public HTTPS promo artwork in the persistent player as well as the spotlight. Loading a preview must not crash when an admin chooses artwork outside the Next image-optimization allowlist; no remote-host allowlist is widened. Local browser verified both external artwork images loaded while playing, with zero console errors; restored bundled default after the test.

## 2026-10-23 — Figma catalog-first front page

- Branch `codex/catalog-frontpage`: adapting the Figma Make catalog layout to the real 257-release catalog on home and /releases. Flexible top-right campaign slot, dense discovery cards and grid/table browser.
- Shared homepage/releases layout, real six-card discovery row, paginated full catalog table/grid, accent-insensitive multiword/track search, genre/artist/availability filters, removable chips and browser-local saved hearts. Real MP3/WAV prices, individual-track links, TBC retained for X. No fake vinyl availability, counts, dates or metadata from the prototype.
- Top-right promotion supports a real published release, explicit presale destination, merch or another campaign; blank release selection picks nearest upcoming published release then latest. Safe public URLs and validated copy; automatic fallback in `data/site-promotion.json`. Decorative playback bars reflect actual progress; persistent player adds volume and guarded seek without rerendering every catalog play button on time updates.
- Added Label Portal → Settings → Featured Promotion plus migration `20261023200826_catalog_promotions.sql`. Existing backend remains unconfigured; no remote migration, account, credentials or payments activated. Manual admin controls require Supabase activation and migration. A promo does not create preorder checkout/fulfillment. Details in SETUP-TOMORROW.md.
- Local verification: eight catalog/promotion/auth/fallback tests, six remix tests, nine commerce/cart cases, 24 fulfillment contracts and 63 actual-migration PostgreSQL assertions pass. TypeScript and production build pass. Browser: real 257 rows with All, X/TBC artist filter, search/page reset, empty-state recovery, grid/list, persisted favorites, full-EP cart price, individual track links, preview playback/seek/volume/pause/close and player persistence through Remixes navigation. 390px phone and 1024px tablet have no horizontal overflow; card controls fit and remain accessible. Temporary merch/presale config rendered with correct destinations and no unrelated audio, restored default before build. Zero console errors in local checks. PR #4 merged to main (28e2749); preview dpl_H7iyq4mQDRLxx8hRrE9WQssZ8koN and production dpl_82zD8qnF2jVTcp7rcUvS1C7FcSBD READY. Protected preview HTML verified through authenticated CLI; no protection settings changed. Final browser checks below.


## 2026-10-23 — Joeski remix catalog

- Branch `codex/joeski-remixes`: separate static `/remixes` catalog with all 114 supplied remix entries, 81 labels and 2001–2026 range; source JSON preserved byte-for-byte. Search across artist/title/mix/label/release, label filter, four sorts, live count and reset/empty state.
- All 114 covers sourced from exact store/retailer pages and shipped locally (2.3 MB total). Reusable importer and reviewed provenance manifests under `scripts/enrich-remix-artwork.py` and `data/`; no catalog APIs or external-image dependency at runtime. Confirmed row 106's missing title as Sundowna through Boomkat; correction is separate from the unchanged original archive.
- Preserved all supplied purchase URLs: 114 Traxsource buttons, 102 Beatport buttons; 12 Traxsource-only entries, no guessed Beatport links. External-label remixes stay out of the Maya cart and members vault.
- Added Remixes navigation, homepage CTA, footer link and Maya/Remixes catalog tabs; moved full navigation to xl to avoid tablet overflow and made the mobile menu scrollable. Added sitemap/metadata/canonical. Metadata/sitemap now default to the live domain rather than localhost when the existing site-URL variable is absent.
- Verified: all six remix regression tests, existing commerce tests (nine cart/checkout, 24 fulfillment and 57 PostgreSQL checks), TypeScript and production build pass. `/remixes` prerenders statically, 3.65 kB route JS. Browser: 114 cards/covers, exact link counts, accent-insensitive search, label intersection, oldest sort, empty-state recovery, 390px phone layout with both buttons reachable/no horizontal overflow, navigation away/back and no console errors. No dependencies, environment variables, database migrations or paid services added. GitHub/Vercel verification follows below when complete.


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

## 2026-10-29 — Joeski YouTube channel
- Added the exact owner-supplied https://www.youtube.com/@joeskiflores/featured link beside existing platforms in the interior footer and Contact/Elsewhere list.
- Separate branch codex/joeski-youtube-social from main; no changes to pending label/showcase PRs13/14, catalog, gated Press Kit, cart or player.
- Build/typecheck pass. Desktop/mobile isolated Chrome checks both links, exact href, new-tab safety, no horizontal overflow and navigation away/back without page exceptions. Homepage/coverage regression tests pass.
