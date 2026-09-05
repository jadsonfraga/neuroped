"""Blank-template delivery contract; no real SMTP or account mutation."""
import copy
import importlib.util
import json
import os
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location("delivery", ROOT / "scripts/authorial_scale_delivery.py")
delivery = importlib.util.module_from_spec(spec)
spec.loader.exec_module(delivery)

class DeliveryTest(unittest.TestCase):
    def setUp(self):
        self.rows = json.loads((ROOT / "client/src/data/authorialMonitoring.json").read_text())
    def test_originals_are_already_sent(self):
        receipts = json.loads((ROOT / "config/authorial-mail-bootstrap.json").read_text())
        originals = [r for r in self.rows if r["id"] in {"afi12-sdg", "sdrd12-sdg", "sarf12-sdg"}]
        self.assertEqual(len(originals), 3)
        self.assertEqual(delivery.select_pending(originals, receipts["receipts"]), [])
    def test_future_model_remains_pending(self):
        row = copy.deepcopy(self.rows[0]); row["id"] = "fixture-novo-modelo"
        receipts = json.loads((ROOT / "config/authorial-mail-bootstrap.json").read_text())
        self.assertEqual(delivery.select_pending([row], receipts["receipts"]), [row])
    def test_fingerprint_order_independent(self):
        self.assertEqual(delivery.fingerprint(self.rows[0]), delivery.fingerprint(dict(reversed(list(self.rows[0].items())))))
    def test_content_change_changes_fingerprint(self):
        changed = copy.deepcopy(self.rows[0]); changed["items"][0]["text"] += " Exemplo sintético."
        self.assertNotEqual(delivery.fingerprint(changed), delivery.fingerprint(self.rows[0]))
    def test_pending_never_retries(self):
        with self.assertRaisesRegex(RuntimeError, "resultado incerto"):
            delivery.select_pending(self.rows, {delivery.fingerprint(self.rows[0]): {"status": "pending"}})
    def test_unknown_receipt_blocks(self):
        with self.assertRaises(ValueError):
            delivery.select_pending(self.rows, {delivery.fingerprint(self.rows[0]): {"status": "unknown"}})
    def test_missing_transport_fails_explicitly(self):
        with patch.dict(os.environ, {}, clear=True), self.assertRaisesRegex(RuntimeError, "BLOCKED_EXTERNAL_SCALE_MAIL"):
            delivery.smtp_settings()
    def test_no_plaintext_smtp(self):
        config = {"SMTP_HOST": "smtp.invalid", "SMTP_PORT": "25", "SMTP_USERNAME": "fixture", "SMTP_PASSWORD": "fixture", "SMTP_FROM": "sender@example.invalid"}
        with patch.dict(os.environ, config), self.assertRaises(ValueError): delivery.smtp_settings()
    def test_duplicate_items_block(self):
        row = copy.deepcopy(self.rows[0]); row["items"][1]["id"] = row["items"][0]["id"]
        with self.assertRaises(ValueError): delivery.validate(row)
    def test_nonstring_version_blocks(self):
        row = copy.deepcopy(self.rows[0]); row["version"] = 1
        with self.assertRaises(ValueError): delivery.validate(row)
    def test_qualitative_does_not_acquire_total(self):
        row = {"id": "fixture-diario", "version": "1.0", "sourceType": "autoral_diario", "validationStatus": "nao_validado_psicometricamente", "items": [{"id": "1", "text": "Item sintético."}], "scoring": {"totalScoreEnabled": True}}
        with self.assertRaisesRegex(ValueError, "não pode ganhar total"): delivery.validate(row)
    def test_render_pdf_is_real_and_deterministic(self):
        with tempfile.TemporaryDirectory() as temp:
            first = Path(temp)/"one.pdf"; second = Path(temp)/"two.pdf"
            delivery.render_pdf(self.rows, first); delivery.render_pdf(self.rows, second)
            self.assertTrue(first.read_bytes().startswith(b"%PDF-"))
            self.assertGreater(len(first.read_bytes()), 10000)
            self.assertEqual(first.read_bytes(), second.read_bytes())
    def test_tls_mime_and_receipt_order(self):
        class Store:
            data = {"receipts": {}}
            saves = []
            def save(self): self.saves.append(copy.deepcopy(self.data))
        class SMTP:
            message = None
            def ehlo(self): pass
            def login(self, *_): pass
            def close(self): pass
            def send_message(self, msg): self.message=msg; return {}
        store = Store(); smtp = SMTP()
        cfg = {"SMTP_HOST": "smtp.invalid", "SMTP_PORT": "465", "SMTP_USERNAME": "fixture", "SMTP_PASSWORD": "fixture", "SMTP_FROM": "sender@example.invalid"}
        with tempfile.TemporaryDirectory() as temp, patch.object(delivery.smtplib, "SMTP_SSL", return_value=smtp):
            self.assertEqual(delivery.send_records(self.rows[:1], store, Path(temp), cfg), 1)
        self.assertEqual(smtp.message["To"], "jadsonfraga@hotmail.com")
        self.assertEqual(len(list(smtp.message.iter_attachments())), 2)
        self.assertTrue(all(x.get_content_type()=="application/pdf" for x in smtp.message.iter_attachments()))
        self.assertEqual(next(iter(store.saves[0]["receipts"].values()))["status"], "pending")
        self.assertEqual(next(iter(store.saves[1]["receipts"].values()))["status"], "smtp_accepted")

if __name__ == "__main__": unittest.main()
