"""Actual SQLite execution of the production query on synthetic schema projections.
Not a full-migration/D1/browser/customer-zero test.
"""
import json
from pathlib import Path
import re
import sqlite3
import unittest

ROOT = Path(__file__).resolve().parents[2]
SQL = re.search(r'ONBOARDING_PROGRESS_SQL = `([\s\S]*?)`;', (ROOT / 'functions/api/tenant/_onboardingProgress.ts').read_text()).group(1)
ROLES = json.dumps(['owner', 'clinic_admin'])  # Matches the inspected central organization.metrics.read catalog.

class OnboardingScope(unittest.TestCase):
    def setUp(self):
        self.db = sqlite3.connect(':memory:')
        self.db.row_factory = sqlite3.Row
        self.db.executescript('''
          CREATE TABLE users(id TEXT PRIMARY KEY, created_at TEXT, email_verified_at TEXT, is_active INTEGER);
          CREATE TABLE clinics(id TEXT PRIMARY KEY, created_at TEXT, status TEXT);
          CREATE TABLE clinic_memberships(clinic_id TEXT, user_id TEXT, role TEXT, active INTEGER, created_at TEXT);
          CREATE TABLE billing_customers(id TEXT PRIMARY KEY, clinic_id TEXT);
          CREATE TABLE billing_provider_checkouts(billing_customer_id TEXT, created_at TEXT);
          CREATE TABLE live_patients(clinic_id TEXT, created_at TEXT);
          CREATE TABLE live_clinical_events(clinic_id TEXT, created_at TEXT, event_type TEXT, status TEXT);
          CREATE TABLE live_documents(clinic_id TEXT, created_at TEXT, status TEXT);
          CREATE TABLE live_assessments(clinic_id TEXT, created_at TEXT, status TEXT);
          INSERT INTO users VALUES ('owner-alpha','2026-09-01 00:00:00',NULL,1), ('owner-beta','2026-09-01 00:00:00',NULL,1), ('platform-admin','2026-09-01 00:00:00',NULL,1);
          INSERT INTO clinics VALUES ('alpha','2026-09-01 00:00:00','active'), ('beta','2026-09-01 00:00:00','active');
          INSERT INTO clinic_memberships VALUES ('alpha','owner-alpha','owner',1,'2026-09-01 00:00:00'), ('beta','owner-beta','owner',1,'2026-09-01 00:00:00');
          INSERT INTO live_patients VALUES ('beta','2026-09-02 00:00:00');
        ''')

    def tearDown(self):
        self.db.close()

    def read(self, clinic='alpha', actor='owner-alpha', roles=ROLES):
        return self.db.execute(SQL, (clinic, actor, roles)).fetchone()

    def test_foreign_missing_and_injection_return_no_row(self):
        for clinic in ('beta', 'missing', "alpha' OR 1=1 --"):
            self.assertIsNone(self.read(clinic))

    def test_authorized_empty_tenant_does_not_inherit_beta(self):
        self.assertIsNone(self.read()['first_patient'])
        self.assertIsNotNone(self.read('beta', 'owner-beta')['first_patient'])

    def test_global_admin_is_not_tenant_bypass(self):
        self.assertIsNone(self.read(actor='platform-admin'))

    def test_revocation_and_clinic_suspension_take_effect_in_final_query(self):
        self.db.execute("UPDATE clinic_memberships SET active=0 WHERE clinic_id='alpha'")
        self.assertIsNone(self.read())
        self.db.execute("UPDATE clinic_memberships SET active=1 WHERE clinic_id='alpha'")
        self.db.execute("UPDATE clinics SET status='suspended' WHERE id='alpha'")
        self.assertIsNone(self.read())

    def test_central_permission_roles_fail_closed(self):
        self.assertIsNone(self.read(roles='[]'))
        self.db.execute("UPDATE clinic_memberships SET role='financial' WHERE clinic_id='alpha'")
        self.assertIsNone(self.read())

    def test_earliest_timestamp_uses_instant_not_string_order(self):
        self.db.executemany('INSERT INTO live_patients VALUES (?, ?)', [
            ('alpha', '2026-09-20 20:00:00'), ('alpha', '2026-09-20T12:00:00Z')])
        self.assertEqual(self.read()['first_patient'], '2026-09-20T12:00:00Z')

    def test_voided_clinical_records_do_not_mark_current_progress(self):
        self.db.execute("INSERT INTO live_documents VALUES ('alpha','2026-09-20 00:00:00','voided')")
        self.assertIsNone(self.read()['first_document'])

if __name__ == '__main__':
    unittest.main()
