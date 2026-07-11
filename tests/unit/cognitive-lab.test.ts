// @ts-check
/**
 * cognitive-lab.test.ts — trava o motor do Cognitive Lab:
 *  A) estatística descritiva (média/mediana/DP/CV, taxas, blocos, tags);
 *  B) critérios automáticos de validade;
 *  C) geradores de ensaio de TODAS as tarefas: determinismo por seed,
 *     proporções de alvo, resposta correta ∈ respostas da tarefa, n-back
 *     com correspondências reais.
 * Rodar: npm run test:cognitive (tsx).
 */
import { computeStats, evaluateValidity, mean, median, mulberry32, stdDev } from "../../client/src/features/cognitive-lab/stats";
import { cognitiveTasks } from "../../client/src/features/cognitive-lab/tasks";
import type { TrialRecord } from "../../client/src/features/cognitive-lab/types";

let checks = 0;
let failures = 0;
function ok(cond: boolean, msg: string) {
  checks++;
  if (!cond) {
    failures++;
    console.error(`  ❌ ${msg}`);
  }
}

// ---------- A) Estatística ----------
ok(mean([1, 2, 3]) === 2, "media simples");
ok(mean([]) === null, "media vazia = null");
ok(median([1, 3, 2]) === 2, "mediana impar");
ok(median([1, 2, 3, 4]) === 2.5, "mediana par");
ok(Math.abs((stdDev([2, 4, 4, 4, 5, 5, 7, 9]) ?? 0) - 2.138) < 0.01, "desvio padrao amostral");
ok(stdDev([5]) === null, "DP com n<2 = null");

function rec(partial: Partial<TrialRecord>, i: number): TrialRecord {
  return {
    index: i, block: 0, phase: "test", tags: ["alvo"], expected: "go",
    responded: "go", rtMs: 500, correct: true, anticipated: false, onsetMs: 0,
    ...partial,
  };
}

const trials: TrialRecord[] = [
  rec({ rtMs: 400 }, 0),
  rec({ rtMs: 600 }, 1),
  rec({ rtMs: 500, block: 1 }, 2),
  rec({ responded: null, rtMs: null, correct: false }, 3), // omissão
  rec({ expected: null, tags: ["nogo"], responded: "go", rtMs: 300, correct: false }, 4), // comissão
  rec({ rtMs: 100, anticipated: true, correct: false }, 5), // antecipação
  rec({ phase: "practice", rtMs: 999 }, 6), // treino não entra
];
const stats = computeStats(trials);
ok(stats.nTrials === 6, `nTrials so da aplicacao (${stats.nTrials})`);
ok(stats.meanRt === 500, `RT medio exclui omissao/comissao/antecipacao (${stats.meanRt})`);
ok(stats.medianRt === 500, "mediana");
ok(stats.minRt === 400 && stats.maxRt === 600, "min/max");
ok(Math.abs((stats.cvRt ?? 0) - 0.2) < 0.001, `CV = DP/media (${stats.cvRt})`);
ok(Math.abs(stats.omissionRate - 1 / 5) < 1e-9, `taxa de omissao sobre esperados (${stats.omissionRate})`);
ok(stats.anticipationRate > 0, "antecipacao contada");
ok(stats.commissionRate > 0, "comissao contada");
ok(stats.blockMeans.length === 2, "medias por bloco");
ok(stats.byTag["nogo"].n === 1, "quebra por tag");
ok(stats.rtDistribution.reduce((a, b) => a + b.count, 0) === 3, "distribuicao cobre RTs validos");

// ---------- B) Validade ----------
const validCriteria = { minResponseRate: 0.6, maxAnticipationRate: 0.2, minPracticeAccuracy: 0.6 };
ok(evaluateValidity(trials, validCriteria).valid, "sessao ok passa validade");
const badTrials = trials.map((t, i) => (t.expected !== null ? { ...t, responded: null, rtMs: null, correct: false, index: i } : t));
ok(!evaluateValidity(badTrials, validCriteria).valid, "sem respostas reprova validade");

// ---------- C) Geradores das tarefas ----------
for (const task of cognitiveTasks) {
  const a = task.makeTrials(task.trialsPerBlock, mulberry32(42));
  const b = task.makeTrials(task.trialsPerBlock, mulberry32(42));
  ok(a.length === task.trialsPerBlock, `${task.id}: gera n ensaios`);
  ok(JSON.stringify(a) === JSON.stringify(b), `${task.id}: deterministico por seed`);
  const responseIds = new Set(task.responses.map((r) => r.id));
  ok(
    a.every((t) => t.correctResponse === null || responseIds.has(t.correctResponse)),
    `${task.id}: resposta correta pertence as respostas da tarefa`
  );
  ok(a.every((t) => t.stimulus.display.length > 0), `${task.id}: estimulo nao-vazio`);
  ok(a.every((t) => t.tags.length > 0), `${task.id}: ensaios etiquetados`);
  const targets = a.filter((t) => t.correctResponse !== null).length;
  ok(targets > 0, `${task.id}: ha ensaios com resposta esperada`);
  ok(task.practiceTrials >= 5, `${task.id}: treino suficiente`);
  ok(task.deadlineMs >= 800, `${task.id}: prazo de resposta plausivel`);
}

// N-back: correspondências reais com o n da tarefa.
for (const level of [1, 2, 3] as const) {
  const task = cognitiveTasks.find((t) => t.id === `nback-${level}`);
  if (!task) { ok(false, `nback-${level} existe`); continue; }
  const seq = task.makeTrials(50, mulberry32(7));
  const matches = seq.filter((t, i) => i >= level && t.stimulus.display === seq[i - level].stimulus.display);
  const declared = seq.filter((t) => t.correctResponse === "match");
  ok(declared.length > 0, `nback-${level}: possui alvos`);
  ok(
    declared.every((t) => matches.includes(t)) && matches.every((t) => declared.includes(t)),
    `nback-${level}: alvo declarado = correspondencia real`
  );
}

// Stroop: incongruente nunca tem tinta igual à palavra.
{
  const stroop = cognitiveTasks.find((t) => t.id === "stroop-np");
  const seq = stroop ? stroop.makeTrials(48, mulberry32(3)) : [];
  const bad = seq.filter(
    (t) => t.tags.includes("incongruente") && t.correctResponse === t.stimulus.display.toLowerCase()
  );
  ok(seq.length > 0 && bad.length === 0, "stroop: incongruente tem tinta ≠ palavra");
}

console.log(`\n[cognitive-lab] ${checks} verificações, ${failures} falha(s).`);
if (failures > 0) process.exit(1);
console.log("✅ COGNITIVE LAB OK");
