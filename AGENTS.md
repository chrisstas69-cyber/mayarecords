# Joeski / Maya Records platform

> Shared context for every AI tool. `CLAUDE.md` and `.cursorrules` are symlinks
> to this file — edit this one and Claude Code, Cursor and Codex all see the change.

Joeski's artist site + Maya Records label store: 255-release catalog with previews and
MP3/WAV sales, a $10/mo members vault of Joeski edits, a promoter-only press kit, and the
`/admin` Label Portal. Owned by **Joeski**; built together with **Chris (Stas)**.

| | |
|---|---|
| Repo | github.com/chrisstas69-cyber/mayarecords |
| Live | https://joeski-platform.vercel.app (every push to `main` deploys) |
| Stack | Next.js 15 (App Router) · TypeScript · Tailwind v4 · Supabase · Stripe |

## Read first
- `WORKLOG.md` — what was done, newest first. **Add an entry before you stop.**
- `SETUP-TOMORROW.md` — Supabase + Stripe setup, step by step.
- `HANDOFF.md` — original project overview and admin manual.
- `.claude/skills/label-catalog-import/` — how the catalog was imported (reusable for other labels).

## How to run it
```bash
npm install
npx next dev -p 3100     # port 3000 may be taken on Chris's Mac
```
Without `.env.local` the site runs on the bundled catalog in `src/lib/data/*.generated.ts`.
Secrets live only in `.env.local` (never committed, never pasted into chat) and in Vercel.

## Two people, one repo — the rules
- **Never commit straight to `main`.** `main` is the live site.
  Start work with `git checkout main && git pull`, then `git checkout -b <your-name>/<thing>`.
- Push the branch and open a Pull Request. Vercel builds a preview URL for every PR —
  check it there, then merge. Merging to `main` deploys.
- Small PRs, one topic each. Pull `main` often. If two people must touch the same file,
  say so in WORKLOG first.
- Don't hand-edit `src/lib/data/*.generated.ts` — regenerate with the scripts in `scripts/`.

## Project rules
- Catalog numbers are `MAYA###` (never `MYA`).
- Every release is for sale (MP3 + WAV). Joeski edits are **not** sold — members-only.
- `/press` is promoter-only (collects promoter details). Bio/rider PDFs live in `private/epk`.
- Big media is not in git: `private-media/` (full edits) and `catalog/` (import scratch)
  stay local; production files go to Supabase Storage via `scripts/sync-to-supabase.py`.
- Follow `~/.claude/CLAUDE.md` standards if present (Supabase guards, lazy SDK init,
  deploy via git push only — never `vercel --prod`).
