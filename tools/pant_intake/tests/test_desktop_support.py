"""Regressões da entrega desktop, somente dados sintéticos."""
import copy
import json
import os
import sys
import tempfile
import unittest
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from desktop_support import (Session, checked_json, export_case_bundle, load_json,
                             prepare, pretty, process_folder, safe_report, save_new)
ROOT = Path(__file__).resolve().parents[1]


def demo():
    return load_json(ROOT / 'exemplos/caso_demo_pronto.json')


class DesktopTests(unittest.TestCase):
    def test_ready(self): self.assertEqual(safe_report(demo())['status'], 'PRONTO')
    def test_duplicate_keys(self): self.assertRaises(ValueError, checked_json, '{"a":1,"a":2}')
    def test_nan(self): self.assertRaises(ValueError, checked_json, '{"a":NaN}')
    def test_infinite_exponent(self): self.assertRaises(ValueError, checked_json, '{"a":1e999}')
    def test_depth(self): self.assertRaises(ValueError, checked_json, '['*70+'0'+']'*70)
    def test_size(self): self.assertRaises(ValueError, checked_json, ' '*1_000_001)
    def test_invalid_json(self): self.assertRaises(ValueError, checked_json, '{')
    def test_preserve_zero_false(self): self.assertEqual(checked_json('{"a":0,"b":false}'), {'a':0,'b':False})
    def test_session_copy(self):
        c=demo(); s=Session({}); s.set_case(c); c['case_id']='CHANGED'
        self.assertNotEqual(c,s.case)
    def test_session_invalidates_draft(self):
        s=Session(demo()); s.validate(); s.compile(); self.assertIsNotNone(s.draft)
        s.set_case(demo()); self.assertIsNone(s.draft); self.assertIsNone(s.report)
    def test_text_unreviewed(self):
        s=Session(demo()); s.text('queixa: Fonte de teste.', 'relato_pais')
        self.assertEqual(s.case['domains']['queixa'][-1]['review_status'],'pendente')
    def test_session_invalid_shape(self): self.assertRaises(ValueError, Session({}).set_case, [])
    def test_core_extra_failure_is_blocked(self):
        c=demo(); c['weight']['kg']={}; self.assertEqual(safe_report(c)['final_pdf_emitted'],False)
    def test_unknown_domain_blocked(self):
        c=demo(); c['domains']['nao_mapeado']=[{'text':'Não sumir'}]
        self.assertEqual(safe_report(c)['status'],'BLOQUEADO'); self.assertRaises(ValueError,prepare,c)
    def test_unassessed_text_blocked(self):
        c=demo();c['domains']['exame']=[{'status':'nao_avaliado','reason':'Não realizado','text':'Normal'}]
        self.assertEqual(safe_report(c)['status'],'BLOQUEADO'); self.assertRaises(ValueError,prepare,c)
    def test_save_never_overwrites(self):
        with tempfile.TemporaryDirectory() as d:
            p=Path(d)/'a.txt';save_new(p,'original')
            self.assertRaises(FileExistsError,save_new,p,'novo');self.assertEqual(p.read_text(),'original')
    def test_export_full(self):
        with tempfile.TemporaryDirectory() as d:
            p=export_case_bundle(demo(),Path(d)); m=load_json(p/'manifesto.json')
            self.assertEqual(m['final_pdfs_emitted'],0)
            self.assertEqual(len(list(p.glob('RASCUNHO_*.md'))),5)
            self.assertEqual(load_json(p/'caso.json'),demo())
    def test_export_idempotent(self):
        with tempfile.TemporaryDirectory() as d:
            a=export_case_bundle(demo(),Path(d)); b=export_case_bundle(demo(),Path(d));self.assertEqual(a,b)
            self.assertEqual(len(list(Path(d).iterdir())),1)
    def test_export_tamper_detected(self):
        with tempfile.TemporaryDirectory() as d:
            p=export_case_bundle(demo(),Path(d));(p/'RASCUNHO_anamnese.md').write_text('alterado')
            self.assertRaises(ValueError,export_case_bundle,demo(),Path(d))
            self.assertEqual((p/'RASCUNHO_anamnese.md').read_text(),'alterado')
    def test_export_incomplete_still_records_block(self):
        with tempfile.TemporaryDirectory() as d:
            p=export_case_bundle({},Path(d));m=load_json(p/'manifesto.json')
            self.assertEqual(m['status'],'BLOQUEADO');self.assertFalse(m['drafts_compiled'])
    def test_input_unchanged(self):
        c=demo();before=copy.deepcopy(c);safe_report(c);prepare(c);self.assertEqual(c,before)
    def test_batch_preserves_original(self):
        with tempfile.TemporaryDirectory() as d:
            i=Path(d)/'in';o=Path(d)/'out';i.mkdir();o.mkdir();save_new(i/'case.json',pretty(demo()))
            original=(i/'case.json').read_bytes();result=process_folder(i,o)
            self.assertEqual(result['status'],'PROCESSADO');self.assertEqual(result['processed'],1)
            self.assertEqual((i/'case.json').read_bytes(),original)
    def test_batch_error_is_not_success(self):
        with tempfile.TemporaryDirectory() as d:
            i=Path(d)/'in';o=Path(d)/'out';i.mkdir();o.mkdir();save_new(i/'case.json','{')
            result=process_folder(i,o);self.assertEqual(result['status'],'COM_PENDENCIAS')
            self.assertEqual(result['results'][0]['status'],'ERRO')
    def test_batch_summary_has_no_filename(self):
        with tempfile.TemporaryDirectory() as d:
            i=Path(d)/'in';o=Path(d)/'out';i.mkdir();o.mkdir();save_new(i/'NOME-FICTICIO.json','{')
            self.assertNotIn('NOME-FICTICIO',pretty(process_folder(i,o)))
    def test_batch_same_dir_rejected(self):
        with tempfile.TemporaryDirectory() as d: self.assertRaises(ValueError,process_folder,Path(d),Path(d))
    def test_batch_child_dir_rejected(self):
        with tempfile.TemporaryDirectory() as d:
            child=Path(d)/'out';child.mkdir();self.assertRaises(ValueError,process_folder,Path(d),child)
    def test_batch_bounded(self):
        with tempfile.TemporaryDirectory() as d:
            i=Path(d)/'in';o=Path(d)/'out';i.mkdir();o.mkdir()
            for n in range(501): (i/f'{n}.json').touch()
            self.assertRaises(ValueError,process_folder,i,o)
    def test_load_size_bound(self):
        with tempfile.TemporaryDirectory() as d:
            p=Path(d)/'x.json';p.write_bytes(b' '*1_000_001);self.assertRaises(ValueError,load_json,p)
    def test_no_gate_final_pdf(self): self.assertFalse(safe_report(demo())['final_pdf_emitted'])
    def test_notes_mixed_consultation(self):
        s=Session(demo()); payload={'segments':[{'id':'s','consultationId':'OTHER','text':'teste','startMs':0,'endMs':10}]}
        self.assertRaises(ValueError,s.notes,payload)

if __name__=='__main__':unittest.main()
