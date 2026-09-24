import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import {
  formatMinutesBudget,
  parseScaleMinutes,
  sumScaleMinutes,
} from "../../client/src/lib/scaleTime.ts";

// Parser honesto do campo `tempo` do catálogo. Regra central: tempo ilegível
// NUNCA vira número inventado (o antigo motor BLOCO 3 assumia 10 min por
// padrão — orçamento fake apresentado como real).
assert.deepEqual(parseScaleMinutes("5–10 min"), { min: 5, max: 10 });
assert.deepEqual(parseScaleMinutes("10-15 min"), { min: 10, max: 15 });
assert.deepEqual(parseScaleMinutes("15 min"), { min: 15, max: 15 });
assert.deepEqual(parseScaleMinutes("~2 min"), { min: 2, max: 2 });
assert.deepEqual(parseScaleMinutes("90–150 min"), { min: 90, max: 150 });
assert.equal(parseScaleMinutes("variável"), null);
assert.equal(parseScaleMinutes(""), null);
assert.equal(parseScaleMinutes(undefined), null);

// Soma declara incerteza quando alguma etapa tem tempo variável.
const full = sumScaleMinutes(["5–10 min", "15 min"]);
assert.deepEqual(full, { min: 20, max: 25, complete: true });
assert.equal(formatMinutesBudget(full), "≈ 20–25 min");

const partial = sumScaleMinutes(["5–10 min", "variável"]);
assert.deepEqual(partial, { min: 5, max: 10, complete: false });
assert.match(formatMinutesBudget(partial), /pelo menos 5–10 min/);

assert.equal(
  formatMinutesBudget(sumScaleMinutes(["variável"])),
  "tempo variável",
);

// O plano de avaliação do filtro deriva do pódio auditado — e o motor
// paralelo do BLOCO 3 (ids hardcoded inexistentes, baterias vazias,
// confiança fixa fake) não pode ressuscitar.
const filtroEngine = readFileSync("client/src/pages/filtro-engine.tsx", "utf8");
assert.match(filtroEngine, /AssessmentPlanCard podium=\{podium\}/);

const planCard = readFileSync(
  "client/src/components/AssessmentPlanCard.tsx",
  "utf8",
);
assert.match(planCard, /sumScaleMinutes/);
assert.doesNotMatch(planCard, /suggestBattery/);
// A finalidade clínica exibida vem do catálogo (achado Codex P1): nomear a
// fase de "triagem" reclassificaria um ouro diagnóstico (CARS) ou de
// monitorização (EUSM-10). Fases têm nomes neutros; categoria é por escala.
assert.match(planCard, /getAssessmentUse\(scale\)/);
assert.doesNotMatch(planCard, /Triagem inicial/);

for (const extinct of [
  "client/src/pages/bloco3-showcase.tsx",
  "client/src/features/clinical-assistant/suggestionEngine.ts",
  "client/src/features/battery-visualization/BatteryVisualization.tsx",
  // Docs que ensinavam a importar/abrir o que foi extinto (achado Codex P2).
  "BLOCO3_QUICKSTART.md",
  "DEPLOYMENT_FINAL_BLOCO3.md",
]) {
  assert.equal(
    existsSync(extinct),
    false,
    `${extinct} ressuscitou — o plano de avaliação canônico deriva do pódio do filtro, sem motor paralelo`,
  );
}

console.log(
  "✓ Orçamento de tempo honesto: parser sem defaults inventados; plano de fases derivado do pódio; motor BLOCO 3 extinto",
);
