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
];
for (const field of safety) assert.equal(data[field], 0, field + " regressão");
assert.ok(data.complaint_covered_when_coverable_pct >= 99.1, "cobertura de queixas regrediu");
assert.ok(data.band_medals_full_pct >= 89.2, "cobertura integral etária regrediu");
assert.ok(data.signal_covered_when_safe_candidate_pct >= 80, "cobertura de sinais com opção segura regrediu");
console.log("Filtro: invariantes e métricas sintéticas aprovados", {
  contexts: data.contexts,
  signalCoverageWhenSafe: data.signal_covered_when_safe_candidate_pct,
});
