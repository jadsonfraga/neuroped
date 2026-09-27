/**
 * Real clinical crypto contract, without network, database, provider or crypto
 * mocks. This proves keyring validation and ciphertext compatibility locally;
 * it does NOT attest production key custody, D1/R2 restore or SaaS readiness.
 * CI: node --import tsx --test tests/unit/clinical-crypto-rotation-readiness.test.mjs
 */
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import test from "node:test";
import {
  clinicalBlindIndex,
  clinicalCryptoReady,
  clinicalCryptoStatus,
  currentClinicalEncryptionVersion,
  decryptClinicalJson,
  encryptClinicalJson,
} from "../../functions/api/tenant/_crypto.ts";

const secret = () => randomBytes(48).toString("base64");
const configuration = () => ({
  CLINICAL_DATA_KEY: secret(),
  CLINICAL_DATA_KEY_ID: "current-synthetic",
  CLINICAL_INDEX_KEY: secret(),
});
const record = {
  kind: "synthetic-only",
  finding: "Não avaliado",
  nested: { values: [0, false, null, "çã"], version: 1 },
};
const clinicA = "synthetic-clinic-a";
const clinicB = "synthetic-clinic-b";
const purpose = "synthetic-event";

function assertBlocked(env, code) {
  assert.equal(clinicalCryptoReady(env), false);
  assert.deepEqual(clinicalCryptoStatus(env), { configured: false, code });
}

test("current key and independent index key remain sufficient without rotation", async () => {
  const env = configuration();
  assert.deepEqual(clinicalCryptoStatus(env), { configured: true });
  const cipher = await encryptClinicalJson(env, clinicA, purpose, record);
  assert.deepEqual(await decryptClinicalJson(env, clinicA, purpose, cipher), record);
});

test("empty optional rotation placeholders remain absent, not a new requirement", () => {
  const env = {
    ...configuration(),
    CLINICAL_DATA_KEY_PREVIOUS: "   ",
    CLINICAL_DATA_KEY_PREVIOUS_ID: "\t",
  };
  assert.equal(clinicalCryptoReady(env), true);
});

for (const size of [1, 16, 31]) {
  test(`explicit previous key below the minimum (${size}) cannot report ready`, () => {
    assertBlocked({
      ...configuration(),
      CLINICAL_DATA_KEY_PREVIOUS: secret().slice(0, size),
      CLINICAL_DATA_KEY_PREVIOUS_ID: "old-synthetic",
    }, "CLINICAL_PREVIOUS_KEY_NOT_CONFIGURED");
  });
}

test("a short previous key also fails when the legacy previous ID is implicit", () => {
  assertBlocked({
    ...configuration(),
    CLINICAL_DATA_KEY_PREVIOUS: secret().slice(0, 31),
  }, "CLINICAL_PREVIOUS_KEY_NOT_CONFIGURED");
});

for (const value of [undefined, "", "   "]) {
  test(`previous ID without usable key is not silently discarded (${JSON.stringify(value)})`, () => {
    assertBlocked({
      ...configuration(),
      CLINICAL_DATA_KEY_PREVIOUS: value,
      CLINICAL_DATA_KEY_PREVIOUS_ID: "old-synthetic",
    }, "CLINICAL_PREVIOUS_KEY_NOT_CONFIGURED");
  });
}

test("minimum-length previous key remains valid; the fix does not redefine existing keys", () => {
  assert.equal(clinicalCryptoReady({
    ...configuration(),
    CLINICAL_DATA_KEY_PREVIOUS: secret().slice(0, 32),
    CLINICAL_DATA_KEY_PREVIOUS_ID: "old-synthetic",
  }), true);
});

test("rotation reads original ciphertext unchanged and writes only the current version", async () => {
  const previous = { ...configuration(), CLINICAL_DATA_KEY_ID: "old-synthetic" };
  const before = await encryptClinicalJson(previous, clinicA, purpose, record);
  const afterRotation = {
    ...configuration(),
    CLINICAL_DATA_KEY_PREVIOUS: previous.CLINICAL_DATA_KEY,
    CLINICAL_DATA_KEY_PREVIOUS_ID: previous.CLINICAL_DATA_KEY_ID,
    CLINICAL_INDEX_KEY: previous.CLINICAL_INDEX_KEY,
  };
  assert.equal(clinicalCryptoReady(afterRotation), true);
  assert.deepEqual(await decryptClinicalJson(afterRotation, clinicA, purpose, before), record);
  const updated = { ...record, nested: { ...record.nested, version: 2 } };
  const after = await encryptClinicalJson(afterRotation, clinicA, purpose, updated);
  assert.match(before, /^v1\.old-synthetic\./);
  assert.match(after, /^v1\.current-synthetic\./);
  assert.deepEqual(await decryptClinicalJson(afterRotation, clinicA, purpose, after), updated);
  assert.deepEqual(await decryptClinicalJson(afterRotation, clinicA, purpose, before), record);
  assert.equal(
    await clinicalBlindIndex(previous, clinicA, "name", "  Synthetic  Record  "),
    await clinicalBlindIndex(afterRotation, clinicA, "name", "synthetic record"),
  );
  for (const cipher of [before, after]) {
    await assert.rejects(decryptClinicalJson(afterRotation, clinicB, purpose, cipher), /CLINICAL_DECRYPT_FAILED/);
    await assert.rejects(decryptClinicalJson(afterRotation, clinicA, "different-purpose", cipher), /CLINICAL_DECRYPT_FAILED/);
    const parts = cipher.split(".");
    const bytes = Buffer.from(parts[3], "base64");
    bytes[0] ^= 1;
    parts[3] = bytes.toString("base64");
    await assert.rejects(decryptClinicalJson(afterRotation, clinicA, purpose, parts.join(".")), /CLINICAL_DECRYPT_FAILED/);
  }
});

test("legacy default IDs and whitespace normalization retain ciphertext compatibility", async () => {
  const currentSecret = secret();
  const oldSecret = secret();
  const env = {
    CLINICAL_DATA_KEY: ` ${currentSecret} `,
    CLINICAL_DATA_KEY_PREVIOUS: ` ${oldSecret} `,
    CLINICAL_INDEX_KEY: secret(),
  };
  assert.equal(clinicalCryptoReady(env), true);
  assert.equal(currentClinicalEncryptionVersion(env), "clinical-v1:k1");
  const old = await encryptClinicalJson({
    CLINICAL_DATA_KEY: oldSecret,
    CLINICAL_DATA_KEY_ID: "previous",
  }, clinicA, purpose, record);
  assert.deepEqual(await decryptClinicalJson(env, clinicA, purpose, old), record);
});

test("existing current-key, index-key, collision, format and separation guards remain", () => {
  const env = configuration();
  assertBlocked({ ...env, CLINICAL_DATA_KEY: "" }, "CLINICAL_CRYPTO_NOT_CONFIGURED");
  assertBlocked({ ...env, CLINICAL_INDEX_KEY: "" }, "CLINICAL_INDEX_KEY_NOT_CONFIGURED");
  assertBlocked({ ...env, CLINICAL_INDEX_KEY: env.CLINICAL_DATA_KEY }, "CLINICAL_KEY_SEPARATION_REQUIRED");
  assertBlocked({ ...env, CLINICAL_DATA_KEY_ID: "invalid.id" }, "CLINICAL_KEY_ID_INVALID");
  assertBlocked({
    ...env,
    CLINICAL_DATA_KEY_PREVIOUS: secret(),
    CLINICAL_DATA_KEY_PREVIOUS_ID: env.CLINICAL_DATA_KEY_ID,
  }, "CLINICAL_KEY_ID_COLLISION");
  assertBlocked({
    ...env,
    CLINICAL_DATA_KEY_PREVIOUS: secret(),
    CLINICAL_DATA_KEY_PREVIOUS_ID: "invalid.id",
  }, "CLINICAL_KEY_ID_INVALID");
  assertBlocked({
    ...env,
    CLINICAL_DATA_KEY_PREVIOUS: env.CLINICAL_INDEX_KEY,
    CLINICAL_DATA_KEY_PREVIOUS_ID: "old-synthetic",
  }, "CLINICAL_KEY_SEPARATION_REQUIRED");
});

test("broken rotation never echoes key material, prefixes or operator-supplied IDs", () => {
  const env = {
    ...configuration(),
    CLINICAL_DATA_KEY_PREVIOUS: secret().slice(0, 31),
    CLINICAL_DATA_KEY_PREVIOUS_ID: `id_${randomBytes(10).toString("hex")}`,
  };
  const status = clinicalCryptoStatus(env);
  assert.deepEqual(status, { configured: false, code: "CLINICAL_PREVIOUS_KEY_NOT_CONFIGURED" });
  const encoded = JSON.stringify(status);
  for (const value of Object.values(env)) {
    assert.equal(encoded.includes(value), false);
    assert.equal(encoded.includes(value.slice(0, 8)), false);
  }
});

test("structural readiness is not proof of historic key coverage or a restored database", async () => {
  const old = { ...configuration(), CLINICAL_DATA_KEY_ID: "retired-synthetic" };
  const cipher = await encryptClinicalJson(old, clinicA, purpose, record);
  const currentOnly = configuration();
  // Deliberately document the boundary: unknown historic keys need a real
  // inventory/recovery drill, not an invented ready=true assertion.
  assert.equal(clinicalCryptoReady(currentOnly), true);
  await assert.rejects(decryptClinicalJson(currentOnly, clinicA, purpose, cipher), /CLINICAL_KEY_VERSION_UNAVAILABLE/);
});
