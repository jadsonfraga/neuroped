import contextlib
import io
import json
from pathlib import Path
import sys
import tempfile
import unittest
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from run_gate import main, read_case
ROOT = Path(__file__).resolve().parents[1]

class CliTests(unittest.TestCase):
    def test_ready_exit_zero(self):
        with contextlib.redirect_stdout(io.StringIO()):
            self.assertEqual(main(['--input', str(ROOT/'exemplos/caso_demo_pronto.json')]), 0)
    def test_empty_template_not_ready(self):
        out=io.StringIO()
        with contextlib.redirect_stdout(out): self.assertEqual(main(['--template']), 0)
        self.assertEqual(json.loads(out.getvalue())['case_id'], '')
    def test_blocked_exit_two(self):
        with tempfile.TemporaryDirectory() as directory:
            path=Path(directory)/'case.json';path.write_text('{}')
            with contextlib.redirect_stdout(io.StringIO()):self.assertEqual(main(['--input',str(path)]),2)
    def test_no_overwrite(self):
        with tempfile.TemporaryDirectory() as directory:
            path=Path(directory)/'case.json';path.write_text('preservar')
            with contextlib.redirect_stderr(io.StringIO()):self.assertEqual(main(['--template','--output',str(path)]),1)
            self.assertEqual(path.read_text(),'preservar')
    def test_duplicate_keys_rejected(self):
        with tempfile.TemporaryDirectory() as directory:
            path=Path(directory)/'case.json';path.write_text('{"case_id":"a","case_id":"b"}')
            self.assertRaises(ValueError,read_case,str(path))
    def test_nonfinite_rejected(self):
        with tempfile.TemporaryDirectory() as directory:
            path=Path(directory)/'case.json';path.write_text('{"dose":NaN}')
            self.assertRaises(ValueError,read_case,str(path))

if __name__=='__main__':unittest.main()
