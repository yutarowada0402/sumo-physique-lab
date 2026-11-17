import unittest
from pipeline.collect import normalize, rank

class CollectorTests(unittest.TestCase):
    def profile(self, **patch):
        return dict(id=19, nskId=3842, shikonaEn='Hoshoryu', shikonaJp='豊昇龍　智勝', currentRank='Yokozuna 1 West', heya='Tatsunami', birthDate='1999-05-22T00:00:00Z', height=188, weight=148, **patch)

    def test_identity_and_source_ids_are_distinct(self):
        row = normalize(self.profile(), {'totalWins': 406, 'totalLosses': 240, 'totalAbsences': 49}, '2026-11-17')
        self.assertEqual(row['shikona'], '豊昇龍')
        self.assertEqual(row['rikishi_id'], 'sumo-api-19')
        self.assertTrue(row['source_url'].endswith('/3842/'))
        self.assertEqual(row['stable'], '立浪部屋')
        self.assertEqual(row['division'], 'makuuchi')
        self.assertEqual(row['rank_raw'], '西横綱')
        self.assertEqual(row['career_losses'], 240)

    def test_missing_is_not_zero(self):
        profile = self.profile()
        profile.update(height=0, weight=None, birthDate='', shikonaJp='魁禅(かいぜん)', currentRank='Jonokuchi 1 East')
        row = normalize(profile, {}, '2026-11-17')
        self.assertIsNone(row['height_cm'])
        self.assertIsNone(row['weight_kg'])
        self.assertIsNone(row['career_wins'])
        self.assertEqual(row['shikona_kana'], 'かいぜん')
        self.assertEqual(row['division'], 'jonokuchi')

    def test_unknown_rank_fails(self):
        with self.assertRaises(ValueError):
            rank('Mae-zumo')

class CollectionFailureTests(unittest.TestCase):
    def test_http_error_preserves_snapshot_and_does_not_retry(self):
        import json
        import tempfile
        import urllib.error
        from pathlib import Path
        from unittest.mock import patch
        from pipeline import collect
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            snapshot = root / 'data/real/snapshot.json'
            snapshot.parent.mkdir(parents=True)
            snapshot.write_text('previous snapshot')
            profiles = root / 'profiles.json'
            profiles.write_text(json.dumps({'total': 1, 'records': [{'id': 19}]}))
            with patch.object(collect, 'ROOT', root), patch('sys.argv', ['collect', '--profiles-file', str(profiles)]), patch.object(collect.time, 'sleep'), patch.object(collect, 'fetch', side_effect=urllib.error.HTTPError('url', 429, 'Too Many Requests', {}, None)) as request:
                with self.assertRaises(urllib.error.HTTPError):
                    collect.main()
            request.assert_called_once()
            self.assertEqual(snapshot.read_text(), 'previous snapshot')

    def test_incomplete_profiles_stop_before_any_statistics_requests(self):
        import json
        import tempfile
        from pathlib import Path
        from unittest.mock import patch
        from pipeline import collect
        with tempfile.TemporaryDirectory() as directory:
            profiles = Path(directory) / 'profiles.json'
            profiles.write_text(json.dumps({'total': 2, 'records': [{'id': 19}]}))
            with patch('sys.argv', ['collect', '--profiles-file', str(profiles)]), patch.object(collect, 'fetch') as request:
                with self.assertRaises(ValueError):
                    collect.main()
            request.assert_not_called()
