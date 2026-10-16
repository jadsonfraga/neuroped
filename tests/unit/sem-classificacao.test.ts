// Diretriz do Dr. Jadson (16/10/2026): NENHUM corte, nível, faixa de classificação, rótulo interpretativo,
// limiar ou comparação com referência em tela, PDF, registro, relatório ou código. O app só relata COMO a
// avaliação foi feita e COMO a criança respondeu. Estes testes varrem todas as saídas e o código-fonte.
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { PHASE_ORDER } from "../../client/src/features/super-neuropad/bank";
import {
  buildGameBrief, buildGameReport, buildPatientRecordItems, buildStructuredLines, isJudged, itemsFor, recordBuild, recordJudged, recordTouch, summarize,
  type AnswerRecord, type AnswerStatus, type GameSession, type Item, type PhaseId,
} from "../../client/src/features/super-neuropad/model";
import { buildGameDocSpec } from "../../client/src/features/super-neuropad/pdf";
import { buildFamilyDocSpec, buildFamilySummary } from "../../client/src/features/super-neuropad/familyDelivery";
import { describeIced, type IcedInput } from "../../client/src/features/dyslexia-risk/model";
import { buildIcedDocSpec, buildIcedFamilySummary, buildIcedFullRecord, buildIcedSummary, icedInputOf, icedResponseItems, type IcedState } from "../../client/src/features/dyslexia-risk/report";
import { BANDS, bandForAge, fluencyWords, type BandBank } from "../../client/src/features/dyslexia-risk/game/bank";
import { newGame, nextItemFor, recordFluency, recordResponse, setObservacoes, WORLDS, summarizeGame } from "../../client/src/features/dyslexia-risk/game/engine";
import { GAME_DISCLAIMER, buildGameDocSpec as buildJlnDocSpec, buildGameRecord, gameResponseItems } from "../../client/src/features/dyslexia-risk/game/report";
import { DESCRIPTIVE_NOTICE } from "../../client/src/lib/descriptiveNotice";

const ISSUER = { doctorName: "Profissional Sintético", specialty: "Neuropediatria", credentials: "CRM 00000", clinicName: "Clínica Sintética", motto: "" };

/** Vocabulário que nunca pode aparecer em nenhuma saída (tela, PDF, registro, relatório, resumo). */
const BANNED_OUTPUT = new RegExp([
  "\\bnível\\b", "\\bníveis\\b", "\\bnivel\\b", "\\bnivel_", "ponto de corte", "pontos? de corte", "\\bcortes?\\b", "limiar", "âncora", "piso autoral",
  "referência interna", "dentro da referência", "abaixo da referência", "acima da referência", "\\bnormativ", "percentil", "escore", "pontuação",
  "sinal de alerta", "sinais de alerta", "sinais para investigar", "\\balerta\\b", "esperado para a (?:idade|faixa)", "\\bdentro do esperado\\b", "\\bobservar\\b",
  "\\belevad[ao]\\b", "\\bintermedi[aá]ri[ao]\\b", "limítrofe", "\\btrava\\b", "prioridade para", "roteiro sugerido", "leitura operacional", "leitura para a consulta",
  "pontos fortes", "pontos para olhar", "nível demonstrado", "merece conversa", "\\bdéficits?\\b", "triagem",
].join("|"), "i");

function assertClean(text: string, label: string) {
  const hit = BANNED_OUTPUT.exec(text);
  assert.equal(hit, null, `${label}: vocabulário interpretativo "${hit?.[0]}" em ...${hit ? text.slice(Math.max(0, hit.index - 60), hit.index + 80).replace(/\n/g, " ") : ""}...`);
}
const flat = (value: unknown) => JSON.stringify(value);

function record(item: Item, phaseId: PhaseId, status: AnswerStatus): AnswerRecord {
  if (item.kind === "toque") {
    const chosen = status === "acerto" ? item.options.find((o) => o.label === item.answer)! : status === "erro" ? item.options.find((o) => o.label !== item.answer)! : null;
    return recordTouch(item, phaseId, chosen, 3, false, status === "recusa");
  }
  if (isJudged(item)) return recordJudged(item, phaseId, status, 5);
  return recordBuild(item, phaseId, status === "acerto" ? [...item.target] : status === "erro" ? [...item.target].reverse() : null, 5, false, status === "recusa");
}
function play(years: number, plan: (index: number) => AnswerStatus): GameSession {
  let index = 0;
  const answers = PHASE_ORDER.flatMap((phaseId) => itemsFor(String(years), phaseId).map((item) => record(item, phaseId, plan(index++))));
  return { version: "test", ageYears: years, bandId: String(years), characterId: "robo", startedAt: "2026-10-15T12:00:00.000Z", finishedAt: "2026-10-15T12:15:00.000Z", answers, pauseCount: 1, pausedSeconds: 30, observations: "Colaborou e pediu para repetir." };
}
const PLANS: Array<[string, (index: number) => AnswerStatus]> = [
  ["todos acertos", () => "acerto"],
  ["todos erros", () => "erro"],
  ["misto", (i) => (["acerto", "erro", "sem_resposta", "recusa", "acerto"] as const)[i % 5]],
];

test("Super NeuroPad: nenhuma saída (relatório, resumo, estruturado, prontuário, PDF, família) tem classificação, em nenhuma idade nem situação", () => {
  for (let years = 2; years <= 17; years++) {
    for (const [name, plan] of PLANS) {
      for (const partial of [false, true]) {
        const base = play(years, plan);
        const session = partial ? { ...base, answers: base.answers.slice(0, 7), finishedAt: null } : base;
        const label = `${years} anos · ${name}${partial ? " · parcial" : ""}`;
        const summary = summarize(session);
        for (const key of ["level", "expectedMin", "redFlags"]) assert.equal(key in summary, false, `${label}: resumo sem ${key}`);
        assertClean(buildGameReport(session), `${label} relatório`);
        assertClean(buildGameBrief(session), `${label} resumo`);
        assertClean(buildStructuredLines(session).join("\n"), `${label} estruturado`);
        assertClean(flat(buildPatientRecordItems(session)), `${label} prontuário`);
        assertClean(flat(buildGameDocSpec(session, ISSUER, "15/10/2026 12:00")), `${label} PDF`);
        assertClean(buildFamilySummary(session, { email: "familia@exemplo.com", phone: "" }, new Date("2026-10-15T15:00:00Z")), `${label} resumo família`);
        assertClean(flat(buildFamilyDocSpec(session, ISSUER, "15/10/2026 12:00", new Date("2026-10-15T15:00:00Z"))), `${label} PDF família`);
        assert.ok(buildGameReport(session).includes(DESCRIPTIVE_NOTICE), `${label}: aviso descritivo presente`);
        for (const line of buildStructuredLines(session)) {
          if (/^[A-Z_0-9]+ \{/.test(line)) {
            const parsed = JSON.parse(line.slice(line.indexOf(" ") + 1)) as Record<string, unknown>;
            for (const key of Object.keys(parsed)) assert.doesNotMatch(key, /^(nivel|esperado|alerta|faixa_|corte|score|escore)/, `${label}: campo ${key}`);
          }
        }
      }
    }
  }
});

const FULL = { esc: "sim", alf: "sim", freq: "sim", aud: "sim", vis: "sim", di: "sim", pers: "sim" } as const;
const icedInput: IcedInput = {
  ano: "3", controle: { ...FULL }, palavrasAcertos: 12, palavrasF: 6, pseudoAcertos: 5, pseudoLex: 4, pcpm: 30, fluLidas: 33, fluErros: 3, fluTempo: 60,
  ditadoF: 6, ditadoPseudoCertas: 1, ditadoPseudoTotal: 10, cfAcertos: 4, ranSeg: 70, ranErros: 6, familiar: "sim", persistencia4: true,
};
function icedState(over: Partial<IcedState> = {}): IcedState {
  return {
    nome: "Ana Testes", data: "", nasc: "", idade: "8", ano: "3", escola: "pública", anosEsc: "2", examinador: "Dra. Teste",
    controle: { ...FULL },
    palavras: Array.from({ length: 20 }, (_, i) => ({ ok: i < 12, err: i >= 12, prod: "" })),
    pseudo: Array.from({ length: 16 }, (_, i) => ({ ok: i < 5, err: i >= 5, lex: i >= 5 && i < 9, prod: "" })),
    flu: { tempo: 60, lidas: 33, erros: 3 },
    ditado: Array.from({ length: 12 }, (_, i) => ({ grafia: "", f: i < 6, o: false })),
    ditadoP: Array.from({ length: 10 }, (_, i) => ({ grafia: "", ok: i < 1 })),
    cf: Array.from({ length: 12 }, (_, i) => ({ ok: i < 4, err: i >= 4 })),
    ran: { seg: 70, erros: 6 },
    fam: { pai: "sim", mae: "nao", irmao: "nao", nome: "" },
    pers: { a: "sim", b: "sim", c: "sim", d: "sim", nota: "" },
    fenomeno: "Lê devagar, subvocaliza.",
    done: { portao: true, escudo: true, palavras: true, pseudo: true, fluencia: true, ditado: true, sons: true, formas: true, familia: true, ponte: true },
    ...over,
  };
}

test("ICED-8: relatório completo, resumo, família, PDF e itens do prontuário são só medidas brutas", () => {
  for (const over of [{}, { done: {} }, { controle: { ...FULL, aud: "nao", vis: "" } }, { ano: "outro" as const }]) {
    const state = icedState(over as Partial<IcedState>);
    const result = describeIced(icedInputOf(state));
    for (const key of ["total", "faixa", "trava", "leitura", "nucleo", "avisos", "pontosExaminaveis", "proporcaoPct"]) assert.equal(key in result, false, key);
    const label = JSON.stringify(over);
    assertClean(result.frase, `ICED frase ${label}`);
    assertClean(buildIcedFullRecord(state, result, "15/10/2026 10:00"), `ICED registro ${label}`);
    assertClean(buildIcedSummary(state, result, "15/10/2026 10:00"), `ICED resumo ${label}`);
    assertClean(buildIcedFamilySummary(state, result, "15/10/2026 10:00"), `ICED família ${label}`);
    assertClean(flat(buildIcedDocSpec(state, result, ISSUER, "15/10/2026 10:00")), `ICED PDF ${label}`);
    assertClean(flat(icedResponseItems(state, result)), `ICED prontuário ${label}`);
  }
  const direct = describeIced(icedInput);
  assert.equal(direct.dominios.find((d) => d.id === "ran")!.medida, "70 s · 6 erros (40 estímulos)");
});

function playJln(age: number, correct: boolean): ReturnType<typeof newGame> {
  const bank = bandForAge(age) as BandBank;
  let g = newGame({ nome: "Teste", idade: age, examinador: "Aplicador" });
  for (const w of WORLDS) {
    if (w.id === "fluencia") {
      g = recordFluency(g, { probeId: bank.fluencia.id, totalWords: fluencyWords(bank.fluencia).length, lidas: 25, erros: 3, segundos: 20 });
      continue;
    }
    let guard = 0;
    for (let item = nextItemFor(g, w.id, bank); item && guard < 50; item = nextItemFor(g, w.id, bank), guard++) {
      g = recordResponse(g, { world: w.id, itemId: item.id, level: (item as { level?: number }).level as 1 | 2 | 3 ?? 2, prompt: "p", expected: "e", ms: 1500, kind: (item as { kind?: string }).kind as never, given: correct ? "e" : "zz", outcome: correct ? "correto" : "erro", errorType: correct ? undefined : "fonologico" }, bank);
    }
  }
  return g;
}

test("Jogo das Letras e Números: registro, PDF, itens do prontuário e resumo não têm nível, sinal, percentual nem referência", () => {
  for (const age of [5, 8, 12, 15, 18]) {
    for (const correct of [true, false]) {
      const g = playJln(age, correct);
      const label = `${age} anos ${correct ? "acertos" : "erros"}`;
      const summary = summarizeGame(g);
      for (const key of ["sinais"]) assert.equal(key in summary, false, key);
      assertClean(buildGameRecord(g, "15/10/2026 10:00"), `JLN registro ${label}`);
      assertClean(flat(buildJlnDocSpec(g, ISSUER, "15/10/2026 10:00")), `JLN PDF ${label}`);
      assertClean(flat(gameResponseItems(g)), `JLN prontuário ${label}`);
      assert.doesNotMatch(buildGameRecord(g, "x"), /\(\d+%\)|\d+%/, `${label}: sem percentuais de acerto`);
    }
  }
  assert.equal(GAME_DISCLAIMER, DESCRIPTIVE_NOTICE);
  assert.equal(DESCRIPTIVE_NOTICE, "Registro descritivo; sem classificação. Interpretação a cargo do profissional.");
  assertClean(BANDS.map((b) => b.label).join(" "), "rótulos das faixas");
});

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : /\.(ts|tsx)$/.test(name) ? [path] : [];
  });
}
const strip = (source: string) => source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");

test("código: arquivos de corte/referência removidos e nenhum identificador ou texto de classificação nos módulos", () => {
  for (const removed of [
    "client/src/features/super-neuropad/cutProfiles.ts", "client/src/features/dyslexia-risk/icedConfig.ts", "client/src/features/dyslexia-risk/game/fluencyFlags.ts",
  ]) assert.equal(existsSync(removed), false, `${removed} deve ter sido removido`);
  const files = [...walk("client/src/features/super-neuropad"), ...walk("client/src/features/dyslexia-risk"), "client/src/pages/super-neuropad-game.tsx", "client/src/pages/dyslexia-risk.tsx"];
  const identifiers = /\b(cutText|cutProfileFor|cutProvenanceText|levelCuts|phaseLevel|overallLevel|LEVEL_LABELS?|LEVEL_PANEL|LEVEL_ICON|CUT_PROFILES|FLUENCY_ANCHORS|RAN_REFERENCE|DITADO_REFERENCE|SCORE_REFERENCE|FLUENCY_REFERENCES|FLUENCY_FLOOR|ICED_PROVENANCE|ICED_REFERENCE_VERSION|scoreIced|finalLevel(?:Of)?|redFlags?|RED_FLAG\w*|expectedMin|travaStatusText|TRAVA_CONTROLS|fluencyFlags|TIME_MARGIN_NOTE|timeMarginTight|MIN_DOMAIN_ITEMS_FOR_LEVEL)\b/;
  const phrases = /referência interna|ponto de corte|pontos de corte|percentil|limiar|âncora|piso autoral|sinais? de alerta|sinais para investigar|escore normativo|nível demonstrado|norma formal|≤ −1 DP|\bnão normativa|esperado para a (?:idade|faixa)|dentro do esperado|acima do esperado|abaixo do esperado/i;
  for (const file of files) {
    const source = strip(readFileSync(file, "utf8"));
    assert.doesNotMatch(source, identifiers, `${file}: identificador de classificação`);
    assert.doesNotMatch(source, phrases, `${file}: texto de classificação`);
  }
});

test("observações do aplicador e tempos medidos entram nas saídas sem classificação (JLN, ICED e Super NeuroPad)", () => {
  const g = setObservacoes(playJln(9, true), "Colaborou. Aplicador repetiu a instrução.  Ambiente com ruído.");
  const record = buildGameRecord(g, "16/10/2026 10:00");
  assert.match(record, /Observações do aplicador \(reação da criança, mediação, condições\): Colaborou\. Aplicador repetiu a instrução\. Ambiente com ruído\./);
  assert.match(record, /Tempo de resposta por mundo:/);
  assert.match(record, /Tempo de resposta por item: mínimo 1,5 s · mediana 1,5 s · máximo 1,5 s/);
  assert.match(record, /Início da sessão:/);
  assertClean(record, "JLN registro com observações");
  assertClean(flat(buildJlnDocSpec(g, ISSUER, "x")), "JLN PDF com observações");
  assert.ok(gameResponseItems(g).some((i) => i.question === "Observações do aplicador" && /Ambiente com ruído/.test(i.answer)));
  assert.ok(gameResponseItems(g).some((i) => i.question === "Tempos de resposta"));
  const state = icedState({ observacoes: "Pediu para repetir.  Sem óculos na aplicação." });
  const result = describeIced(icedInputOf(state));
  assert.match(buildIcedFullRecord(state, result, "16/10/2026"), /Observações do examinador \(reação da criança, mediação, condições\): Pediu para repetir\. Sem óculos na aplicação\./);
  assert.ok(icedResponseItems(state, result).some((i) => i.question === "Observações do examinador"));
  assertClean(flat(buildIcedDocSpec(state, result, ISSUER, "x")), "ICED PDF com observações");
  const session = { ...play(6, () => "acerto"), observations: "Acompanhante presente na sala." };
  assert.match(buildGameReport(session), /Acompanhante presente na sala\./);
  assert.ok(buildStructuredLines(session)[0].includes("folga_planejada_s"));
});
