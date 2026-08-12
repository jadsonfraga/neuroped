import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  canAccessClinicFinance,
  canManageClinic,
  canReadClinicClinicalData,
  canWriteClinicClinicalData,
  isClinicMembershipRole,
  isValidClinicSlug,
  normalizeClinicSlug,
} from "../../shared/tenant";
import {
  clinicalBlindIndex,
  clinicalCryptoReady,
  currentClinicalEncryptionVersion,
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
assert.equal(isValidClinicSlug("ai"), true, "slug tenant de dois caracteres não pode repetir o bug antigo de quantificador");
assert.equal(isValidClinicSlug("a-"), false);

const dataKeyV1 = "phase1-data-key-v1-0123456789-ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const dataKeyV2 = "phase1-data-key-v2-0123456789-ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const indexKey = "phase1-index-key-0123456789-ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const env = {
  CLINICAL_DATA_KEY: dataKeyV2,
  CLINICAL_DATA_KEY_ID: "k2",
  CLINICAL_INDEX_KEY: indexKey,
};
assert.equal(clinicalCryptoReady(env), true);
assert.equal(clinicalCryptoReady({ CLINICAL_DATA_KEY: dataKeyV2 }), false, "index key é obrigatória");
assert.equal(
  clinicalCryptoReady({
    CLINICAL_DATA_KEY: dataKeyV2,
    CLINICAL_DATA_KEY_ID: "k2",
    CLINICAL_INDEX_KEY: dataKeyV2,
  }),
  false,
  "blind index deve usar secret independente da data key",
);
assert.equal(
  clinicalCryptoReady({
    CLINICAL_DATA_KEY: dataKeyV2,
    CLINICAL_DATA_KEY_ID: "k2",
    CLINICAL_DATA_KEY_PREVIOUS: dataKeyV1,
    CLINICAL_DATA_KEY_PREVIOUS_ID: "k2",
    CLINICAL_INDEX_KEY: indexKey,
  }),
  false,
  "key IDs atual/anterior não podem colidir",
);
assert.equal(currentClinicalEncryptionVersion(env), "clinical-v1:k2");

const clinicA = "clinic-a";
const clinicB = "clinic-b";
const purpose = "patient-profile:patient-1";
const original = {
  name: "Paciente Sintético",
  birthDate: "2020-01-02",
  guardianName: "Responsável Sintético",
};

const encrypted = await encryptClinicalJson(env, clinicA, purpose, original);
assert.ok(encrypted.startsWith("v1.k2."));
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

const oldEnv = {
  CLINICAL_DATA_KEY: dataKeyV1,
  CLINICAL_DATA_KEY_ID: "k1",
  CLINICAL_INDEX_KEY: indexKey,
};
const oldCiphertext = await encryptClinicalJson(oldEnv, clinicA, purpose, original);
const rotatedEnv = {
  CLINICAL_DATA_KEY: dataKeyV2,
  CLINICAL_DATA_KEY_ID: "k2",
  CLINICAL_DATA_KEY_PREVIOUS: dataKeyV1,
  CLINICAL_DATA_KEY_PREVIOUS_ID: "k1",
  CLINICAL_INDEX_KEY: indexKey,
};
assert.deepEqual(
  await decryptClinicalJson(rotatedEnv, clinicA, purpose, oldCiphertext),
  original,
  "keyring mantém leitura de registros cifrados pela chave anterior",
);
await assert.rejects(
  () => decryptClinicalJson(env, clinicA, purpose, oldCiphertext),
  /CLINICAL_KEY_VERSION_UNAVAILABLE/,
  "chave antiga removida do keyring não pode ser simulada silenciosamente",
);

const indexA = await clinicalBlindIndex(env, clinicA, "patient-identity", "Paciente|2020-01-02");
const indexARepeat = await clinicalBlindIndex(env, clinicA, "patient-identity", "  PACIENTE|2020-01-02  ");
const indexAOldKey = await clinicalBlindIndex(oldEnv, clinicA, "patient-identity", "Paciente|2020-01-02");
const indexB = await clinicalBlindIndex(env, clinicB, "patient-identity", "Paciente|2020-01-02");
assert.equal(indexA, indexARepeat, "blind index é determinístico após normalização");
assert.equal(indexA, indexAOldKey, "rotação da data key não invalida blind indexes");
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

const liveEventsBlock = migration.match(
  /CREATE TABLE IF NOT EXISTS live_clinical_events \([\s\S]*?\n\);/,
)?.[0] ?? "";
assert.match(liveEventsBlock, /payload_encrypted TEXT NOT NULL/);
assert.doesNotMatch(liveEventsBlock, /\n\s*(subjective|objective|assessment|plan|notes)\s+TEXT/i);

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
assert.match(tenantCore, /export function prepareSaasAudit/);
assert.match(tenantCore, /SELECT \?, \?, \?, \?, \?, \?, \? WHERE changes\(\) = 1/);

const tenantCrypto = readFileSync(
  new URL("../../functions/api/tenant/_crypto.ts", import.meta.url),
  "utf8",
);
assert.match(tenantCrypto, /CLINICAL_INDEX_KEY/);
assert.match(tenantCrypto, /CLINICAL_DATA_KEY_PREVIOUS/);
assert.match(tenantCrypto, /HKDF/);
assert.match(tenantCrypto, /CLINICAL_KEY_ID_COLLISION/);
assert.match(tenantCrypto, /CLINICAL_KEY_SEPARATION_REQUIRED/);
assert.doesNotMatch(tenantCrypto, /NEUROPED_JWT_SECRET/);

const livePatientsApi = readFileSync(
  new URL("../../functions/api/live/patients/index.ts", import.meta.url),
  "utf8",
);
assert.match(livePatientsApi, /CLINICAL_LIVE_DISABLED/);
assert.match(livePatientsApi, /CLINICAL_CRYPTO_NOT_CONFIGURED/);
assert.match(livePatientsApi, /getClinicMembership/);
assert.match(livePatientsApi, /profile_encrypted/);
assert.match(livePatientsApi, /db\.batch\(/);
assert.match(livePatientsApi, /prepareSaasAudit\(/);
assert.match(livePatientsApi, /EXTERNAL_REFERENCE_CONFLICT/);
assert.doesNotMatch(livePatientsApi, /await writeSaasAudit/);
assert.doesNotMatch(livePatientsApi, /INSERT INTO patients_demo/);

const liveEventsApi = readFileSync(
  new URL("../../functions/api/live/events/index.ts", import.meta.url),
  "utf8",
);
assert.match(liveEventsApi, /CLINICAL_LIVE_DISABLED/);
assert.match(liveEventsApi, /patientBelongsToClinic/);
assert.match(liveEventsApi, /payload_encrypted/);
assert.match(liveEventsApi, /provenanceSource/);
assert.match(liveEventsApi, /supersedesEventId/);
assert.match(liveEventsApi, /STALE_SUPERSESSION/);
assert.match(liveEventsApi, /SET status = 'corrected'/);
assert.match(liveEventsApi, /WHERE changes\(\) = 1/);
assert.match(liveEventsApi, /prepareSaasAudit\(db, auditParams, true\)/);
assert.match(liveEventsApi, /normalizedOccurredAt/, "occurredAt precisa passar por validação ISO estrita");
assert.match(liveEventsApi, /datetime\(\{ offset: true \}\)/);
assert.match(liveEventsApi, /duplicate: true/);
assert.doesNotMatch(liveEventsApi, /await writeSaasAudit/);
assert.doesNotMatch(liveEventsApi, /clinical_events_demo/);
assert.doesNotMatch(liveEventsApi, /patients_demo/);

const membersApi = readFileSync(
  new URL("../../functions/api/tenants/[id]/members.ts", import.meta.url),
  "utf8",
);
assert.match(membersApi, /LAST_OWNER_PROTECTED/);
assert.match(membersApi, /membershipCanManage/);
assert.match(membersApi, /Somente owner pode conceder papel owner/);
assert.match(
  membersApi,
  /Somente owner pode alterar o papel de outro owner/,
  "clinic_admin não pode demover owner por upsert",
);
assert.match(
  membersApi,
  /isLastOwnerConstraintError/,
  "handler precisa reagir ao trigger físico de último owner (0010)",
);

const tenantsApi = readFileSync(
  new URL("../../functions/api/tenants/index.ts", import.meta.url),
  "utf8",
);
assert.match(tenantsApi, /isValidTimeZone/);
assert.match(tenantsApi, /Timezone IANA inválido/);

console.log("saas phase1 foundation tests ok");
