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
const preservedCore = fs.readFileSync("client/src/pages/sonda-dez-daily-core.tsx", "utf8");
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
  assert.match(wrapper, /sonda-dez-daily-core/);
  assert.match(preservedCore, /const STIMULI: Stimulus\[\]/);
  assert.match(preservedCore, /SondaDezBasePage/);
  assert.match(clinicalCore, /const BANDS: BandDef\[\]/);
  assert.match(clinicalCore, /const BLOCKED_PATTERNS: RegExp\[\]/);
  assert.match(clinicalCore, /estado desta tela vive apenas em memória/);
});

test("consolidação não introduz persistência clínica nem dependência visual remota", () => {
  assert.doesNotMatch(wrapper, /localStorage|sessionStorage/);
  assert.doesNotMatch(preservedCore, /https?:\/\//);
});
