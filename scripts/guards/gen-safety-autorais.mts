// Regenera scripts/guards/safety-classification-autorais.json a partir das specs autorais (classificação explícita).
import { writeFileSync } from "node:fs";
import { openScaleSpecs } from "../../client/src/data/openScalesIndex.ts";
const out: Record<string, string> = {};
for (const s of openScaleSpecs.filter((x) => x.authorial)) out[s.id] = `${s.suicideRisk ? 1 : 0}${s.psychosisRisk ? 1 : 0}|${s.verbalRequirement ?? "indiferente"}|${s.literacyRequirement ?? "indiferente"}`;
writeFileSync(new URL("./safety-classification-autorais.json", import.meta.url), JSON.stringify(out, null, 2) + "\n");
console.log(`safety-classification-autorais.json: ${Object.keys(out).length} escalas`);
