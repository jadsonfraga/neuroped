"""Catraca antirregressão: o adaptador legado PANT deve permanecer inutilizável."""
import contextlib
import io
import tempfile
import unittest
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from pant_adapter import (
    LEGACY_RETIREMENT_CODE,
    LegacyAdapterRetired,
    emit_pant,
    inspect_runtime,
    main,
)

ROOT = Path(__file__).resolve().parents[1]


class LegacyAdapterRetirementTests(unittest.TestCase):
    def test_inspect_runtime_is_always_blocked(self):
        with tempfile.TemporaryDirectory() as d:
            with self.assertRaisesRegex(LegacyAdapterRetired, LEGACY_RETIREMENT_CODE):
                inspect_runtime(Path(d))

    def test_emit_is_always_blocked_and_creates_no_pdf(self):
        with tempfile.TemporaryDirectory() as d:
            out = Path(d) / "out.pdf"
            with self.assertRaisesRegex(LegacyAdapterRetired, LEGACY_RETIREMENT_CODE):
                emit_pant({}, Path(d), out)
            self.assertFalse(out.exists())

    def test_cli_fails_closed(self):
        stderr = io.StringIO()
        with contextlib.redirect_stderr(stderr):
            code = main([])
        self.assertEqual(code, 2)
        self.assertIn(LEGACY_RETIREMENT_CODE, stderr.getvalue())

    def test_legacy_runtime_contract_cannot_return(self):
        source = (ROOT / "pant_adapter.py").read_text(encoding="utf-8")
        forbidden = (
            "MOTOR_PANT_" + "HELENA_ESTHER.py",
            "00_LEI_PANT_VIGENTE_" + "v5.md",
            "CURRENT_DRIVE_" + "V5_SHA256",
            "balanced_" + "fallback",
            "importlib." + "util",
        )
        for marker in forbidden:
            self.assertNotIn(marker, source)


if __name__ == "__main__":
    unittest.main()
