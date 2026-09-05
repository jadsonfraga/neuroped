"""Testes isolados do adaptador PANT; nenhum dado real, fonte ou brasão é versionado."""
import tempfile
import unittest
from pathlib import Path
import sys
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from neuroped_fluxo.core import approve_text, draft_documents, handoff
from pant_adapter import emit_pant, inspect_runtime
from desktop_support import load_json

ROOT = Path(__file__).resolve().parents[1]


def pant_case():
    c = load_json(ROOT / "exemplos/caso_demo_pronto.json")
    c["purpose"] = "pant"
    c["patient"]["school_enrolled"] = False
    sid_p, sid_m = "pais", "medico"
    def fact(text, sid): return {"text": text, "source_id": sid, "review_status": "confirmado"}
    c["domains"].update({
        "gestacao": [fact("Gestação fictícia sem intercorrência registrada no exemplo.", sid_p)],
        "desenvolvimento": [fact("Desenvolvimento fictício descrito apenas para teste estrutural.", sid_p)],
        "historia_familiar": [fact("História familiar fictícia conferida no exemplo.", sid_p)],
        "funcionamento": [fact("Funcionamento fictício documentado para validar a cadeia.", sid_p)],
        "exame": [fact("Observação médica fictícia realizada apenas no caso sintético.", sid_m)],
        "orientacoes": [fact("Orientação fictícia sem prescrição e sem decisão clínica real.", sid_m)],
    })
    c["hypotheses"] = [{
        "label": "Hipótese exclusivamente sintética", "status": "em_investigacao",
        "icd10": "Z00.8", "icd11": "QA00.0",
        "for": ["Achado fictício a favor"], "against": ["Achado fictício a ponderar"],
        "criteria": ["Critério fictício somente para teste"],
    }]
    return c


def approved_handoff():
    c = pant_case(); d = draft_documents(c)
    a = approve_text(c, d, "Médico fictício", "APROVAR TEXTO")
    return handoff(c, d, a)


def fake_runtime(root: Path, *, qa_pass=True):
    (root / "fonts").mkdir()
    law = "# LEI PANT VIGENTE — v5\nSubstitui a v1, a v2, a v3 e a v4.\n"
    (root / "00_LEI_PANT_VIGENTE_v5.md").write_text(law, encoding="utf-8")
    (root / "marca_capa.png").write_bytes(b"PNG-cover")
    (root / "marca_miolo.png").write_bytes(b"PNG-body")
    (root / "00_TRAVA_ANTIRREGRESSAO.py").write_text('SELO="900cb06d69bb6da7"\nIDENTIDADE={"nome":"Médico fictício","titulacao":"Neuropediatra","crm":"CRM-XX 000","rqe":"RQE 000","cnpj":"00.000.000/0000-00","razao":"Clínica fictícia","endereco_capa":"Endereço fictício"}\n', encoding="utf-8")
    motor = '''\nimport importlib.util\nfrom pathlib import Path\nBASE=Path(__file__).resolve().parent\ns=importlib.util.spec_from_file_location("t",BASE/"00_TRAVA_ANTIRREGRESSAO.py");trava=importlib.util.module_from_spec(s);s.loader.exec_module(trava)\nFACES=[("CormorantG",400,"normal","font.ttf")]\ndef _checar_fontes(): assert (BASE/"fonts/font.ttf").is_file()\ndef secao(n,t,*b): return f"<h2>{n}:{t}</h2>"+"".join(b)\ndef p(t,capitular=False): return f"<p>{t}</p>"\ndef fonte(r,t,capitular=False): return f"<p>{r}: {t}</p>"\ndef destaque(t): return f"<aside>{t}</aside>"\ndef analise(a,b): return "<div>"+";".join(a+b)+"</div>"\ndef tabela(rows,cab=("Campo","Valor")): return "<table>"+"".join(str(x) for x in rows)+"</table>"\ndef fecho(a): return "<footer>Soli Deo Gloria</footer>"\ndef render(capa,corpo,saida,**kwargs):\n    Path(saida).write_bytes(b"%PDF-FAKE\\n"+("\\n".join(corpo)).encode())\n    return saida,{"selo":trava.SELO,"folhas":1}\n'''
    (root / "01_MOTOR_PANT_HELENA_ESTHER.py").write_text(motor, encoding="utf-8")
    qa = f'''\nimport importlib.util\nfrom pathlib import Path\nBASE=Path(__file__).resolve().parent\ns=importlib.util.spec_from_file_location("tq",BASE/"00_TRAVA_ANTIRREGRESSAO.py");trava=importlib.util.module_from_spec(s);s.loader.exec_module(trava)\ndef medir(path,ordem_expressa_fechar=False): return {{"passa":{str(qa_pass)},"nota":{10.0 if qa_pass else 9.0},"bloqueios":{[] if qa_pass else ["falha sintética"]}}}\n'''
    (root / "01_QA_PANT_HELENA_ESTHER.py").write_text(qa, encoding="utf-8")
    (root / "fonts/font.ttf").write_bytes(b"font")
    import hashlib
    return hashlib.sha256(law.encode()).hexdigest()


class AdapterTests(unittest.TestCase):
    def test_runtime_ready(self):
        with tempfile.TemporaryDirectory() as d:
            root=Path(d);sha=fake_runtime(root)
            self.assertTrue(inspect_runtime(root, expected_law_sha256=sha)["ready"])
    def test_runtime_wrong_law_hash_blocked(self):
        with tempfile.TemporaryDirectory() as d:
            root=Path(d);fake_runtime(root)
            self.assertRaises(ValueError, inspect_runtime, root, expected_law_sha256="0"*64)
    def test_missing_brand_blocked(self):
        with tempfile.TemporaryDirectory() as d:
            root=Path(d);sha=fake_runtime(root);(root/"marca_capa.png").unlink()
            self.assertRaises(ValueError, inspect_runtime, root, expected_law_sha256=sha)
    def test_invalid_approval_blocked(self):
        h=approved_handoff();h["approval"]["draft_sha256"]="x"
        with tempfile.TemporaryDirectory() as d:
            root=Path(d);sha=fake_runtime(root)
            self.assertRaises(ValueError, emit_pant, h, root, root/"out.pdf", expected_law_sha256=sha)
    def test_emit_passes_and_never_marks_signed(self):
        h=approved_handoff()
        with tempfile.TemporaryDirectory() as d:
            root=Path(d);sha=fake_runtime(root);out=root/"out.pdf"
            r=emit_pant(h,root,out,expected_law_sha256=sha)
            self.assertTrue(out.is_file());self.assertTrue(r["qa"]["passa"])
            self.assertTrue(r["final_pdf_emitted"]);self.assertFalse(r["digital_signature_applied"])
    def test_qa_failure_leaves_no_final(self):
        h=approved_handoff()
        with tempfile.TemporaryDirectory() as d:
            root=Path(d);sha=fake_runtime(root,qa_pass=False);out=root/"out.pdf"
            self.assertRaises(ValueError,emit_pant,h,root,out,expected_law_sha256=sha)
            self.assertFalse(out.exists())
    def test_never_overwrites(self):
        h=approved_handoff()
        with tempfile.TemporaryDirectory() as d:
            root=Path(d);sha=fake_runtime(root);out=root/"out.pdf";out.write_bytes(b"original")
            self.assertRaises(FileExistsError,emit_pant,h,root,out,expected_law_sha256=sha)
            self.assertEqual(out.read_bytes(),b"original")
    def test_changed_case_invalidates_approval(self):
        h=approved_handoff();h["case"]["purpose"]="evolucao"
        with tempfile.TemporaryDirectory() as d:
            root=Path(d);sha=fake_runtime(root)
            self.assertRaises(ValueError,emit_pant,h,root,root/"out.pdf",expected_law_sha256=sha)

if __name__ == "__main__": unittest.main()
