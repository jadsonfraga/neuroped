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
// Cobertura integral da faixa (catraca). Desde 2026-11-22 (âncora de epilepsia), medida
// em dois grupos de contextos, cada um travado no seu valor atual:
// - NÃO afetados por âncora de condição: candidatas e pódio idênticos aos de antes da
//   âncora; qualquer regressão aqui é alheia à âncora e reprova.
// - Afetados: a âncora removeu instrumento de epilepsia em queixa sem epilepsia (as
//   51 medalhas IPN-EPI/SEG 0–215 m trocadas por instrumentos da janela etária).
// O total geral cai de 89,2 para 89,0 só por essas trocas.
// docs/FILTRO_TRIO_COMPLEMENTAR_2026-11-22.md
assert.ok(data.band_medals_full_unaffected_pct >= 88.1, "cobertura integral etária regrediu em contexto sem âncora");
assert.ok(data.band_medals_full_anchor_affected_pct >= 90.1, "cobertura integral etária regrediu em contexto com âncora");
assert.ok(data.band_medals_full_pct >= 89.0, "cobertura integral etária regrediu");
assert.ok(data.signal_covered_when_safe_candidate_pct >= 80, "cobertura de sinais com opção segura regrediu");
console.log("Filtro: invariantes e métricas sintéticas aprovados", {
  contexts: data.contexts,
  signalCoverageWhenSafe: data.signal_covered_when_safe_candidate_pct,
});
