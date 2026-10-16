// Dyslexia Risk: o app só descreve a aplicação e as respostas (diretriz do Dr. Jadson, 16/10/2026).
// Sem pontos, cortes, faixas, trava, âncoras, referências ou rótulos interpretativos. Mantém o rascunho
// local com validade de 72 h.
import assert from "node:assert/strict";
import test from "node:test";
import { describeIced, type IcedInput } from "../../client/src/features/dyslexia-risk/model";
import * as engine from "../../client/src/features/dyslexia-risk/game/engine";
import * as gameReport from "../../client/src/features/dyslexia-risk/game/report";
import { buildIcedFamilySummary, buildIcedSummary, icedResponseItems, type IcedState } from "../../client/src/features/dyslexia-risk/report";
import { DRAFT_TTL_MS, clearDraft, readDraft, writeDraft } from "../../client/src/features/dyslexia-risk/localDraft";

const FULL = { esc: "sim", alf: "sim", freq: "sim", aud: "sim", vis: "sim", di: "sim", pers: "sim" } as const;
const base: IcedInput = {
  ano: "3", controle: { ...FULL },
  palavrasAcertos: 20, palavrasF: 0,
  pseudoAcertos: 16, pseudoLex: 0,
  pcpm: 110,
  ditadoF: 0, ditadoPseudoCertas: 5,
  cfAcertos: 12,
  ranSeg: 30, ranErros: 0,
  familiar: "nao", persistencia4: false,
};

test("a mesma medida gera o mesmo texto bruto, sem depender de ano escolar nem de corte", () => {
  for (const patch of [{}, { pcpm: 70 }, { pcpm: 71 }, { ano: "2" as const, pcpm: 42 }, { ano: "outro" as const, pcpm: 42 }, { ditadoF: 4 }, { ranSeg: 46 }]) {
    const result = describeIced({ ...base, ...patch });
    const flu = result.dominios.find((d) => d.id === "fluencia")!;
    assert.match(flu.medida, new RegExp(`palavras corretas por minuto: ${patch.pcpm ?? 110}`));
    assert.equal(result.dominios.length, 8);
    assert.deepEqual(Object.keys(result).sort(), ["controles", "controlesSemResposta", "dominios", "frase", "naoExaminados"]);
  }
  assert.notEqual(describeIced({ ...base, ranSeg: 46 }).frase, describeIced({ ...base, ranSeg: 30 }).frase);
});

test("controles do Bloco 0: só registra a resposta e informa o que falta; nada trava nem muda a descrição", () => {
  const strong = { ...base, pcpm: 60, ditadoF: 5, pseudoAcertos: 10, cfAcertos: 6 };
  const reference = describeIced(strong).dominios;
  for (const value of ["", "nv", "nao"] as const) {
    const result = describeIced({ ...strong, controle: { ...FULL, aud: value } });
    assert.deepEqual(result.dominios, reference, "domínios iguais, qualquer que seja o Bloco 0");
    assert.equal(result.controles.find((c) => c.chave === "aud")!.resposta, value === "nao" ? "não" : value === "nv" ? "não verificado" : "não informado");
    assert.deepEqual(result.controlesSemResposta, value === "nao" ? [] : ["Audição previamente adequada, ou corrigida"]);
  }
});

test("domínios não aplicados ficam como não examinados e a frase só lista medidas", () => {
  const parcial = describeIced({ ...base, cfAcertos: null, ranSeg: null, pcpm: null });
  assert.deepEqual(parcial.naoExaminados.sort(), ["Consciência fonológica", "Fluência", "Nomeação rápida"].sort());
  assert.match(parcial.frase, /Registro descritivo; sem classificação\. Interpretação a cargo do profissional\./);
  assert.doesNotMatch(parcial.frase, /pontos|escore|faixa|limiar|não equivale|resultado normal/i);
});

test("relatórios, resumo, família e itens do prontuário não trazem escore, trava nem aviso interpretativo", () => {
  const state = {
    nome: "Criança Sintética", nasc: "", idade: "8", escola: "", anosEsc: "2", ano: "outro", examinador: "", data: "",
    controle: { esc: "sim", alf: "sim", freq: "sim", aud: "", vis: "sim", di: "sim", pers: "sim" },
  } as unknown as Partial<IcedState>;
  const result = describeIced({ ...base, ano: "outro", controle: { ...FULL, aud: "" } });
  const items = icedResponseItems(state as IcedState, result);
  assert.ok(items.every((item) => !/escore|trava|leitura operacional|núcleo|avisos de leitura/i.test(item.question)));
  const summary = buildIcedSummary(state as IcedState, result, "15/10/2026 10:00");
  assert.match(summary, /Bloco 0 sem resposta "sim"\/"não": Audição/);
  assert.doesNotMatch(summary, /Trava|Aviso:|\/15|âncora/);
  const family = buildIcedFamilySummary(state as IcedState, result, "15/10/2026 10:00");
  assert.match(family, /Atividades aplicadas:/);
  assert.doesNotMatch(family, /atenção|prioridade|sinalizaram|sem sinalização/i);
});

test("jogo: o motor não exporta rótulos de nível nem referência de fluência", () => {
  for (const removed of ["LEVEL_LABEL", "finalLevelOf"]) assert.equal(removed in engine, false, removed);
  assert.equal("FLUENCY_NO_NORM" in gameReport, false);
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
