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

// ---------- D) Task switching / memória (novas tarefas SR) ----------
{
  const sw = cognitiveTasks.find((t) => t.id === "task-switching");
  const seq = sw ? sw.makeTrials(48, mulberry32(11)) : [];
  ok(seq.some((t) => t.tags.includes("troca")) && seq.some((t) => t.tags.includes("repeticao")), "switching: gera trocas e repeticoes");
  ok(seq[0]?.tags.includes("repeticao") === true, "switching: primeiro ensaio conta como repeticao");
  for (const memId of ["memoria-visual-np", "memoria-verbal-np"]) {
    const mem = cognitiveTasks.find((t) => t.id === memId);
    const ms = mem ? mem.makeTrials(52, mulberry32(13)) : [];
    const seen: string[] = [];
    let badRepeat = 0;
    for (const t of ms) {
      const isRepeat = t.correctResponse === "javi";
      if (isRepeat && !seen.includes(t.stimulus.display)) badRepeat++;
      seen.push(t.stimulus.display);
    }
    ok(ms.some((t) => t.correctResponse === "javi"), `${memId}: possui repetidos`);
    ok(badRepeat === 0, `${memId}: todo "repetido" apareceu antes de fato`);
  }
}

// ---------- E) Lógica de span (dígitos/Corsi) ----------
{
  const { initialSpanState, nextSpanState, makeDigitSequence, makeCorsiSequence, isReproductionCorrect, SPAN_MAX } = await import("../../client/src/features/cognitive-lab/spanLogic");
  let st = initialSpanState();
  ok(st.length === 2 && st.attempt === 1, "span inicia em 2 itens");
  st = nextSpanState(st, true);
  ok(st.length === 3 && st.attempt === 1 && st.bestSpan === 2, "acerto de primeira sobe direto");
  st = nextSpanState(st, false);
  ok(st.length === 3 && st.attempt === 2, "erro na 1a tentativa da 2a chance");
  st = nextSpanState(st, false);
  ok(st.done && st.bestSpan === 2, "dois erros no mesmo comprimento encerram");
  // Sobe até o teto e encerra.
  let st2 = initialSpanState();
  for (let i = 0; i < 20 && !st2.done; i++) st2 = nextSpanState(st2, true);
  ok(st2.done && st2.bestSpan === SPAN_MAX, `so acertos termina no teto (${st2.bestSpan})`);
  const dig = makeDigitSequence(8, mulberry32(5));
  ok(dig.length === 8 && dig.every((d, i) => i === 0 || d !== dig[i - 1]), "digitos sem repeticao adjacente");
  const cor = makeCorsiSequence(8, mulberry32(5));
  ok(cor.length === 8 && cor.every((b) => b >= 0 && b < 9) && cor.every((b, i) => i === 0 || b !== cor[i - 1]), "corsi 0..8 sem repeticao adjacente");
  ok(isReproductionCorrect([1, 2, 3], [1, 2, 3], false), "reproducao direta correta");
  ok(isReproductionCorrect([1, 2, 3], [3, 2, 1], true), "reproducao inversa correta");
  ok(!isReproductionCorrect([1, 2, 3], [1, 2], false), "tamanho errado reprova");
}

// ---------- F) Helpers dos runners custom (trail/busca/torre) ----------
{
  const { makeTrailSequence, makeTrailLayout } = await import("../../client/src/features/cognitive-lab/TrailMakingRunner");
  const a = makeTrailSequence("A");
  const b = makeTrailSequence("B");
  ok(a.length === 15 && a[0] === "1" && a[14] === "15", "trilha A = 1..15");
  ok(b.length === 15 && b[0] === "1" && b[1] === "A" && b[14] === "8", "trilha B alterna numero/letra ate 8");
  const layout = makeTrailLayout(15, mulberry32(9));
  ok(layout.length === 15, "layout com 15 posicoes");
  let minDist = Infinity;
  for (let i = 0; i < layout.length; i++)
    for (let j = i + 1; j < layout.length; j++)
      minDist = Math.min(minDist, Math.hypot(layout[i].x - layout[j].x, layout[i].y - layout[j].y));
  ok(minDist >= 12, `trilha: alvos sem sobreposicao (dist minima ${minDist.toFixed(1)})`);

  const { makeSearchGrid } = await import("../../client/src/features/cognitive-lab/VisualSearchRunner");
  for (const size of [12, 24] as const) {
    const g = makeSearchGrid(size, mulberry32(21));
    ok(g.cells.length === size, `busca ${size}: grade completa`);
    ok(g.cells.filter((c) => c === "🦋").length === 1, `busca ${size}: exatamente 1 alvo`);
    ok(g.cells[g.targetIndex] === "🦋", `busca ${size}: targetIndex aponta o alvo`);
  }

  const { TOWER_PROBLEMS, solveMinMoves, isLegalMove, applyMove } = await import("../../client/src/features/cognitive-lab/TowerRunner");
  ok(TOWER_PROBLEMS.length === 5, "torre: 5 problemas");
  const mins = TOWER_PROBLEMS.map((p) => solveMinMoves(p.start, p.goal));
  ok(mins.every((m) => m >= 2 && m <= 8), `torre: minimos plausiveis (${mins.join(",")})`);
  ok(mins.every((m, i) => i === 0 || m >= mins[i - 1]), `torre: dificuldade nao decrescente (${mins.join(",")})`);
  const s0 = TOWER_PROBLEMS[0].start;
  const legalTo = [0, 1, 2].find((to) => isLegalMove(s0, s0.findIndex((p) => p.length > 0), to) && to !== s0.findIndex((p) => p.length > 0));
  ok(legalTo !== undefined, "torre: existe movimento legal no estado inicial");
  if (legalTo !== undefined) {
    const from = s0.findIndex((p) => p.length > 0);
    const s1 = applyMove(s0, from, legalTo);
    ok(s1 !== s0 && s1[from].length === s0[from].length - 1, "torre: applyMove imutavel e move o topo");
  }
}

console.log(`\n[cognitive-lab] ${checks} verificações, ${failures} falha(s).`);
if (failures > 0) process.exit(1);
console.log("✅ COGNITIVE LAB OK");
