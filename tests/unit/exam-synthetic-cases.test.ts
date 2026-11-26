import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { examBands } from "../../client/src/data/exame-por-idade";
import { assistantExamResources, medicalExamResources, examVisuals } from "../../client/src/data/examResources";
import { examExamples, socialAlternatives } from "../../client/src/data/clinicalAssistantGuide";
import { bands } from "../../client/src/data/observacaoSocial";
import { assistantObservationLines, emptyAssistantObservation } from "../../client/src/lib/assistantObservation";
import { examVisit, initialExam, summarizeExam } from "../../client/src/lib/examVisitSession";
import * as social from "../../client/src/components/observacao-social/session";

const examCases = [
  "Dormiu durante o convite", "Virou o rosto após a fala", "Olhou o pano sem estender a mão",
  "Aproximou a mão usando apoio habitual", "Indicou a bola pelo olhar", "Explorou o livro no colo",
  "Segurou a bola e encerrou a troca", "Escolheu uma peça em vez das duas",
  "Colocou o pano sobre o boneco", "Preferiu não usar o giz", "Contou uma versão diferente",
  "Passou a vez sem fazer marca", "Indicou o caminho por gesto", "Desenhou a sequência em vez de falar",
  "Pediu para responder por escrito", "Escolheu ouvir a instrução", "Pediu uma explicação diferente",
];
const socialCases = [
  "Orientou-se para o cuidador ao ouvir o som", "Voltou a bater na mesa após a pausa", "Ofereceu o prato ao cuidador",
  "Mudou o destino após o segundo convite", "Mostrou uma figura e encerrou", "Escolheu a opção sem tocar na tela",
  "Passou a vez", "Preferiu desenhar", "Pediu para começar", "Propôs um terceiro final",
  "Deu uma dica após esclarecimento", "Juntou duas ideias", "Pediu que repetissem a pergunta",
  "Escolheu por escrito", "Ofereceu trocar os papéis", "Apontou uma alternativa", "Não quis continuar",
  "Respondeu sem falar sobre a própria vida", "Reformulou sua preferência", "Sugeriu outra ordem", "Passou sem explicar",
];
assert.equal(examCases.length, examBands.length);
assert.equal(socialCases.length, bands.length);

examBands.forEach((band, index) => {
  test("Exame neurológico e mental: " + band.age, () => {
    let visit = examVisit(initialExam, { type: "select", band: index });
    assert.deepEqual(summarizeExam(visit), []);
    assert.equal(medicalExamResources[band.age].length, band.steps.length);
    for (const [step, item] of band.steps.entries()) {
      assert.equal(medicalExamResources[band.age][step].title, item.title);
      assert.ok(medicalExamResources[band.age][step].preparation);
      visit = examVisit(visit, { type: "record", step, status: (["direct", "assisted", "reported", "noOpportunity", "stopped", "materialsMissing"] as const)[step], note: "Simulação " + (step + 1) + ": contexto descrito separadamente." });
    }
    assert.deepEqual(summarizeExam(visit).map(x => x.step), band.steps.map(x => x.title));
    assert.equal(new Set(summarizeExam(visit).map(x => x.status)).size, 6);
    assert.equal(examVisit(visit, { type: "select", band: (index + 1) % examBands.length }), visit);
    assert.deepEqual(summarizeExam(examVisit(visit, { type: "finish" })), []);
  });

  test("Exame via assistente: " + band.age, () => {
    const examples = examExamples[band.age];
    const resources = assistantExamResources[band.age];
    assert.deepEqual(assistantObservationLines(emptyAssistantObservation), []);
    assert.equal(resources.length, 2);
    for (const [slot, prompt] of examples.entries()) {
      assert.equal(resources[slot].title, prompt.title);
      assert.ok(prompt.say && prompt.observe && resources[slot].preparation);
      if (index < 8) assert.equal(resources[slot].visual, undefined);
    }
    const [summary] = assistantObservationLines({ ...emptyAssistantObservation, reaction: examCases[index] });
    assert.equal(summary, "Observação direta: " + examCases[index]);
    assert.deepEqual(assistantObservationLines({ ...emptyAssistantObservation, outcome: "stopped" }), ["Preferiu parar."]);
    assert.deepEqual(assistantObservationLines({ ...emptyAssistantObservation, outcome: "no-opportunity" }), ["Sem oportunidade de observar."]);
  });
});

bands.forEach(([age, scenes], index) => test("Observação Social: " + age, () => {
  let state = social.session(social.fresh, { type: "age", band: index });
  assert.ok(socialAlternatives[age]);
  for (let scene = 0; scene <= scenes.length; scene++) {
    state = social.session(state, { type: "open", scene });
    assert.equal(Object.keys(state.records).length, scene, "abrir cena não cria nota");
    state = social.session(state, { type: "stage", stage: "record" });
    if (scene === 1) state = social.session(state, { type: "edit", field: "condition", value: "Oportunidade insuficiente" });
    else state = social.session(state, { type: "edit", field: "reaction", value: socialCases[index] });
    assert.ok(social.describeSocialScene(index, scene)?.startsWith(age));
  }
  assert.equal(Object.keys(state.records).length, 4);
  assert.equal(state.records[index + "/1"].reaction, "");
  assert.equal(social.session(state, { type: "age", band: (index + 1) % bands.length }), state);
  assert.equal(social.session(state, { type: "reset" }), social.fresh);
  assert.equal(social.canPresentSocialCards(index), index >= 2);
  if (index < 2) for (const x of scenes) assert.doesNotMatch([x[3], x[4], x[5]].join(" "), /tablet|tela pequena|aff?aste?ou a tela/i);
}));

test("papel de operador não recebe campo de hipótese interpretativa", () => {
  assert.equal(social.canInterpretSocialObservation("operator"), false);
  assert.equal(social.canInterpretSocialObservation(undefined), false);
  assert.equal(social.canInterpretSocialObservation("professional"), true);
  assert.equal(social.canInterpretSocialObservation("admin"), true);
  const source = readFileSync(new URL("../../client/src/components/observacao-social/ObservacaoSocial.tsx", import.meta.url), "utf8");
  assert.match(source, /\{canInterpret && <details/);
});

test("os cartões de narração descrevem o material que realmente exibem", () => {
  assert.match(examExamples["4 anos"][0].material, /garrafa e copo/i);
  assert.match(examExamples["6 a 8 anos"][1].material, /sol, livro e pipa/i);
  assert.deepEqual(examVisuals.everyday.pictures, ["bottle", "cup"]);
  assert.deepEqual(examVisuals.morning.pictures, ["sun", "book", "kite"]);
});

test("a revisão descreve a quantidade de anotações sem sugerir meta de conclusão", () => {
  assert.equal(social.socialReviewLabel(1), "Revisar sessão (1 registro)");
  assert.equal(social.socialReviewLabel(4), "Revisar sessão (4 registros)");
});
