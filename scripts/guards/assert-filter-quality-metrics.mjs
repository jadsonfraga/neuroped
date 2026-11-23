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
// Cobertura integral da faixa (catraca), em duas medidas:
// - SEM âncoras de condição/bateria: o mesmo motor com as âncoras desligadas, em
//   todos os contextos. Mantém o piso ORIGINAL de 89,2 e reprova qualquer regressão
//   que não venha das âncoras; não muda quando uma âncora nova entra.
// - COM âncoras (o que o usuário vê): cada âncora troca instrumentos de 0–18 anos de
//   outra condição (epilepsia, mutismo, linguagem) por instrumentos da janela etária,
//   o que reduz a cobertura integral; o piso fica no valor atual. A âncora em si é
//   travada por anchored_outside_condition = 0.
// docs/FILTRO_TRIO_COMPLEMENTAR_2026-11-22.md
assert.ok(data.band_medals_full_without_anchors_pct >= 89.2, "cobertura integral etária regrediu (motor sem âncoras)");
assert.ok(data.band_medals_full_pct >= 88.8, "cobertura integral etária regrediu");
assert.ok(data.signal_covered_when_safe_candidate_pct >= 80, "cobertura de sinais com opção segura regrediu");
console.log("Filtro: invariantes e métricas sintéticas aprovados", {
  contexts: data.contexts,
  signalCoverageWhenSafe: data.signal_covered_when_safe_candidate_pct,
});
