import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
const source = path => readFileSync(new URL("../../client/src/" + path, import.meta.url), "utf8");

test("o cartão guiado apresenta preparar, conduzir e registrar antes dos controles de exceção", () => {
  const body = source("components/ClinicalAssistantCards.tsx");
  const terms = ["1. Prepare", "Materiais e recurso desta atividade", "2. Conduza", "3. Registre", "O que aconteceu", "Se não der para seguir"];
  const positions = terms.map(term => body.indexOf(term));
  assert.ok(positions.every((pos, i) => pos >= 0 && (!i || pos > positions[i - 1])));
  assert.match(body, /<summary[^>]*>Materiais e recurso desta atividade<\/summary>[\s\S]*<ExamActivityResources[\s\S]*alreadyRecorded=\{hasNote\}/);
});

test("acolhimento opcional usa painel fechado; sem tela abaixo de dois anos", () => {
  const body = source("components/ExamWelcome.tsx");
  assert.match(body, /<details key=\{ageLabel\}[^>]*>[\s\S]*<summary[^>]*>Acolhimento opcional<\/summary>[\s\S]*Mostrar cartão de chegada/);
  assert.match(body, /profile === "presencial"[\s\S]*sem apresentar uma tela/);
});

test("a escolha de idade vem antes do atalho para outra página no guia da assistente", () => {
  const body = source("pages/exame-via-assistente.tsx");
  assert.ok(body.indexOf('id="assistant-exam-age"') < body.indexOf("Abrir Observação Social"));
});

test("a trilha social mostra somente o passo atual sem criar navegação nova", () => {
  const body = source("components/ExamSessionTrail.tsx");
  assert.match(body, /const visibleSteps = current \? steps\.filter/);
  assert.match(body, /visibleSteps\.map/);
  assert.match(body, /aria-current=\{active \? "step"/);
});
