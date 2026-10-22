import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { CIRCUIT_TASKS, circuitForAge } from "../../client/src/features/super-neuropad/clinicalCircuit";
import { PERFIS_ANUAIS, perfilAnual, dicaDeMissaoPorIdade } from "../../client/src/features/super-neuropad/ageAdaptation";

test("16 perfis anuais distintos, do início aos 17 anos, sem interpolação ou mudança dos itens", () => {
  assert.deepEqual(PERFIS_ANUAIS.map((p) => p.idade),Array.from({length:16},(_,i)=>i+2));
  assert.equal(new Set(PERFIS_ANUAIS.map((p)=>p.convite)).size,16,"convite próprio por idade");
  for(let years=2;years<=17;years++){
    const p=perfilAnual(years);
    assert.ok(p);
    assert.ok(p.nome.length > 8,"título anual presente em " + years);
    for(const key of ["convite","comunicacao","interacao","motricidade","cognicao","acessibilidade"] as const)
      assert.ok(p[key].length > 45,key+" " + years);
    assert.ok(circuitForAge(years).length>=10);
  }
  for (const age of [-1,0,1,1.5,18,NaN,Infinity]) assert.equal(perfilAnual(age),undefined);
});

test("refinamento ajustado à idade respeita método e entrevista clínica de risco", () => {
  for(let age=2;age<=17;age++){
    for(const task of circuitForAge(age)){
      const hint=dicaDeMissaoPorIdade(age,task);
      if(task.id==="risk"){assert.equal(hint,null);continue;}
      if(task.executor==="secretaria"){assert.match(hint,/contato da secretaria/);continue;}
      assert.ok(hint && hint.includes(age+" anos"),task.id);
      if(task.method==="presencial")assert.match(hint,/examinador.*auxiliar não realiza manobras/i);
      if(task.method==="entrevista")assert.match(hint,/entrevista profissional.*privacidade/i);
    }
  }
  const exam=CIRCUIT_TASKS.find(t=>t.id==="reflex");
  assert.ok(exam);
  assert.match(dicaDeMissaoPorIdade(3,exam)||"",/profissional/);
  assert.notEqual(dicaDeMissaoPorIdade(3,exam),dicaDeMissaoPorIdade(15,exam));
  assert.equal(dicaDeMissaoPorIdade(1,exam),null);
});

test("não cria resultados, corte etário, automações ou controles de bloqueio", () => {
  const src=readFileSync("client/src/features/super-neuropad/ageAdaptation.ts","utf8");
  const ui=readFileSync("client/src/features/super-neuropad/ClinicalCircuit.tsx","utf8");
  assert.doesNotMatch(src,/(localStorage|sessionStorage|fetch\(|getUserMedia|MediaRecorder)/);
  assert.doesNotMatch(ui,/\bdisabled\b/);
  assert.match(ui,/data-testid="super-neuropad-age-profile"/);
  assert.match(ui,/data-testid="super-neuropad-age-station-guidance"/);
  assert.match(ui,/dicaDeMissaoPorIdade\(years, task\)/);
  assert.ok(!PERFIS_ANUAIS.some(p=>/percentil|escore|ponto de corte|dentro do esperado/i.test(JSON.stringify(p))));
});
