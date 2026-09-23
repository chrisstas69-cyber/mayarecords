# Session handoff (2026-09-23)

Repo `~/Projects/joeski-platform` → GitHub `chrisstas69-cyber/mayarecords` (`main` auto-deploys to Vercel:
https://joeski-platform.vercel.app). Read `WORKLOG.md`, `SETUP-TOMORROW.md`, `~/.claude/CLAUDE.md`.

## Where things stand
- Site runs on the bundled catalog (`src/lib/data/*.generated.ts`) until Supabase is connected.
- Chris is doing Supabase + Stripe next, following `SETUP-TOMORROW.md`. **Keys go in `.env.local`, never in chat.**
  When he says "keys are in .env.local", push them to Vercel (production + preview) with
  `vercel env add <NAME> production < <(value)`, without echoing them. Then run `python3 scripts/sync-to-supabase.py`.
- Dev server: `npx next dev -p 3100` (port 3000 belongs to another app).

## Rules from Chris
- Catalog numbers are `MAYA###`, never `MYA`.
- Edits: the $10/mo members-only vault. He knows the copyright risk and chose to ship.
- Releases: full-track download after purchase. Previews are the listening clip.
- `/press` = promoter-only EPK that collects promoter data.
- Ask before pushing (he OK'd pushing tonight's work).

## Open items
- Members who switch devices lose access (cookie). Build an emailed "restore access" link.
- Booking/demo emails unconfirmed (`BOOKING` in seed.ts).
- Masters exist for only 20 releases. The rest need WAVs from Joeski's drives.
- Live section (DJ Sneak-style streaming): idea only, not started.
- Discogs token was pasted in chat on 2026-09-22. Remind Chris to revoke it.
