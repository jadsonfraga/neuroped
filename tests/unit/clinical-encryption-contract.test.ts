import assert from "node:assert/strict";
import {
  CLINICAL_LEGACY_SENTINEL,
  clinicalBlindTokenGroupsForQuery,
  clinicalBlindTokensForValue,
  clinicalKeyId,
  decryptClinicalJson,
  encryptClinicalJson,
  isClinicalEnvelope,
} from "../../shared/clinical-crypto";

const keyA = "clinical-key-A-0123456789-abcdefghijklmnopqrstuvwxyz";
const keyB = "clinical-key-B-0123456789-abcdefghijklmnopqrstuvwxyz";
const scope = { table: "patients_demo", rowId: "patient-1", field: "secure_payload" };
const payload = { name: "Criança Teste", birthDate: "2018-04-03", notes: "dado clínico" };

const envelope = await encryptClinicalJson(keyA, scope, payload);
assert.equal(isClinicalEnvelope(envelope), true);
assert.match(envelope, /^c1\.[0-9a-f]{16}\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/);
assert.deepEqual(await decryptClinicalJson({ active: keyA, strict: true }, scope, envelope), payload);

await assert.rejects(
  () => decryptClinicalJson({ active: keyA, strict: true }, { ...scope, rowId: "patient-2" }, envelope),
  /CLINICAL_CIPHERTEXT_INVALID/,
  "AAD precisa impedir mover o ciphertext para outro registro",
);
await assert.rejects(
  () => decryptClinicalJson({ active: keyA, strict: true }, scope, null, JSON.stringify(payload)),
  /CLINICAL_PLAINTEXT_FORBIDDEN/,
  "strict=true não pode aceitar fallback plaintext",
);
assert.deepEqual(
  await decryptClinicalJson({ active: keyA, strict: false }, scope, null, JSON.stringify(payload)),
  payload,
  "dual-read é permitido apenas durante a janela de migração",
);
assert.equal(
  await decryptClinicalJson({ active: keyA, strict: false }, scope, null, CLINICAL_LEGACY_SENTINEL),
  null,
  "sentinela nunca é interpretada como payload clínico",
);

const oldEnvelope = await encryptClinicalJson(keyA, scope, payload);
assert.deepEqual(
  await decryptClinicalJson({ active: keyB, previous: keyA, strict: true }, scope, oldEnvelope),
  payload,
  "rotação deve manter leitura temporária com previous key",
);
await assert.rejects(
  () => decryptClinicalJson({ active: keyB, strict: true }, scope, oldEnvelope),
  /CLINICAL_CIPHERTEXT_INVALID/,
);
assert.notEqual(await clinicalKeyId(keyA), await clinicalKeyId(keyB));

const tokens1 = await clinicalBlindTokensForValue(keyA, "patient", "João da Silva");
const tokens2 = await clinicalBlindTokensForValue(keyA, "patient", "João da Silva");
assert.deepEqual(tokens1, tokens2, "blind index deve ser determinístico");
assert.equal(tokens1.length > 0, true);
assert.equal(tokens1.every((token) => /^[0-9a-f]{64}$/.test(token)), true);
const groups = await clinicalBlindTokenGroupsForQuery(
  { active: keyB, previous: keyA, strict: true },
  "patient",
  "João Silva",
);
assert.equal(groups.length, 2);
assert.equal(groups.every((group) => group.length === 2), true, "cada termo deve aceitar active/previous durante rotação");

console.log("✓ criptografia clínica: AES-GCM/AAD, strict mode, rotação e blind index aprovados");
