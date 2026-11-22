// Curadoria por faixa etária (v2026-11-22.3): teto de 30 min; complemento com o melhor dos quatro blocos
// (Sonda 10, OBS-10, Reconhecimento Visual e Avaliação Cognitiva) sob uma política por idade pensada para
// crianças em geral atípicas: limite por tipo de tarefa, sem repetir palavra-alvo nem texto, domínio certo
// aos 2–3 anos e núcleo intacto.
import assert from "node:assert/strict";
import test from "node:test";
import {
  alvosDaTarefa, conceptKey, CURADORIA_BANCOS, curatedOptionalDrafts, CURADORIA_SUFIXO, GAME_BANK, INTEGRATED_BANK, limitesDaIdade,
  OPTIONAL_BANK, PHASE_ORDER, pedeLetraOuNumeral, tipoTarefa, YEARS, type TipoTarefa,
} from "../../client/src/features/super-neuropad/bank";
import { estimateBandSeconds, itemProvenance, SESSION_LIMIT_SECONDS, sessionLimitSeconds } from "../../client/src/features/super-neuropad/model";

const curados = (years: number) => OPTIONAL_BANK[years].filter(({ item }) => item.ref.endsWith(` · ${CURADORIA_SUFIXO}`));
const porMundo = (years: number) => PHASE_ORDER.map((phaseId) => GAME_BANK[years][phaseId].length).join("/");

test("teto de 30 minutos em todas as idades, com a estimativa dos 50 desafios dentro dele", () => {
  assert.equal(SESSION_LIMIT_SECONDS, 30 * 60);
  for (const years of YEARS) {
    assert.equal(sessionLimitSeconds(years), 30 * 60, `${years} anos: teto`);
    const estimate = estimateBandSeconds(years);
    assert.equal(estimate.items, 50, `${years} anos: 50 desafios`);
    assert.ok(estimate.totalSeconds <= 30 * 60, `${years} anos: ${estimate.minutes} min`);
  }
});

test("curadoria dos roteiros: Sonda 10/OBS-10 em toda idade, rastreável, sem item autoral nem objeto externo", () => {
  for (const years of YEARS) {
    const lista = curados(years);
    assert.equal(lista.length, curatedOptionalDrafts(years).length, `${years} anos: toda a curadoria entra no complemento`);
    assert.ok(lista.length >= 4, `${years} anos: curadoria presente (${lista.length})`);
    for (const { item } of lista) {
      assert.ok(["sonda10", "obs10"].includes(item.origin), `${item.id}: origem Sonda 10 ou OBS-10`);
      assert.match(item.ref, /^(Sonda 10|OBS-10) · /, `${item.id}: referência ao roteiro`);
      assert.equal(itemProvenance(item), "banco_de_origem", `${item.id}: não é item autoral`);
      assert.doesNotMatch(item.prompt, /\b(lápis|papel|folha|fichas?|cartões|blocos?)\b/i, `${item.id}: sem objeto fora do aplicativo`);
    }
    for (const phaseId of ["vila", "memoria", "corpo"] as const) {
      assert.ok(GAME_BANK[years][phaseId].length > INTEGRATED_BANK[years][phaseId].length, `${years} anos/${phaseId}: complemento chega ao mundo central`);
    }
  }
});

test("toda tarefa do complemento é aplicável e registrável com os quatro status (sem condição de “não aplicado”)", () => {
  for (const years of YEARS) {
    for (const { item } of OPTIONAL_BANK[years]) {
      assert.doesNotMatch(item.prompt, /^Só se|não aplicado/i, `${item.id}: tarefa condicional sem status para registrar (${item.prompt})`);
    }
  }
});

test("política por idade: nenhum tipo de tarefa passa do limite da idade no complemento", () => {
  for (const years of YEARS) {
    const limites = limitesDaIdade(years);
    const contagem: Partial<Record<TipoTarefa, number>> = {};
    for (const { item } of OPTIONAL_BANK[years]) contagem[tipoTarefa(item)] = (contagem[tipoTarefa(item)] ?? 0) + 1;
    for (const [tipo, total] of Object.entries(contagem) as Array<[TipoTarefa, number]>) {
      const limite = limites[tipo];
      if (limite !== undefined) assert.ok(total <= limite, `${years} anos: ${tipo} ${total} > ${limite}`);
    }
  }
});

test("adequação à idade: sem letra/numeral aos 2–3; sem leitura de palavra antes dos 6; sem minúscula fora dos 6; sem nomear cor antes dos 4", () => {
  for (const years of YEARS) {
    const tipos = OPTIONAL_BANK[years].map(({ item }) => tipoTarefa(item));
    if (years <= 3) assert.deepEqual(OPTIONAL_BANK[years].filter(({ item }) => pedeLetraOuNumeral(item)).map(({ item }) => item.prompt), [], `${years} anos`);
    if (years <= 5) assert.ok(!tipos.includes("leitura") && !tipos.includes("ortografia"), `${years} anos: sem leitura`);
    if (years !== 6) assert.ok(!tipos.includes("letra_minuscula"), `${years} anos: sem minúscula`);
    if (years <= 3) assert.ok(!tipos.includes("cor_nomear") && !tipos.includes("quantidade_menos") && !tipos.includes("pareamento"), `${years} anos`);
  }
});

test("sem redundância: nenhuma palavra-alvo nem texto lido se repete entre o complemento e a bateria", () => {
  for (const years of YEARS) {
    const vistos = new Set(PHASE_ORDER.flatMap((phaseId) => INTEGRATED_BANK[years][phaseId].flatMap(alvosDaTarefa)));
    const principal = new Set(PHASE_ORDER.flatMap((phaseId) => INTEGRATED_BANK[years][phaseId].map(conceptKey)));
    for (const { item } of OPTIONAL_BANK[years]) {
      for (const alvo of alvosDaTarefa(item)) {
        assert.ok(!vistos.has(alvo), `${item.id}: alvo repetido "${alvo}" (${item.prompt})`);
        vistos.add(alvo);
      }
      assert.ok(!principal.has(conceptKey(item)), `${item.id}: conceito já na bateria (${item.prompt})`);
    }
  }
  // Casos concretos da revisão de 22/11/2026.
  const doisAnos = OPTIONAL_BANK[2].map(({ item }) => item.prompt).join(" | ");
  assert.ok((doisAnos.match(/avião/gi) ?? []).length <= 1, "2 anos: avião uma vez só");
  assert.ok(OPTIONAL_BANK[8].filter(({ item }) => tipoTarefa(item) === "ortografia").length <= 1, "8 anos: um item de ortografia");
});

test("2–3 anos: cada complemento cai no mundo do seu domínio e leva esse domínio (entra no resumo por domínio)", () => {
  for (const years of [2, 3]) {
    for (const { item, phaseId } of OPTIONAL_BANK[years]) {
      const dominio = INTEGRATED_BANK[years][phaseId][0].domain;
      assert.ok(dominio, `${years}/${phaseId}`);
      assert.equal(item.domain, dominio, `${item.id}: domínio do mundo (${item.prompt})`);
      const tipo = tipoTarefa(item);
      if (tipo === "nomeacao" || tipo === "vr_nomear") {
        assert.equal(phaseId, "numeros", `${item.id}: nomear é linguagem expressiva`);
        assert.match(item.kind === "fala" ? item.expected : "", /aproximação da palavra ou onomatopeia/, `${item.id}: aceita fala emergente`);
      }
      if (["figura", "vr_reconhecer", "quantidade", "forma", "cor"].includes(tipo)) assert.equal(phaseId, "palavras", `${item.id}: figura/conceito é linguagem receptiva`);
    }
    assert.ok(GAME_BANK[years].numeros.filter((item) => /quant|tem mais|tem menos|onde tem/i.test(item.prompt)).length === 0, `${years} anos: sem quantidade no mundo da fala`);
  }
});

test("Reconhecimento Visual e Avaliação Cognitiva: entram até 7 anos pela curadoria dos bancos; dos 8 em diante só a Avaliação Cognitiva", () => {
  for (const years of YEARS) {
    const ids = new Set(CURADORIA_BANCOS[years]);
    const refs = OPTIONAL_BANK[years].filter(({ item }) => ids.has(item.id)).map(({ item }) => item.ref);
    assert.ok(refs.some((ref) => new RegExp(`^Cognitivos ${years} anos · `).test(ref)), `${years} anos: Avaliação Cognitiva da idade`);
    const visual = OPTIONAL_BANK[years].filter(({ item }) => item.origin === "visual");
    if (years <= 7) {
      assert.ok(refs.some((ref) => /^Reconhecimento visual · nomear · /.test(ref)), `${years} anos: nomear`);
      assert.ok(visual.length >= 2, `${years} anos: Reconhecimento Visual presente`);
    } else {
      assert.equal(visual.length, 0, `${years} anos: sem Reconhecimento Visual de teto no complemento`);
    }
    if (years >= 4 && years <= 5) assert.ok(refs.some((ref) => /^Reconhecimento visual · parear · /.test(ref)), `${years} anos: parear como piso`);
    if (years >= 5 && years <= 7) assert.ok(refs.some((ref) => /conceito contextualizado/.test(ref)), `${years} anos: conceito contextualizado`);
  }
});

test("equilíbrio: nenhum mundo passa de 11 a partir dos 6 anos; composição de referência registrada", () => {
  // Dos 8 aos 17, a Floresta dos Olhos fica no núcleo (6) de propósito: não há tarefa visual que não seja de teto.
  for (const years of YEARS.filter((value) => value >= 6)) {
    for (const phaseId of PHASE_ORDER) assert.ok(GAME_BANK[years][phaseId].length <= 11, `${years}/${phaseId}: ${GAME_BANK[years][phaseId].length}`);
  }
  // Medição da revisão de 22/11/2026; muda só com revisão deliberada.
  assert.equal(porMundo(2), "7/5/21/6/6/5");
  assert.equal(porMundo(5), "6/14/7/8/8/7");
  assert.equal(porMundo(8), "7/6/10/10/9/8");
  assert.equal(porMundo(17), "8/6/9/9/9/9");
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
