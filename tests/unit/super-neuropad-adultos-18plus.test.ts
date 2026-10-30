import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { MAX_AGE_YEARS, MIN_AGE_YEARS, PHASE_ORDER, YEARS } from "../../client/src/features/super-neuropad/bank";
import { ageGate } from "../../client/src/features/super-neuropad/model";
import { ADULTO_IDADE_MINIMA, BATERIA_ADULTA_HOMOLOGADA, MENSAGEM_NAO_HOMOLOGADA, MUNDOS_ADULTOS, acessoBateriaAdulta } from "../../client/src/features/super-neuropad/bateriaAdulta";

const BATERIA_SRC = "client/src/features/super-neuropad/bateriaAdulta.ts";
const PAGE_SRC = "client/src/pages/super-neuropad-game.tsx";

test("seis mundos adultos, com as mesmas chaves e ordem do jogo", () => {
  assert.deepEqual([...PHASE_ORDER], ["vila", "olhos", "palavras", "numeros", "memoria", "corpo"]);
  assert.deepEqual(MUNDOS_ADULTOS.map((mundo) => mundo.id), PHASE_ORDER);
});

test("cada mundo tem 4 tarefas completas, com identificadores únicos", () => {
  const ids = new Set<string>();
  for (const mundo of MUNDOS_ADULTOS) {
    assert.equal(mundo.tarefas.length, 4, mundo.id);
    assert.ok(mundo.nome.length > 5 && mundo.tema.length > 10, mundo.id);
    for (const tarefa of mundo.tarefas) {
      assert.ok(!ids.has(tarefa.id), "id repetido: " + tarefa.id);
      ids.add(tarefa.id);
      assert.ok(tarefa.id.startsWith(mundo.id + "-"), tarefa.id);
      assert.ok(tarefa.fala.length > 40, "fala " + tarefa.id);
      assert.ok(tarefa.material.length > 0, "material " + tarefa.id);
      assert.ok(Number.isInteger(tarefa.minutos) && tarefa.minutos >= 1 && tarefa.minutos <= 10, "minutos " + tarefa.id);
      assert.ok(tarefa.passos.length >= 3, "passos " + tarefa.id);
      assert.ok(tarefa.observacoes.length >= 4, "observacoes " + tarefa.id);
    }
  }
  assert.equal(ids.size, 24);
});

test("linguagem adulta: sem pontuação, norma, classificação ou termos infantis", () => {
  const texto = JSON.stringify(MUNDOS_ADULTOS);
  assert.doesNotMatch(texto, /percentil|escore|pontu|norma|diagn[óo]st|acerto|\berro\b|errad|correto|classific|esperado|ponto de corte|idade mental|\bcriança|\bbrincad|\bcarrinho|\bbola\b/i);
});

test("a bateria adulta não importa nada da pediátrica nem dos perfis anuais, e não usa armazenamento", () => {
  const src = readFileSync(BATERIA_SRC, "utf8");
  assert.doesNotMatch(src, /from "\.\/(bank|missoes|ageAdaptation|jornadaAnual|items|model|sufficiencia|extensao|obrigatorio|clinicalCircuit)"/);
  assert.doesNotMatch(src, /from "\.\.\/(cognitive-age|visual-recognition|jogo-facil|components)/);
  assert.doesNotMatch(src, /localStorage|sessionStorage|fetch\(/);
});

test("nenhuma idade libera partida adulta enquanto a bateria não estiver homologada", () => {
  assert.equal(BATERIA_ADULTA_HOMOLOGADA, false);
  assert.equal(ADULTO_IDADE_MINIMA, 18);
  for (const idade of [0, 1, 2, 17]) {
    assert.deepEqual(acessoBateriaAdulta(idade), { ok: false, motivo: "menor_de_18", mensagem: "A bateria adulta é para pessoas a partir de 18 anos." });
  }
  for (const idade of [18, 30, 65, 100]) {
    assert.deepEqual(acessoBateriaAdulta(idade), { ok: false, motivo: "nao_homologada", mensagem: MENSAGEM_NAO_HOMOLOGADA });
  }
  for (const idade of [18.5, NaN, Infinity, -1]) {
    assert.equal(acessoBateriaAdulta(idade).ok, false, String(idade));
  }
  assert.match(MENSAGEM_NAO_HOMOLOGADA, /não foi homologada/);
});

test("a bateria pediátrica continua de 2 a 17 anos e recusa 18 sem alteração", () => {
  assert.equal(MIN_AGE_YEARS, 2);
  assert.equal(MAX_AGE_YEARS, 17);
  assert.deepEqual([...YEARS], Array.from({ length: 16 }, (_, index) => index + 2));
  const gate = ageGate(18);
  assert.equal(gate.ok, false);
  if (!gate.ok) assert.equal(gate.reason, "acima_do_teto");
});

test("o botão 18+ fica desabilitado, sem ação, e aponta para o aviso de desenvolvimento", () => {
  const page = readFileSync(PAGE_SRC, "utf8");
  const idx = page.indexOf('data-testid="super-neuropad-adultos-18plus"');
  assert.ok(idx > 0, "botão 18+ presente");
  const bloco = page.slice(page.lastIndexOf("<button", idx), page.indexOf("</button>", idx));
  assert.match(bloco, /\bdisabled\b/);
  assert.doesNotMatch(bloco, /onClick/);
  assert.match(bloco, /aria-describedby="super-neuropad-adultos-aviso"/);
  assert.match(page, /id="super-neuropad-adultos-aviso"[^>]*data-testid="super-neuropad-adultos-aviso"/);
  assert.match(page, /Não utilizar a bateria pediátrica de 17 anos como avaliação adulta/);
});
