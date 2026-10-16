// Calcula as "impressões digitais" do comportamento clínico dos dois módulos (cortes, escores, sinais).
// Usado pelo teste de congelamento e pelo gerador do fixture. Não contém norma nem valor novo.
import { createHash } from "node:crypto";
import {
  AGE_BANDS, PHASE_ORDER, estimateBandSeconds, itemsFor, isJudged, levelCuts, overallLevel, phaseLevel, recordBuild, recordJudged, recordTouch, summarize,
  type AnswerRecord, type AnswerStatus, type GameSession, type Item, type PhaseId,
} from "../../client/src/features/super-neuropad/model";
import { scoreIced, type IcedInput } from "../../client/src/features/dyslexia-risk/model";
import { BANDS, bandForAge, fluencyWords, type BandBank } from "../../client/src/features/dyslexia-risk/game/bank";
import {
  WORLDS, estimateSessionSeconds, newGame, nextItemFor, recordFluency, recordResponse, summarizeGame, type GameState, type ItemResponse,
} from "../../client/src/features/dyslexia-risk/game/engine";

const sha = (value: unknown) => createHash("sha256").update(JSON.stringify(value)).digest("hex");

function record(item: Item, phaseId: PhaseId, status: AnswerStatus): AnswerRecord {
  if (item.kind === "toque") {
    const chosen = status === "acerto" ? item.options.find((o) => o.label === item.answer)! : status === "erro" ? item.options.find((o) => o.label !== item.answer)! : null;
    return recordTouch(item, phaseId, chosen, 3, false, status === "recusa");
  }
  if (isJudged(item)) return recordJudged(item, phaseId, status, 5);
  return recordBuild(item, phaseId, status === "acerto" ? [...item.target] : null, 5, false, status === "recusa");
}
function play(years: number, plan: (item: Item, phaseId: PhaseId, index: number) => AnswerStatus): GameSession {
  let n = 0;
  const answers = PHASE_ORDER.flatMap((phaseId) => itemsFor(String(years), phaseId).map((item) => record(item, phaseId, plan(item, phaseId, n++))));
  return { version: "golden", ageYears: years, bandId: String(years), characterId: "robo", startedAt: "2026-10-15T12:00:00.000Z", finishedAt: "2026-10-15T12:15:00.000Z", answers };
}

export const SUPER_PLANS: Record<string, (item: Item, phaseId: PhaseId, index: number) => AnswerStatus> = {
  todos: () => "acerto",
  alternado: (_i, _p, n) => (n % 2 === 0 ? "acerto" : "erro"),
  memoriaErro: (_i, p) => (p === "memoria" ? "erro" : "acerto"),
  umErroPorMundo: (_i, _p, n) => (n % 3 === 1 ? "erro" : "acerto"),
  semResposta: (_i, _p, n) => (n % 4 === 0 ? "sem_resposta" : "acerto"),
};

/** Nível por mundo e total, para cada idade e cada plano. Os níveis de domínio (2–3 anos) vão numa chave à parte. */
export function superFingerprint() {
  const levels: Record<string, string> = {};
  const domains: Record<string, string> = {};
  for (const band of AGE_BANDS) {
    for (const [name, plan] of Object.entries(SUPER_PLANS)) {
      const s = summarize(play(band.min, plan));
      levels[`${band.min}/${name}`] = `${s.level}|${s.hits}/${s.total}|${s.phases.map((p) => `${p.hits}:${p.level}`).join(",")}`;
      domains[`${band.min}/${name}`] = s.domains.map((d) => `${d.domain}:${d.hits}/${d.total}:${d.level}`).join(",");
    }
  }
  const cuts: Record<string, unknown> = {};
  for (let total = 1; total <= 40; total++) {
    cuts[total] = [levelCuts(total, "fase"), levelCuts(total, "total"), Array.from({ length: total + 1 }, (_, h) => `${phaseLevel(h, total)[0]}${overallLevel(h, total)[0]}`).join("")];
  }
  const minutes = Object.fromEntries(AGE_BANDS.map((b) => [b.min, estimateBandSeconds(b.min).totalSeconds]));
  return { levels, domains, cuts, minutes };
}

// ── ICED-8: amostra pseudoaleatória determinística (LCG), sem depender de Math.random ──
function lcg(seed: number) {
  let s = seed >>> 0;
  return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 2 ** 32);
}
export function icedInputs(count = 4000): IcedInput[] {
  const r = lcg(20261016);
  const pick = <T,>(xs: readonly T[]): T => xs[Math.floor(r() * xs.length)];
  const tri = ["sim", "sim", "sim", "nao", "nv", ""] as const;
  const out: IcedInput[] = [];
  for (let i = 0; i < count; i++) {
    const all = r() < 0.6;
    const base = all ? "sim" : undefined;
    out.push({
      ano: pick(["2", "3", "outro", ""] as const),
      controle: Object.fromEntries(["esc", "alf", "freq", "aud", "vis", "di", "pers"].map((k) => [k, base ?? pick(tri)])) as IcedInput["controle"],
      palavrasAcertos: pick([null, 12, 15, 16, 17, 20]), palavrasF: pick([null, 0, 2, 3, 4, 5, 8]), palavrasNorma: r() < 0.05,
      pseudoAcertos: pick([null, 6, 10, 11, 16]), pseudoLex: pick([null, 0, 3, 4, 6]), pseudoNorma: r() < 0.05,
      pcpm: pick([null, 20, 42, 43, 55, 56, 70, 71, 80, 81, 120]), fluenciaNorma: r() < 0.05,
      ditadoF: pick([null, 0, 3, 4, 7]), ditadoPseudoCertas: pick([null, 0, 2, 3, 5]), ditadoNorma: r() < 0.05,
      cfAcertos: pick([null, 3, 6, 7, 9, 10, 12]), cfNorma: r() < 0.05,
      ranSeg: pick([null, 30, 45, 46, 70]), ranErros: pick([null, 0, 3, 4, 8]), ranNorma: r() < 0.05,
      familiar: pick(["sim", "nao", "nv", ""] as const), persistencia4: pick([null, true, false]),
    });
  }
  return out;
}
export function icedFingerprint() {
  const rows = icedInputs().map((input) => {
    const res = scoreIced(input);
    return `${res.faixa}|${res.total}|${res.nucleo}|${res.trava ? 1 : 0}|${res.dominios.map((d) => `${d.pontos}${d.examinado ? "e" : "n"}${d.limítrofe ? "l" : ""}`).join(",")}`;
  });
  return { count: rows.length, hash: sha(rows), sample: rows.slice(0, 12) };
}

// ── Jogo de dislexia: sessão roteirizada por faixa ──
function playGame(age: number, correct: boolean): GameState {
  const bank = bandForAge(age) as BandBank;
  let g = newGame({ nome: "G", idade: age, examinador: "G" });
  for (const w of WORLDS) {
    if (w.id === "fluencia") {
      g = recordFluency(g, { probeId: bank.fluencia.id, totalWords: fluencyWords(bank.fluencia).length, lidas: 40, erros: 2, segundos: 60 });
      continue;
    }
    let guard = 0;
    for (let item = nextItemFor(g, w.id, bank); item && guard < 50; item = nextItemFor(g, w.id, bank), guard++) {
      const a: Pick<ItemResponse, "given" | "outcome" | "errorType"> = correct
        ? { given: (item as { answer?: string }).answer ?? "x", outcome: "correto" }
        : { given: "zz", outcome: "erro", errorType: "fonologico" };
      g = recordResponse(g, { world: w.id, itemId: item.id, level: (item as { level?: 1 | 2 | 3 }).level ?? 2, prompt: "p", expected: "e", ms: 1500, kind: (item as { kind?: string }).kind ?? ((item as { pseudo?: boolean }).pseudo ? "pseudo" : "palavra"), op: (item as { op?: ItemResponse["op"] }).op, ...a }, bank);
    }
  }
  return g;
}
export function gameFingerprint() {
  const out: Record<string, string> = {};
  for (const b of BANDS) {
    const age = b.minAge;
    for (const correct of [true, false]) {
      const s = summarizeGame(playGame(age, correct));
      out[`${b.band}/${correct ? "ok" : "erro"}`] = `${s.ditado.corretos}/${s.ditado.total}|${s.ditado.finalLevel}|${s.leitura.decodificacao.corretos}/${s.leitura.decodificacao.total}|${s.leitura.compreensao.corretos}/${s.leitura.compreensao.total}|${s.aritmetica.corretos}/${s.aritmetica.total}|${s.sinais.length}`;
    }
    out[`${b.band}/estimativa`] = String(estimateSessionSeconds(b.band));
  }
  return out;
}
