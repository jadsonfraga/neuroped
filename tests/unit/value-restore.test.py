"""Offline recovery-verifier tests. Synthetic data only; not a D1/production recovery claim."""
from pathlib import Path
import secrets
import sqlite3
import sys
import unittest
sys.path.insert(0, str(Path(__file__).resolve().parents[2] / 'scripts'))
from value_restore_verifier import manifest, verify_restored, run_synthetic_rehearsal

class RestoreIntegrity(unittest.TestCase):
    def setUp(self):
        self.source = sqlite3.connect(':memory:')
        self.source.executescript('''
          PRAGMA foreign_keys=ON;
          CREATE TABLE clinics(id TEXT PRIMARY KEY);
          CREATE TABLE records(id TEXT PRIMARY KEY, clinic_id TEXT REFERENCES clinics(id), payload BLOB);
          INSERT INTO clinics VALUES ('synthetic-alpha'), ('synthetic-beta');
          INSERT INTO records VALUES ('synthetic-record', 'synthetic-alpha', X'010203');
        ''')
        self.key = secrets.token_bytes(32)
        self.expected = manifest(self.source, self.key)
        self.restored = sqlite3.connect(':memory:')
        self.source.backup(self.restored)

    def tearDown(self):
        self.source.close(); self.restored.close()

    def test_real_backup_and_restore_match_all_tables(self):
        self.assertTrue(verify_restored(self.restored, self.expected, self.key)['verified'])

    def test_same_count_changed_content_fails(self):
        self.restored.execute("UPDATE records SET payload=X'040506'")
        with self.assertRaisesRegex(ValueError, 'RESTORE_CONTENT_MISMATCH'):
            verify_restored(self.restored, self.expected, self.key)

    def test_missing_row_fails(self):
        self.restored.execute('DELETE FROM records')
        with self.assertRaises(ValueError): verify_restored(self.restored, self.expected, self.key)

    def test_schema_drift_fails(self):
        self.restored.execute('ALTER TABLE records ADD COLUMN extra TEXT')
        with self.assertRaisesRegex(ValueError, 'RESTORE_SCHEMA_MISMATCH'):
            verify_restored(self.restored, self.expected, self.key)

    def test_foreign_key_break_fails(self):
        self.restored.execute("UPDATE records SET clinic_id='synthetic-missing'")
        with self.assertRaisesRegex(ValueError, 'RESTORE_FOREIGN_KEY_FAILURE'):
            verify_restored(self.restored, self.expected, self.key)

    def test_schema_version_drift_fails(self):
        self.restored.execute("PRAGMA user_version=7")
        with self.assertRaisesRegex(ValueError, "RESTORE_SCHEMA_MISMATCH"):
            verify_restored(self.restored, self.expected, self.key)

    def test_weak_manifest_key_rejected(self):
        with self.assertRaises(ValueError): manifest(self.source, b'weak')

    def test_report_does_not_contain_rows_or_key(self):
        import json
        report = json.dumps(verify_restored(self.restored, self.expected, self.key))
        self.assertNotIn('synthetic-record', report)
        self.assertNotIn(self.key.hex(), report)

    def test_rehearsal_measures_only_synthetic_rpo_rto(self):
        report = run_synthetic_rehearsal()
        self.assertTrue(report['restoreVerified'])
        self.assertEqual(report['dataset'], 'synthetic_projection')
        self.assertGreaterEqual(report['syntheticRtoSeconds'], 0)
        self.assertIsNone(report['productionRtoSeconds'])
        self.assertIsNone(report['productionRpoSeconds'])

if __name__ == '__main__': unittest.main()
