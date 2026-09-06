import copy
import json
import math
import sys
import unittest
from datetime import date
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from neuroped_fluxo.core import (empty_case, validate, import_notes, import_labeled_text,
                                draft_documents, approve_text, handoff, present, digest)
ROOT = Path(__file__).resolve().parents[1]

def demo():
    return json.loads((ROOT / 'exemplos/caso_demo_pronto.json').read_text(encoding='utf-8'))

def medicine_case():
    c = demo()
    c['medications'] = [{'name':'Fármaco fictício, não utilizar','action':'manter','formulation':'Fictícia','route':'Fictícia',
        'indication':'Teste','schedule':'Teste','dose_mg':2,'doses_per_day':2,'source_id':'medico','review_status':'confirmado'}]
    c['weight'] = {'kg':20,'measured_at':'2026-09-05','source_id':'medico'}
    c['allergies'] = {'status':'negadas','source_id':'pais'}
    return c

class GateTests(unittest.TestCase):
    def assertCode(self,c,code):
        r=validate(c,today=date(2026,9,5));self.assertIn(code,[i['code'] for i in r['issues']]);return r
    def test_ready(self):self.assertEqual(validate(demo())['status'],'PRONTO')
    def test_empty_is_blocked(self):self.assertEqual(validate(empty_case())['status'],'BLOQUEADO')
    def test_draft_allowed_when_blocked(self):self.assertTrue(validate(empty_case())['can_draft'])
    def test_not_dict(self):self.assertEqual(validate([])['status'],'BLOQUEADO')
    def test_nan(self):c=demo();c['a']=float('nan');self.assertCode(c,'E00B')
    def test_boolean_weight(self):c=medicine_case();c['weight']['kg']=True;self.assertCode(c,'M01')
    def test_huge_integer_weight(self):c=medicine_case();c['weight']['kg']=10**1000;self.assertCode(c,'M01')
    def test_huge_integer_dose(self):c=medicine_case();c['medications'][0]['dose_mg']=10**1000;self.assertCode(c,'M12')
    def test_negative_weight(self):c=medicine_case();c['weight']['kg']=-1;self.assertCode(c,'M01')
    def test_dose_arithmetic(self):self.assertEqual(validate(medicine_case())['dose_arithmetic'][0]['mg_per_kg_per_day'],.2)
    def test_daily_total_conflict(self):c=medicine_case();c['medications'][0]['daily_mg']=99;self.assertCode(c,'M13')
    def test_missing_formulation(self):c=medicine_case();del c['medications'][0]['formulation'];self.assertCode(c,'M08')
    def test_missing_weight_date(self):c=medicine_case();c['weight']['measured_at']=None;self.assertCode(c,'M02')
    def test_taper_requires_baseline(self):c=medicine_case();c['medications'][0]['action']='desmamar';self.assertCode(c,'M14')
    def test_material_decision_requires_evidence_record(self):c=medicine_case();c['medications'][0]['action']='iniciar';self.assertCode(c,'V01')
    def test_unknown_allergies(self):c=medicine_case();c['medications'][0]['action']='iniciar';c['allergies']['status']='desconhecido';self.assertCode(c,'M05')
    def test_risk_requires_plan(self):c=demo();c['risk']['signal']='presente';self.assertCode(c,'R04')
    def test_unassessed_risk_not_negative(self):c=demo();c['risk']['signal']='nao_avaliado';self.assertEqual(self.assertCode(c,'R02')['status'],'GERAVEL_COM_RESSALVAS')
    def test_seizures_require_semiology_and_rescue(self):c=demo();c['focus']['epilepsy']=True;self.assertCode(c,'S01')
    def test_future_date(self):c=demo();c['encounter_date']='2099-01-01';self.assertCode(c,'G03')
    def test_birth_in_future(self):c=demo();c['patient']['dob']='2099-01-01';self.assertCode(c,'G06')
    def test_inconsistent_age(self):c=demo();c['patient']['dob']='2020-01-01';self.assertCode(c,'G07')
    def test_leap_birthday(self):c=demo();c['patient']['dob']='2020-02-29';c['patient']['age_months']=78;self.assertEqual(validate(c)['status'],'PRONTO')
    def test_exam_requires_medical_source(self):c=demo();c['domains']['exame']=[{'text':'Texto exame','source_id':'pais','review_status':'confirmado'}];self.assertCode(c,'F08')
    def test_unreviewed_fact(self):c=demo();c['domains']['queixa'][0]['review_status']='pendente';self.assertCode(c,'F07')
    def test_ai_inference_not_fact(self):c=demo();c['sources'][0]['type']='inferencia_ia';self.assertCode(c,'F07')
    def test_duplicate_source_ids(self):c=demo();c['sources'].append(copy.deepcopy(c['sources'][0]));self.assertCode(c,'F01')
    def test_source_date_future(self):c=demo();c['sources'][0]['date']='2099-01-01';self.assertCode(c,'F03')
    def test_no_source(self):c=demo();c['domains']['queixa'][0]['source_id']='nonexistent';self.assertCode(c,'F06')
    def test_placeholder_is_absent(self):c=demo();c['domains']['queixa'][0]['text']='DADO AUSENTE';self.assertCode(c,'F05')
    def test_not_assessed_is_not_normal(self):c=demo();c['domains']['exame']=[{'status':'nao_avaliado','reason':'Não realizado no exemplo'}];self.assertCode(c,'D03');self.assertNotIn('normal',str(draft_documents(c)['documents']))
    def test_confirmed_diagnosis_requires_order(self):c=demo();c['hypotheses']=[{'label':'Hipótese fictícia','status':'confirmado','icd10':'DEMO','icd11':'DEMO','for':['teste'],'against':['teste'],'criteria':['teste']}];self.assertCode(c,'H03')
    def test_icd_pair_not_inferred(self):c=demo();c['hypotheses']=[{'label':'Teste','status':'em_investigacao','icd10':'DEMO'}];self.assertCode(c,'H01');self.assertNotIn('icd11',c['hypotheses'][0])
    def test_contradiction(self):c=demo();c['contradictions']=[{'resolved':False}];self.assertCode(c,'C01')
    def test_therapy_frequency(self):c=demo();c['therapies']=[{'specialty':'Teste','method':'Teste','goal':'Teste','rationale':'Teste','review_status':'confirmado'}];self.assertCode(c,'T02')
    def test_structure_fail_closed(self):c=demo();c['medications']={};self.assertCode(c,'E01')
    def test_id_blocks_names_with_spaces(self):c=demo();c['case_id']='Nome Completo Pessoa';self.assertCode(c,'G02')
    def test_no_mutation_during_validation(self):c=demo();prior=copy.deepcopy(c);validate(c);self.assertEqual(c,prior)
    def test_unassigned_cannot_silently_disappear(self):c=demo();c['unassigned_segments']=[{'text':'Trecho pendente'}];self.assertCode(c,'F09')
    def test_zero_not_missing(self):self.assertTrue(present(0));self.assertTrue(present(False));self.assertFalse(present(None))
    def test_no_clinical_approval(self):r=validate(demo());self.assertFalse(r['clinical_approval']);self.assertFalse(r['final_pdf_emitted'])
    def test_adversarial_field_types(self):
        values=[None,False,True,0,-1,'x',[],{},[1],{'x':[]},1e300]
        base=demo()
        for key in base:
            for value in values:
                c=copy.deepcopy(base);c[key]=copy.deepcopy(value)
                with self.subTest(field=key,value=value):
                    r=validate(c);self.assertIn(r['status'],['PRONTO','BLOQUEADO','GERAVEL_COM_RESSALVAS'])

class ImportTests(unittest.TestCase):
    def notes(self):return json.loads((ROOT/'exemplos/notes_demo.json').read_text(encoding='utf-8'))
    def test_notes_import_unconfirmed(self):c=import_notes(self.notes(),demo());self.assertEqual(c['domains']['queixa'][-1]['review_status'],'pendente')
    def test_note_consultation_collision(self):c=demo();c['encounter_id']='OTHER';self.assertRaises(ValueError,import_notes,self.notes(),c)
    def test_note_idempotence(self):a=import_notes(self.notes(),demo());b=import_notes(self.notes(),a);self.assertEqual(a,b)
    def test_same_segment_id_changed_content_rejected(self):
        original=self.notes();a=import_notes(original,demo());changed=copy.deepcopy(original)
        changed['segments'][0]['text']='Outra versão; deve ser reconciliada.'
        self.assertRaises(ValueError,import_notes,changed,a)
    def test_same_segment_id_changed_source_rejected(self):
        original=self.notes();a=import_notes(original,demo());changed=copy.deepcopy(original)
        changed['segments'][0]['source']='observacao_medico'
        self.assertRaises(ValueError,import_notes,changed,a)
    def test_unknown_topics_preserved(self):c=import_notes(self.notes(),demo());self.assertEqual(len(c['unassigned_segments']),1)
    def test_never_generates_medications_or_diagnoses(self):c=import_notes(self.notes(),demo());self.assertEqual(c['medications'],[]);self.assertEqual(c['hypotheses'],[])
    def test_source_type_preserved(self):c=import_notes(self.notes(),demo());self.assertEqual(c['sources'][-1]['type'],'inferencia_ia')
    def test_invalid_time(self):n=self.notes();n['segments'][0]['endMs']=-1;self.assertRaises(ValueError,import_notes,n,demo())
    def test_unlabeled_text_preserved(self):c=import_labeled_text('texto sem rótulo',demo());self.assertEqual(c['unassigned_segments'][0]['text'],'texto sem rótulo')
    def test_labeled_text_idempotent(self):a=import_labeled_text('queixa: Exemplo',demo());b=import_labeled_text('queixa: Exemplo',a);self.assertEqual(a,b)

class ApprovalTests(unittest.TestCase):
    def test_draft_always_available(self):self.assertEqual(draft_documents(empty_case())['stage'],'FASE_1')
    def test_explicit_text_required(self):c=demo();d=draft_documents(c);self.assertRaises(ValueError,approve_text,c,d,'Médico','sim')
    def test_handoff_honest(self):c=demo();d=draft_documents(c);a=approve_text(c,d,'Médico fictício','APROVAR TEXTO');h=handoff(c,d,a);self.assertFalse(h['final_pdf_emitted']);self.assertEqual(h['renderer_status'],'PENDENTE_ADAPTADOR_CANONICO')
    def test_case_change_invalidates(self):c=demo();d=draft_documents(c);a=approve_text(c,d,'Médico fictício','APROVAR TEXTO');c['patient']['age_months']=73;self.assertRaises(ValueError,handoff,c,d,a)
    def test_text_change_invalidates(self):c=demo();d=draft_documents(c);a=approve_text(c,d,'Médico fictício','APROVAR TEXTO');d['documents']['anamnese']+=' mudança';self.assertRaises(ValueError,handoff,c,d,a)
    def test_blocked_case_cannot_handoff(self):c=empty_case();d=draft_documents(c);a=approve_text(c,d,'Médico fictício','APROVAR TEXTO');self.assertRaises(ValueError,handoff,c,d,a)
    def test_report_and_text_separated(self):d=draft_documents(empty_case());self.assertTrue(d['pending']);self.assertNotIn('DADO AUSENTE',d['documents']['anamnese'])
    def test_same_content_stable_hash(self):self.assertEqual(digest(demo()),digest(demo()))

if __name__=='__main__':unittest.main()
