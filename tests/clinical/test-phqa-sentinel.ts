import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  buildPhqaReportItems,
  hasPositivePhqaSelfHarm,
  requiresPhqaSafetyConfirmation,
  updatePhqaSafetyConfirmation,
} from "../../client/src/data/expandedScales";

assert.equal(hasPositivePhqaSelfHarm({}), false);
assert.equal(hasPositivePhqaSelfHarm({ 8: 0 }), false);
assert.equal(hasPositivePhqaSelfHarm({ 8: 1 }), true);
assert.equal(hasPositivePhqaSelfHarm({ 8: 3 }), true);

assert.equal(requiresPhqaSafetyConfirmation({ 8: 1 }, false), true);
assert.equal(requiresPhqaSafetyConfirmation({ 8: 1 }, true), false);
assert.equal(requiresPhqaSafetyConfirmation({ 8: 0 }, false), false);

// Máquina de estado: 0→1 exige confirmação; após confirmar, 1→0 zera o
// reconhecimento para que um novo positivo nunca herde confirmação antiga.
let safetyConfirmed = updatePhqaSafetyConfirmation(false, 8, 0, 1);
assert.equal(safetyConfirmed, false);
safetyConfirmed = true;
safetyConfirmed = updatePhqaSafetyConfirmation(safetyConfirmed, 8, 1, 0);
assert.equal(safetyConfirmed, false);
safetyConfirmed = updatePhqaSafetyConfirmation(safetyConfirmed, 8, 0, 1);
assert.equal(safetyConfirmed, false);
assert.equal(updatePhqaSafetyConfirmation(true, 7, 1, 2), true);
assert.equal(updatePhqaSafetyConfirmation(true, 8, 1, 2), false);

const unconfirmedPositiveReport = buildPhqaReportItems({ 8: 1 }, false);
assert.match(
  unconfirmedPositiveReport.at(-1)?.answer ?? "",
  /confirmação.*pendente/i,
);
const positiveReport = buildPhqaReportItems({ 8: 1 }, true);
assert.match(
  positiveReport.at(-1)?.question ?? "",
  /Nota de segurança.*item 9/i,
);
assert.match(
  positiveReport.at(-1)?.answer ?? "",
  /sem cálculo ou interpretação de escore/i,
);
assert.equal(buildPhqaReportItems({ 8: 0 }, false).length, 9);

const page = readFileSync("client/src/pages/phqa.tsx", "utf8");
assert.match(page, /hasPositivePhqaSelfHarm\(answers\)/);
assert.match(page, /data-testid="phqa-self-harm-alert"/);
assert.match(page, /data-testid="phqa-self-harm-result-alert"/);
assert.match(page, /role="alert"/);
assert.match(page, /SAMU 192/);
assert.match(page, /href="#\/cssrs"/);
assert.match(page, /id="phqa-safety-protocol-confirmed"/);
assert.match(page, /if \(safetyConfirmationRequired\)/);
assert.match(page, /focusSafetyAlert\(\)/);
assert.match(page, /buildPhqaReportItems\([\s\S]{0,80}safetyProtocolConfirmed/);

console.log(
  "✓ PHQ-A: item 9 positivo bloqueia resultado até protocolo confirmado",
);
