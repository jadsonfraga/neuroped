import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import {
  SONDA_DEZ_BANDS,
  SONDA_DEZ_GOLDEN_RULES,
  SONDA_DEZ_RESPONSE_LADDER,
  SONDA_DEZ_SAFETY_CONTRACT,
} from "../../client/src/data/sondaDezCanonical";

const wrapper = fs.readFileSync("client/src/pages/sonda-dez-daily.tsx", "utf8");
const preservedCore = fs.readFileSync("client/src/components/sonda-dez/SondaDezDailyCore.tsx", "utf8");
const clinicalCore = fs.readFileSync("client/src/pages/testes-diretos.tsx", "utf8");

test("Sonda Dez mantém seis especializações etárias canônicas", () => {
  assert.deepEqual(
    SONDA_DEZ_BANDS.map((band) => band.id),
    ["12-23m", "24-35m", "3-4a", "5-7a", "8-11a", "12-17a"],
  );
  assert.equal(new Set(SONDA_DEZ_BANDS.map((band) => band.specialization)).size, 6);
});

test("escada semântica preserva códigos e explicita grau de ajuda", () => {
  assert.deepEqual(
    SONDA_DEZ_RESPONSE_LADDER.map((item) => item.code),
    ["E", "I", "P", "0", "NA"],
  );
  assert.deepEqual(
    SONDA_DEZ_RESPONSE_LADDER.map((item) => item.label),
    ["Sozinha", "Com instrução", "Com ajuda", "Não fez", "Não deu para avaliar"],
  );
  assert.equal(SONDA_DEZ_GOLDEN_RULES.length, 3);
});

test("contrato continua observacional e não normativo", () => {
  assert.equal(SONDA_DEZ_SAFETY_CONTRACT.durationMinutes, 10);
  assert.equal(SONDA_DEZ_SAFETY_CONTRACT.persistence, "memory-only");
  assert.equal(SONDA_DEZ_SAFETY_CONTRACT.normativeScore, false);
  assert.equal(SONDA_DEZ_SAFETY_CONTRACT.percentile, false);
  assert.equal(SONDA_DEZ_SAFETY_CONTRACT.diagnosticOutput, false);
  assert.equal(SONDA_DEZ_SAFETY_CONTRACT.medicalIntegrationRequired, true);
});

test("camada consolidada preserva núcleo diário e núcleo clínico", () => {
  assert.match(wrapper, /components\/sonda-dez\/SondaDezDailyCore/);
  assert.match(preservedCore, /const STIMULI: Stimulus\[\]/);
  assert.match(preservedCore, /SondaDezBasePage/);
  assert.match(clinicalCore, /const BANDS: BandDef\[\]/);
  assert.match(clinicalCore, /const BLOCKED_PATTERNS: RegExp\[\]/);
  assert.match(clinicalCore, /estado desta tela vive apenas em memória/);
});

test("guia operacional não desloca o alvo de rolagem das missões", () => {
  const coreIndex = wrapper.indexOf("<SondaDezDailyCorePage />");
  const floatingGuideIndex = wrapper.indexOf("fixed bottom-5 right-5");
  const overlayIndex = wrapper.indexOf("fixed inset-0 z-[130]");
  assert.ok(coreIndex >= 0, "núcleo diário deve ser renderizado");
  assert.ok(floatingGuideIndex > coreIndex, "atalho do guia deve ficar fora do fluxo antes do núcleo");
  assert.ok(overlayIndex > coreIndex, "guia expandido deve ser overlay, não bloco acima da missão");
});

test("Tela da criança fica visualmente acima do atalho do guia", () => {
  assert.match(wrapper, /fixed bottom-5 right-5 z-\[90\]/);
  assert.match(clinicalCore, /z-\[100\]/);
  assert.doesNotMatch(wrapper, /fixed bottom-5 right-5 z-\[(10[0-9]|1[1-9][0-9]|[2-9][0-9]{2,})\]/);
});

test("consolidação não introduz persistência clínica nem dependência visual remota", () => {
  assert.doesNotMatch(wrapper, /localStorage|sessionStorage/);
  assert.doesNotMatch(preservedCore, /https?:\/\//);
});
