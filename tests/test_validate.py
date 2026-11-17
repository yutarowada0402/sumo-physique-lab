import unittest
from pipeline.validate import validate
class ValidationTests(unittest.TestCase):
    def test_warning_preserves_record(self):
        report = validate([{"rikishi_id": "x", "division": "juryo", "height_cm": 999}])
        self.assertEqual(report["count"], 1)
        self.assertEqual(len(report["warnings"]), 1)
        self.assertFalse(report["errors"])
    def test_invalid_duplicate_and_dates(self):
        rows=[{"rikishi_id":"x", "division":"juryo", "career_wins":-1, "performance_as_of":"a"},{"rikishi_id":"x", "division":"invalid", "performance_as_of":"b"}]
        self.assertEqual(len(validate(rows)["errors"]), 4)
if __name__ == "__main__": unittest.main()
