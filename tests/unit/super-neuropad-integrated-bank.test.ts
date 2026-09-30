// Banco integrado do Super NeuroPad Game (uma faixa por ano, 2 a 17 anos):
// contagem por faixa, ids e conteúdos sem duplicata, origem rastreável nas
// quatro abas (Sonda 10, OBS-10, Reconhecimento Visual, Avaliação Cognitiva),
// calibração por idade, adaptações para 2–3 anos, nada fora do aplicativo e
// sessão estimada em até 20 minutos em todas as faixas.
import assert from "node:assert/strict";
import test from "node:test";
import { COGNITIVE_BANK } from "../../client/src/features/cognitive-age/bank";
import { OBJECTIVE_BANDS } from "../../client/src/components/jogo-facil/objectiveBank";
import { easyPlanSettings, itemFor as vrItemFor } from "../../client/src/features/visual-recognition/model";
import { EMOJI_NAMES, INTEGRATED_BANK, labelForArt } from "../../client/src/features/super-neuropad/bank";
import {
  AGE_BANDS,
  ORIGIN_ORDER,
  PHASE_ORDER,
  SESSION_LIMIT_SECONDS,
  YEARS,
  bandItemCount,
  estimateBandSeconds,
  itemSeconds,
  itemsFor,
  itemsPerPhase,
  pdfLossless,
  type Item,
} from "../../client/src/features/super-neuropad/model";

const allItems = (years: number): Item[] => PHASE_ORDER.flatMap((phaseId) => itemsFor(String(years), phaseId));
const texts = (item: Item): string[] => {
  const base = [item.prompt, item.ref];
  if (item.kind === "toque") return [...base, item.answer, item.stimulus ?? "", item.context ?? "", item.preview ?? "", ...item.options.map((option) => option.label)];
  if (item.kind === "montar") return [...base, item.word, ...item.tiles];
  return [...base, item.expected, item.stimulus ?? "", item.gesture ?? ""];
};

test("contagem por faixa: 4 desafios por mundo até 5 anos (24), 5 a partir de 6 anos (30); seis mundos em todas as idades", () => {
  assert.deepEqual([...YEARS], Array.from({ length: 16 }, (_, index) => index + 2));
  assert.deepEqual(Object.keys(INTEGRATED_BANK).map(Number), [...YEARS]);
  for (const years of YEARS) {
    for (const phaseId of PHASE_ORDER) assert.equal(itemsFor(String(years), phaseId).length, itemsPerPhase(years), `${years}/${phaseId}`);
    assert.equal(bandItemCount(String(years)), years <= 5 ? 24 : 30);
  }
  assert.ok(bandItemCount("2") < bandItemCount("6"), "2–3 anos: menos desafios");
});

test("ids únicos no banco inteiro e nenhum desafio repetido dentro da mesma faixa", () => {
  const ids = new Set<string>();
  for (const years of YEARS) {
    const seen = new Set<string>();
    const figures = new Set<string>();
    for (const phaseId of PHASE_ORDER) {
      itemsFor(String(years), phaseId).forEach((item, index) => {
        assert.equal(item.id, `${years}.${phaseId}.${index + 1}`);
        assert.equal(ids.has(item.id), false, `id duplicado ${item.id}`);
        ids.add(item.id);
        const key = [item.prompt, item.kind === "toque" ? item.options.map((option) => option.label).join("/") : "", "stimulus" in item ? item.stimulus ?? "" : "", item.kind === "montar" ? item.word : ""].join("|");
        assert.equal(seen.has(key), false, `${item.id}: desafio repetido na faixa`);
        seen.add(key);
        const figure = item.kind === "toque" ? item.stimulusVr ?? (item.options.some((option) => option.vr) ? item.answer : undefined) : item.kind === "fala" ? item.stimulusVr : undefined;
        if (figure) {
          assert.equal(figures.has(figure), false, `${item.id}: figura ${figure} repetida na faixa`);
          figures.add(figure);
        }
      });
    }
  }
  assert.equal(ids.size, YEARS.reduce((sum, years) => sum + bandItemCount(String(years)), 0));
});

test("cada item diz de onde veio; toda faixa usa as quatro abas de origem", () => {
  for (const years of YEARS) {
    const items = allItems(years);
    for (const item of items) {
      assert.ok(ORIGIN_ORDER.includes(item.origin), `${item.id}: origem conhecida`);
      assert.ok(item.ref.trim().length > 5, `${item.id}: referência`);
      const expectedPrefix = { sonda10: /^Sonda 10 · /, obs10: /^OBS-10 · /, visual: /^Reconhecimento visual · /, cognitivo: /^Cognitivos \d+ anos · / }[item.origin];
      assert.match(item.ref, expectedPrefix, `${item.id}: referência coerente com a origem`);
    }
    for (const origin of ORIGIN_ORDER) assert.ok(items.some((item) => item.origin === origin), `${years} anos: sem itens de ${origin}`);
  }
});

test("reuso fiel: itens cognitivos e do banco objetivo são os mesmos das abas de origem", () => {
  for (const years of YEARS) {
    for (const item of allItems(years)) {
      const cognitive = item.ref.match(/^Cognitivos (\d+) anos · (visual|fala\/leitura|letras\/escrita|números) (\d)$/);
      if (cognitive) {
        const domain = { visual: "visual", "fala/leitura": "leitura", "letras/escrita": "escrita", números: "aritmetica" }[cognitive[2]] as keyof (typeof COGNITIVE_BANK)[number];
        const source = COGNITIVE_BANK[Number(cognitive[1])][domain][Number(cognitive[3]) - 1];
        assert.ok(source, `${item.id}: origem cognitiva existe`);
        if (source.kind === "tap") {
          assert.equal(item.kind, "toque");
          if (item.kind === "toque") {
            assert.deepEqual(item.options.map((option) => option.art), source.options, `${item.id}: mesmas alternativas`);
            assert.equal(item.answer, labelForArt(source.answer));
          }
        } else if (source.kind === "say") {
          assert.equal(item.kind, "fala");
          if (item.kind === "fala") assert.equal(item.expected, source.expected);
        } else {
          assert.equal(item.kind, "montar");
          if (item.kind === "montar") assert.deepEqual(item.target, source.target);
        }
        assert.ok(Number(cognitive[1]) === years || Number(cognitive[1]) === years - 1, `${item.id}: perfil da idade (ou item-piso de um ano abaixo)`);
      }
      const objective = item.ref.match(/banco objetivo (.+) · item (\d+)$/);
      if (objective) {
        const band = OBJECTIVE_BANDS.find((entry) => entry.label === objective[1])!;
        assert.ok(band && years >= band.minYears && years <= band.maxYears + 1, `${item.id}: perfil objetivo da idade (ou item-piso de um ano abaixo)`);
        const source = band.items[Number(objective[2]) - 1];
        assert.equal(item.prompt, source.say);
        assert.equal(item.origin, Number(objective[2]) % 2 === 1 ? "sonda10" : "obs10", "índice par = Sonda 10, ímpar = OBS-10");
      }
    }
  }
});

test("toque: 2 a 4 opções, rótulos únicos, uma certa; figuras do banco visual existem, cabem na idade e seguem a graduação do Modo Fácil", () => {
  for (const years of YEARS) {
    for (const item of allItems(years)) {
      if (item.kind !== "toque") continue;
      assert.ok(item.options.length >= 2 && item.options.length <= 4, `${item.id}: 2 a 4 opções`);
      const labels = item.options.map((option) => option.label);
      assert.equal(new Set(labels).size, labels.length, `${item.id}: rótulos únicos`);
      assert.equal(labels.filter((label) => label === item.answer).length, 1, `${item.id}: exatamente uma certa`);
      for (const option of item.options) assert.ok(option.label.trim() && (option.art.trim() || option.vr), `${item.id}: opção com arte e rótulo`);
      const vr = item.options.filter((option) => option.vr);
      if (vr.length) {
        assert.equal(vr.length, item.options.length, `${item.id}: não mistura figura visual com emoji`);
        for (const option of vr) assert.ok(vrItemFor(option.vr!).minMonths <= years * 12, `${item.id}: ${option.vr} abaixo da idade mínima do banco visual`);
        const target = vrItemFor(vr.find((option) => option.label === item.answer)!.vr!);
        assert.equal(item.options.length, target.pair ? 2 : easyPlanSettings(years * 12).choices, `${item.id}: número de alternativas do Modo Fácil`);
      }
      if (item.stimulusVr) assert.ok(vrItemFor(item.stimulusVr).minMonths <= years * 12);
      if (item.preview) {
        const shown = item.preview.split(/\s+/);
        const answerArt = item.options.find((option) => option.label === item.answer)!.art;
        assert.equal(shown.includes(answerArt), !/NÃO apareceu/.test(item.prompt), `${item.id}: resposta coerente com o que foi mostrado`);
      }
    }
  }
});

test("fala/ação têm critério explícito; montar tem letras suficientes; desenho é com o dedo na tela", () => {
  for (const years of YEARS) {
    for (const item of allItems(years)) {
      if (item.kind === "fala" || item.kind === "fazer") {
        assert.ok(item.expected.trim().length >= 3, `${item.id}: critério de acerto`);
        if (item.stimulusVr !== undefined) assert.ok(vrItemFor(item.stimulusVr).minMonths <= years * 12);
      }
      if (item.kind === "montar") {
        assert.equal(item.target.join(""), item.word);
        const pool = [...item.tiles];
        for (const letter of item.target) {
          const at = pool.indexOf(letter);
          assert.ok(at >= 0, `${item.id}: falta a letra ${letter}`);
          pool.splice(at, 1);
        }
      }
      if (item.kind === "fazer" && item.shape) assert.equal(item.draw, true, `${item.id}: cópia de figura é feita na tela`);
      if (item.kind === "fala" || item.kind === "fazer") {
        assert.doesNotMatch(item.prompt, /\b(no papel|com o lápis|pegue o|entregue|bola macia|blocos?|caixa com tampa|cronômetro|fita)\b/i, `${item.id}: nada de material fora do aplicativo`);
      }
      assert.doesNotMatch(texts(item).join(" "), /câmera|filme|grave|fotograf/i, `${item.id}: sem câmera`);
    }
  }
});

test("2–3 anos: menos desafios, alternativa por gesto/apontar nos itens de fala, sem letras, leitura, numerais ou nomeação de cor", () => {
  for (const years of [2, 3]) {
    const items = allItems(years);
    const speech = items.filter((item) => item.kind === "fala");
    const gestures = items.filter((item) => (item.kind === "fala" || item.kind === "fazer") && item.gesture);
    assert.ok(gestures.length >= 3, `${years} anos: ${gestures.length} itens aceitam gesto`);
    if (years === 2) assert.ok(speech.every((item) => item.kind === "fala" && (item.gesture || /Repita: BOLA|Junta 2 palavras/.test(item.prompt + item.expected))), "2 anos: fala com alternativa, exceto repetição e combinação de palavras");
    for (const item of items) {
      assert.doesNotMatch(item.prompt, /letra|Leia|escrit|número \d|Toque no número/i, `${item.id}: sem letramento aos ${years} anos`);
      if (item.kind === "toque") for (const option of item.options) assert.doesNotMatch(option.art, /^\d+$/, `${item.id}: sem numeral como alternativa aos ${years} anos (quantidade × quantidade)`);
      if (item.kind === "fala" && item.stimulusVr) assert.notEqual(vrItemFor(item.stimulusVr).category, "cores", `${item.id}: nomear cor só a partir de 4 anos`);
    }
  }
  for (const years of YEARS.filter((entry) => entry >= 4)) {
    assert.ok(allItems(years).every((item) => !("gesture" in item) || !item.gesture), `${years} anos: gesto é adaptação só de 2–3 anos`);
  }
});

test("calibração: repetição de dígitos e ordem inversa crescem com a idade; conceitos contextualizados só a partir de 5 anos", () => {
  const span = (years: number, pattern: RegExp) => {
    const item = allItems(years).find((entry) => entry.kind === "fala" && pattern.test(entry.prompt));
    const match = item?.prompt.match(/: ((?:\d – )*\d)\.”/);
    return match ? match[1].split(" – ").length : 0;
  };
  let forward = 0;
  let backward = 0;
  for (const years of YEARS.filter((entry) => entry >= 3)) {
    const f = span(years, /“Repita: \d/);
    assert.ok(f >= forward, `${years} anos: repetição direta não diminui`);
    forward = f || forward;
    const b = span(years, /Repita ao contrário: \d/);
    if (b) { assert.ok(b >= backward, `${years} anos: ordem inversa não diminui`); backward = b; }
  }
  assert.equal(span(4, /“Repita: \d/), 3);
  assert.equal(span(6, /“Repita: \d/), 4);
  assert.equal(span(9, /“Repita: \d/), 5);
  assert.equal(span(12, /“Repita: \d/), 6);
  for (const years of YEARS) {
    for (const item of allItems(years)) if (item.kind === "toque" && item.context) assert.ok(years >= 5, `${item.id}: contexto só a partir de 5 anos (roteiro visual)`);
  }
});

test("evocação das 3 palavras (OBS-10): registro na Ilha das Palavras e evocação na Caverna da Memória, a partir de 6 anos", () => {
  for (const years of YEARS) {
    const register = itemsFor(String(years), "palavras").some((item) => /CASA, GATO, PÃO/.test(item.prompt));
    const recall = itemsFor(String(years), "memoria").some((item) => /Lembra das 3 palavras/.test(item.prompt));
    assert.equal(register, years >= 6, `${years} anos: registro`);
    assert.equal(recall, years >= 6, `${years} anos: evocação`);
  }
});

test("tudo sobrevive ao PDF: enunciados, critérios, rótulos e referências sem perda de figura", () => {
  for (const years of YEARS) for (const item of allItems(years)) for (const text of texts(item)) assert.ok(pdfLossless(text), `${item.id}: ${text}`);
  for (const [art, name] of Object.entries(EMOJI_NAMES)) assert.ok(name.trim() && pdfLossless(art), art);
  assert.equal(labelForArt("🍎🍎🍎"), "maçã ×3");
  assert.equal(labelForArt("CASA"), "CASA");
  assert.throws(() => labelForArt("🦖"), /sem nome/);
});

test("tempo estimado: sessão inteira em até 20 minutos em toda faixa, com mais tempo por item para 2–5 anos e pausa planejada", () => {
  const table: string[] = [];
  for (const years of YEARS) {
    const estimate = estimateBandSeconds(years);
    assert.ok(estimate.totalSeconds <= SESSION_LIMIT_SECONDS, `${years} anos: ${estimate.totalSeconds}s > 20 min`);
    assert.ok(estimate.totalSeconds >= 8 * 60, `${years} anos: estimativa plausível (${estimate.totalSeconds}s)`);
    assert.equal(estimate.items, bandItemCount(String(years)));
    assert.deepEqual(Object.keys(estimate.byPhase), [...PHASE_ORDER]);
    table.push(`${years}:${estimate.minutes}`);
  }
  const itemOnly = (years: number) => allItems(years).reduce((sum, item) => sum + itemSeconds(item), 0);
  assert.ok(estimateBandSeconds(2).itemSeconds > itemOnly(2) * 1.4, "2 anos: fator de criança pequena aplicado");
  assert.ok(estimateBandSeconds(2).overheadSeconds > estimateBandSeconds(8).overheadSeconds, "até 5 anos: pausa planejada");
  assert.equal(AGE_BANDS.length, YEARS.length);
  assert.ok(table.length === 16);
});

test("abas de origem continuam com os seus bancos intactos (o jogo só lê)", () => {
  assert.equal(OBJECTIVE_BANDS.length, 13);
  for (const band of OBJECTIVE_BANDS) assert.equal(band.items.length, 20);
  for (let age = 1; age <= 19; age++) for (const items of Object.values(COGNITIVE_BANK[age])) assert.equal(items.length, 4);
});
