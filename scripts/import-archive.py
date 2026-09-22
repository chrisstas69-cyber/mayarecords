#!/usr/bin/env python3
"""
Local media import for the demo catalog (no Supabase needed).

  python3 scripts/import-archive.py

Reads the Maya archive + Joeski Edits folders, then writes:
  public/media/covers/<cat>.jpg          release artwork (900px)
  public/media/previews/<cat>-<n>.mp3    90s public release previews
  public/media/edits/<slug>.jpg          edit artwork
  public/media/edits/<slug>-preview.mp3  60s public edit previews
  private-media/edits/<slug>.wav|.mp3    full edits — served only to subscribers
  src/lib/data/archive.generated.ts      release catalog
  src/lib/data/edits.generated.ts        edits catalog

Media dirs are gitignored. Once Supabase is live, use /admin/bulk → Folder
import instead; this script is for local previewing.
"""
import json
import os
import re
import shutil
import subprocess
from datetime import date, timedelta
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ARCHIVE = Path.home() / "Downloads/Maya Records Archive/01 Releases by Catalog Number"
EDITS = Path.home() / "Downloads/Joeski Edits"

PUB = ROOT / "public/media"
PRIV = ROOT / "private-media/edits"

# Titles/artists read off the sleeves. Tracks: (title, source filename or None).
RELEASES = {
    "MAYA156": ("I Am", "joeski", "Joeski feat. De No", []),
    "MAYA157": ("Rose EP", "juanito", "Juanito", [
        ("Long Ride (Original Mix)", "01 - Juanito - Long Ride (Original Mix) [-6dB, 24Bit].wav"),
        ("Long Ride (Radio Edit)", "02 - Juanito - Long Ride (Radio Edit) [-6dB, 24Bit].wav"),
        ("Rose (Original Mix)", "03 - Juanito - Rose (Original Mix) [-6dB, 24Bit].wav"),
        ("Rose (Radio Edit)", "04 - Juanito - Rose (Radio Edit) [-6dB, 24Bit].wav"),
    ]),
    "MAYA158": ("Talk To Me", "joeski", "Joeski feat. Rachel", [("Talk To Me", "MAYA158_1.wav")]),
    "MAYA159": ("Hey Fellas", "joeski", "Joeski", [("Hey Fellas", "MAYA159_1.wav")]),
    "MAYA160": ("Fantasy EP", "hipp-e", "Hipp-E", [
        ("Fantasy EP — Track 1", "MAYA160_1.wav"),
        ("Fantasy EP — Track 2", "MAYA160_2.wav"),
    ]),
    "MAYA161": ("I Rise", "joeski", "Joeski", [("I Rise", "MAYA161_1.wav")]),
    "MAYA162": ("Toxic", "joeski", "Joeski", [("Toxic", "MAYA162_1.wav")]),
    "MAYA163": ("Reach For The Stars", "joeski", "Joeski feat. Rachel", [("Reach For The Stars", "Reach for the Stars -Master.wav")]),
    "MAYA164": ("Jump Up!", "joeski", "Joeski", [("Jump Up!", "MAYA164_1.wav")]),
    "MAYA165": ("Dub", "joeski", "Joeski", [("Dub", "MAYA165_1.wav")]),
    "MAYA166": ("I Remember House", "joeski", "Joeski", [("I Remember House (Damian Lazarus Re-Shape)", "I Remember House (Damian Lazurus Re-Shape.wav")]),
    "MAYA167": ("Freedom Now!", "joeski", "Joeski", [("Freedom Now!", "Freedom Now! wav.wav")]),
    "MAYA168": ("Somebody", "joeski", "Joeski", [("Somebody", "Somebody .wav")]),
    "MAYA169": ("Sax Hustler", "joeski", "Joeski feat. Sax Kitten", [("Sax Hustler", "Sax Hustler -Master.wav")]),
    "MAYA170": ("Chico", "hr-ski", "HR&Ski", [("Chico", "CHICO .wav")]),
    "MAYA171": ("Asi Me Gusta", "el-jibaro", "El Jibaro", [("Asi Me Gusta", "Asi Me Gusta -Master.aif")]),
    "MAYA172": ("Be Free", "joeski", "Joeski feat. Rachel", [("Be Free", "Be Free .wav")]),
    "MAYA173": ("Courage", "joeski", "Joeski", [
        ("Courage", "Courage -Master.wav"),
        ("Make A Move (Juanito)", "Juanito_Make_A_Move MASTER.wav"),
    ]),
    "MAYA174": ("20 Years of Maya", "joeski", "Joeski", [
        ("Carrion (Original Reprise)", "1.Carrion (Original Reprise) -Master.wav"),
        ("African Sunrise", "2.African Sunrise -Master.wav"),
        ("Into The Future", "3.Into The Future -Master.wav"),
        ("Soledad", "4.Soledad -Master.wav"),
        ("Slave To Your Love (feat. Rachel)", "5.Slave To your Love -Master.wav"),
        ("Sunset In Uganda", "6.Sunsent in Uganda -Master.wav"),
        ("Dub Eyes", "7.Dub Eyes -Master.wav"),
        ("My Cello", "8.My Cello -Master.wav"),
        ("Love Tribe", "9.Love Tribe -Master.wav"),
        ("Love Without Judgement", "10.Love Without Judgement.wav"),
        ("Close Your Eyes", "11.Close Your Eyes -Master.wav"),
        ("I'm Happy (On Acid Mix)", "12.I'm Happy (On Acid) -Master.wav"),
    ]),
    "MAYA181": ("NY Strong", "joeski", "Joeski", [("NY Strong (Radio Mix)", "Joeski - NY Strong (Radio Mix).wav")]),
    "MAYA188": ("Tierra Linda", "joeski", "Joeski", [
        ("Tierra Linda (Extended Mix)", "Joeski - Tierra Linda (Extended Mix) .wav"),
        ("Tierra Linda (Radio Edit)", "Joeski - Tierra Linda (Radio Edit).wav"),
    ]),
    "MAYA242": ("Chaaman", "kaax", "K'áax", []),
    "MAYA245": ("Furia EP", "david-herrero", "David Herrero", []),
    "MAYA246": ("Haunted By You", "joeski", "Joeski", []),
    "MAYA247": ("Flor De Un Dia", "kaax", "K'áax", []),
    "MAYA248": ("Boombastic", "joeski", "Joeski", []),
    "MAYA249": ("Illuminated", "kaax", "K'áax", []),
    "MAYA253": ("Music Is Everything", "joeski", "Joeski", []),
}

# (image filename, wav filename, original artist, title) — matched by reading the label art.
EDIT_LIST = [
    ("ChatGPT Image Sep 20, 2026, 01_18_23 PM.png", "Joeski Vs Eddie Kendricks - Change Of Mind (Joeski Edit).wav", "Eddie Kendricks", "Change Of Mind"),
    ("ChatGPT Image Sep 20, 2026, 01_20_10 PM.png", "Joeski Vs Terror Squad - Lean Back (Joeski Edit).wav", "Terror Squad", "Lean Back"),
    ("ChatGPT Image Sep 20, 2026, 01_21_42 PM.png", "Joeski VS Fleetwood Mac - Dreams (Joeski Edit).wav", "Fleetwood Mac", "Dreams"),
    ("ChatGPT Image Sep 20, 2026, 01_27_57 PM.png", "Joeski Vs 50 Cent - Hate It Or Love It (Joeski Edit).wav", "50 Cent", "Hate It Or Love It"),
    ("ChatGPT Image Sep 20, 2026, 01_29_02 PM.png", "Joeski Vs Aventura - Amor De Madre (Joeski Edit).wav", "Aventura", "Amor De Madre"),
    ("ChatGPT Image Sep 20, 2026, 01_30_02 PM.png", "Joeski Vs Aventura- Obsession (Joeski Edit).wav", "Aventura", "Obsession"),
    ("ChatGPT Image Sep 20, 2026, 01_32_40 PM.png", "Joeski Vs Bia - Plate (Joeski Edit).wav", "Bia", "Plate"),
    ("ChatGPT Image Sep 20, 2026, 01_34_10 PM.png", "Joeski Vs The Cure - A Forest (Joeski Edit).wav", "The Cure", "A Forest"),
    ("ChatGPT Image Sep 20, 2026, 01_35_04 PM.png", "Joeski Vs Los Enanitos Verdes - Lamento Boliviano(Joeski Edit).wav", "Los Enanitos Verdes", "Lamento Boliviano"),
    ("ChatGPT Image Sep 20, 2026, 01_36_13 PM.png", "Joeski VS Carl Bean - Born this Way (Joeski Edit).wav", "Carl Bean", "Born This Way"),
    ("ChatGPT Image Sep 20, 2026, 01_57_29 PM.png", "Joeski Vs 50 Centfeat Chris Brown - Im The Man (Joeski Edit).wav", "50 Cent feat. Chris Brown", "I'm The Man"),
]
# One edit per week, Fridays. The first drop is backdated so the demo shows a mix of out + upcoming.
FIRST_DROP = date(2026, 8, 14)


def slugify(s: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", s.lower().replace("'", "").replace("&", "and")).strip("-")


def duration(path: Path) -> int:
    out = subprocess.run(
        ["ffprobe", "-v", "quiet", "-show_entries", "format=duration", "-of", "csv=p=0", str(path)],
        capture_output=True, text=True, check=True,
    ).stdout.strip()
    return int(float(out))


def clip(src: Path, dst: Path, seconds: int, total: int, bitrate: str = "192k") -> None:
    if dst.exists():
        return
    start = max(0, min(int(total * 0.3), total - seconds))
    fade_out = max(0, seconds - 3)
    subprocess.run(
        ["ffmpeg", "-v", "error", "-y", "-ss", str(start), "-t", str(seconds), "-i", str(src),
         "-af", f"afade=t=in:d=1,afade=t=out:st={fade_out}:d=3",
         "-ac", "2", "-b:a", bitrate, str(dst)],
        check=True,
    )


def encode_full(src: Path, dst: Path) -> None:
    if dst.exists():
        return
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(src), "-ac", "2", "-b:a", "320k", str(dst)], check=True)


def image(src: Path, dst: Path, size: int = 900) -> None:
    if dst.exists():
        return
    subprocess.run(["sips", "-s", "format", "jpeg", "-Z", str(size), str(src), "--out", str(dst)],
                   capture_output=True, check=True)


def build_releases() -> list[dict]:
    (PUB / "covers").mkdir(parents=True, exist_ok=True)
    (PUB / "previews").mkdir(parents=True, exist_ok=True)
    out = []
    for cat, (title, artist_slug, artist_name, tracks) in RELEASES.items():
        folder = ARCHIVE / cat
        cover = PUB / "covers" / f"{cat.lower()}.jpg"
        art = sorted((folder / "Artwork").glob("*.[jJpP][pPnN][gG]")) if (folder / "Artwork").exists() else []
        if art:
            preferred = [a for a in art if a.stem == cat] or [a for a in art if a.suffix.lower() == ".jpg"] or art
            image(preferred[0], cover)
        track_rows = []
        for i, (ttitle, fname) in enumerate(tracks, start=1):
            src = folder / "WAV" / fname
            total = duration(src)
            preview = PUB / "previews" / f"{cat.lower()}-{i}.mp3"
            clip(src, preview, 90, total)
            track_rows.append({
                "position": i, "title": ttitle, "duration_seconds": total,
                "preview_url": f"/media/previews/{preview.name}",
            })
        out.append({
            "catalog_number": cat, "title": title, "artist_slug": artist_slug, "artist_name": artist_name,
            "cover_url": f"/media/covers/{cover.name}" if cover.exists() else None,
            "tracks": track_rows,
        })
        print(f"release {cat}: {title} ({len(track_rows)} tracks)")
    return out


def build_edits() -> list[dict]:
    (PUB / "edits").mkdir(parents=True, exist_ok=True)
    PRIV.mkdir(parents=True, exist_ok=True)
    out = []
    for n, (img, wav, original, title) in enumerate(EDIT_LIST):
        slug = slugify(f"{original} {title}")
        src = EDITS / wav
        total = duration(src)
        image(EDITS / img, PUB / "edits" / f"{slug}.jpg", 800)
        clip(src, PUB / "edits" / f"{slug}-preview.mp3", 60, total, "160k")
        encode_full(src, PRIV / f"{slug}.mp3")
        if not (PRIV / f"{slug}.wav").exists():
            shutil.copy2(src, PRIV / f"{slug}.wav")
        out.append({
            "slug": slug, "title": title, "original_artist": original,
            "drop_date": (FIRST_DROP + timedelta(weeks=n)).isoformat(),
            "duration_seconds": total,
            "cover_url": f"/media/edits/{slug}.jpg",
            "preview_url": f"/media/edits/{slug}-preview.mp3",
            "wav_bytes": src.stat().st_size,
        })
        print(f"edit {slug} → drops {out[-1]['drop_date']}")
    return out


HEADER = "// Generated by scripts/import-archive.py — edit the script, not this file.\n"


def main() -> None:
    releases = build_releases()
    (ROOT / "src/lib/data/archive.generated.ts").write_text(
        HEADER + "export const ARCHIVE_RELEASES = " + json.dumps(releases, indent=2, ensure_ascii=False) + " as const;\n"
    )
    edits = build_edits()
    (ROOT / "src/lib/data/edits.generated.ts").write_text(
        HEADER + "export const EDITS_DATA = " + json.dumps(edits, indent=2, ensure_ascii=False) + " as const;\n"
    )


if __name__ == "__main__":
    main()
