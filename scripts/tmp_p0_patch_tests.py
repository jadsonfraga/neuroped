import json
from pathlib import Path

p=Path('functions/api/operations/_core.ts');s=p.read_text()
s=s.replace('async function operationalKey(secret: string, keyId: string): Promise<CryptoKey> {', '''async function legacyOperationalKey(secret: string): Promise<CryptoKey> {
  const material = new TextEncoder().encode(`neuroped-operational-v1:${secret}`);
  const digest = await crypto.subtle.digest("SHA-256", material);
  return crypto.subtle.importKey("raw", digest, { name: "AES-GCM" }, false, ["decrypt"]);
}

async function operationalKey(secret: string, keyId: string): Promise<CryptoKey> {''',1)
s=s.replace('''export async function decryptText(env: OperationsEnv, value: string | null): Promise<string | null> {
  if (!value) return null;
  const [version, keyId, ivB64, cipherB64, ...extra] = value.split(".");
  if (version !== "v2" || !keyId || !ivB64 || !cipherB64 || extra.length > 0) return null;
  try {
    const secret = operationalSecretFor(env, keyId);
    const key = await operationalKey(secret, keyId);
    const plain = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: base64ToBytes(ivB64) },
      key,
      base64ToBytes(cipherB64),
    );
    return new TextDecoder().decode(plain);
  } catch {
    return null;
  }
}''','''export async function decryptText(env: OperationsEnv, value: string | null): Promise<string | null> {
  if (!value) return null;
  const parts = value.split(".");
  try {
    if (parts[0] === "v2" && parts.length === 4) {
      const [, keyId, ivB64, cipherB64] = parts;
      if (!keyId || !ivB64 || !cipherB64) return null;
      const secret = operationalSecretFor(env, keyId);
      const key = await operationalKey(secret, keyId);
      const plain = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: base64ToBytes(ivB64) },
        key,
        base64ToBytes(cipherB64),
      );
      return new TextDecoder().decode(plain);
    }
    // Compatibilidade somente de leitura: v1 antigo pode usar exclusivamente K1.
    // O fallback para NEUROPED_JWT_SECRET foi removido e não volta nesta via.
    if (parts[0] === "v1" && parts.length === 3) {
      const [, ivB64, cipherB64] = parts;
      if (!ivB64 || !cipherB64) return null;
      const secret = operationalSecretFor(env, "k1");
      const key = await legacyOperationalKey(secret);
      const plain = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: base64ToBytes(ivB64) },
        key,
        base64ToBytes(cipherB64),
      );
      return new TextDecoder().decode(plain);
    }
    return null;
  } catch {
    return null;
  }
}''',1)
p.write_text(s)

Path('tests/unit/clinical-data-encryption.test.ts').write_text(r'''import assert from "node:assert/strict";
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
''')

Path('tests/unit/clinical-encryption-static.test.mjs').write_text(r'''import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read=(p)=>readFileSync(new URL(`../../${p}`,import.meta.url),"utf8");
const op=read("functions/api/operations/_core.ts");
assert.doesNotMatch(op,/env\.NEUROPED_JWT_SECRET/);
assert.doesNotMatch(op,/OperationsEnv[\s\S]{0,220}NEUROPED_JWT_SECRET/);
assert.match(op,/OPERATIONAL_DATA_KEY_K1/);
assert.match(op,/v2\.\$\{keyId\}/);
const seed=read("db/seed.d1.sql");
assert.doesNotMatch(seed,/INSERT\s+INTO\s+(patients_demo|consultations_demo|scale_results_demo|documents_demo|memory_notes)/i);
const patients=read("functions/api/patients/index.ts");
assert.match(patients,/name='?\[encrypted\]'?|\[encrypted\]/);
assert.match(patients,/replaceBlindTokensStatements/);
const consultations=read("functions/api/consultations/index.ts");
assert.match(consultations,/objective, assessment, plan/);
assert.match(consultations,/NULL, NULL, NULL/);
const docs=read("functions/api/documents/index.ts");
assert.match(docs,/type.*encrypted/);
const scales=read("functions/api/scales/results.ts");
assert.match(scales,/scale_id.*encrypted/);
const memory=read("functions/api/memory/search.ts");
assert.doesNotMatch(memory,/memory_notes_fts/);
assert.match(memory,/searchEncryptedEntityIds/);
const clinical=read("functions/api/clinical-core/index.ts");
assert.match(clinical,/provenance_source.*encrypted/);
const conecta=read("functions/api/conecta/index.ts");
assert.match(conecta,/category.*encrypted/);
const migration=read("functions/api/admin/crypto-migration.ts");
for(const marker of ["residualPlaintext","decryptFailures","missingSearchIndexes","readyForStrict"]) assert.match(migration,new RegExp(marker));
console.log("✓ persistência clínica D1 não reintroduz payload clínico em texto aberto nem deriva chave operacional do JWT");
''')

p=Path('package.json');data=json.loads(p.read_text());quick=data['scripts']['test:quick-wins'];prefix='node --import tsx tests/unit/clinical-data-encryption.test.ts && node tests/unit/clinical-encryption-static.test.mjs && '
if not quick.startswith(prefix):data['scripts']['test:quick-wins']=prefix+quick
p.write_text(json.dumps(data,ensure_ascii=False,indent=2)+"\n")
print('crypto regressions prepared')
