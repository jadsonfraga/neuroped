import assert from "node:assert/strict";
import fs from "node:fs";

function source(path) { return fs.readFileSync(path, "utf8"); }

const clinicalFiles = [
  "functions/api/patients/index.ts",
  "functions/api/patients/[id].ts",
  "functions/api/consultations/index.ts",
  "functions/api/scales/results.ts",
  "functions/api/documents/index.ts",
  "functions/api/clinical-core/index.ts",
  "functions/api/conecta/index.ts",
];
for (const path of clinicalFiles) {
  const text = source(path);
  assert.match(text, /secure_payload_encrypted/, `${path} precisa usar coluna cifrada`);
  assert.match(text, /encryptClinicalPayload|decryptClinicalPayload/, `${path} precisa atravessar o helper criptográfico`);
}

const schema = source("db/schema.d1.sql");
for (const table of ["patients_demo", "consultations_demo", "scale_results_demo", "documents_demo", "memory_notes"]) {
  assert.match(schema, new RegExp(`CREATE TABLE IF NOT EXISTS ${table}[\\s\\S]*?secure_payload_encrypted TEXT`), `${table} precisa nascer cifrável`);
}
assert.match(schema, /clinical_search_tokens/);
assert.match(schema, /clinical_encryption_state/);

const seed = source("db/seed.d1.sql");
assert.doesNotMatch(seed, /INSERT\s+OR\s+IGNORE\s+INTO\s+(patients_demo|consultations_demo|scale_results_demo|documents_demo|memory_notes)/i, "seed D1 não pode reintroduzir conteúdo clínico plaintext");

const memorySearch = source("functions/api/memory/search.ts");
assert.match(memorySearch, /blindTokenGroupsForQuery/);
assert.match(memorySearch, /clinical_search_tokens/);
assert.doesNotMatch(memorySearch, /memory_notes_fts\s+MATCH/);

const operations = source("functions/api/operations/_core.ts");
assert.doesNotMatch(operations, /OPERATIONAL_DATA_KEY\?\.trim\(\)\s*\|\|\s*env\.NEUROPED_JWT_SECRET/,
  "a chave operacional não pode recair para o segredo JWT");

const health = source("functions/api/health.ts");
assert.match(health, /readyForIdentifiableClinicalData/);
assert.match(health, /clinicalPhase\s*===\s*"strict"/);
assert.match(health, /operationalConfigured/);

const migration = source("scripts/migrate-d1-clinical-encryption.mts");
assert.match(migration, /PLAINTEXT_RESIDUAL/);
assert.match(migration, /migrateOperationalFromLegacy/);
assert.match(migration, /clinical_encryption_state/);

console.log("✓ P0 static: superfícies clínicas cifradas, blind index, seed seguro e chaves separadas");
