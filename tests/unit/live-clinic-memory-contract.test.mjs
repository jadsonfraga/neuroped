import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const migration = read("db/migrations/0015_live_clinic_memory.sql");
const api = read("functions/api/live/memory/index.ts");
const mutation = read("functions/api/live/memory/[id].ts");
const core = read("functions/api/live/memory/_core.ts");
const contract = read("shared/live-clinic-memory.ts");
const page = read("client/src/pages/memoria-clinica.tsx");
const policy = read("client/src/security/routeGuardPolicy.ts");
const roles = read("shared/tenant.ts");

const requiredMigrationTokens = [
  "CREATE TABLE IF NOT EXISTS live_clinic_memory",
  "clinic_id TEXT NOT NULL REFERENCES clinics",
  "body_encrypted TEXT NOT NULL",
  "client_request_id TEXT NOT NULL",
  "revision INTEGER NOT NULL DEFAULT 1",
  "CREATE TABLE IF NOT EXISTS live_clinic_memory_terms",
  "CREATE TABLE IF NOT EXISTS live_clinic_memory_audit",
];
for (const token of requiredMigrationTokens) assert.match(migration, new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), token);

for (const token of [
  "clinicalCryptoReady",
  "getClinicMembership",
  "requireBillingEntitlement",
  "canReadClinicMemory",
  "canWriteClinicMemory",
  "clientRequestId",
  "tokenHashes",
  "db.batch",
]) assert.match(core + api + mutation, new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), token);

for (const token of [
  "scope: z.enum(clinicMemoryScopes)",
  "kind: z.enum(clinicMemoryKinds)",
  "expectedRevision",
  "clientRequestId",
  "normalizeClinicMemoryTokens",
]) assert.match(contract, new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), token);

for (const token of [
  "/api/live/memory",
  "Persistida na nuvem da clínica",
  "Operacional — compartilhada com secretaria",
  "syncState",
]) assert.match(page, new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), token);

assert.match(policy, /route: "\/memoria-clinica", roles: \["admin", "professional", "operator"\]/);
assert.match(roles, /canReadClinicMemory/);
assert.match(roles, /canWriteClinicMemory/);
assert.match(roles, /role === "assistant"/);

console.log("live-clinic-memory-contract: PASS");
