#!/usr/bin/env python3
"""
One-off: pull the full Maya Records (Discogs label 463) catalog.

  DISCOGS_TOKEN=... python3 scripts/discogs-fetch.py

Writes to catalog/discogs/:
  label-releases.json   raw label listing
  releases/<id>.json    full release detail (tracklist, credits, images)
  covers/<CAT>.jpg      primary cover image
  catalog.csv           one row per catalog number, normalized to MAYA###
"""
import csv
import json
import os
import re
import time
import urllib.request
from pathlib import Path

LABEL_ID = 463
TOKEN = os.environ["DISCOGS_TOKEN"]
UA = "MayaRecordsCatalog/1.0"
OUT = Path(__file__).resolve().parent.parent / "catalog/discogs"


def get(url: str, raw: bool = False):
    sep = "&" if "?" in url else "?"
    req = urllib.request.Request(f"{url}{sep}token={TOKEN}" if not raw else url,
                                 headers={"User-Agent": UA, "Authorization": f"Discogs token={TOKEN}"})
    for attempt in range(5):
        try:
            with urllib.request.urlopen(req, timeout=30) as r:
                remaining = int(r.headers.get("X-Discogs-Ratelimit-Remaining", "10"))
                body = r.read()
                if remaining < 3:
                    time.sleep(20)
                return body if raw else json.loads(body)
        except urllib.error.HTTPError as e:
            if e.code == 429:
                time.sleep(30)
                continue
            raise
    raise RuntimeError(f"gave up on {url}")


def normalize_cat(cat: str) -> str:
    m = re.search(r"(\d+)", cat or "")
    if not m or not re.match(r"\s*MA?YA", cat or "", re.I):
        return (cat or "").strip()
    return f"MAYA{int(m.group(1)):03d}"


def main() -> None:
    (OUT / "releases").mkdir(parents=True, exist_ok=True)
    (OUT / "covers").mkdir(parents=True, exist_ok=True)

    listing, page = [], 1
    while True:
        data = get(f"https://api.discogs.com/labels/{LABEL_ID}/releases?per_page=100&page={page}")
        listing += data["releases"]
        if page >= data["pagination"]["pages"]:
            break
        page += 1
    (OUT / "label-releases.json").write_text(json.dumps(listing, indent=2))
    print(f"{len(listing)} label entries")

    rows, seen = [], set()
    for item in listing:
        rid = item["id"]
        is_master = item.get("type") == "master"
        if is_master:
            rid = item.get("main_release", rid)
        path = OUT / "releases" / f"{rid}.json"
        if path.exists():
            rel = json.loads(path.read_text())
        else:
            rel = get(f"https://api.discogs.com/releases/{rid}")
            path.write_text(json.dumps(rel, indent=2))
            time.sleep(1.1)

        maya_labels = [l for l in rel.get("labels", []) if l.get("id") == LABEL_ID] or rel.get("labels", [])
        raw_cat = maya_labels[0].get("catno", "") if maya_labels else item.get("catno", "")
        cat = normalize_cat(raw_cat)
        key = (cat, rel.get("title"))
        if key in seen:
            continue
        seen.add(key)

        cover = ""
        images = rel.get("images") or []
        if images:
            img = next((i for i in images if i.get("type") == "primary"), images[0])
            dest = OUT / "covers" / f"{re.sub(r'[^A-Za-z0-9_-]+', '_', cat) or rid}.jpg"
            if not dest.exists() and img.get("uri"):
                try:
                    dest.write_bytes(get(img["uri"], raw=True))
                    time.sleep(1.1)
                except Exception as e:
                    print(f"  cover failed {cat}: {e}")
            cover = str(dest.relative_to(OUT)) if dest.exists() else ""

        artists = " ".join(
            (a["name"] + (f" {a['join']}" if a.get("join") else "")) for a in rel.get("artists", [])
        ).strip()
        rows.append({
            "catalog_number": cat,
            "discogs_catno": raw_cat,
            "artist": re.sub(r"\s\(\d+\)", "", artists),
            "title": rel.get("title", ""),
            "year": rel.get("year") or "",
            "released": rel.get("released", ""),
            "formats": "; ".join(f"{f.get('name','')} {' '.join(f.get('descriptions', []))}".strip() for f in rel.get("formats", [])),
            "genres": "; ".join(rel.get("genres", [])),
            "styles": "; ".join(rel.get("styles", [])),
            "tracklist": " | ".join(
                f"{t.get('position','')} {t.get('title','')}" + (f" ({t['duration']})" if t.get("duration") else "")
                for t in rel.get("tracklist", []) if t.get("type_", "track") == "track"
            ),
            "cover": cover,
            "discogs_id": rel.get("id"),
            "discogs_url": rel.get("uri", ""),
        })
        print(f"  {cat:10} {rows[-1]['artist']} — {rows[-1]['title']}")

    rows.sort(key=lambda r: r["catalog_number"])
    with open(OUT / "catalog.csv", "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
        w.writeheader()
        w.writerows(rows)
    print(f"done: {len(rows)} releases → {OUT/'catalog.csv'}")


if __name__ == "__main__":
    main()
