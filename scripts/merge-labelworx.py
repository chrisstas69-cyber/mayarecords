#!/usr/bin/env python3
"""
Overlay Labelworx (the label's own distribution data) onto the site catalog.

  python3 scripts/merge-labelworx.py [path/to/Release_List.xlsx]

Run after import-archive.py + merge-catalog.py. Labelworx is the source of
truth, so it wins on titles, artists, dates, genres, descriptions and
tracklists. Previews come from the Labelworx sample CDN (recorded by
labelworx-scrape-audio.py) unless the local archive already has one.

Also decides what's for sale: a release gets a price only when a full master
exists locally (the archive WAVs) — Labelworx only exposes preview clips.
Writes catalog/masters.json for scripts/sync-to-supabase.py.

Reusable for another label: point it at that label's export + scrape output
and change LABEL_NAME / the catalog prefix in normalize_cat().
"""
import json
import re
import sys
from collections import defaultdict
from datetime import date
from pathlib import Path

import openpyxl

ROOT = Path(__file__).resolve().parent.parent
LABEL_NAME = "Maya Recordings"
DEFAULT_XLSX = Path.home() / "Downloads/Release_List_Maya_Recordings_Entire_Catalog.xlsx"
MANIFEST = ROOT / "catalog/labelworx-audio/manifest.json"
ARCHIVE_TS = ROOT / "src/lib/data/archive.generated.ts"
ARCHIVE_WAVS = Path.home() / "Downloads/Maya Records Archive/01 Releases by Catalog Number"


def normalize_cat(raw: str):
    m = re.search(r"MA?YA\s*-?\s*(\d{3,4})", raw or "", re.I)
    if not m or int(m.group(1)) > 999:
        return None
    return f"MAYA{int(m.group(1)):03d}"


def parse_dmy(s):
    if not s:
        return None
    try:
        d, m, y = str(s).split("/")
        return date(int(y), int(m), int(d)).isoformat()
    except ValueError:
        return None


def seconds(hms):
    try:
        h, m, s = (int(x) for x in str(hms).split(":"))
        return h * 3600 + m * 60 + s or None
    except ValueError:
        return None


def price_for(track_count: int) -> int:
    # Placeholder label pricing — editable per release in the admin.
    if track_count <= 1:
        return 199
    if track_count <= 3:
        return 399
    if track_count <= 6:
        return 599
    return 999


def slugify(s: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", s.encode("ascii", "ignore").decode().lower()).strip("-")


def load_labelworx(xlsx: Path) -> dict:
    wb = openpyxl.load_workbook(xlsx, read_only=True, data_only=True)
    ws = wb.active
    rows = ws.iter_rows(values_only=True)
    headers = list(next(rows))
    col = {h: i for i, h in enumerate(headers)}

    releases = defaultdict(lambda: {"tracks": []})
    for r in rows:
        if r[col["Label Name"]] != LABEL_NAME:
            continue
        cat = normalize_cat(r[col["Catalog"]] or "") or normalize_cat(r[col["Release Description"]] or "")
        if not cat:
            continue
        rel = releases[cat]
        artist = r[col["Main Release Artists"]] or ""
        feat = r[col["Featuring Release Artists"]]
        rel.setdefault("title", r[col["Release Name"]])
        rel.setdefault("artist_name", f"{artist} feat. {feat}" if feat else artist)
        rel.setdefault("primary_artist", artist.split(",")[0].split(" & ")[0].strip())
        rel.setdefault("release_date", parse_dmy(r[col["Original Release Date (DD/MM/YYYY)"]]) or parse_dmy(r[col["Release Date (DD/MM/YYYY)"]]))
        rel.setdefault("genre", r[col["Genre"]])
        desc = (r[col["Release Description"]] or "").strip()
        # Several descriptions are just "LABEL x CATALOG y" boilerplate.
        if desc and not re.match(r"^LABEL\b", desc, re.I):
            rel.setdefault("description", desc)
        mix = r[col["Mix Name"]]
        title = r[col["Track Title"]] or rel["title"]
        rel["tracks"].append({
            "position": len(rel["tracks"]) + 1,
            "title": f"{title} ({mix})" if mix else title,
            "duration_seconds": seconds(r[col["Track Time"]]),
            "isrc": r[col["ISRC"]],
            "writers": r[col["Track Writers"]],
            "producers": r[col["Track Producers"]],
        })
    return releases


def load_samples() -> dict:
    """cat -> {position: sample_url} from the scrape manifest."""
    if not MANIFEST.exists():
        return {}
    out = defaultdict(dict)
    for key, v in json.loads(MANIFEST.read_text()).items():
        if not v.get("sample_url"):
            continue
        cat, pos = key.rsplit("-", 1)
        if pos.isdigit():
            out[cat][int(pos)] = v["sample_url"]
    return out


def local_masters() -> dict:
    """cat -> list of full-length WAV/AIFF masters from the label archive."""
    out = {}
    if not ARCHIVE_WAVS.exists():
        return out
    for folder in sorted(ARCHIVE_WAVS.glob("MAYA*")):
        wavs = sorted(p for p in (folder / "WAV").glob("*") if p.suffix.lower() in (".wav", ".aif", ".aiff"))
        if wavs:
            out[folder.name.upper()] = [str(p) for p in wavs]
    return out


def main() -> None:
    xlsx = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_XLSX
    lw = load_labelworx(xlsx)
    samples = load_samples()
    masters = local_masters()

    src = ARCHIVE_TS.read_text()
    catalog = json.loads(src.split("=", 1)[1].rsplit("as const", 1)[0].strip().rstrip(";"))
    by_cat = {r["catalog_number"]: r for r in catalog}

    for cat, info in lw.items():
        rel = by_cat.get(cat)
        if rel is None:
            rel = {"catalog_number": cat, "cover_url": None, "tracks": []}
            cover = ROOT / "public/media/covers" / f"{cat.lower()}.jpg"
            if cover.exists():
                rel["cover_url"] = f"/media/covers/{cover.name}"
            by_cat[cat] = rel
        rel["title"] = info["title"] or rel.get("title") or cat
        rel["artist_name"] = info["artist_name"] or rel.get("artist_name") or "Joeski"
        rel["artist_slug"] = slugify(info["primary_artist"]) or rel.get("artist_slug") or "joeski"
        rel["release_date"] = info["release_date"] or rel.get("release_date")
        rel["genre"] = info["genre"] or rel.get("genre")
        if info.get("description"):
            rel["description"] = info["description"]

        # Labelworx samples line up with Labelworx positions. Local archive previews only
        # match by position when the two tracklists are the same length.
        cat_samples = samples.get(cat, {})
        old_tracks = rel.get("tracks", [])
        local_previews = (
            {t["position"]: t.get("preview_url") for t in old_tracks if t.get("preview_url")}
            if len(old_tracks) == len(info["tracks"])
            else {}
        )
        rel["tracks"] = [
            {**t, "preview_url": cat_samples.get(t["position"]) or local_previews.get(t["position"])}
            for t in info["tracks"]
        ]

    # Every release is for sale (Chris's call). Masters exist locally for only some —
    # the rest need their WAVs uploaded before a buyer's download link works.
    for cat, rel in by_cat.items():
        rel["digital_price_cents"] = price_for(len(rel.get("tracks") or []) or 1)
        rel["has_master"] = cat in masters

    merged = sorted(by_cat.values(), key=lambda r: r["catalog_number"])
    header = "// Generated by scripts/import-archive.py + merge-catalog.py + merge-labelworx.py — edit those, not this file.\n"
    ARCHIVE_TS.write_text(header + "export const ARCHIVE_RELEASES = " + json.dumps(merged, indent=2, ensure_ascii=False) + " as const;\n")

    artists = {}
    for r in merged:
        slug = r.get("artist_slug") or "joeski"
        name = re.split(r"\s+(?:feat\.?|&|,)\s*", r.get("artist_name") or "Joeski", maxsplit=1)[0].strip()
        artists.setdefault(slug, name)
    (ROOT / "src/lib/data/artists.generated.ts").write_text(
        header + "export const ARCHIVE_ARTISTS = "
        + json.dumps([{"slug": s, "name": n} for s, n in sorted(artists.items())], indent=2, ensure_ascii=False)
        + " as const;\n"
    )

    (ROOT / "catalog").mkdir(exist_ok=True)
    (ROOT / "catalog/masters.json").write_text(json.dumps(masters, indent=2))

    with_preview = sum(1 for r in merged if any(t.get("preview_url") for t in r["tracks"]))
    missing = [r["catalog_number"] for r in merged if not r.get("has_master")]
    print(f"{len(merged)} releases · {len(lw)} from Labelworx · {with_preview} with previews · all for sale · {len(merged) - len(missing)} with masters on hand")
    (ROOT / "catalog/missing-masters.txt").write_text("\n".join(missing) + "\n")


if __name__ == "__main__":
    main()
