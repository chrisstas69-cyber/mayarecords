#!/usr/bin/env python3
"""Publish a fully extracted DJ mix inventory with reviewed SoundCloud sources and supplied covers only."""
import argparse
import hashlib
import importlib.util
import json
from pathlib import Path
import re
import shutil
import unicodedata
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('mix_import', ROOT / 'scripts/import-dj-mixes.py')
inspector = importlib.util.module_from_spec(spec)
spec.loader.exec_module(inspector)


def normalized(title):
    title = re.sub(r'^joeski\s*[-–—]?\s*', '', title, flags=re.I)
    return re.sub(r'[^a-z0-9]', '', unicodedata.normalize('NFKD', title).encode('ascii', 'ignore').decode().lower())


def soundcloud_url(value):
    u = urlsplit(value)
    if u.scheme != 'https' or u.netloc != 'soundcloud.com' or not re.fullmatch(r'/[a-zA-Z0-9_-]+/[a-zA-Z0-9_-]+', u.path) or u.query or u.fragment:
        raise ValueError('Expected an exact public SoundCloud track URL')
    return value


def digest(path):
    h = hashlib.sha256()
    with path.open('rb') as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b''):
            h.update(chunk)
    return h.hexdigest()


def publish(source, tracks, overrides, require_complete=True):
    if require_complete and not (source / 'IMPORT-COMPLETE.json').is_file():
        raise ValueError('Archive has not completed; do not publish a partial import')
    mixes, errors = inspector.inventory(source)
    if errors:
        raise ValueError(f'Invalid audio files: {errors}')
    if not mixes:
        raise ValueError('No completed mixes')
    index = {}
    for track in tracks:
        soundcloud_url(track['url'])
        index.setdefault(normalized(track['title']), []).append(track)
    rows, provenance, duplicates, hashes = [], {}, [], {}
    for entry in sorted(mixes, key=lambda row: (' (2)' in row['source_file'], row['source_file'])):
        checksum = digest(source / entry['source_file'])
        if checksum in hashes:
            duplicates.append({'source_file': entry['source_file'], 'same_as': hashes[checksum], 'sha256': checksum})
            continue
        hashes[checksum] = entry['source_file']
        override = overrides.get(entry['id'], {})
        candidates = index.get(normalized(override.get('title', entry['title'])), [])
        track = candidates[0] if len(candidates) == 1 else None
        if override.get('url'):
            track = next((t for t in tracks if t['url'] == override['url']), None)
            if not track:
                raise ValueError(f"Override URL lacks verified source: {entry['id']}")
        cover = entry['artwork_file']
        cover_url = None
        if cover:
            image = (source / cover).resolve(strict=True)
            if not image.is_relative_to(source) or image.is_symlink():
                raise ValueError('Unsafe artwork source')
            destination = ROOT / 'public/images/mixes' / (entry['id'] + image.suffix.lower())
            destination.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(image, destination)
            cover_url = '/' + destination.relative_to(ROOT / 'public').as_posix()
        title = override.get('title', entry['title'])
        slug = re.sub(r'[^a-z0-9]+', '-', unicodedata.normalize('NFKD', title).encode('ascii', 'ignore').decode().lower()).strip('-')[:100] + '-' + entry['id'][-8:]
        rows.append({'id': entry['id'], 'title': title, 'slug': slug, 'recorded_on': None, 'published_on': ((track.get('date') or '')[:10] or None) if track else None, 'archive_date': entry['archive_date'], 'duration_seconds': entry['duration_seconds'], 'description': None, 'cover_url': cover_url, 'audio_url': None, 'external_url': track['url'] if track else None, 'tracklist': None, 'featured': False})
        provenance[entry['id']] = {**entry, 'sha256': checksum, 'soundcloud': track, 'match': 'reviewed' if override.get('url') else 'normalized title' if track else 'pending', 'review_note': override.get('note')}
    rows.sort(key=lambda r: (r['published_on'] or r['archive_date'] or '', r['title']), reverse=True)
    if len({row['external_url'] for row in rows if row['external_url']}) != sum(bool(row['external_url']) for row in rows):
        raise ValueError('Two distinct recordings point to the same stream; review before publishing')
    audit = {'archive_complete': require_complete, 'source_mix_count': len(mixes), 'published_mix_count': len(rows), 'verified_soundcloud_count': sum(bool(r['external_url']) for r in rows), 'pending_soundcloud_count': sum(not r['external_url'] for r in rows), 'artwork_count': sum(bool(r['cover_url']) for r in rows), 'duplicates': duplicates}
    return rows, provenance, audit


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source', type=Path, required=True)
    parser.add_argument('--verified-tracks', type=Path, required=True)
    args = parser.parse_args()
    source = args.source.resolve(strict=True)
    tracks = json.loads(args.verified_tracks.read_text())
    overrides = json.loads((ROOT / 'data/joeski-mixes-overrides.json').read_text())
    rows, provenance, audit = publish(source, tracks, overrides)
    verified = {item['soundcloud']['url']: item['soundcloud'] for item in provenance.values() if item['soundcloud']}
    for name, value in [('joeski-mixes.json', rows), ('joeski-mixes-sources.json', provenance), ('joeski-mixes-import.json', audit), ('joeski-mixes-verified-tracks.json', sorted(verified.values(), key=lambda t: t['url']))]:
        (ROOT / 'data' / name).write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps(audit, indent=2))


if __name__ == '__main__':
    main()
