#!/usr/bin/env python3
"""
Compose the clean vertical 9:16 frame used as the *source image* for the
Higgsfield motion-generation step. Cover artwork only — no text baked in.
Text goes on afterward as a separate overlay (see build_teaser.py), because
letters warp unpredictably when an AI video model animates a frame that
already contains them.

Works with PNG/JPG/SVG cover art. No Python image libraries required —
composition happens by writing an SVG string and rasterizing it with
headless Chrome, the same technique used everywhere else in this skill,
so there is exactly one rendering path to maintain.

Usage:
    python3 build_base_frame.py <cover_art_path> <output_png_path>
"""
import base64
import mimetypes
import subprocess
import sys
import tempfile
from pathlib import Path

CANVAS_W, CANVAS_H = 1080, 1920
ART_SIZE = 640  # square artwork box
ART_X = (CANVAS_W - ART_SIZE) // 2
ART_Y = 520  # upper-middle; leaves room below for the title overlay later

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
    raise SystemExit(
        "Couldn't find Chrome/Chromium for headless SVG rendering. "
        "Install Google Chrome, or add its path to CHROME_CANDIDATES in this script."
    )


def render_svg(svg_path: Path, out_png: Path, width: int, height: int) -> None:
    chrome = find_chrome()
    subprocess.run(
        [
            chrome,
            "--headless",
            "--disable-gpu",
            f"--screenshot={out_png}",
            f"--window-size={width},{height}",
            "--hide-scrollbars",
            "--default-background-color=00000000",
            f"file://{svg_path.resolve()}",
        ],
        check=True,
        capture_output=True,
    )


def data_uri(path: Path) -> str:
    mime = mimetypes.guess_type(str(path))[0] or "image/png"
    b64 = base64.b64encode(path.read_bytes()).decode()
    return f"data:{mime};base64,{b64}"


def main() -> None:
    if len(sys.argv) != 3:
        raise SystemExit("Usage: build_base_frame.py <cover_art_path> <output_png_path>")
    cover_path = Path(sys.argv[1]).expanduser().resolve()
    out_path = Path(sys.argv[2]).expanduser().resolve()
    out_path.parent.mkdir(parents=True, exist_ok=True)
    if not cover_path.exists():
        raise SystemExit(f"Cover art not found: {cover_path}")

    with tempfile.TemporaryDirectory() as tmp_str:
        tmp = Path(tmp_str)

        # SVG cover art needs its own rasterization pass before it can be
        # embedded as a data URI in the composed frame below.
        if cover_path.suffix.lower() == ".svg":
            art_png = tmp / "art.png"
            render_svg(cover_path, art_png, 1000, 1000)
            art_uri = data_uri(art_png)
        else:
            art_uri = data_uri(cover_path)

        frame_svg = tmp / "frame.svg"
        frame_svg.write_text(f"""<svg xmlns="http://www.w3.org/2000/svg" width="{CANVAS_W}" height="{CANVAS_H}" viewBox="0 0 {CANVAS_W} {CANVAS_H}">
<defs>
<radialGradient id="glow" cx="50%" cy="34%" r="60%">
<stop offset="0%" stop-color="#241a10"/>
<stop offset="100%" stop-color="#0b0a08"/>
</radialGradient>
</defs>
<rect width="{CANVAS_W}" height="{CANVAS_H}" fill="url(#glow)"/>
<image href="{art_uri}" x="{ART_X}" y="{ART_Y}" width="{ART_SIZE}" height="{ART_SIZE}" preserveAspectRatio="xMidYMid meet"/>
</svg>""")

        render_svg(frame_svg, out_path, CANVAS_W, CANVAS_H)

    print(f"Wrote base frame: {out_path}")


if __name__ == "__main__":
    main()
