// Correções do diagnóstico de 14/10/2026 (Dyslexia Risk): rótulos sem norma, fluência sem
// referência, controles de exclusão não confirmados, ano sem âncora, escore examinável e
// rascunho local com validade. Inclui congelamento (golden) dos cortes do ICED-8.
import assert from "node:assert/strict";
import test from "node:test";
import { scoreIced, travaStatusText, type IcedInput } from "../../client/src/features/dyslexia-risk/model";
import { buildIcedFamilySummary, buildIcedSummary, icedResponseItems, type IcedState } from "../../client/src/features/dyslexia-risk/report";
import { LEVEL_LABEL } from "../../client/src/features/dyslexia-risk/game/engine";
import { FLUENCY_NO_NORM } from "../../client/src/features/dyslexia-risk/game/report";
import { DRAFT_TTL_MS, clearDraft, readDraft, writeDraft } from "../../client/src/features/dyslexia-risk/localDraft";

const FULL = { esc: "sim", alf: "sim", freq: "sim", aud: "sim", vis: "sim", di: "sim", pers: "sim" } as const;
const base: IcedInput = {
  ano: "3", controle: { ...FULL },
  palavrasAcertos: 20, palavrasF: 0, palavrasNorma: false,
  pseudoAcertos: 16, pseudoLex: 0, pseudoNorma: false,
  pcpm: 110, fluenciaNorma: false,
  ditadoF: 0, ditadoPseudoCertas: 5, ditadoNorma: false,
  cfAcertos: 12, cfNorma: false,
  ranSeg: 30, ranErros: 0, ranNorma: false,
  familiar: "nao", persistencia4: false,
};

test("golden ICED-8: escore e núcleo congelados; sem pontos de corte (faixa sempre descritiva)", () => {
  const cases: Array<[Partial<IcedInput>, number, string, string]> = [
    [{}, 0, "descritiva", "ausente"],
    [{ pcpm: 70 }, 3, "descritiva", "presente"],
    [{ pcpm: 71 }, 0, "descritiva", "ausente"],
    [{ ano: "2", pcpm: 42 }, 3, "descritiva", "presente"],
    [{ ano: "2", pcpm: 43 }, 0, "descritiva", "ausente"],
    [{ ditadoF: 4 }, 3, "descritiva", "presente"],
    [{ ditadoPseudoCertas: 2 }, 3, "descritiva", "presente"],
    [{ pcpm: 60, ditadoF: 5 }, 6, "descritiva", "presente"],
    [{ pcpm: 60, ditadoF: 5, pseudoAcertos: 10 }, 8, "descritiva", "presente"],
    [{ pcpm: 60, ditadoF: 5, pseudoAcertos: 10, cfAcertos: 6 }, 10, "descritiva", "presente"],
    [{ pseudoAcertos: 10, cfAcertos: 6, ranSeg: 46, familiar: "sim", persistencia4: true, palavrasAcertos: 15 }, 9, "descritiva", "ausente"],
    [{ palavrasAcertos: 16, palavrasF: 3 }, 0, "descritiva", "ausente"],
  ];
  for (const [patch, total, faixa, nucleo] of cases) {
    const result = scoreIced({ ...base, ...patch });
    assert.deepEqual([result.total, result.faixa, result.nucleo], [total, faixa, nucleo], JSON.stringify(patch));
  }
});

test("controle de exclusão vazio ou 'não verificado' deixa o escore descritivo (ausente ≠ normal)", () => {
  const strong = { ...base, pcpm: 60, ditadoF: 5, pseudoAcertos: 10, cfAcertos: 6 };
  assert.equal(scoreIced(strong).faixa, "descritiva");
  assert.equal(scoreIced(strong).total, 10);
  assert.equal(scoreIced(strong).controlesPendentes.length, 0);
  for (const value of ["", "nv"] as const) {
    for (const key of ["esc", "alf", "aud", "vis", "di"]) {
      const result = scoreIced({ ...strong, controle: { ...FULL, [key]: value } });
      assert.equal(result.trava, false);
      assert.equal(result.faixa, "descritiva", `${key}=${value || "vazio"}`);
      assert.equal(result.controlesPendentes.length, 1);
      assert.match(travaStatusText(result), /^pendente/);
      assert.equal(result.total, 10, "o escore continua calculado, só não é interpretado");
    }
  }
  // freq e pers não fazem parte da trava: vazios não bloqueiam
  assert.equal(scoreIced({ ...strong, controle: { ...FULL, freq: "", pers: "nv" } }).controlesPendentes.length, 0);
  // trava "não" prevalece sobre pendência
  const locked = scoreIced({ ...strong, controle: { ...FULL, aud: "nao", vis: "" } });
  assert.equal(locked.trava, true);
  assert.deepEqual(locked.controlesPendentes, []);
  assert.match(travaStatusText(locked), /^ativa/);
});

test("ano sem âncora de fluência e domínios não examinados geram aviso e escore examinável", () => {
  const outro = scoreIced({ ...base, ano: "outro" });
  assert.ok(outro.avisos.some((aviso) => /sem âncora de fluência/.test(aviso)));
  assert.equal(outro.pontosExaminaveis, 12, "fluência não examinada: 15 − 3");
  const comNorma = scoreIced({ ...base, ano: "outro", fluenciaNorma: true });
  assert.ok(!comNorma.avisos.some((aviso) => /sem âncora/.test(aviso)), "norma formal do ano resolve a âncora");
  assert.equal(scoreIced(base).pontosExaminaveis, 15);
  assert.deepEqual(scoreIced(base).avisos, []);
  const parcial = scoreIced({ ...base, cfAcertos: null, ranSeg: null });
  assert.equal(parcial.pontosExaminaveis, 12);
  assert.match(parcial.leitura, /não equivale a resultado normal/);
  assert.match(parcial.frase, /pontos possíveis nos domínios examinados: 12/);
});

test("relatórios mostram trava pendente, avisos e escore examinável; família não ouve 'outra prioridade' quando só falta confirmar", () => {
  const state = {
    nome: "Criança Sintética", nasc: "", idade: "8", escola: "", anosEsc: "2", ano: "outro", examinador: "", data: "",
    controle: { esc: "sim", alf: "sim", freq: "sim", aud: "", vis: "sim", di: "sim", pers: "sim" },
  } as unknown as Partial<IcedState>;
  const result = scoreIced({ ...base, ano: "outro", controle: { ...FULL, aud: "" } });
  const items = icedResponseItems(state as IcedState, result);
  assert.match(items.find((item) => item.question === "Trava de controle")?.answer ?? "", /^pendente/);
  assert.ok(items.some((item) => item.question === "Avisos de leitura"));
  const summary = buildIcedSummary(state as IcedState, result, "15/10/2026 10:00");
  assert.match(summary, /Trava de controle: pendente/);
  assert.match(summary, /Aviso: Ano escolar sem âncora/);
  const family = buildIcedFamilySummary(state as IcedState, result, "15/10/2026 10:00");
  assert.match(family, /ainda faltam confirmar/);
  assert.doesNotMatch(family, /indicou outra prioridade/);
});

test("jogo: rótulos de nível nunca soam como norma; fluência traz 'sem referência normativa'", () => {
  for (const label of Object.values(LEVEL_LABEL)) {
    assert.match(label, /referência interna da faixa \(não normativa\)/);
    assert.doesNotMatch(label, /esperado para a faixa|abaixo da faixa$|acima da faixa$/);
  }
  assert.equal(FLUENCY_NO_NORM, "sem referência normativa nesta triagem");
});

test("rascunho local: expira em 72 h, aceita o formato antigo uma vez e nunca derruba com armazenamento bloqueado", () => {
  const memory = new Map<string, string>();
  const storage = { getItem: (k: string) => memory.get(k) ?? null, setItem: (k: string, v: string) => void memory.set(k, v), removeItem: (k: string) => void memory.delete(k) };
  const t0 = Date.UTC(2026, 9, 15, 12);
  assert.equal(writeDraft("k", { nome: "Ana" }, t0, storage), true);
  assert.deepEqual(readDraft("k", t0 + DRAFT_TTL_MS - 1000, storage), { nome: "Ana" });
  assert.equal(readDraft("k", t0 + DRAFT_TTL_MS + 1, storage), null, "expirado");
  assert.equal(memory.has("k"), false, "expirado é apagado do aparelho");
  memory.set("legado", JSON.stringify({ version: 1, worlds: {} }));
  assert.deepEqual(readDraft("legado", t0, storage), { version: 1, worlds: {} }, "sessão antiga em andamento não se perde");
  memory.set("futuro", JSON.stringify({ v: 1, savedAt: t0 + 10 * DRAFT_TTL_MS, data: { x: 1 } }));
  assert.equal(readDraft("futuro", t0, storage), null, "carimbo no futuro (relógio adulterado) não estende a validade");
  const blocked = { getItem: () => { throw new Error("bloqueado"); }, setItem: () => { throw new Error("cota"); }, removeItem: () => { throw new Error("bloqueado"); } };
  assert.equal(readDraft("k", t0, blocked), null);
  assert.equal(writeDraft("k", { a: 1 }, t0, blocked), false);
  assert.doesNotThrow(() => clearDraft("k", blocked));
  memory.set("lixo", "{não é json");
  assert.equal(readDraft("lixo", t0, storage), null);
});
