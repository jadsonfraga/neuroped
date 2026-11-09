import os
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import bridge

class PantChatBridgeTests(unittest.TestCase):
    def test_unsafe_active_markup_rejected(self):
        with self.assertRaises(ValueError):
            bridge.source_bytes("# Teste\n</script><script>alert(1)</script>")
        with self.assertRaises(ValueError):
            bridge.source_bytes("# Teste\n[link](javascript:alert(1))")

    def test_empty_and_large_rejected(self):
        with self.assertRaises(ValueError):
            bridge.source_bytes(" ")
        with self.assertRaises(ValueError):
            bridge.source_bytes("x" * (bridge.MAX_MD_BYTES + 1))

    def test_filename_traversal_is_neutralized(self):
        self.assertEqual(bridge.stem("../../paciente.md"), "paciente")
        self.assertEqual(bridge.stem(r"..\..\teste.md"), "teste")

    def test_acceptance_requires_confirmation_and_exact_hash(self):
        with tempfile.TemporaryDirectory() as folder:
            with patch.object(bridge, "HOME", Path(folder)):
                bridge.dirs()
                md = "---\nnome: PACIENTE FICTICIO\n---\n# Conteudo\n"
                sha = bridge.sha256(md.encode("utf-8"))
                self.assertFalse(bridge.is_approved(sha))
                with self.assertRaises(PermissionError):
                    bridge.approve(md, "NAO REVISADO")
                result = bridge.approve(md, "REVISEI E APROVO O TEXTO INTEGRAL")
                self.assertEqual(result["sha256"], sha)
                self.assertTrue(bridge.is_approved(sha))
                self.assertFalse(bridge.is_approved(bridge.sha256((md+"X").encode("utf-8"))))

    def test_final_blocked_without_acceptance(self):
        with tempfile.TemporaryDirectory() as folder:
            with patch.object(bridge, "HOME", Path(folder)):
                with self.assertRaises(PermissionError):
                    bridge.render("---\nnome: FICTICIO\n---\n# Teste", "teste.md", "final")

    def test_only_loopback(self):
        self.assertEqual(bridge.HOST, "127.0.0.1")
        self.assertNotIn("*", bridge.ORIGINS)
        self.assertNotIn("https://example.com", bridge.ORIGINS)

if __name__ == "__main__":
    unittest.main()
