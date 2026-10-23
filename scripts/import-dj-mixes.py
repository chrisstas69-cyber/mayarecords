#!/usr/bin/env python3
"""Inspect the supplied DJ mix folder without publishing incomplete imports or copying audio into Git."""
import argparse
import datetime as dt
import hashlib
import json
import math
from pathlib import Path
import re
import subprocess
import unicodedata

AUDIO_EXTENSIONS = {'.mp3', '.wav', '.aiff', '.aif', '.flac', '.m4a', '.ogg'}
IMAGE_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.webp'}
DATE_PREFIX = re.compile(r'^(\d{4}-\d{2}-\d{2})\s*[-–—]\s*(.+)$')


def title_and_date(stem, tags):
    match = DATE_PREFIX.match(stem)
    date = None
    title = stem
    if match:
        date = dt.date.fromisoformat(match[1]).isoformat()
        title = match[2].strip()
    tagged = tags.get('title', '').strip()
    if tagged:
        title = tagged
    title = re.sub(r'^Joeski\s*[-–—]\s*', '', title, flags=re.I).strip()
    return title or stem, date


def probe(path):
    result = subprocess.run(
        ['ffprobe', '-v', 'error', '-show_entries', 'format=duration,bit_rate:format_tags:stream=codec_type,codec_name,sample_rate,channels', '-of', 'json', str(path)],
        check=True, capture_output=True, text=True, timeout=30,
    )
    data = json.loads(result.stdout)
    duration = float(data.get('format', {}).get('duration', 0))
    if not math.isfinite(duration) or duration <= 0:
        raise ValueError('Missing or invalid audio duration')
    stream = next((s for s in data.get('streams', []) if s.get('codec_type') == 'audio'), None)
    if not stream:
        raise ValueError('No audio stream')
    tags = {k.lower(): v for k, v in data.get('format', {}).get('tags', {}).items() if isinstance(v, str)}
    return round(duration), tags, stream


def inventory(root, inspect=probe):
    root = root.resolve(strict=True)
    paths = sorted((p for p in root.rglob('*') if p.is_file() and not p.is_symlink() and '__MACOSX' not in p.parts), key=lambda p: str(p).casefold())
    images = {unicodedata.normalize('NFC', str(p.relative_to(root).with_suffix(''))).casefold(): p for p in paths if p.suffix.lower() in IMAGE_EXTENSIONS}
    entries, errors = [], []
    for path in paths:
        if path.suffix.lower() not in AUDIO_EXTENSIONS:
            continue
        relative = path.relative_to(root).as_posix()
        try:
            if not path.resolve().is_relative_to(root):
                raise ValueError('Source escapes the supplied folder')
            duration, tags, stream = inspect(path)
            title, date = title_and_date(path.stem, tags)
            image = images.get(unicodedata.normalize('NFC', str(path.relative_to(root).with_suffix(''))).casefold())
            identifier = 'mix-' + hashlib.sha256(relative.encode('utf-8')).hexdigest()[:16]
            entries.append({
                'id': identifier,
                'title': title,
                'archive_date': date,
                'date_source': 'supplied filename' if date else None,
                'duration_seconds': duration,
                'source_file': relative,
                'source_bytes': path.stat().st_size,
                'artwork_file': image.relative_to(root).as_posix() if image else None,
                'codec': stream.get('codec_name'),
                'sample_rate': stream.get('sample_rate'),
                'channels': stream.get('channels'),
                'audio_url': None,
                'external_url': None,
            })
        except (ValueError, subprocess.SubprocessError, OSError, json.JSONDecodeError) as error:
            errors.append({'source_file': relative, 'error': type(error).__name__})
    entries.sort(key=lambda row: (row['archive_date'] or '', row['title'].casefold()), reverse=True)
    return entries, errors


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source', required=True, type=Path)
    parser.add_argument('--manifest', required=True, type=Path)
    parser.add_argument('--allow-incomplete', action='store_true', help='Inspect only completed files while the ZIP is still arriving; never a publication signal.')
    args = parser.parse_args()
    root = args.source.resolve(strict=True)
    complete = (root / 'IMPORT-COMPLETE.json').is_file()
    if not complete and not args.allow_incomplete:
        parser.error('Archive extraction is not complete. Wait for IMPORT-COMPLETE.json; --allow-incomplete is inspection only.')
    entries, errors = inventory(root)
    result = {
        'schema_version': 1,
        'archive_complete': complete,
        'ready_for_publication': False,
        'mix_count': len(entries),
        'total_duration_seconds': sum(row['duration_seconds'] for row in entries),
        'paired_artwork_count': sum(bool(row['artwork_file']) for row in entries),
        'errors': errors,
        'mixes': entries,
    }
    args.manifest.parent.mkdir(parents=True, exist_ok=True)
    args.manifest.write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({key: value for key, value in result.items() if key != 'mixes'}, indent=2))
    if errors:
        raise SystemExit(1)


if __name__ == '__main__':
    main()
