#!/usr/bin/env python3
"""Resolve store artwork through Agent Reach's Jina Reader; retain provenance.

Run only when updating the catalog, never during a build or a web request.
Existing successful rows are reused. Unavailable pages remain unresolved rather
than substituting a related release's artwork.
"""

import concurrent.futures
import datetime
import json
import pathlib
import re
import subprocess
import threading
import time
import urllib.parse
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parents[1]
CACHE = pathlib.Path("/tmp/joeski-remix-artwork-pages")
MANIFEST = ROOT / "data/joeski-remixes-artwork.json"
REVIEWED = ROOT / "data/joeski-remixes-artwork-sources.json"
LOCK = threading.Lock()
NEXT_REQUEST = 0.0


def read_page(url):
    global NEXT_REQUEST
    path = CACHE / (re.sub(r"\W+", "-", url) + ".txt")
    if path.exists():
        return path.read_text()
    with LOCK:
        wait = max(0, NEXT_REQUEST - time.monotonic())
        time.sleep(wait)
        NEXT_REQUEST = time.monotonic() + 3.2
    result = subprocess.run(
        ["curl", "--fail", "--silent", "--show-error", "--max-time", "90",
         "https://r.jina.ai/" + url], capture_output=True, text=True, check=True,
    )
    if "Performing security verification" in result.stdout or "Just a moment..." in result.stdout:
        raise ValueError("Store page requires verification; not bypassed")
    path.write_text(result.stdout)
    return result.stdout


def resolve(row):
    reviewed = json.loads(REVIEWED.read_text()).get(str(row["id"])) if REVIEWED.exists() else None
    url = reviewed["source_page_url"] if reviewed else row["beatport_url"] or row["traxsource_url"]
    try:
        if reviewed:
            image_url = reviewed["source_image_url"]
        else:
            page = read_page(url)
            if row["beatport_url"]:
                # The track's own cover is explicitly labeled, before recommendations.
                match = re.search(r"!\[Image \d+: Cover art for [^\]]+\]\((https://geo-media\.beatport\.com/[^)]+)\)", page)
            else:
                match = re.search(r"!\[[^\]]*\]\((https://geo-media\.traxsource\.com/[^)]+)\)", page)
            if not match:
                raise ValueError("No release cover identified on the supplied track page")
            image_url = match.group(1)
        if urllib.parse.urlparse(image_url).hostname not in {
            "geo-media.beatport.com", "geo-media.traxsource.com", "www.redeyerecords.co.uk",
            "geo-static.traxsource.com", "static.qobuz.com", "images.boomkat.com", "f4.bcbits.com",
        }:
            raise ValueError("Unexpected artwork host")
        request = urllib.request.Request(image_url, headers={"User-Agent": "MayaCatalog/1.0"})
        with urllib.request.urlopen(request, timeout=35) as response:
            content = response.read(4_000_001)
        if len(content) > 4_000_000:
            raise ValueError("Invalid or oversized artwork")
        if content.startswith(b"\xff\xd8\xff"):
            extension = "jpg"
        elif content.startswith(b"\x89PNG\r\n\x1a\n"):
            extension = "png"
        elif content.startswith(b"RIFF") and content[8:12] == b"WEBP":
            extension = "webp"
        else:
            raise ValueError("Artwork is not a supported raster image")
        filename = f"remix-{row['id']:03d}.{extension}"
        target = ROOT / "public/images/remixes" / filename
        target.write_bytes(content)
        print(f"{row['id']:03d} artwork: {row['title']}", flush=True)
        return str(row["id"]), {
            "cover_url": f"/images/remixes/{filename}",
            "source_page_url": url,
            "source_image_url": image_url,
            "checked_date": datetime.date.today().isoformat(),
            **({"note": reviewed["note"]} if reviewed else {}),
        }
    except Exception as error:
        print(f"{row['id']:03d} unresolved: {error}", flush=True)
        return str(row["id"]), {"cover_url": None, "source_page_url": url, "note": str(error)}


def main():
    CACHE.mkdir(parents=True, exist_ok=True)
    (ROOT / "public/images/remixes").mkdir(parents=True, exist_ok=True)
    rows = json.loads((ROOT / "data/joeski-remixes.json").read_text())
    manifest = json.loads(MANIFEST.read_text()) if MANIFEST.exists() else {}
    pending = [row for row in rows if not manifest.get(str(row["id"]), {}).get("cover_url")]
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as executor:
        for key, value in executor.map(resolve, pending):
            manifest[key] = value
            MANIFEST.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n")
    print(f"Resolved {sum(bool(v.get('cover_url')) for v in manifest.values())}/{len(rows)} covers")


if __name__ == "__main__":
    main()
