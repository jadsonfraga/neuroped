import assert from "node:assert/strict";
import test from "node:test";
import { gameItemsFor, PHASE_ORDER, type TouchItem } from "../../client/src/features/super-neuropad/model";
import {
  isNonVerbalItem,
  isNumericItem,
  NV_MAX_NUMERIC,
  NV_PROVENANCE,
  NV_VALIDATION_STATUS,
  NV_SESSION_MAX,
  NV_YEARS,
  nvChallengesFor,
  nvOptionOrders,
  nvRecord,
  nvReportText,
  nvSpokenPrompt,
  nvSummary,
} from "../../client/src/features/super-neuropad-nao-verbal/model";

const NOTICE = "Registro descritivo; sem classificação. Interpretação a cargo do profissional.";

test("cada idade de 2 a 6 anos monta uma sessão curta, sem repetir item", () => {
  for (const years of NV_YEARS) {
    const challenges = nvChallengesFor(years);
    assert.ok(challenges.length >= 8 && challenges.length <= NV_SESSION_MAX, `${years} anos: ${challenges.length} desafios`);
    assert.equal(new Set(challenges.map((c) => c.item.id)).size, challenges.length, `${years} anos: item repetido`);
  }
});

test("todo desafio vem do banco da própria idade, sem alteração de conteúdo", () => {
  for (const years of NV_YEARS) {
    const bank = new Map(PHASE_ORDER.flatMap((phaseId) => gameItemsFor(String(years), phaseId).map((item) => [item.id, { item, phaseId }] as const)));
    for (const { item, phaseId } of nvChallengesFor(years)) {
      const source = bank.get(item.id);
      assert.ok(source, `${item.id} não está no banco de ${years} anos`);
      assert.equal(source.phaseId, phaseId);
      assert.deepEqual(item, source.item, `${item.id} foi alterado`);
    }
  }
});

test("nenhum desafio exige fala, leitura ou opções escritas em palavras", () => {
  const verbal = /\b(leia|fale|diga|nomeie|s[ií]labas?|palmas)\b/i;
  for (const years of NV_YEARS) {
    for (const { item } of nvChallengesFor(years)) {
      assert.equal(item.kind, "toque", item.id);
      assert.ok(!verbal.test(item.prompt), `${item.id}: enunciado verbal "${item.prompt}"`);
      assert.equal(item.context, undefined, `${item.id}: tem contexto para ler`);
      for (const option of item.options) {
        assert.ok(option.vr || !/[A-Za-zÀ-ÿ]{2,}/.test(option.art), `${item.id}: opção escrita "${option.art}"`);
      }
    }
  }
});

test("o filtro recusa itens de fala, leitura e contexto lido", () => {
  const base: TouchItem = { kind: "toque", id: "x", prompt: "Toque no gato.", origin: "visual", ref: "teste", options: [{ art: "🐱", label: "gato" }, { art: "🐶", label: "cachorro" }], answer: "gato" };
  assert.equal(isNonVerbalItem(base), true);
  assert.equal(isNonVerbalItem({ ...base, prompt: "Leia e toque: GATO" }), false);
  assert.equal(isNonVerbalItem({ ...base, context: "Uma história lida antes." }), false);
  assert.equal(isNonVerbalItem({ ...base, options: [{ art: "GATO", label: "gato" }, { art: "CÃO", label: "cão" }] }), false);
  assert.equal(isNonVerbalItem({ ...base, stimulus: "BOLA" }), false);
  assert.equal(isNonVerbalItem({ kind: "fala", id: "y", prompt: "Diga o nome.", origin: "sonda10", ref: "t", expected: "x" }), false);
});

test(`no máximo ${NV_MAX_NUMERIC} desafios com resposta em número escrito`, () => {
  for (const years of NV_YEARS) {
    const numeric = nvChallengesFor(years).filter(({ item }) => isNumericItem(item)).length;
    assert.ok(numeric <= NV_MAX_NUMERIC, `${years} anos: ${numeric} numéricos`);
  }
});

test("a resposta esperada percorre as posições (sem favorecer um lado)", () => {
  for (const years of NV_YEARS) {
    const challenges = nvChallengesFor(years);
    const orders = nvOptionOrders(challenges, 4242);
    challenges.forEach(({ item }, i) => {
      assert.equal(orders[i].length, item.options.length);
      assert.deepEqual([...orders[i]].map((o) => o.label).sort(), item.options.map((o) => o.label).sort(), `${item.id}: opções perdidas`);
    });
    const byCount = new Map<number, Set<number>>();
    challenges.forEach(({ item }, i) => {
      const pos = orders[i].findIndex((o) => o.label === item.answer);
      const set = byCount.get(item.options.length) ?? new Set<number>();
      set.add(pos);
      byCount.set(item.options.length, set);
    });
    for (const [n, positions] of byCount) {
      const count = challenges.filter(({ item }) => item.options.length === n).length;
      assert.equal(positions.size, Math.min(n, count), `${years} anos, ${n} opções: posições ${[...positions]}`);
    }
  }
});

test("registro e resumo são descritivos e contam cada situação", () => {
  const [first, second, third, fourth] = nvChallengesFor(3);
  const orders = nvOptionOrders([first, second, third, fourth], 7);
  const right = orders[0].find((o) => o.label === first.item.answer)!;
  const wrong = orders[1].find((o) => o.label !== second.item.answer)!;
  const records = [
    nvRecord(first, orders[0], right, { seconds: 4, repeats: 1, attentionCalls: 0 }),
    nvRecord(second, orders[1], wrong, { seconds: 6, repeats: 0, attentionCalls: 1 }),
    nvRecord(third, orders[2], null, { seconds: 20, repeats: 0, attentionCalls: 2 }),
    nvRecord(fourth, orders[3], null, { seconds: 3, repeats: 0, attentionCalls: 0, refusal: true }),
  ];
  assert.deepEqual(records.map((r) => r.status), ["acerto", "erro", "sem_resposta", "recusa"]);
  const summary = nvSummary(records);
  assert.deepEqual(summary.counts, { acerto: 1, erro: 1, sem_resposta: 1, recusa: 1 });
  assert.equal(summary.medianSeconds, 5);
  assert.equal(summary.repeats, 1);
  assert.equal(summary.attentionCalls, 3);
  const text = nvReportText(records, 3, NOTICE, "22/11/2026 10:00");
  assert.match(text, /Idade informada: 3 anos/);
  assert.ok(text.includes(NOTICE));
  assert.ok(text.includes(NV_PROVENANCE), "registro sem versão");
  assert.ok(text.includes(NV_VALIDATION_STATUS), "registro sem status de validação");
  assert.match(NV_VALIDATION_STATUS, /não validada/);
  assert.ok(!/\b(diagn[oó]stic|normal|alterad|atraso|risco|TEA|autis)/i.test(text.replace(NOTICE, "").replace(NV_VALIDATION_STATUS, "")), "texto não pode classificar");
});

test("a voz lê o enunciado sem nomes de emoji nem símbolos soltos; a tela mantém o original", () => {
  assert.equal(nvSpokenPrompt("Quantos sapos? 🐸🐸🐸🐸🐸"), "Quantos sapos?");
  assert.equal(nvSpokenPrompt("4 + 3 = ?"), "4 mais 3 é igual a quanto?");
  assert.equal(nvSpokenPrompt("6 − 2 = ?"), "6 menos 2 é igual a quanto?");
  assert.equal(nvSpokenPrompt("Toque no olho 👁️."), "Toque no olho.");
  for (const years of NV_YEARS) {
    for (const { item } of nvChallengesFor(years)) {
      const spoken = nvSpokenPrompt(item.prompt);
      assert.ok(spoken.length > 0, `${item.id}: enunciado falado vazio`);
      assert.doesNotMatch(spoken, /\p{Extended_Pictographic}|[=+−]/u, `${item.id}: ${spoken}`);
    }
  }
});

test("o registro informa o estilo das figuras mostradas quando a aba o passa", () => {
  const challenge = nvChallengesFor(3)[0];
  const order = nvOptionOrders([challenge], 1)[0];
  const record = nvRecord(challenge, order, order[0], { seconds: 2, repeats: 0, attentionCalls: 0 });
  assert.match(nvReportText([record], 3, NOTICE, "22/11/2026 14:00", "Kawaii · 1 a 4 anos"), /^Figuras: Kawaii · 1 a 4 anos$/m);
  assert.doesNotMatch(nvReportText([record], 3, NOTICE, "22/11/2026 14:00"), /^Figuras:/m);
});
