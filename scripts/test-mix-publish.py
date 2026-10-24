import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('publish', Path(__file__).with_name('publish-dj-mixes.py'))
publisher = importlib.util.module_from_spec(spec)
spec.loader.exec_module(publisher)


class MixPublishTests(unittest.TestCase):
    def test_incomplete_archive_is_refused_before_any_output(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            with self.assertRaisesRegex(ValueError, 'has not completed'):
                publisher.publish(root, [], {})
            self.assertEqual(list(root.iterdir()), [])

    def test_unsafe_source_urls_are_rejected(self):
        for value in ['https://evil.test/u/m', 'https://soundcloud.com/u', 'https://soundcloud.com/u/sets/x', 'http://soundcloud.com/u/m', 'https://a:b@soundcloud.com/u/m', 'https://soundcloud.com/u/m?token=secret']:
            with self.assertRaises(ValueError):
                publisher.soundcloud_url(value)

    def test_duplicate_bytes_are_one_mix_not_two_and_unknown_links_stay_null(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            source = root / 'input'
            source.mkdir()
            (source / 'IMPORT-COMPLETE.json').write_text('{}')
            for name, data in [('one.mp3', b'audio'), ('one (2).mp3', b'audio'), ('unknown.mp3', b'other')]:
                (source / name).write_bytes(data)
            def row(name, title):
                return {'id': name, 'title': title, 'source_file': name + '.mp3', 'artwork_file': None, 'archive_date': '2020-01-01', 'duration_seconds': 3600}
            rows = [row('one', 'Example'), row('one (2)', 'Example'), row('unknown', 'Unverified')]
            track = {'title': 'Joeski - Example', 'url': 'https://soundcloud.com/djjoeski/example', 'date': '2020-01-02T12:00:00Z'}
            with patch.object(publisher, 'ROOT', root), patch.object(publisher.inspector, 'inventory', return_value=(rows, [])):
                output, sources, audit = publisher.publish(source, [track], {})
            self.assertEqual(len(output), 2)
            self.assertEqual(audit['source_mix_count'], 3)
            self.assertEqual(len(audit['duplicates']), 1)
            self.assertEqual(audit['verified_soundcloud_count'], 1)
            self.assertEqual(audit['pending_soundcloud_count'], 1)
            self.assertEqual(next(r for r in output if r['id'] == 'one')['published_on'], '2020-01-02')
            self.assertIsNone(next(r for r in output if r['id'] == 'unknown')['external_url'])
            self.assertTrue(all(r['recorded_on'] is None and r['audio_url'] is None for r in output))

    def test_unobserved_override_and_conflicting_stream_are_not_published(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / 'IMPORT-COMPLETE.json').write_text('{}')
            (root / 'a.mp3').write_bytes(b'a')
            (root / 'b.mp3').write_bytes(b'b')
            rows = [{'id': name, 'source_file': name + '.mp3', 'title': 'Same title', 'artwork_file': None, 'archive_date': None, 'duration_seconds': 3600} for name in ['a', 'b']]
            track = {'title': 'Same title', 'url': 'https://soundcloud.com/djjoeski/same-title', 'date': None}
            with patch.object(publisher.inspector, 'inventory', return_value=(rows, [])):
                with self.assertRaisesRegex(ValueError, 'lacks verified source'):
                    publisher.publish(root, [track], {'a': {'url': 'https://soundcloud.com/djjoeski/not-observed'}})
                with self.assertRaisesRegex(ValueError, 'same stream'):
                    publisher.publish(root, [track], {})


if __name__ == '__main__':
    unittest.main()
