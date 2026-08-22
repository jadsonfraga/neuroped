import assert from "node:assert/strict";
import fs from "node:fs";

const read = (path) => fs.readFileSync(path, "utf8");

const dose = read("client/src/pages/calculadora-dose.tsx");
assert.match(dose, /const idx8 = med\.frequency\.indexOf\("8\/8h"\)/);
assert.match(dose, /const idx12 = med\.frequency\.indexOf\("12\/12h"\)/);
assert.doesNotMatch(dose, /frequency\.includes\("8\/8h"\) \? 3 : med\.frequency\.includes\("12\/12h"\)/);

const scales = read("client/src/pages/escalas-neuropsiquiatria.tsx");
assert.match(scales, /\(\?:a\|-\|–\|—\)/, "parser deve reconhecer ranges com a, hífen e travessões");
assert.match(scales, /semanas\?\|meses\?\|anos\?/, "parser deve reconhecer semanas explicitamente");
assert.match(scales, /v \/ 4\.345/, "semanas devem ser convertidas para meses");
assert.match(scales, /dark:bg-orange-950\/30/, "badge Bronze deve manter paleta orange no dark mode");

const prontuario = read("client/src/pages/prontuario.tsx");
assert.match(prontuario, /nextIds\[key\] = created\.id;[\s\S]{0,400}setEventIds\(\(prev\) => \(\{ \.\.\.prev, \[key\]: created\.id \}\)\)/,
  "save clínico deve persistir progresso a cada evento criado");

const memorySearch = read("functions/api/memory/search.ts");
const patientDelete = read("functions/api/patients/[id].ts");
assert.match(memorySearch, /clinical_memory_notes_demo/);
assert.doesNotMatch(memorySearch, /FROM memory_notes\b/);
assert.match(patientDelete, /DELETE FROM clinical_memory_notes_demo WHERE patient_id = \?/);
assert.doesNotMatch(patientDelete, /DELETE FROM memory_notes WHERE patient_id = \?/);

const billingGuard = read("functions/api/billing/_guard.ts");
assert.match(billingGuard, /WHERE user_id = \? AND clinic_id = \? AND active = 1/,
  "tenant explícito de billing deve exigir membership ativa");
assert.doesNotMatch(billingGuard, /if \(explicit\) return explicit;/);

const webhook = read("functions/api/billing/webhook.ts");
assert.match(webhook, /async function checkoutSeatsForEvent/);
assert.match(webhook, /seats = COALESCE\(\?, seats\)/);
assert.doesNotMatch(webhook, /ORDER BY created_at DESC LIMIT 1\), seats\)/,
  "webhook não deve copiar seats do checkout mais recente sem vínculo com o evento");

const migration = read("db/migrations/0015_saas_billing_trial_seats_hardening.sql");
assert.match(migration, /CREATE TRIGGER trg_clinic_create_billing_trial/);
assert.match(migration, /'saas-professional',[\s\S]*?2,[\s\S]*?'trial'/);
assert.match(migration, /COUNT\(\*\) \+ 1/);

console.log("[open-pr-reconciliation] contratos reconciliados OK");
