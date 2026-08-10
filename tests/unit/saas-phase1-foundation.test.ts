import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  canAccessClinicFinance,
  canManageClinic,
  canReadClinicClinicalData,
  canWriteClinicClinicalData,
  isClinicMembershipRole,
  normalizeClinicSlug,
} from "../../shared/tenant";
import {
  clinicalBlindIndex,
  decryptClinicalJson,
  encryptClinicalJson,
} from "../../functions/api/tenant/_crypto";

assert.equal(isClinicMembershipRole("owner"), true);
assert.equal(isClinicMembershipRole("assistant"), true);
assert.equal(isClinicMembershipRole("admin"), false, "role global não vira role tenant implicitamente");
assert.equal(canManageClinic("owner"), true);
assert.equal(canManageClinic("clinic_admin"), true);
assert.equal(canManageClinic("professional"), false);
assert.equal(canReadClinicClinicalData("professional"), true);
assert.equal(canReadClinicClinicalData("assistant"), false, "assistente falha fechado para PHI");
assert.equal(canWriteClinicClinicalData("financial"), false, "financeiro não escreve clínica");
assert.equal(canAccessClinicFinance("financial"), true);
assert.equal(canAccessClinicFinance("professional"), false);
assert.equal(normalizeClinicSlug("Clínica Neuro Desenvolvimento"), "clinica-neuro-desenvolvimento");

const env = {
  CLINICAL_DATA_KEY: "phase1-test-key-0123456789-ABCDEFGHIJKLMNOPQRSTUVWXYZ",
};
const clinicA = "clinic-a";
const clinicB = "clinic-b";
const purpose = "patient-profile:patient-1";
const original = {
  name: "Paciente Sintético",
  birthDate: "2020-01-02",
  guardianName: "Responsável Sintético",
};

const encrypted = await encryptClinicalJson(env, clinicA, purpose, original);
assert.ok(encrypted.startsWith("v1."));
assert.equal(encrypted.includes(original.name), false, "PII não aparece no ciphertext");
assert.deepEqual(await decryptClinicalJson(env, clinicA, purpose, encrypted), original);

await assert.rejects(
  () => decryptClinicalJson(env, clinicB, purpose, encrypted),
  /CLINICAL_DECRYPT_FAILED/,
  "ciphertext de uma clínica não pode ser decriptado no contexto de outra",
);
await assert.rejects(
  () => decryptClinicalJson(env, clinicA, "patient-profile:patient-2", encrypted),
  /CLINICAL_DECRYPT_FAILED/,
  "ciphertext fica vinculado também ao registro/purpose por AAD",
);

const indexA = await clinicalBlindIndex(env, clinicA, "patient-identity", "Paciente|2020-01-02");
const indexARepeat = await clinicalBlindIndex(env, clinicA, "patient-identity", "  PACIENTE|2020-01-02  ");
const indexB = await clinicalBlindIndex(env, clinicB, "patient-identity", "Paciente|2020-01-02");
assert.equal(indexA, indexARepeat, "blind index é determinístico após normalização");
assert.notEqual(indexA, indexB, "blind index é segregado logicamente por tenant");

const migration = readFileSync(
  new URL("../../db/migrations/0009_saas_phase1_foundation.sql", import.meta.url),
  "utf8",
);
assert.match(migration, /CREATE TABLE IF NOT EXISTS clinics/);
assert.match(migration, /CREATE TABLE IF NOT EXISTS clinic_memberships/);
assert.match(migration, /CREATE TABLE IF NOT EXISTS live_patients/);
assert.match(migration, /clinic_id TEXT NOT NULL REFERENCES clinics\(id\)/);
assert.match(migration, /profile_encrypted TEXT NOT NULL/);
assert.match(migration, /CREATE TABLE IF NOT EXISTS live_clinical_events/);
assert.match(migration, /payload_encrypted TEXT NOT NULL/);
assert.match(migration, /CREATE TABLE IF NOT EXISTS saas_audit_log/);

const livePatientBlock = migration.match(
  /CREATE TABLE IF NOT EXISTS live_patients \([\s\S]*?\n\);/,
)?.[0] ?? "";
assert.doesNotMatch(livePatientBlock, /\n\s*name\s+TEXT/i, "live_patients não armazena nome em plaintext");
assert.doesNotMatch(livePatientBlock, /guardian_/i, "live_patients não armazena responsável em plaintext");

const tenantCore = readFileSync(
  new URL("../../functions/api/tenant/_core.ts", import.meta.url),
  "utf8",
);
assert.match(tenantCore, /O role global `admin` NÃO é bypass entre clínicas/);
assert.doesNotMatch(
  tenantCore,
  /user\.role\s*===\s*["']admin["']\s*\?\s*true/,
  "não pode reaparecer bypass global de tenant",
);

const livePatientsApi = readFileSync(
  new URL("../../functions/api/live/patients/index.ts", import.meta.url),
  "utf8",
);
assert.match(livePatientsApi, /CLINICAL_LIVE_DISABLED/);
assert.match(livePatientsApi, /CLINICAL_CRYPTO_NOT_CONFIGURED/);
assert.match(livePatientsApi, /getClinicMembership/);
assert.match(livePatientsApi, /profile_encrypted/);
assert.doesNotMatch(livePatientsApi, /INSERT INTO patients_demo/);

console.log("saas phase1 foundation tests ok");
