#!/usr/bin/env python3
"""
Load the whole catalog into Supabase in one go. Safe to re-run.

  python3 scripts/sync-to-supabase.py            # catalog + covers + edits
  python3 scripts/sync-to-supabase.py --masters  # also upload sale masters (big — needs Supabase Pro)

Reads NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from .env.local.
Run supabase/migrations 0001 -> 0004 first (see SETUP-TOMORROW.md).

What it does:
  - artists, releases, tracks  (upsert by slug; tracks rewritten per release)
  - covers        -> public "covers" bucket
  - local previews -> public "audio" bucket (Labelworx previews stay on their CDN)
  - Joeski edits  -> private "edits" bucket + edits table
  - --masters: one ZIP of WAVs per for-sale release -> private "masters" bucket,
    sets releases.master_url + digital_price_cents so the Buy button works.
"""
from __future__ import annotations

import json
import tempfile
import re
import sys
import zipfile
from pathlib import Path

import requests

ROOT = Path(__file__).resolve().parent.parent


def env() -> dict:
    vals = {}
    for line in (ROOT / ".env.local").read_text().splitlines():
        if "=" in line and not line.strip().startswith("#"):
            k, v = line.split("=", 1)
            vals[k.strip()] = v.strip().strip('"')
    return vals


E = env()
URL = E.get("NEXT_PUBLIC_SUPABASE_URL", "").rstrip("/")
KEY = E.get("SUPABASE_SERVICE_ROLE_KEY", "")
if not URL or not KEY:
    sys.exit("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local first.")
H = {"apikey": KEY, "Authorization": f"Bearer {KEY}"}


def load_generated(name: str, const: str) -> list:
    src = (ROOT / "src/lib/data" / name).read_text()
    return json.loads(src.split(f"{const} =", 1)[1].rsplit("as const", 1)[0].strip().rstrip(";"))


def rest(method: str, table: str, *, params=None, json_body=None, prefer=None):
    headers = {**H, "Content-Type": "application/json"}
    if prefer:
        headers["Prefer"] = prefer
    r = requests.request(method, f"{URL}/rest/v1/{table}", headers=headers, params=params, json=json_body, timeout=60)
    if r.status_code >= 300:
        raise RuntimeError(f"{method} {table}: {r.status_code} {r.text[:300]}")
    return r.json() if r.text else None


def upload(bucket: str, path: str, data, content_type: str) -> str:
    """data: bytes, or an open binary file (streamed, for big masters)."""
    r = requests.post(
        f"{URL}/storage/v1/object/{bucket}/{path}",
        headers={**H, "Content-Type": content_type, "x-upsert": "true"},
        data=data,
        timeout=1800,
    )
    if r.status_code >= 300:
        raise RuntimeError(f"upload {bucket}/{path}: {r.status_code} {r.text[:300]}")
    return f"{URL}/storage/v1/object/public/{bucket}/{path}"


def local_file(url: str | None) -> Path | None:
    if url and url.startswith("/media/"):
        p = ROOT / "public" / url.lstrip("/")
        return p if p.exists() else None
    return None


def sync_catalog() -> dict:
    releases = load_generated("archive.generated.ts", "ARCHIVE_RELEASES")
    artists = load_generated("artists.generated.ts", "ARCHIVE_ARTISTS")

    rest("POST", "artists", params={"on_conflict": "slug"}, prefer="resolution=merge-duplicates",
         json_body=[{"name": a["name"], "slug": a["slug"]} for a in artists])
    artist_ids = {a["slug"]: a["id"] for a in rest("GET", "artists", params={"select": "id,slug", "limit": 10000})}

    release_ids = {}
    for i, r in enumerate(releases, 1):
        cat = r["catalog_number"]
        cover = local_file(r.get("cover_url"))
        cover_url = upload("covers", f"releases/{cat.lower()}.jpg", cover.read_bytes(), "image/jpeg") if cover else None

        tracks = []
        for t in r.get("tracks", []):
            preview = t.get("preview_url")
            lf = local_file(preview)
            if lf:
                preview = upload("audio", f"previews/{lf.name}", lf.read_bytes(), "audio/mpeg")
            tracks.append({**t, "preview_url": preview})

        row = {
            "title": r["title"],
            "slug": cat.lower(),
            "catalog_number": cat,
            "artist_id": artist_ids.get(r.get("artist_slug")) or artist_ids["joeski"],
            "release_date": r.get("release_date"),
            "genre": r.get("genre"),
            "description": r.get("description"),
            "cover_url": cover_url,
            "preview_url": next((t["preview_url"] for t in tracks if t.get("preview_url")), None),
            "links": [{"label": "Discogs", "url": r["discogs_url"]}] if r.get("discogs_url") else [],
            "state": "published",
            "featured": cat == "MAYA188",
            "digital_price_cents": r.get("digital_price_cents"),
        }
        saved = rest("POST", "releases", params={"on_conflict": "slug"},
                     prefer="resolution=merge-duplicates,return=representation", json_body=row)[0]
        release_ids[cat] = saved["id"]

        rest("DELETE", "tracks", params={"release_id": f"eq.{saved['id']}"})
        if tracks:
            rest("POST", "tracks", json_body=[{
                "release_id": saved["id"],
                "position": t["position"],
                "title": t["title"],
                "duration_seconds": t.get("duration_seconds"),
                "isrc": t.get("isrc"),
                "preview_url": t.get("preview_url"),
            } for t in tracks])
        print(f"  [{i}/{len(releases)}] {cat} {r['title']}")
    return release_ids


def sync_edits() -> None:
    edits = load_generated("edits.generated.ts", "EDITS_DATA")
    for e in edits:
        cover = local_file(e["cover_url"])
        preview = local_file(e["preview_url"])
        row = {
            "slug": e["slug"],
            "title": e["title"],
            "original_artist": e["original_artist"],
            "drop_date": e["drop_date"],
            "duration_seconds": e["duration_seconds"],
            "cover_url": upload("covers", f"edits/{e['slug']}.jpg", cover.read_bytes(), "image/jpeg") if cover else None,
            "preview_url": upload("audio", f"edits/{e['slug']}-preview.mp3", preview.read_bytes(), "audio/mpeg") if preview else None,
        }
        for ext, ctype in (("mp3", "audio/mpeg"), ("wav", "audio/wav")):
            f = ROOT / "private-media/edits" / f"{e['slug']}.{ext}"
            if f.exists():
                upload("edits", f.name, f.read_bytes(), ctype)
                row[f"{ext}_path"] = f.name
        rest("POST", "edits", params={"on_conflict": "slug"}, prefer="resolution=merge-duplicates", json_body=row)
        print(f"  edit {e['slug']}")


def sync_masters(release_ids: dict) -> None:
    masters = json.loads((ROOT / "catalog/masters.json").read_text())
    releases = {r["catalog_number"]: r for r in load_generated("archive.generated.ts", "ARCHIVE_RELEASES")}
    for cat, files in masters.items():
        if cat not in release_ids:
            continue
        tmp = Path(tempfile.gettempdir()) / f"{cat}.zip"
        with zipfile.ZipFile(tmp, "w", zipfile.ZIP_STORED) as z:
            for f in files:
                z.write(f, arcname=f"{cat} - {Path(f).name}")
        size_mb = tmp.stat().st_size / 1e6
        try:
            with tmp.open("rb") as fh:
                upload("masters", f"{cat}.zip", fh, "application/zip")
        except RuntimeError as err:
            print(f"  ! {cat} ({size_mb:.0f} MB) not uploaded: {err}")
            continue
        finally:
            tmp.unlink(missing_ok=True)
        rest("PATCH", "releases", params={"id": f"eq.{release_ids[cat]}"}, json_body={
            "master_url": f"masters/{cat}.zip",
            "digital_price_cents": releases[cat].get("digital_price_cents") or 199,
        })
        print(f"  master {cat} ({size_mb:.0f} MB) — on sale")


def main() -> None:
    print("Catalog…")
    release_ids = sync_catalog()
    print("Edits…")
    sync_edits()
    if "--masters" in sys.argv:
        print("Masters…")
        sync_masters(release_ids)
    print("Done. Open the site — it now reads from Supabase.")


if __name__ == "__main__":
    main()
