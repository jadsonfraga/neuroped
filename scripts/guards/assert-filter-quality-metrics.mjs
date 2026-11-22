import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const data = JSON.parse(readFileSync(0, "utf8"));
const safety = [
  "medals_not_applicable",
  "exact_age_violations",
  "band_no_overlap_violations",
  "respondent_violations",
  "redundant_pairs",
  "cap_violations",
  "acute_broadband_violations",
  "anchored_outside_condition",
];
for (const field of safety) assert.equal(data[field], 0, field + " regressão");
assert.ok(data.complaint_covered_when_coverable_pct >= 99.1, "cobertura de queixas regrediu");
// 89,2 → 89,0 em 2026-11-22 (âncora de epilepsia): as 51 medalhas que deixaram de
// cobrir a faixa inteira eram módulos IPN-EPI/SEG (0–215 m) em queixas de sono e
// ansiedade sem epilepsia, trocados por instrumentos da janela etária (SWYC). O
// invariante novo "anchored_outside_condition" (= 0) trava a regressão clínica real.
// docs/FILTRO_TRIO_COMPLEMENTAR_2026-11-22.md
assert.ok(data.band_medals_full_pct >= 89.0, "cobertura integral etária regrediu");
assert.ok(data.signal_covered_when_safe_candidate_pct >= 80, "cobertura de sinais com opção segura regrediu");
console.log("Filtro: invariantes e métricas sintéticas aprovados", {
  contexts: data.contexts,
  signalCoverageWhenSafe: data.signal_covered_when_safe_candidate_pct,
});
