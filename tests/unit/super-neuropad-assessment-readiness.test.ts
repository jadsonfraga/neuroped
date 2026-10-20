import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import {
  REQUIREMENTS, requirementsForAge, reviewDocumentarySufficiency,
  buildReadinessReport, type EvidenceMap, type ConsultationFocus,
} from "../../client/src/features/super-neuropad/assessmentReadiness";

test("cobertura de informações documentais em todas as faixas de 2 a 17 anos", () => {
  const ids = new Set(REQUIREMENTS.map(x=>x.id));
  assert.equal(ids.size, REQUIREMENTS.length,"identificadores exclusivos");
  for (let age=2;age<=17;age++){
    const base=requirementsForAge(age);
    assert.ok(base.length>=12,`núcleo clínico ${age}`);
    for(const id of ["identity","complaint","development","neuro","mental","differential","plan"])
      assert.ok(base.some(item=>item.id===id),`idade ${age}: ${id}`);
    const full=requirementsForAge(age,["tea","tdah","linguagem","epilepsia","motor","aprendizagem","psiquiatria"]);
    assert.ok(full.length>=base.length);
    assert.equal(new Set(full.map(x=>x.id)).size,full.length);
    assert.ok(full.every(item=>age>=item.min && age<=item.max));
    if(age<6)assert.ok(full.every(item=>item.id!=="learn"));
    if(age<8)assert.ok(full.every(item=>item.id!=="risk8"));
    if(age>=8)assert.ok(full.some(item=>item.id==="risk8"));
  }
  for(const age of [0,1,1.5,18,NaN])assert.deepEqual(requirementsForAge(age),[]);
});

test("focos não exigem exames complementares universais: avaliação condicional",()=>{
  assert.ok(requirementsForAge(8).every(t=>!t.focus));
  assert.ok(requirementsForAge(8,["epilepsia"]).some(t=>t.id==="epilepsy-plan"));
  assert.ok(requirementsForAge(8,["epilepsia"]).every(t=>t.id!=="tea-rb"));
  assert.ok(requirementsForAge(3,["tdah"]).every(t=>t.id!=="tdah-context"));
  assert.ok(requirementsForAge(9,["aprendizagem"]).some(t=>t.id==="learn"));
  assert.ok(requirementsForAge(4,["aprendizagem"]).every(t=>t.id!=="learn"));
});

test("nenhuma conclusão automática: pendências, fontes e justificativas não são presumidas",()=>{
  const empty=reviewDocumentarySufficiency(7,[],{});
  assert.equal(empty.completed,0);
  assert.equal(empty.pending.length,empty.total);
  const x:EvidenceMap={
    identity:{status:"documentado",note:"Registro conferido."}, // sem fonte — pendente
    complaint:{status:"documentado",source:"familia",note:"Queixa detalhada."},
    neuro:{status:"documentado",source:"familia",note:"Mãe relata marcha regular."}, // exame exige profissional
    mental:{status:"documentado",source:"clinico",note:"Observada atenção durante entrevista."},
    plan:{status:"inaplicavel",note:""}, // justificativa ausente
    physical:{status:"limitado",note:"Criança não permitiu aferição; observação limitada."}
  };
  const s=reviewDocumentarySufficiency(7,[],x);
  assert.equal(s.completed,3);
  assert.ok(s.pending.includes("Exame neurológico presencial documentado"));
  assert.ok(s.pending.includes("Identificação e idade verificadas no prontuário protegido"));
  assert.ok(s.limited.includes("Exame físico e dados antropométricos relevantes"));
  assert.match(s.summary,/Documentação ainda incompleta/);
});

test("mesmo com todos os itens informados, jamais há liberação médica automática",()=>{
  const focus:ConsultationFocus[]=["tea","epilepsia"];
  const tasks=requirementsForAge(12,focus);
  const entries:EvidenceMap=Object.fromEntries(tasks.map(x=>[x.id,{
    status:"documentado",source:x.clinicianOnly?"clinico":"familia",note:"Evidência revisada pelo profissional no registro clínico."
  }]));
  const r=reviewDocumentarySufficiency(12,focus,entries);
  assert.equal(r.completed,r.total);
  assert.equal(r.pending.length,0);
  assert.match(r.summary,/autorização médica/);
  const report=buildReadinessReport(12,focus,entries,new Date("2026-10-20T15:00:00Z"));
  assert.match(report,/Investiga[çc][ãa]o de TEA/);
  assert.match(report,/Epilepsia/);
  assert.match(report,/não é laudo, diagnóstico, autorização de assinatura/);
  assert.match(report,/exclusiva do médico responsável/);
});

test("exportação explicita ausências e limitações, sem inventar achados ou identificação",()=>{
  const txt=buildReadinessReport(5,["linguagem"],{
    complaint:{status:"documentado",source:"familia",note:"Linguagem expressiva com atraso referido."},
    neuro:{status:"limitado",note:"Sem cooperação para parte do exame."},
    lang:{status:"inaplicavel",note:"Avaliação auditiva específica será agendada."}
  },new Date("2026-10-20T15:00:00Z"));
  assert.match(txt,/Linguagem expressiva com atraso referido/);
  assert.match(txt,/Sem cooperação para parte do exame/);
  assert.match(txt,/Ainda não documentado/);
  assert.doesNotMatch(txt,/(CEP|CPF|CRM-BA)/);
});

test("integração é aditiva e revisão documental permanece separada da emissão e da entrega à família",()=>{
  const page=readFileSync("client/src/pages/super-neuropad-game.tsx","utf8");
  const ui=readFileSync("client/src/features/super-neuropad/AssessmentReadiness.tsx","utf8");
  assert.match(page,/import \{ AssessmentReadiness \}/);
  assert.match(page,/<AssessmentReadiness key=\{ageYears \?\? "sem-idade"\}/);
  assert.match(ui,/data-testid="super-neuropad-documentary-readiness"/);
  assert.match(ui,/Nenhuma resposta do jogo marca um campo como concluído/);
  assert.doesNotMatch(ui,/(localStorage|sessionStorage|MediaRecorder|getUserMedia|fetch\(|XMLHttpRequest|SaveToPatient)/);
  assert.match(ui,/não emite|não assina|não autoriza/i);
});
