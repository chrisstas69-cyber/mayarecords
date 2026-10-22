#!/usr/bin/env python3
"""Apply a reviewed file-to-track manifest to the bundled catalog.

python3 scripts/import-release-folder.py ~/Downloads/'joeski maya'

Only short previews and embedded artwork go in public/media. Original audio
stays in the input directory; catalog/masters.json records its private paths.
Requires ffmpeg and ffprobe. Re-running preserves existing previews and artwork.
"""
import argparse
import concurrent.futures
import json
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "src/lib/data"


def load_generated(name, constant):
    source = (DATA / name).read_text()
    return json.loads(source.split(f"{constant} =", 1)[1].rsplit(" as const", 1)[0].strip().rstrip(";"))


def write_generated(name, constant, rows):
    path = DATA / name
    header = path.read_text().split("export const", 1)[0]
    if "import-release-folder.py" not in header:
        header += "// Folder audio/metadata overlay: scripts/import-release-folder.py + catalog/imports/joeski-maya.json.\n"
    path.write_text(header + f"export const {constant} = " + json.dumps(rows, indent=2, ensure_ascii=False) + " as const;\n")


def run(args):
    return subprocess.run(args, check=True, capture_output=True, text=True).stdout


def probe(path):
    data = json.loads(run(["ffprobe", "-v", "error", "-show_entries", "format=duration:format_tags", "-of", "json", str(path)]))["format"]
    return float(data["duration"]), data.get("tags", {})


def preview(source, target, duration):
    target.parent.mkdir(parents=True, exist_ok=True)
    length = min(60, duration)
    start = min(duration * 0.3, duration - length)
    run(["ffmpeg", "-v", "error", "-y", "-ss", str(start), "-i", str(source),
         "-t", str(length), "-map", "0:a:0", "-vn", "-map_metadata", "-1",
         "-af", f"afade=t=in:d=1,afade=t=out:st={max(0, length - 3)}:d=3",
         "-ac", "2", "-ar", "44100", "-b:a", "128k", str(target)])


def cover(source, target):
    target.parent.mkdir(parents=True, exist_ok=True)
    run(["ffmpeg", "-v", "error", "-y", "-i", str(source), "-an", "-map", "0:v:0",
         "-vf", "scale=900:900:force_original_aspect_ratio=decrease", "-frames:v", "1", str(target)])


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("folder", type=Path)
    parser.add_argument("--manifest", type=Path, default=ROOT / "catalog/imports/joeski-maya.json")
    parser.add_argument("--check", action="store_true", help="Validate the reviewed mapping without changing files")
    args = parser.parse_args()
    folder = args.folder.expanduser().resolve()
    manifest = json.loads(args.manifest.read_text())
    releases = load_generated("archive.generated.ts", "ARCHIVE_RELEASES")
    by_cat = {r["catalog_number"]: r for r in releases}
    for release in manifest["new_releases"]:
        by_cat.setdefault(release["catalog_number"], release)

    entries = {row["file"]: row for row in manifest["files"]}
    if len(entries) != len(manifest["files"]):
        raise ValueError("A filename is listed more than once in the manifest")
    actual = {p.name for p in folder.iterdir() if p.suffix.lower() in (".aiff", ".aif", ".wav")}
    if actual != set(entries):
        raise ValueError(f"Folder/manifest mismatch: unmapped={sorted(actual - set(entries))}; missing={sorted(set(entries) - actual)}")
    slots = set()
    for name, row in entries.items():
        if "pending" in row:
            continue
        if "duplicate_of" in row:
            if row["duplicate_of"] not in entries or "duplicate_of" in entries[row["duplicate_of"]]:
                raise ValueError(f"Invalid duplicate reference: {name}")
            continue
        cat = row["catalog_number"]
        pending_number = by_cat.get(cat, {}).get("catalog_number_pending") is True
        if cat not in by_cat or not (re.fullmatch(r"MAYA\d{3}", cat) or (cat == "TBC" and pending_number)):
            raise ValueError(f"Unknown catalog number: {cat}")
        tracks = by_cat[cat]["tracks"]
        if not any(t["position"] == row["position"] for t in tracks):
            raise ValueError(f"Missing track: {cat} #{row['position']}")
        slot = cat, row["position"]
        if slot in slots:
            raise ValueError(f"Two input files map to the same track: {slot}")
        slots.add(slot)
    if args.check:
        print(f"Validated {len(entries)} files: {len(slots)} tracks, {sum('duplicate_of' in r for r in entries.values())} duplicate copies, {sum('pending' in r for r in entries.values())} pending.")
        return

    masters_path = ROOT / "catalog/masters.json"
    old_masters = json.loads(masters_path.read_text()) if masters_path.exists() else {}
    # Replace this folder's earlier mappings while retaining other archive sources.
    masters = {cat: [p for p in paths if Path(p).parent.resolve() != folder] for cat, paths in old_masters.items()}
    jobs = []
    affected = set()
    covers = set()
    preview_count = 0
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        for name, row in entries.items():
            if "duplicate_of" in row or "pending" in row:
                continue
            source = folder / name
            duration, tags = probe(source)
            cat = row["catalog_number"]
            release = by_cat[cat]
            track = next(t for t in release["tracks"] if t["position"] == row["position"])
            track["duration_seconds"] = round(duration)
            if tags.get("TBPM"):
                track["bpm"] = float(tags["TBPM"])
            if tags.get("TKEY"):
                track["musical_key"] = tags["TKEY"]
            if not track.get("isrc") and tags.get("TSRC"):
                track["isrc"] = tags["TSRC"]
            if not release.get("genre"):
                release["genre"] = tags.get("genre")
            if not release.get("release_date") and re.fullmatch(r"\d{4}-\d{2}-\d{2}", tags.get("date", "")):
                release["release_date"] = tags["date"]
            if not track.get("preview_url"):
                path = ROOT / "public/media/previews" / f"{cat.lower()}-{track['position']}-folder.mp3"
                track["preview_url"] = "/" + str(path.relative_to(ROOT / "public"))
                if not path.exists():
                    jobs.append(pool.submit(preview, source, path, duration))
                    preview_count += 1
            if not release.get("cover_url") and cat not in covers:
                path = ROOT / "public/media/covers" / f"{cat.lower()}-folder.jpg"
                if not path.exists():
                    jobs.append(pool.submit(cover, source, path))
                release["cover_url"] = "/" + str(path.relative_to(ROOT / "public"))
                covers.add(cat)
            masters.setdefault(cat, []).append(str(source))
            release["has_master"] = True
            affected.add(cat)
        for job in concurrent.futures.as_completed(jobs):
            job.result()

    releases = sorted(by_cat.values(), key=lambda r: r["catalog_number"])
    write_generated("archive.generated.ts", "ARCHIVE_RELEASES", releases)
    artists = load_generated("artists.generated.ts", "ARCHIVE_ARTISTS")
    known = {artist["slug"] for artist in artists}
    for release in manifest["new_releases"]:
        if release["artist_slug"] not in known:
            artists.append({"slug": release["artist_slug"], "name": release["artist_name"]})
            known.add(release["artist_slug"])
    write_generated("artists.generated.ts", "ARCHIVE_ARTISTS", sorted(artists, key=lambda a: a["slug"]))
    masters = {cat: sorted(set(paths)) for cat, paths in sorted(masters.items()) if paths}
    masters_path.write_text(json.dumps(masters, indent=2, ensure_ascii=False) + "\n")
    print(f"Imported {len(slots)} tracks across {len(affected)} releases; {preview_count} new 60s previews, {len(covers)} covers; {len(releases)} total releases.")


if __name__ == "__main__":
    main()
