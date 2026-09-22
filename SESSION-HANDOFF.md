# Session handoff: Maya Records platform (2026-09-22)

Repo: `~/Projects/joeski-platform` (remote `chrisstas69-cyber/mayarecords`, `main`). Pushing to `main` auto-deploys to Vercel.
Read `HANDOFF.md` (project overview), `WORKLOG.md`, and `~/.claude/CLAUDE.md` first.
**Nothing from this session is committed or pushed.** Ask Chris before pushing.

Dev server: `npx next dev -p 3100`. Port 3000 is taken by another (Vite) app on this Mac.

## Chris's latest request (verbatim, token removed)
> add the last prompt to the new handoff add this last prompt cat# should say maya001 and so one not mya also i will set up supbase but i wanted to bring this up i want to use my discogs api token to grab all the maya releases cat. i just need to so this once for hte info for the website. i dont care about exposing the token i will revoke it once its done. i need the fastest easiest way to get the catalog into the website. here is what perplextiy is saying it gave me instructions but its being safe. here si the api for discgos [TOKEN — pasted in chat, Chris will revoke] this is the whole cat i need https://www.discogs.com/label/463-Maya can you put this all in a folder

## Previous request (the Members build)
> build it anyway ill deal with it later on. also when you build it include a section for sample packs, drum kits, stems, live sets and early release

Background: Joeski's edits (unlicensed DJ edits of major-label tracks) are behind the $10/mo membership. Chris was told about the copyright/DMCA risk and chose to ship anyway; he'll revisit it later. Wording: "Joeski's tools for DJs", with no per-track sales. **Releases have no buy button.**

## Built so far
- **Catalog numbers are `MAYA###`** (e.g. MAYA001, MAYA174). Never `MYA`. The UI copy and admin placeholders have been fixed.
- `scripts/import-archive.py`: local media from `~/Downloads/Maya Records Archive` and `~/Downloads/Joeski Edits`. It writes:
  - `public/media` + `private-media` (both gitignored)
  - `src/lib/data/archive.generated.ts` (26 releases, MAYA156–253)
  - `src/lib/data/edits.generated.ts` (11 edits, weekly Friday drops)
- `src/lib/data/seed.ts`: the site catalog is built from the archive releases. Placeholder releases are removed. `digital_price_cents: null`.
- **Members** (`/members`, "Members" in the nav):
  - `src/lib/members.ts`: access check via Stripe subscription cookie `jm_sub`, or demo cookie `jm_demo` while Stripe isn't configured.
  - `src/lib/actions/members.ts`:
    - Checkout uses `mode: subscription` with `STRIPE_MEMBERS_PRICE_ID`.
    - Email capture writes to the Supabase `fans` table, or `private-media/fans.jsonl` without Supabase.
    - Also has the demo on/off actions.
  - `src/app/api/members/confirm`: Stripe success page; sets the cookie.
  - `src/app/api/members/edits/[slug]`: gated WAV/MP3 stream/download. Returns 403 for non-members and 404 for edits that haven't dropped. Verified.
  - Page sections: this week's edit, edit vault (upcoming edits locked), toolkit (Weekly Edits live; Sample Packs, Drum Kits, Stems, Live Sets, Early Releases coming soon), tiers (Members $10 active, Producer/Inner Circle TBA), email capture.
  - `supabase/migrations/0003_members.sql`: tables `fans`, `edits`, `subscriptions`, plus a private `edits` bucket.
- **Discogs pull** (`scripts/discogs-fetch.py`, run once with `DISCOGS_TOKEN` env, never saved to disk). Output in `catalog/discogs/`:
  - `catalog.csv`: one row per release, catalog numbers normalized to MAYA###, with artist, title, year, formats, genres/styles, tracklist, cover, Discogs URL
  - `covers/`
  - `releases/*.json` raw (gitignored)
  - `label-releases.json`

## Next steps
1. **Get the Discogs catalog into the website (fastest path):**
   - Extend `scripts/import-archive.py` (or add a merge step) to read `catalog/discogs/catalog.csv`.
   - Merge it with the archive releases by catalog number. Archive audio/artwork wins where present; Discogs fills title, artist, year/date, genres and tracklist for everything else (MAYA001–MAYA25x).
   - Copy the Discogs covers to `public/media/covers/<cat>.jpg` when the archive has no artwork.
   - Regenerate `archive.generated.ts`. Set `release_date` from Discogs `released`/`year`; that also fixes the "Released: TBA" issue.
   - Add artists from Discogs to `SEED_ARTISTS` (or generate them).
   - Later, once Supabase exists: emit a SQL/CSV that `/admin/bulk` can import so the same data lands in the database.
2. Chris is setting up Supabase: create the project, run migrations 0001 → 0003 + seed, set Vercel env vars, set the admin role (see HANDOFF.md §4). After that, move the media into Supabase Storage (buckets `covers`, `audio`, private `edits`).
3. Stripe: create the $10/mo recurring price and set `STRIPE_MEMBERS_PRICE_ID` + `STRIPE_SECRET_KEY`.
4. `/admin/edits`: uploader for new weekly edits (cover, WAV, original artist, title, drop date).
5. Commit, then **ask before pushing**. The media is local-only until step 2.
6. Remind Chris to **revoke the Discogs token**.

## Loose ends
- The Eddie Kendricks edit cover says "Chnage Of Mind". Chris will replace it himself.
- MAYA166 and MAYA168 have no artwork (they use the Maya logo fallback). 7 releases have art but no audio.
- Tier 2/3 contents are undecided. Draft ideas: Producer (~$20–25) = sample packs, drum kits, monthly stems; Inner Circle (~$50, capped) = live sets/streams, early releases, demo feedback.
- The live-streaming section (like DJ Sneak's app) is a future idea. Don't start it unasked.
