---
name: release-teaser
description: Generates a 15-second vertical (1080x1920) AI-animated social teaser video for a new Joeski / Maya Records release, ready to post to Instagram Reels, TikTok, or Stories. Takes cover artwork plus artist name, release title, catalog number, and a tagline (e.g. "OUT FRIDAY"), and produces a silent branded MP4 — animated cover art with a warm glow, title overlay, and a "link in bio" end card — saved into marketing/teasers/. Use this skill whenever the user asks for a release teaser, promo video, hype video, hook video, announcement clip, or "something to post" for an upcoming or just-published record — even if they don't say "teaser" explicitly. Trigger on requests like "make a teaser for the new single," "I need the Instagram video for Friday's release," "create a promo clip for MYA-146," or "can you do the same video thing for the next record."
---

# Release Teaser Generator

Produces the same 15-second vertical teaser format every time — cover art
animates with a slow cinematic push-in and warm glow, title text fades in,
then a branded end card points viewers to the site. Built so it works
identically for any release: swap the cover art and the four text fields,
run the same recipe.

The pipeline has three stages. Stages 1 and 3 are deterministic and
**scripted** (`scripts/build_base_frame.py`, `scripts/build_teaser.py`) —
run them, don't reimplement them inline. Stage 2 needs an AI video
generation call, which only the agent can make (it's an MCP tool, not
something a plain script can do), so it's spelled out step by step below.

## Before you start

**Locate the video-generation tools.** They're MCP tools whose names are
prefixed with a server ID that can differ between accounts and machines
(e.g. `mcp__a9c6145b-...__generate_video` in one session, something else in
another). Don't assume the exact prefix from a past run. If the tools
`media_upload`, `media_confirm`, `generate_video`, and `job_display` aren't
already loaded, use `ToolSearch` with a query like `"generate_video"` or
`"higgsfield"` to find and load them first.

**Gather the four inputs from the user** (ask if any are missing — don't
guess a catalog number or invent a tagline):
- Cover artwork file (PNG/JPG/SVG — square works best; this repo's
  placeholder covers live at `public/images/covers/{slug}.svg`)
- Artist name (usually "Joeski," sometimes a collaborator or another
  label artist)
- Release title
- Catalog number (e.g. `MYA-146`)
- Tagline — defaults to `NEW SINGLE` if not specified; other good options:
  `OUT FRIDAY`, `OUT NOW`, `2 DAYS`
- Site domain for the end card CTA (check `NEXT_PUBLIC_SITE_URL` in
  `.env.local`, or ask — don't hardcode a guessed domain)

## Stage 1 — Build the base frame (scripted)

```bash
python3 .claude/skills/release-teaser/scripts/build_base_frame.py \
  public/images/covers/mya-146.svg \
  /tmp/teaser-base.png
```

This composes a clean 1080×1920 frame: dark background, warm radial glow,
cover art centered in the upper two-thirds. **No text is baked in** — text
gets added in Stage 3, after the video renders, because AI video models
distort embedded letters unpredictably as they animate a frame.

## Stage 2 — Animate it (manual, agent-driven)

Upload the base frame, request the motion clip, wait for it, download it.

1. **Upload** `/tmp/teaser-base.png` via `media_upload` → PUT the bytes to
   the returned `upload_url` with `curl` → `media_confirm` with
   `type: "image"`. This gives you a `media_id`.

2. **Generate** the motion clip:
   ```json
   {
     "model": "kling3_0_turbo",
     "prompt": "Slow cinematic push-in on a glowing engraved emblem centered on a dark background, subtle warm amber light breathing and flickering behind it, soft dust particles drifting upward, camera very slowly zooming in, minimal elegant motion, moody nightclub atmosphere, no camera shake, no text",
     "aspect_ratio": "9:16",
     "duration": 5,
     "medias": [{"value": "<media_id from step 1>", "role": "start_image"}]
   }
   ```
   `duration: 5` matches `MOTION_SECONDS` in `build_teaser.py`. **Leave it
   at 5 for now** — the person who commissioned this skill wants to
   lengthen the teaser later, but not yet. If that changes, update
   `MOTION_SECONDS` in `build_teaser.py` to match whatever duration you
   request here; the rest of the timing derives from it automatically.

3. **Poll** `job_display` with the returned job ID until `status` is
   `"completed"`. This routinely takes 1–3 minutes — check back every
   30–60 seconds rather than polling in a tight loop, and don't block the
   conversation turn waiting; tell the user it's rendering and check again
   shortly after.

4. **Download** `results.rawUrl` to `/tmp/teaser-motion.mp4`:
   ```bash
   curl -s -o /tmp/teaser-motion.mp4 "<rawUrl>"
   ```

## Stage 3 — Composite the final teaser (scripted)

```bash
python3 .claude/skills/release-teaser/scripts/build_teaser.py \
  /tmp/teaser-motion.mp4 \
  "Joeski" \
  "Night Bodega" \
  "MYA-146" \
  "OUT FRIDAY" \
  "joeskimusic.com" \
  marketing/teasers/mya-146-night-bodega.mp4
```

This boomerangs the 5-second clip into a smooth 10-second loop, fades in
the title overlay, fades out into a 5-second branded end card, and
encodes the final MP4 (H.264, faststart) — about 15 seconds total, ready
to post. **Always save the output to `marketing/teasers/` in the repo, not
`/tmp`** — files in `/tmp` don't survive and won't ship with the rest of
the project when it's pushed to git.

The script never uses ffmpeg's `drawtext` filter — some ffmpeg builds
don't ship it (this one didn't). All text is rendered as an SVG through
headless Chrome and composited with `overlay` instead, so it works
regardless of the local ffmpeg's filter set.

## After generating

**Always tell the user the video is silent.** The whole point of a music
teaser is the track — before posting, layer the real audio snippet over
the video (any phone editor, or one more `ffmpeg -i teaser.mp4 -i clip.mp3
-c:v copy -c:a aac -shortest final.mp4` if the snippet file is on hand).

Send the finished file with whatever file-delivery tool is available in
the current environment, and mention where it landed in the repo
(`marketing/teasers/...`) so it's easy to find again later.

## Adjusting the timeframe later

Everything is driven by two constants at the top of `build_teaser.py`:
`MOTION_SECONDS` (currently 5) and `ENDCARD_SECONDS` (currently 5). Raise
either one, keep `duration` in the Stage 2 `generate_video` call in sync
with `MOTION_SECONDS`, and every fade/overlay timing recalculates
automatically — no other numbers need to change.
