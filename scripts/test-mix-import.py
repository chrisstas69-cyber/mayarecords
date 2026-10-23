import importlib.util
from pathlib import Path
import tempfile
import unittest

spec = importlib.util.spec_from_file_location('mix_import', Path(__file__).with_name('import-dj-mixes.py'))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class MixImportTests(unittest.TestCase):
    def test_supplied_date_and_tagged_title(self):
        self.assertEqual(module.title_and_date('2012-07-09 - Joeski -Live at time nyc', {}), ('Live at time nyc', '2012-07-09'))
        self.assertEqual(module.title_and_date('2012-07-09 - filename', {'title': 'Joeski — Studio Session'}), ('Studio Session', '2012-07-09'))

    def test_unknown_date_stays_unknown_and_invalid_date_is_rejected(self):
        self.assertEqual(module.title_and_date('Undated mix', {}), ('Undated mix', None))
        with self.assertRaises(ValueError):
            module.title_and_date('2012-99-09 - Invalid', {})

    def test_incomplete_files_and_mac_metadata_are_excluded(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / '2013-02-22 - DEEPER RYTHMS VOL 2.mp3').write_bytes(b'audio')
            (root / '2013-02-22 - DEEPER RYTHMS VOL 2.JPG').write_bytes(b'art')
            (root / '2013-02-22 - Not finished.mp3.importing').write_bytes(b'partial')
            (root / '__MACOSX').mkdir()
            (root / '__MACOSX' / '._test.mp3').write_bytes(b'metadata')
            (root / 'alias.mp3').symlink_to(root / '2013-02-22 - DEEPER RYTHMS VOL 2.mp3')
            inspect = lambda _: (4544, {}, {'codec_name': 'mp3'})
            rows, errors = module.inventory(root, inspect)
            self.assertEqual(len(rows), 1)
            self.assertEqual(errors, [])
            self.assertTrue(rows[0]['artwork_file'].endswith('.JPG'))
            self.assertEqual(rows[0]['external_url'], None)
            self.assertEqual(rows[0]['audio_url'], None)
            self.assertEqual(rows, module.inventory(root, inspect)[0])

    def test_bad_audio_is_reported_not_imported(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / 'bad.mp3').write_bytes(b'not audio')
            def fail(_):
                raise ValueError('No audio stream')
            rows, errors = module.inventory(root, fail)
            self.assertEqual(rows, [])
            self.assertEqual(errors[0]['error'], 'ValueError')


if __name__ == '__main__':
    unittest.main()
