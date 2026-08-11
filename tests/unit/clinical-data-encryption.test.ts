import assert from "node:assert/strict";
import {
  blindIndexTokens,
  blindQueryTokenGroups,
  decryptClinicalOrLegacy,
  decryptClinicalPayload,
  encryptClinicalPayload,
} from "../../functions/api/_clinicalCrypto";
import { decryptText, encryptText } from "../../functions/api/operations/_core";

const k1 = "clinical-data-k1-0123456789-abcdefghijklmnopqrstuvwxyz";
const i1 = "clinical-index-k1-0123456789-abcdefghijklmnopqrstuvwxyz";
const k2 = "clinical-data-k2-0123456789-abcdefghijklmnopqrstuvwxyz";
const envK1 = { CLINICAL_DATA_KEY: k1, CLINICAL_DATA_KEY_K1: k1, CLINICAL_DATA_KEY_ID: "k1", CLINICAL_INDEX_KEY: i1, CLINICAL_INDEX_KEY_K1: i1, CLINICAL_INDEX_KEY_ID: "k1" };
const aad = { entityType: "patient", entityId: "p-1", patientId: "p-1" };
const clear = { name: "Paciente Confidencial", diagnosis: "F90.0", note: "dado clínico sensível" };
const cipher = await encryptClinicalPayload(envK1, aad, clear);
assert.match(cipher, /^c1\.k1\./);
assert.ok(!cipher.includes(clear.name));
assert.ok(!cipher.includes(clear.note));
assert.deepEqual(await decryptClinicalPayload(envK1, aad, cipher), clear);
await assert.rejects(() => decryptClinicalPayload(envK1, { ...aad, patientId: "p-2" }, cipher));

const rotated = { ...envK1, CLINICAL_DATA_KEY: k2, CLINICAL_DATA_KEY_ID: "k2" };
assert.deepEqual(await decryptClinicalPayload(rotated, aad, cipher), clear, "K2 deve continuar lendo ciphertext K1 arquivado");
const cipher2 = await encryptClinicalPayload(rotated, aad, clear);
assert.match(cipher2, /^c1\.k2\./);
assert.deepEqual(await decryptClinicalPayload(rotated, aad, cipher2), clear);

await assert.rejects(
  () => decryptClinicalOrLegacy({ ...envK1, CLINICAL_REQUIRE_ENCRYPTED: "true" }, aad, "plaintext", () => clear),
  /texto aberto/i,
);

const blindA = await blindIndexTokens(envK1, ["João da Silva", "F90.0"]);
const blindB = await blindIndexTokens(envK1, ["João da Silva", "F90.0"]);
assert.deepEqual(blindA, blindB, "índice cego deve ser determinístico com a mesma chave");
assert.ok(blindA.tokens.length > 0);
const queryGroups = await blindQueryTokenGroups(envK1, "joao");
assert.equal(queryGroups[0].keyId, "k1");
assert.ok(queryGroups[0].tokens.every((token) => /^[0-9a-f]{64}$/.test(token)));

const opSecret = "operational-key-k1-0123456789-abcdefghijklmnopqrstuvwxyz";
const opEnv = { OPERATIONAL_DATA_KEY: opSecret, OPERATIONAL_DATA_KEY_K1: opSecret, OPERATIONAL_DATA_KEY_ID: "k1" };
const opCipher = await encryptText(opEnv, "responsável confidencial");
assert.match(String(opCipher), /^v2\.k1\./);
assert.equal(await decryptText(opEnv, opCipher), "responsável confidencial");
await assert.rejects(() => encryptText({} as any, "não pode usar JWT"), /OPERATIONAL_CRYPTO_NOT_CONFIGURED/);

async function legacyOperationalEnvelope(secret:string,value:string){
  const enc=new TextEncoder();const digest=await crypto.subtle.digest("SHA-256",enc.encode(`neuroped-operational-v1:${secret}`));const key=await crypto.subtle.importKey("raw",digest,{name:"AES-GCM"},false,["encrypt"]);const iv=crypto.getRandomValues(new Uint8Array(12));const out=new Uint8Array(await crypto.subtle.encrypt({name:"AES-GCM",iv},key,enc.encode(value)));const b64=(bytes:Uint8Array)=>{let s="";for(const b of bytes)s+=String.fromCharCode(b);return btoa(s)};return `v1.${b64(iv)}.${b64(out)}`;
}
const legacy = await legacyOperationalEnvelope(opSecret, "legado seguro");
assert.equal(await decryptText(opEnv, legacy), "legado seguro", "v1 só pode ser recuperado pela chave operacional K1");
assert.equal(await decryptText({ OPERATIONAL_DATA_KEY: "different-operational-key-0123456789-abcdefghijklmnopqrstuvwxyz", OPERATIONAL_DATA_KEY_ID: "k2" }, legacy), null);

console.log("✓ criptografia clínica/operacional: AAD, rotação, blind index, strict mode e separação de JWT aprovados");
