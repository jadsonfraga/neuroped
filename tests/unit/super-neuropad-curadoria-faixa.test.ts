// Curadoria por faixa etária (v2026-11-22.1): teto de 30 min, complemento com Sonda 10/OBS-10 nos domínios
// centrais, regras de saída (letra/numeral aos 2–3 anos, teto por mundo) e núcleo intacto.
import assert from "node:assert/strict";
import test from "node:test";
import {
  conceptKey, CURADORIA_BANCOS, curatedOptionalDrafts, CURADORIA_SUFIXO, GAME_BANK, INTEGRATED_BANK, MAX_POR_MUNDO, OPTIONAL_BANK, PHASE_ORDER, pedeLetraOuNumeral, YEARS,
} from "../../client/src/features/super-neuropad/bank";
import { estimateBandSeconds, itemProvenance, SESSION_LIMIT_SECONDS, sessionLimitSeconds } from "../../client/src/features/super-neuropad/model";

const CENTRAIS = ["vila", "memoria", "corpo"] as const;
const curados = (years: number) => OPTIONAL_BANK[years].filter(({ item }) => item.ref.endsWith(` · ${CURADORIA_SUFIXO}`));

test("teto de 30 minutos em todas as idades, com a estimativa dos 50 desafios dentro dele", () => {
  assert.equal(SESSION_LIMIT_SECONDS, 30 * 60);
  for (const years of YEARS) {
    assert.equal(sessionLimitSeconds(years), 30 * 60, `${years} anos: teto`);
    const estimate = estimateBandSeconds(years);
    assert.equal(estimate.items, 50, `${years} anos: 50 desafios`);
    assert.ok(estimate.totalSeconds <= 30 * 60, `${years} anos: ${estimate.minutes} min`);
  }
});

test("curadoria: cada idade recebe itens da Sonda 10/OBS-10 nos mundos centrais, rastreáveis e sem item autoral", () => {
  for (const years of YEARS) {
    const lista = curados(years);
    assert.equal(lista.length, curatedOptionalDrafts(years).length, `${years} anos: toda a curadoria entra no complemento`);
    assert.ok(lista.length >= 4, `${years} anos: curadoria presente (${lista.length})`);
    for (const { item, phaseId } of lista) {
      assert.ok(["sonda10", "obs10"].includes(item.origin), `${item.id}: origem Sonda 10 ou OBS-10`);
      assert.match(item.ref, /^(Sonda 10|OBS-10) · /, `${item.id}: referência ao roteiro`);
      assert.equal(itemProvenance(item), "banco_de_origem", `${item.id}: não é item autoral`);
      assert.ok((CENTRAIS as readonly string[]).includes(phaseId) || phaseId === "palavras", `${item.id}: mundo central (${phaseId})`);
      assert.doesNotMatch(item.prompt, /\b(lápis|papel|folha|fichas?|cartões|blocos?)\b/i, `${item.id}: sem objeto fora do aplicativo`);
    }
    for (const phaseId of CENTRAIS) {
      assert.ok(GAME_BANK[years][phaseId].length > INTEGRATED_BANK[years][phaseId].length, `${years} anos/${phaseId}: complemento chega ao mundo central`);
    }
  }
});

test("curadoria não repete tarefa nem conceito da bateria nem de outro complemento", () => {
  for (const years of YEARS) {
    const principal = new Set(PHASE_ORDER.flatMap((phaseId) => INTEGRATED_BANK[years][phaseId].map(conceptKey)));
    const vistos = new Set<string>();
    for (const { item } of OPTIONAL_BANK[years]) {
      const chave = conceptKey(item);
      if (item.ref.endsWith(CURADORIA_SUFIXO)) assert.ok(!principal.has(chave), `${item.id}: conceito já na bateria (${item.prompt})`);
      vistos.add(chave);
    }
    assert.ok(curados(years).every(({ item }) => vistos.has(conceptKey(item))));
  }
});

test("regras de saída: aos 2–3 anos nenhum complemento pede letra ou numeral; o item curado leva o domínio do mundo", () => {
  for (const years of [2, 3]) {
    const pedem = OPTIONAL_BANK[years].filter(({ item }) => pedeLetraOuNumeral(item));
    assert.deepEqual(pedem.map(({ item }) => item.prompt), [], `${years} anos`);
    for (const { item, phaseId } of curados(years)) {
      const dominio = INTEGRATED_BANK[years][phaseId][0].domain;
      assert.ok(dominio, `${years}/${phaseId}: mundo da bateria dedicada tem domínio`);
      assert.equal(item.domain, dominio, `${item.id}: domínio igual ao do mundo`);
    }
  }
  assert.equal(pedeLetraOuNumeral({ kind: "toque", prompt: "Toque na LETRA A.", options: [], answer: "A", origin: "cognitivo", ref: "x" } as never), true);
  assert.equal(pedeLetraOuNumeral({ kind: "toque", prompt: "Toque no cachorro.", options: [], answer: "cachorro", origin: "visual", ref: "x" } as never), false);
});

test("equilíbrio: dos 8 aos 17 anos nenhum mundo passa do teto por mundo e os mundos centrais ficam acima do núcleo", () => {
  assert.equal(MAX_POR_MUNDO, 9);
  for (const years of YEARS.filter((value) => value >= 8)) {
    for (const phaseId of PHASE_ORDER) assert.ok(GAME_BANK[years][phaseId].length <= MAX_POR_MUNDO, `${years}/${phaseId}: ${GAME_BANK[years][phaseId].length}`);
  }
  // Medição de referência da curadoria (itens por mundo); muda só com revisão deliberada da composição.
  const porMundo = (years: number) => PHASE_ORDER.map((phaseId) => GAME_BANK[years][phaseId].length).join("/");
  assert.equal(porMundo(2), "6/13/10/12/5/4");
  assert.equal(porMundo(5), "6/9/11/9/7/8");
  assert.equal(porMundo(8), "7/9/9/7/9/9");
  assert.equal(porMundo(17), "8/8/9/7/9/9");
});

test("núcleo intacto: a bateria principal mantém contagens e ids canônicos", () => {
  assert.deepEqual(YEARS.map((years) => PHASE_ORDER.reduce((sum, phaseId) => sum + INTEGRATED_BANK[years][phaseId].length, 0)),
    [18, 24, 24, 24, 30, 30, 36, 36, 36, 36, 36, 36, 36, 36, 36, 36]);
  for (const years of YEARS) {
    for (const phaseId of PHASE_ORDER) {
      INTEGRATED_BANK[years][phaseId].forEach((item, index) => assert.equal(item.id, `${years}.${phaseId}.${index + 1}`));
    }
  }
});

test("curadoria dos bancos: Reconhecimento Visual (parear, nomear, conceito) e Avaliação Cognitiva entram em toda idade, sem repetir a bateria", () => {
  for (const years of YEARS) {
    const ids = new Set(CURADORIA_BANCOS[years]);
    const lista = OPTIONAL_BANK[years].filter(({ item }) => ids.has(item.id));
    assert.equal(lista.length, ids.size, `${years} anos: ids da curadoria existem no complemento`);
    const refs = lista.map(({ item }) => item.ref);
    assert.ok(refs.some((ref) => /^Reconhecimento visual · nomear · /.test(ref)), `${years} anos: nomear do Reconhecimento Visual`);
    assert.ok(refs.some((ref) => new RegExp(`^Cognitivos ${years} anos · `).test(ref)), `${years} anos: item da Avaliação Cognitiva da idade`);
    if (years >= 4) assert.ok(refs.some((ref) => /^Reconhecimento visual · parear · /.test(ref)), `${years} anos: parear`);
    if (years >= 5) assert.ok(refs.some((ref) => /^Reconhecimento visual · conceito contextualizado · /.test(ref)), `${years} anos: conceito contextualizado`);
    if (years >= 4) {
      for (const dominio of ["fala/leitura", "números", "letras/escrita"]) {
        assert.ok(refs.some((ref) => ref.startsWith(`Cognitivos ${years} anos · ${dominio} `)), `${years} anos: domínio cognitivo ${dominio}`);
      }
    }
    const principal = PHASE_ORDER.flatMap((phaseId) => INTEGRATED_BANK[years][phaseId]);
    for (const { item } of lista) {
      assert.ok(!principal.some((entry) => entry.ref === item.ref), `${item.id}: referência já aplicada na bateria`);
      assert.ok(!principal.map(conceptKey).includes(conceptKey(item)), `${item.id}: conceito já aplicado na bateria`);
      if (years <= 3) assert.equal(item.domain, INTEGRATED_BANK[years][PHASE_ORDER.find((phaseId) => GAME_BANK[years][phaseId].some((entry) => entry.id === item.id))!][0].domain, `${item.id}: domínio do mundo`);
    }
  }
});
