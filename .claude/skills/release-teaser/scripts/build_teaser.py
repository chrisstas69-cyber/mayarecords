#!/usr/bin/env python3
"""
Turn a rendered motion clip (from the Higgsfield generate_video step, see
SKILL.md stage 2) into the final branded teaser: boomerang the motion into
a smooth loop, overlay crisp title text, and append a branded end card.

Text is never drawn with ffmpeg's drawtext filter — some ffmpeg builds
(including the one this skill was developed against) ship without it.
Every piece of text is instead rendered as an SVG through headless Chrome
and composited with ffmpeg's `overlay` filter, so this works regardless of
which filters the local ffmpeg happens to have.

Usage:
    python3 build_teaser.py <motion_mp4> <artist> <title> <catalog_number> \\
        <tagline> <site_domain> <output_mp4>

Example:
    python3 build_teaser.py /tmp/motion.mp4 "Joeski" "Night Bodega" \\
        "MYA-146" "OUT FRIDAY" "joeskimusic.com" \\
        marketing/teasers/mya-146-night-bodega.mp4
"""
import subprocess
import sys
import tempfile
from pathlib import Path

CANVAS_W, CANVAS_H = 1080, 1920

# Current defaults — proven and working end to end. To make the teaser
# longer later, raise MOTION_SECONDS (and/or ENDCARD_SECONDS); every other
# timing below derives from these two, so it stays in sync automatically.
MOTION_SECONDS = 5             # duration requested from generate_video
ENDCARD_SECONDS = 5
TEXT_FADE_IN_AT = 1.2          # seconds into the boomeranged loop
TEXT_FADE_DURATION = 0.9
MAIN_FADE_OUT_DURATION = 0.7   # fade-out length for the looped main section
END_FADE_DURATION = 0.6        # fade in/out length for the end card

BG = "#0b0a08"
CREAM = "#f4efe6"
GOLD = "#c89b5a"
STONE = "#b3a48d"

CHROME_CANDIDATES = [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "google-chrome",
    "chromium",
]


def find_chrome() -> str:
    for candidate in CHROME_CANDIDATES:
        if Path(candidate).exists():
            return candidate
        if "/" not in candidate:
            found = subprocess.run(["which", candidate], capture_output=True, text=True)
            if found.returncode == 0 and found.stdout.strip():
                return found.stdout.strip()
    raise SystemExit("Couldn't find Chrome/Chromium for headless SVG rendering.")


def render_svg(svg_path: Path, out_png: Path, transparent: bool = False) -> None:
    chrome = find_chrome()
    cmd = [
        chrome,
        "--headless",
        "--disable-gpu",
        f"--screenshot={out_png}",
        f"--window-size={CANVAS_W},{CANVAS_H}",
        "--hide-scrollbars",
    ]
    if transparent:
        cmd.append("--default-background-color=00000000")
    cmd.append(f"file://{svg_path.resolve()}")
    subprocess.run(cmd, check=True, capture_output=True)


def esc(text: str) -> str:
    """XML-escape for use inside SVG <text>. Always call this AFTER any
    .upper()/.lower() transform, never before — escaping first and then
    uppercasing turns '&amp;' into '&AMP;', which XML parsers reject and
    the cover art renders blank. (This broke a real release cover once.)"""
    return text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def main() -> None:
    if len(sys.argv) != 8:
        raise SystemExit(
            "Usage: build_teaser.py <motion_mp4> <artist> <title> <catalog_number> "
            "<tagline> <site_domain> <output_mp4>"
        )
    motion_path = Path(sys.argv[1]).expanduser().resolve()
    artist, title, catalog, tagline, domain = sys.argv[2:7]
    out_path = Path(sys.argv[7]).expanduser().resolve()
    out_path.parent.mkdir(parents=True, exist_ok=True)

    if not motion_path.exists():
        raise SystemExit(f"Motion clip not found: {motion_path}")

    artist_disp = esc(artist.upper())
    title_disp = esc(title.upper())
    catalog_disp = esc(catalog.upper())
    tagline_disp = esc(tagline.upper())
    domain_disp = esc(domain.upper())

    loop_seconds = MOTION_SECONDS * 2  # boomerang: forward + reverse
    main_fade_out_at = loop_seconds - MAIN_FADE_OUT_DURATION
    endcard_fade_out_at = ENDCARD_SECONDS - END_FADE_DURATION

    with tempfile.TemporaryDirectory() as tmp_str:
        tmp = Path(tmp_str)

        # --- transparent text overlay (sits on top of the looping motion) ---
        overlay_svg = tmp / "overlay.svg"
        overlay_svg.write_text(f"""<svg xmlns="http://www.w3.org/2000/svg" width="{CANVAS_W}" height="{CANVAS_H}" viewBox="0 0 {CANVAS_W} {CANVAS_H}">
<text x="100" y="1530" font-family="Helvetica Neue, Helvetica" font-size="68" font-weight="500" letter-spacing="12" fill="{CREAM}">{artist_disp}</text>
<text x="100" y="1625" font-family="Helvetica Neue, Helvetica" font-size="60" font-weight="300" letter-spacing="10" fill="{CREAM}">{title_disp}</text>
<text x="100" y="1700" font-family="Helvetica Neue, Helvetica" font-size="32" font-weight="400" letter-spacing="7" fill="{GOLD}">{tagline_disp} — {catalog_disp} · MAYA RECORDS</text>
</svg>""")
        overlay_png = tmp / "overlay.png"
        render_svg(overlay_svg, overlay_png, transparent=True)

        # --- branded end card ---
        endcard_svg = tmp / "endcard.svg"
        endcard_svg.write_text(f"""<svg xmlns="http://www.w3.org/2000/svg" width="{CANVAS_W}" height="{CANVAS_H}" viewBox="0 0 {CANVAS_W} {CANVAS_H}">
<rect width="{CANVAS_W}" height="{CANVAS_H}" fill="{BG}"/>
<rect x="140" y="810" width="800" height="2" fill="{GOLD}" opacity="0.7"/>
<text x="540" y="920" text-anchor="middle" font-family="Helvetica Neue, Helvetica" font-size="60" font-weight="500" letter-spacing="12" fill="{CREAM}">{tagline_disp}</text>
<text x="540" y="1010" text-anchor="middle" font-family="Helvetica Neue, Helvetica" font-size="34" font-weight="300" letter-spacing="8" fill="{GOLD}">{catalog_disp} · MAYA RECORDS</text>
<rect x="140" y="1080" width="800" height="2" fill="{GOLD}" opacity="0.7"/>
<text x="540" y="1200" text-anchor="middle" font-family="Helvetica Neue, Helvetica" font-size="30" font-weight="400" letter-spacing="6" fill="{STONE}">HEAR IT FIRST — LINK IN BIO</text>
<text x="540" y="1265" text-anchor="middle" font-family="Helvetica Neue, Helvetica" font-size="30" font-weight="500" letter-spacing="6" fill="{CREAM}">{domain_disp}</text>
</svg>""")
        endcard_png = tmp / "endcard.png"
        render_svg(endcard_svg, endcard_png)

        # --- ffmpeg composite ---
        filter_complex = (
            f"[0:v]split[fwd][tmp];"
            f"[tmp]reverse[rev];"
            f"[fwd][rev]concat=n=2:v=1:a=0,scale={CANVAS_W}:{CANVAS_H}:flags=lanczos,setsar=1,fps=24[loop];"
            f"[1:v]format=rgba,fade=t=in:st={TEXT_FADE_IN_AT}:d={TEXT_FADE_DURATION}:alpha=1[txt];"
            f"[loop][txt]overlay=0:0,fade=t=out:st={main_fade_out_at}:d={MAIN_FADE_OUT_DURATION}[main];"
            f"[2:v]scale={CANVAS_W}:{CANVAS_H},setsar=1,fps=24,format=yuv420p,"
            f"fade=t=in:st=0:d={END_FADE_DURATION},fade=t=out:st={endcard_fade_out_at}:d={END_FADE_DURATION}[end];"
            f"[main][end]concat=n=2:v=1:a=0[out]"
        )

        cmd = [
            "ffmpeg", "-y", "-v", "error",
            "-i", str(motion_path),
            "-loop", "1", "-t", str(loop_seconds), "-i", str(overlay_png),
            "-loop", "1", "-t", str(ENDCARD_SECONDS), "-i", str(endcard_png),
            "-filter_complex", filter_complex,
            "-map", "[out]",
            "-c:v", "libx264", "-pix_fmt", "yuv420p", "-preset", "medium", "-crf", "20",
            "-movflags", "+faststart",
            str(out_path),
        ]
        subprocess.run(cmd, check=True)

    print(f"Wrote teaser: {out_path}")
    print("Reminder: this video is silent. Layer the actual track snippet over it before posting.")


if __name__ == "__main__":
    main()
