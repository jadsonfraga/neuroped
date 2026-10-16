// Tarefas complementares cronometradas (v2026-10-16): lógica pura do span espacial e do go/no-go, relatório
// descritivo sem norma, integração ao relatório/PDF/prontuário e disciplina clínica da interface.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  CORSI_BLOCKS, FAST_RT_MS, classifyCorsi, corsiSequence, goNoGoConfig, goNoGoIntervals, goNoGoSequence, nextCorsiStep, summarizeCorsi, summarizeGoNoGo,
  taskReportLines, tasksAvailable, type CorsiTrial, type GoNoGoTrial,
} from "../../client/src/features/super-neuropad/tasks";
import { buildGameDocSpec } from "../../client/src/features/super-neuropad/pdf";
import { buildGameReport, buildPatientRecordItems, buildStructuredLines, type GameSession } from "../../client/src/features/super-neuropad/model";

const ISSUER = { doctorName: "Dra. Teste", specialty: "Neuropediatria", credentials: "CRM 0", clinicName: "Clínica Teste", motto: "" };

test("disponibilidade: 4 a 17 anos; 2 e 3 anos fora", () => {
  assert.equal(tasksAvailable(2), false);
  assert.equal(tasksAvailable(3), false);
  for (let years = 4; years <= 17; years++) assert.equal(tasksAvailable(years), true);
  assert.equal(tasksAvailable(4.5), false);
});

test("corsiSequence: determinística, sem blocos repetidos, tamanho pedido, dentro dos 9 blocos", () => {
  for (let length = 2; length <= CORSI_BLOCKS; length++) {
    for (const attempt of [0, 1]) {
      const sequence = corsiSequence(length, 42, attempt);
      assert.equal(sequence.length, length);
      assert.equal(new Set(sequence).size, length);
      assert.ok(sequence.every((block) => block >= 0 && block < CORSI_BLOCKS));
      assert.deepEqual(corsiSequence(length, 42, attempt), sequence);
    }
  }
});

test("classifyCorsi: nenhum, ordem, intrusão e omissão", () => {
  assert.equal(classifyCorsi([1, 2, 3], [1, 2, 3]), "nenhum");
  assert.equal(classifyCorsi([1, 2, 3], [1, 3, 2]), "ordem");
  assert.equal(classifyCorsi([1, 2, 3], [1, 2, 7]), "intrusao");
  assert.equal(classifyCorsi([1, 2, 3], [1, 2]), "omissao");
});

const trial = (length: number, correct: boolean): CorsiTrial => ({ length, sequence: [], response: [], correct, error: correct ? "nenhum" : "ordem", seconds: 3 });

test("nextCorsiStep: acerto sobe, erro dá segunda tentativa, dois erros na mesma extensão param, 9 é o máximo", () => {
  assert.deepEqual(nextCorsiStep([]), { length: 2, attempt: 0 });
  assert.deepEqual(nextCorsiStep([trial(2, true)]), { length: 3, attempt: 0 });
  assert.deepEqual(nextCorsiStep([trial(2, true), trial(3, false)]), { length: 3, attempt: 1 });
  assert.deepEqual(nextCorsiStep([trial(2, true), trial(3, false), trial(3, true)]), { length: 4, attempt: 0 });
  assert.deepEqual(nextCorsiStep([trial(2, true), trial(3, false), trial(3, false)]), { stop: "regra" });
  assert.deepEqual(nextCorsiStep([trial(9, true)]), { stop: "maximo" });
  const result = summarizeCorsi([trial(2, true), trial(3, true), trial(4, false), trial(4, false)], true, "regra");
  assert.equal(result.span, 3);
  assert.equal(summarizeCorsi([trial(2, false), trial(2, false)], true, "regra").span, 0);
});

test("goNoGoSequence: contagem exata, sem no-go nas 2 primeiras, no máximo 2 no-go seguidas, determinística", () => {
  for (const years of [4, 7, 12]) {
    const config = goNoGoConfig(years);
    for (const seed of [1, 99, 123456]) {
      const order = goNoGoSequence(config, seed);
      assert.equal(order.length, config.trials);
      assert.equal(order.filter((kind) => kind === "nogo").length, config.nogo);
      assert.equal(order[0], "go");
      assert.equal(order[1], "go");
      for (let index = 2; index < order.length; index++) assert.ok(!(order[index] === "nogo" && order[index - 1] === "nogo" && order[index - 2] === "nogo"));
      assert.deepEqual(goNoGoSequence(config, seed), order);
      const isi = goNoGoIntervals(config, seed);
      assert.equal(isi.length, config.trials);
      assert.ok(isi.every((value) => value >= config.isiMinMs && value <= config.isiMaxMs));
    }
  }
  assert.ok(goNoGoConfig(4).trials < goNoGoConfig(8).trials && goNoGoConfig(8).trials < goNoGoConfig(12).trials);
});

const gt = (kind: "go" | "nogo", rtMs: number | null, extraTaps = 0): GoNoGoTrial => ({ kind, rtMs, extraTaps, isiMs: 1000 });

test("summarizeGoNoGo: omissões, comissões, toques muito rápidos fora do tempo dos acertos, mediana, DP e CV", () => {
  const trials = [gt("go", 400), gt("go", 500), gt("go", 600), gt("go", 700), gt("go", 800), gt("go", FAST_RT_MS - 1), gt("go", null), gt("nogo", null), gt("nogo", 450, 2), gt("nogo", null)];
  const summary = summarizeGoNoGo({ trials });
  assert.equal(summary.goTrials, 7);
  assert.equal(summary.nogoTrials, 3);
  assert.equal(summary.hits, 5);
  assert.equal(summary.fast, 1);
  assert.equal(summary.omissions, 1);
  assert.equal(summary.commissions, 1);
  assert.equal(summary.extraTaps, 2);
  assert.equal(summary.rt.median, 600);
  assert.equal(summary.rt.n, 5);
  assert.equal(summary.rt.sd, 158);
  assert.equal(summary.rt.cv, 0.26);
  assert.equal(summary.commissionRate, 0.333);
  assert.deepEqual(summarizeGoNoGo({ trials: [] }).rt, { n: 0, median: 0, q1: 0, q3: 0, iqr: 0, sd: 0, cv: null });
});

function session(tasks?: GameSession["tasks"]): GameSession {
  return { version: "t", ageYears: 9, bandId: "9", characterId: "raposa", startedAt: "2026-10-16T12:00:00.000Z", finishedAt: "2026-10-16T12:15:00.000Z", answers: [], ...(tasks ? { tasks } : {}) };
}

test("relatório, linhas estruturadas, PDF e prontuário incluem as tarefas; sem tarefas nada muda", () => {
  assert.deepEqual(taskReportLines(undefined), []);
  const plain = session();
  assert.doesNotMatch(buildGameReport(plain), /TAREFAS COMPLEMENTARES/);
  assert.ok(!buildStructuredLines(plain).some((line) => line.startsWith("TAREFA ")));
  assert.ok(!buildGameDocSpec(plain, ISSUER, "16/10/2026").sections.some((section) => /Tarefas complementares/.test(section.heading)));
  const corsi = summarizeCorsi([trial(2, true), trial(3, true), trial(4, false), trial(4, false)], true, "regra");
  const gonogo = { task: "gonogo" as const, version: "t", practiceDone: true, config: goNoGoConfig(9), trials: [gt("go", 400), gt("go", 500), gt("go", 600), gt("go", null), gt("nogo", 480)], stop: "aplicadora" as const };
  const withTasks = session([corsi, gonogo]);
  const report = buildGameReport(withTasks);
  assert.match(report, /TAREFAS COMPLEMENTARES CRONOMETRADAS \(DESCRITIVAS, SEM NORMA\)/);
  assert.match(report, /span 3/);
  assert.match(report, /omissões 1/);
  assert.ok(buildStructuredLines(withTasks).filter((line) => line.startsWith("TAREFA ")).length === 2);
  const spec = buildGameDocSpec(withTasks, ISSUER, "16/10/2026");
  const section = spec.sections.find((entry) => /Tarefas complementares/.test(entry.heading));
  assert.ok(section);
  assert.doesNotMatch(section.body, /[^\t\n\r\x20-\x7E\xA0-\xFF–—‘’“”…≥≤→⇒←×]/u, "texto do PDF sobrevive à normalização Latin-1");
  assert.ok(buildPatientRecordItems(withTasks).some((row) => /Tarefas complementares/.test(row.question)));
  const all = taskReportLines(withTasks.tasks).join("\n");
  assert.match(all, /sem norma, percentil, ponto de corte, idade equivalente ou diagnóstico/);
  assert.match(all, /latência do toque/);
});

test("interface: opcional, sem rede nem armazenamento, 2–3 anos explicados, nada de certo/errado para a criança", () => {
  const panel = readFileSync("client/src/features/super-neuropad/TasksPanel.tsx", "utf8");
  assert.doesNotMatch(panel, /fetch\(|XMLHttpRequest|localStorage|sessionStorage|indexedDB|navigator\.sendBeacon/);
  assert.match(panel, /snp-tasks-unavailable/);
  assert.match(panel, /Cancelar sem registrar/);
  const page = readFileSync("client/src/pages/super-neuropad-game.tsx", "utf8");
  assert.match(page, /<TasksPanel ageYears=\{session\.ageYears\}/);
  assert.match(page, /setTasks\(\[\]\)/);
});
