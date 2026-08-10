import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");

const contract = read("shared/clinical-core.ts");
const serverRoutes = read("server/routes.ts");
const serverCore = read("server/routes/clinical-core.ts");
const d1 = read("functions/api/clinical-core/index.ts");
const d1Schema = read("functions/api/clinical-core/_schema.ts");
const migration = read("db/migrations/0006_clinical_core.sql");
const migrationWorkflow = read(".github/workflows/clinical-core-d1-migration.yml");
const product = read("docs/NEUROPED_PRODUCT_SYSTEM.md");

assert.match(serverRoutes, /registerClinicalCoreRoutes/, "Clinical Core deve ser registrado no backend Express");
assert.match(serverCore, /payload_encrypted/, "conteúdo clínico livre deve ficar cifrado no backend real");
assert.match(serverCore, /encrypt\(/, "backend real deve usar a camada AES-GCM existente");
assert.match(serverCore, /supersedes_event_id/, "correções devem preservar o registro anterior");
assert.doesNotMatch(serverCore, /app\.delete\(["']\/api\/clinical-core/, "ledger clínico não deve permitir DELETE destrutivo");

assert.match(d1, /clinical_events_demo/, "backend D1 deve permanecer explicitamente DEMO");
assert.match(d1, /is_demo = 1/, "leituras/gravações D1 devem restringir o domínio DEMO");
assert.match(d1Schema, /CHECK \(is_demo = 1\)/, "schema D1 deve possuir trava física DEMO");
assert.match(migration, /CHECK \(is_demo = 1\)/, "migração versionada deve preservar a trava DEMO");
assert.match(migrationWorkflow, /0006_clinical_core\.sql/, "pipeline de produção deve aplicar explicitamente a migração 0006");
assert.match(migrationWorkflow, /clinical_events_demo/, "pipeline deve verificar a tabela do Clinical Core após migrar");
assert.match(migrationWorkflow, /idx_clinical_events_demo_patient_time/, "pipeline deve verificar índices do Clinical Core");
assert.match(migrationWorkflow, /is_demo/, "pipeline deve preservar a trava física DEMO");
assert.doesNotMatch(d1, /DEMO_.*CLINICAL|fixture/i, "ausência de banco não pode fabricar prontuário clínico");
assert.doesNotMatch(d1, /onRequestDelete/, "Clinical Core D1 não deve oferecer exclusão destrutiva");

assert.match(contract, /findingStatuses[\s\S]*not_assessed/, "observação deve representar explicitamente não avaliado");
assert.match(contract, /autonomousPrescription:\s*false/, "contrato deve bloquear prescrição autônoma");
assert.match(contract, /autonomousDiagnosis:\s*false/, "contrato deve bloquear diagnóstico autônomo");
assert.match(product, /NeuroPed Clinical OS/, "definição de produto deve existir no repositório");
assert.match(product, /captura → proveniência → interpretação humana → decisão/, "produto deve declarar o loop clínico longitudinal");

console.log("✓ Clinical Core integration: ledger, criptografia, DEMO isolation, migração e produto aprovados");
