// Certificate A1 is saved only after local password validation; backend stores ciphertext only.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const vault = readFileSync("client/src/lib/certificateVault.ts", "utf8");
const panel = readFileSync("client/src/components/AssinaturaIcpPanel.tsx", "utf8");
const express = readFileSync("client/src/pages/receita-c1-express.tsx", "utf8");
const api = readFileSync("functions/api/certificate-vault.ts", "utf8");
const migration = readFileSync("db/migrations/0042_certificate_vault.sql", "utf8");
const legacy = readFileSync("client/src/lib/certificateSession.ts", "utf8");
const retired = readFileSync("functions/api/cert.ts", "utf8");

assert.match(vault, /user\.role === "admin"/, "only admin can use the certificate vault");
assert.match(vault, /PBKDF2/);
assert.match(vault, /AES-GCM/);
assert.match(vault, /additionalData: certificateAad\(user\.id\)/, "envelope is bound to account ID");
assert.match(vault, /iterations: CERTIFICATE_VAULT_KDF_ITERATIONS/);
assert.match(vault, /CERTIFICATE_VAULT_KDF_ITERATIONS = 600_000/, "PBKDF2-SHA256 meets the current OWASP floor");
assert.match(vault, /passwordWrapKey\(password, decodeBase64\(envelope\.salt\), envelope\.iterations\)/, "unlock uses the iteration count stored in the envelope");
assert.match(api, /MIN_KDF_ITERATIONS = 600_000/, "backend refuses envelopes below the OWASP floor");
assert.match(migration, /CHECK \(kdf_iterations BETWEEN 600000 AND 5000000\)/, "database enforces the accepted KDF range");
assert.match(vault, /body: JSON\.stringify\(payload\)/, "only the encrypted envelope is serialized for upload");
const uploadPayload = vault.slice(vault.indexOf("  const payload = {"), vault.indexOf("  const result = await accountVaultRequest"));
assert.match(uploadPayload, /ciphertext: encodeBase64/);
assert.doesNotMatch(uploadPayload, /password|senha|p12:/i, "upload envelope excludes password and plaintext PFX");
assert.match(api, /user\?\.role === "admin"/, "backend repeats admin authorization");
assert.match(api, /WHERE user_id = \?/g, "backend lookup and mutation are scoped to the authenticated user");
assert.match(api, /Object\.keys\(body\)\.some/, "backend rejects password/PFX fields and unknown payload fields");
assert.match(api, /body\.ciphertext/);
assert.doesNotMatch(migration, /password|passphrase|private_key|pfx_plain/i, "database schema has no password or plaintext key field");
assert.match(migration, /ciphertext_b64/);
assert.match(retired, /status: 410/, "legacy certificate distribution endpoint remains retired");

for (const [name, source] of [["shared signature panel", panel], ["C1 Express", express]]) {
  const uploadStart = source.indexOf("async function onPickP12") >= 0
    ? source.indexOf("async function onPickP12")
    : source.indexOf("async function onUploadP12");
  const verifyStart = source.indexOf("async function verificar", uploadStart);
  const upload = source.slice(uploadStart, verifyStart < 0 ? source.length : verifyStart);
  assert.doesNotMatch(upload, /saveCertificate(?:ToAccount)?\(/, `${name}: selection alone cannot save a certificate`);
  assert.match(source, /readP12Info\([\s\S]{0,500}persistirCertificado\(/, `${name}: local password validation occurs before persistence`);
  assert.match(source, /saveCertificateToAccount\(/, `${name}: successful validation can save to the account vault`);
}
assert.match(legacy, /neuroped-icp/, "legacy plaintext certificate cache continues to be purged");
console.log("✓ certificate account vault is encrypted, admin-scoped and password-free on the backend");
