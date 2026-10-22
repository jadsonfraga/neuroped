import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import {
  buildCircuitReport, circuitForAge, CIRCUIT_SOURCES, CIRCUIT_TASKS, CIRCUIT_URGENCY_NOTE,
  coverageStatus, MSE_SECTIONS, NEURO_BASIC_DOMAINS, STATION_DEMO, type CircuitRecords, type CoverageDomain,
} from "../../client/src/features/super-neuropad/clinicalCircuit";

// Estações publicadas (PR #1191) que permanecem. Missões repetidas foram fundidas (ver FUNDIDAS) e as que a
// auxiliar consegue fazer como brincadeira passaram de "presencial" para "ludico": id e área preservados.
const PUBLISHED_STATIONS = [
  ["rapport", "mental", 2, 17, "observacao"], ["social2", "mental", 2, 5, "ludico"], 
  ["language2", "neurologico", 2, 5, "ludico"], ["language6", "neurologico", 6, 17, "ludico"], ["vision", "neurologico", 2, 17, "presencial"],
  ["face", "neurologico", 2, 17, "presencial"], ["hearing", "neurologico", 2, 17, "presencial"], ["shoulders", "neurologico", 5, 17, "presencial"],
  ["posture", "neurologico", 2, 17, "presencial"], ["strength2", "neurologico", 2, 17, "ludico"], ["strength6", "neurologico", 6, 17, "presencial"],
  ["reflex", "neurologico", 2, 17, "presencial"], ["sensation", "neurologico", 4, 17, "presencial"], ["reach2", "neurologico", 2, 5, "ludico"],
  ["finger6", "neurologico", 6, 17, "presencial"], ["gait2", "neurologico", 2, 5, "ludico"], ["gait6", "neurologico", 6, 17, "presencial"],
  ["growth", "neurologico", 2, 17, "presencial"], ["attention2", "mental", 2, 5, "observacao"], ["attention6", "mental", 6, 17, "ludico"],
  ["memory6", "mental", 6, 17, "entrevista"], ["emotion2", "mental", 2, 5, "observacao"], ["emotion6", "mental", 6, 17, "entrevista"],
  ["thought6", "mental", 6, 17, "entrevista"], ["insight9", "mental", 9, 17, "entrevista"], ["risk", "mental", 8, 17, "entrevista"],
] as const;

const NEW_STATIONS = [
  "fundus", "meningeal", "involuntary", "praxis3", "praxis6", "copy6", "stereognosis", "milestones", "sleep", "escola",
];

// Missões que repetiam outras e foram fundidas: o conteúdo segue na missão que as absorveu.
const FUNDIDAS = ["consciencia", "conversation6", "strength2p", "dismetria2", "romberg", "hand"];

// Domínios com estação em todas as idades 2–17 (sem depender de faixa mais restrita).
const ALWAYS_COVERED = [
  "alerta", "par2", "oculomotores", "par5_7", "pares8_12", "meninges", "linguagem", "tonus", "forca",
  "reflexos", "coordenacao", "marcha", "involuntarios", "lateralidade", "crescimento", "desenvolvimento",
];
// Domínios com exame direto cadastrado em toda a faixa (a cargo do médico); os demais domínios presenciais têm só a versão lúdica.
const PRESENCIAL_DOMAINS = ["par2", "oculomotores", "meninges", "tonus", "reflexos", "crescimento"];

const domain = (id: string): CoverageDomain => {
  const found = [...NEURO_BASIC_DOMAINS, ...MSE_SECTIONS].find((entry) => entry.id === id);
  assert.ok(found, `domínio ${id}`);
  return found;
};
const records = (entries: Record<string, CircuitRecords[string]["status"]>, note = ""): CircuitRecords =>
  Object.fromEntries(Object.entries(entries).map(([id, status]) => [id, { status, note, source: "examinador" }]));

test("estações publicadas: id e área preservados, repetidas fundidas e faixa/método conforme o desenho atual", () => {
  assert.equal(PUBLISHED_STATIONS.length, 26);
  for (const id of FUNDIDAS) assert.ok(!CIRCUIT_TASKS.some((entry) => entry.id === id), `${id} é repetida e foi fundida`);
  for (const [id, area, min, max, method] of PUBLISHED_STATIONS) {
    const task = CIRCUIT_TASKS.find((entry) => entry.id === id);
    assert.ok(task, `estação ${id} removida`);
    assert.equal(task.area, area, id);
    assert.equal(task.min, min, id);
    assert.equal(task.max, max, id);
    assert.equal(task.method, method, id);
  }
});

test("expansão íntegra: IDs únicos, faixas válidas, texto suficiente e urgências com alerta", () => {
  const ids = CIRCUIT_TASKS.map((task) => task.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.ok(CIRCUIT_TASKS.length >= 35);
  for (const id of NEW_STATIONS) assert.ok(ids.includes(id), `nova estação ${id}`);
  for (const task of CIRCUIT_TASKS) {
    assert.ok(task.min >= 2 && task.max <= 17 && task.min <= task.max, task.id);
    assert.ok(task.guide.length > 45 && task.observe.length > 25, task.id);
  }
  assert.match(CIRCUIT_TASKS.find((task) => task.id === "fundus")?.safety ?? "", /papiledema/i);
  assert.match(CIRCUIT_TASKS.find((task) => task.id === "meningeal")?.safety ?? "", /emergência/);
  assert.match(CIRCUIT_URGENCY_NOTE, /urgência/);
});

test("faixas: todo domínio básico mapeia para estações reais e domínios presenciais têm exame direto em 2–17", () => {
  const ids = new Set(CIRCUIT_TASKS.map((task) => task.id));
  for (const entry of [...NEURO_BASIC_DOMAINS, ...MSE_SECTIONS]) {
    for (const id of entry.stations) assert.ok(ids.has(id), `${entry.id} → ${id}`);
  }
  for (let age = 2; age <= 17; age++) {
    const tasks = circuitForAge(age);
    for (const id of ALWAYS_COVERED) {
      const entry = domain(id);
      assert.ok(tasks.some((task) => entry.stations.includes(task.id)), `${id} sem estação aos ${age} anos`);
    }
    for (const id of PRESENCIAL_DOMAINS) {
      const entry = domain(id);
      assert.ok(tasks.some((task) => entry.stations.includes(task.id) && task.method === "presencial"), `${id} sem exame direto aos ${age} anos`);
    }
  }
});

test("cobertura: lúdico não substitui exame direto em domínios presenciais; registro não vira normal", () => {
  const forca = domain("forca");
  assert.equal(coverageStatus(forca, 3, {}), "pendente");
  assert.equal(coverageStatus(forca, 3, records({ strength2: "observado" })), "parcial");
  assert.equal(coverageStatus(forca, 3, records({ strength2: "achado" })), "esclarecer");
  assert.equal(coverageStatus(forca, 3, records({ strength2: "nao_realizado" })), "nao_obtido");
  assert.equal(coverageStatus(forca, 9, records({ strength2: "observado", strength6: "observado" })), "registrado");
  assert.equal(coverageStatus(forca, 9, records({ strength2: "observado" })), "parcial");
  assert.equal(coverageStatus(domain("par11"), 3, {}), "sem_estacao");
  assert.equal(coverageStatus(domain("marcha"), 3, records({ gait2: "observado" })), "registrado");
  assert.equal(coverageStatus(domain("reflexos"), 9, records({ reflex: "nao_colaborou" })), "nao_obtido");
  assert.equal(coverageStatus(domain("reflexos"), 9, records({ reflex: "achado" })), "esclarecer");
  assert.equal(coverageStatus(domain("reflexos"), 9, records({ reflex: "observado", finger6: "achado" })), "registrado");
});

test("seções do estado mental cobrem a estrutura clínica e indicam ausência de estação na faixa", () => {
  const ids = MSE_SECTIONS.map((section) => section.id);
  assert.deepEqual(ids, ["aparencia", "psicomotor", "fala", "humor", "pensamento", "cognicao", "juizo", "neurovegetativo", "seguranca"]);
  assert.ok(MSE_SECTIONS.every((section) => circuitForAge(9).some((task) => section.stations.includes(task.id))));
  assert.equal(coverageStatus(domain("seguranca"), 7, {}), "sem_estacao");
});

test("relatório: cobertura por domínio, fonte de cada registro, urgência e sem conclusão de normalidade", () => {
  const report = buildCircuitReport(7, {
    reflex: { status: "observado", note: "Reflexos patelares simétricos.", source: "examinador" },
    milestones: { status: "achado", note: "Perda de palavras relatada pelo cuidador.", source: "cuidador" },
    gait6: { status: "observado", note: "" },
  }, "", new Date("2026-10-20T12:00:00.000Z"));
  assert.match(report, /v2026-10-21\.1/);
  assert.match(report, /COBERTURA DO EXAME NEUROLÓGICO BÁSICO POR DOMÍNIO/);
  assert.match(report, /COBERTURA DAS SEÇÕES DO EXAME DO ESTADO MENTAL/);
  assert.match(report, /Fonte: Observação direta pelo examinador/);
  assert.match(report, /Fonte: Relato do cuidador/);
  assert.match(report, /Fonte: não informada/);
  assert.match(report, /• Reflexos: Registrado/);
  assert.match(report, /• Marcos do desenvolvimento \(relato\): Achado a esclarecer/);
  assert.match(report, /Sinais de urgência: Rebaixamento/);
  assert.match(report, /Perda de palavras relatada pelo cuidador/);
  assert.doesNotMatch(report, /: normal\b/i);
  assert.doesNotMatch(report, /diagnóstico: [A-Z]/i);
});

test("catálogo de fontes: cinco origens nomeadas: auxiliar distinta do examinador, cuidador, escola e outra", () => {
  assert.deepEqual(Object.keys(CIRCUIT_SOURCES).sort(), ["auxiliar", "cuidador", "escola", "examinador", "outra"]);
});

test("demonstrações: apenas estações cadastradas, animações sem pessoa real, movimento reduzível", () => {
  for (const id of Object.keys(STATION_DEMO)) assert.ok(CIRCUIT_TASKS.some((task) => task.id === id), id);
  assert.deepEqual([...new Set(Object.values(STATION_DEMO))].sort(), ["dedo-nariz", "seguimento", "tandem"]);
  const demoSource = readFileSync("client/src/features/super-neuropad/ClinicalDemo.tsx", "utf8");
  assert.match(demoSource, /prefers-reduced-motion: reduce/);
  assert.doesNotMatch(demoSource, /https?:\/\/|<video|<img|\bsrc=/);
});

test("componente: sem armazenamento, rede ou captura; fonte, urgência e cobertura integradas", () => {
  const component = readFileSync("client/src/features/super-neuropad/ClinicalCircuit.tsx", "utf8");
  assert.doesNotMatch(component, /(localStorage|sessionStorage|MediaRecorder|getUserMedia|fetch\(|XMLHttpRequest)/);
  assert.match(component, /CIRCUIT_URGENCY_NOTE/);
  assert.match(component, /CIRCUIT_SOURCES/);
  assert.match(component, /ClinicalDemo/);
  assert.match(component, /super-neuropad-clinical-coverage/);
});
