"""Real SQLite execution of the evidence query on synthetic schema projections, not D1 E2E."""
import json
from pathlib import Path
import re
import sqlite3
import unittest
ROOT = Path(__file__).resolve().parents[2]
SQL = re.search(r'PRODUCT_EVIDENCE_SQL = `([\s\S]*?)`;', (ROOT / 'functions/api/tenant/_productEvidence.ts').read_text()).group(1)

class ProductEvidenceScope(unittest.TestCase):
    def setUp(self):
        self.db = sqlite3.connect(':memory:'); self.db.row_factory = sqlite3.Row
        self.db.executescript('''
          CREATE TABLE users(id TEXT PRIMARY KEY, is_active INTEGER);
          CREATE TABLE clinics(id TEXT PRIMARY KEY, status TEXT);
          CREATE TABLE clinic_memberships(clinic_id TEXT, user_id TEXT, role TEXT, active INTEGER);
          CREATE TABLE billing_customers(id TEXT PRIMARY KEY, clinic_id TEXT);
          CREATE TABLE billing_subscriptions(customer_id TEXT, status TEXT);
          CREATE TABLE live_patients(clinic_id TEXT, status TEXT);
          CREATE TABLE live_documents(clinic_id TEXT, status TEXT);
          CREATE TABLE live_clinical_events(clinic_id TEXT, status TEXT);
          CREATE TABLE live_assessments(clinic_id TEXT, status TEXT);
          CREATE TABLE saas_audit_log(clinic_id TEXT);
          INSERT INTO users VALUES ('alpha-owner',1), ('beta-owner',1), ('platform-admin',1);
          INSERT INTO clinics VALUES ('alpha','active'), ('beta','active');
          INSERT INTO clinic_memberships VALUES ('alpha','alpha-owner','owner',1), ('beta','beta-owner','owner',1);
          INSERT INTO billing_customers VALUES ('beta-customer','beta');
          INSERT INTO billing_subscriptions VALUES ('beta-customer','active');
          INSERT INTO live_patients VALUES ('beta','active');
        ''')
    def tearDown(self): self.db.close()
    def read(self, clinic='alpha', actor='alpha-owner'):
        return self.db.execute(SQL, (clinic, actor, json.dumps(['owner','clinic_admin']))).fetchone()
    def test_foreign_missing_and_injected_identifiers_are_indistinguishable(self):
        for clinic in ('beta','missing',"alpha' OR 1=1 --"): self.assertIsNone(self.read(clinic))
    def test_zero_is_real_and_beta_counts_do_not_leak(self):
        self.assertEqual(self.read()['patients'],0)
        self.assertEqual(self.read()['active_subscription_records'],0)
        self.assertEqual(self.read('beta','beta-owner')['patients'],1)
    def test_revocation_permission_and_platform_admin_fail_closed(self):
        self.assertIsNone(self.read(actor='platform-admin'))
        self.db.execute("UPDATE clinic_memberships SET role='financial' WHERE clinic_id='alpha'")
        self.assertIsNone(self.read())
        self.db.execute("UPDATE clinic_memberships SET role='owner',active=0 WHERE clinic_id='alpha'")
        self.assertIsNone(self.read())
    def test_inactive_user_and_clinic_fail_closed(self):
        self.db.execute("UPDATE users SET is_active=0 WHERE id='alpha-owner'")
        self.assertIsNone(self.read())
        self.db.execute("UPDATE users SET is_active=1 WHERE id='alpha-owner'")
        self.db.execute("UPDATE clinics SET status='closed' WHERE id='alpha'")
        self.assertIsNone(self.read())
    def test_clinical_states_are_not_mislabelled(self):
        self.db.execute("INSERT INTO live_documents VALUES ('alpha','draft')")
        self.db.execute("INSERT INTO live_patients VALUES ('alpha','merged')")
        self.db.execute("INSERT INTO live_clinical_events VALUES ('alpha','voided')")
        row = self.read()
        self.assertEqual((row['documents'], row['patients'], row['clinical_events']), (0,0,0))
if __name__ == '__main__': unittest.main()
