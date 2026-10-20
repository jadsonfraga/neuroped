import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import {
  buildCircuitReport, circuitForAge, CIRCUIT_TASKS,
  CIRCUIT_METHODS, CIRCUIT_VIDEO_LINKS,
} from "../../client/src/features/super-neuropad/clinicalCircuit";

test("faixas 2–17: missões neurológicas e exame mental em TODAS as idades, sem exame para idade inválida", () => {
  for (let age = 2; age <= 17; age++) {
    const tasks = circuitForAge(age);
    assert.ok(tasks.length >= 10, `idade ${age}: tarefas suficientes`);
    assert.ok(tasks.some((task) => task.area === "neurologico"), `neurológico em ${age}`);
    assert.ok(tasks.some((task) => task.area === "mental"), `mental em ${age}`);
    assert.ok(tasks.some((task) => task.method === "presencial"), `exame físico em ${age}`);
    assert.ok(tasks.every((task) => age >= task.min && age <= task.max));
    assert.equal(circuitForAge(age,"neurologico").length + circuitForAge(age,"mental").length, tasks.length);
  }
  for (const age of [-1,0,1,1.5,18,100,Number.NaN]) assert.deepEqual(circuitForAge(age), []);
});

test("cadastro clínico íntegro: IDs únicos, descrições e faixas não vazias", () => {
  assert.equal(new Set(CIRCUIT_TASKS.map((task) => task.id)).size, CIRCUIT_TASKS.length);
  for (const task of CIRCUIT_TASKS) {
    assert.ok(task.min >= 2 && task.max <= 17 && task.min <= task.max);
    assert.ok(task.guide.length > 45 && task.observe.length > 25);
    assert.ok(CIRCUIT_METHODS[task.method]);
    if (task.video) {
      const reference = CIRCUIT_VIDEO_LINKS[task.video];
      assert.equal(new URL(reference.url).protocol,"https:");
      assert.ok(["neurologicexam.med.utah.edu","med.stanford.edu"].includes(new URL(reference.url).hostname));
    }
  }
  const mustHave = ["Reflexos","Sensibilidade","Pares cranianos II/III/IV/VI","Tônus e postura","Coordenação","Marcha e equilíbrio","Humor e afeto","Pensamento e percepção","Segurança clínica"];
  for (const domain of mustHave) assert.ok(CIRCUIT_TASKS.some((task) => task.domain === domain), `ausente: ${domain}`);
});

test("segurança: tarefas de risco são entrevista profissional sem gamificação ou pontuação", () => {
  const risk = CIRCUIT_TASKS.find((task) => task.id === "risk");
  assert.ok(risk);
  assert.equal(risk.method,"entrevista");
  assert.equal(risk.area,"mental");
  assert.equal(risk.min,8);
  assert.ok(circuitForAge(7).every((task) => task.id !== "risk"));
  assert.ok(circuitForAge(8).some((task) => task.id === "risk"));
  assert.match(risk.safety || "",/NÃO é um jogo/);
  assert.ok(CIRCUIT_TASKS.filter((task) => task.id === "reflex" || task.id === "vision").every((task) => task.method === "presencial"));
});

test("relatório descritivo: somente respostas executadas, lacunas e nenhuma normalidade implícita", () => {
  const report = buildCircuitReport(9, {
    reflex: { status: "nao_realizado", note: "Sem martelo disponível." },
    finger6: { status: "achado", note: "Dismetria observada no lado direito." },
    gait2: { status: "observado", note: "Não aplicável nesta faixa." }, // omitido por idade
    rapport: { status: "observado", note: "" },
  }, "Rever em consulta.", new Date("2026-10-20T12:00:00.000Z"));
  assert.match(report,/Estações registradas: 3\//);
  assert.match(report,/2026-10-20.1/);\n  assert.match(report,/EXAME NEUROLÓGICO BÁSICO/);
  assert.match(report,/ESTADO MENTAL/);
  assert.match(report,/Sem martelo disponível/);
  assert.match(report,/Dismetria observada no lado direito/);
  assert.match(report,/Descrição específica não fornecida; não inferir normalidade/);
  assert.doesNotMatch(report,/Não aplicável nesta faixa/);
  assert.doesNotMatch(report,/diagnóstico: [A-Z]/i);
  assert.equal(buildCircuitReport(1,{}),"Circuito não disponível para esta idade.");
});

test("integração aditiva na tela existente e isolamento de envio, gravação e XP", () => {
  const page = readFileSync("client/src/pages/super-neuropad-game.tsx","utf8");
  const component = readFileSync("client/src/features/super-neuropad/ClinicalCircuit.tsx","utf8");
  assert.match(page,/import \{ ClinicalCircuit \}/);
  assert.match(page,/<ClinicalCircuit key=\{ageYears \?\? "sem-idade"\}/);
  assert.match(component,/visible=|visible: boolean/);
  assert.match(component,/screen|Somente apoio|Não altera os seis mundos|Não são anexados ao PDF/);
  assert.doesNotMatch(component,/(localStorage|sessionStorage|MediaRecorder|getUserMedia|fetch\(|XMLHttpRequest)/);
  assert.match(component,/referrerPolicy="no-referrer"/);
});
