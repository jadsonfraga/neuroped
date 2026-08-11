import assert from "node:assert/strict";
import fs from "node:fs";

const cf = fs.readFileSync(".github/workflows/deploy-cloudflare.yml", "utf8");
const vercel = fs.readFileSync(".github/workflows/deploy-vercel.yml", "utf8");
const prepare = fs.readFileSync("scripts/prepare-clinical-encryption-release.sh", "utf8");
const finalize = fs.readFileSync("scripts/finalize-clinical-encryption-release.sh", "utf8");

assert.match(cf, /Preparar migração clínica P0, backup e chaves separadas/);
assert.match(cf, /clinical-d1-pre-migration-/);
assert.match(cf, /Finalizar criptografia clínica strict e retirar segredos legados/);
assert.match(cf, /readyForIdentifiableClinicalData == true/);
assert.match(cf, /clinicalPhase == "strict"/);
assert.match(cf, /operationalConfigured == true/);

assert.match(vercel, /readyForIdentifiableClinicalData == true/);
assert.match(vercel, /clinicalPhase == "strict"/);
assert.match(vercel, /Cloudflare não confirmou .* criptografia strict/);

assert.match(prepare, /wrangler@4 d1 export/);
assert.match(prepare, /clinical-backup-crypto\.mjs encrypt/);
assert.match(prepare, /clinical-backup-crypto\.mjs decrypt/);
assert.match(prepare, /PRAGMA integrity_check/);
assert.match(prepare, /OPERATIONAL_DATA_KEY_PREVIOUS/);
assert.match(prepare, /Não é seguro sobrescrever uma chave desconhecida/);

assert.match(finalize, /migrate-d1-clinical-encryption\.mts apply/);
assert.match(finalize, /PLAINTEXT|migrate-d1-clinical-encryption\.mts verify/);
assert.match(finalize, /CLINICAL_ENCRYPTION_STRICT "true"/);
assert.match(finalize, /delete_secret_if_present OPERATIONAL_DATA_KEY_PREVIOUS/);
assert.match(finalize, /delete_secret_if_present CERT_P12_B64/);
assert.match(finalize, /delete_secret_if_present CERT_P12_PASSWORD/);
assert.match(finalize, /CERT_ENDPOINT_RETIRED/);
assert.match(finalize, /pages deploy dist\/public/);

assert.doesNotMatch(prepare, /upload-artifact.*\.sql/s, "backup plaintext não pode ser persistido como artefato");
assert.doesNotMatch(finalize, /NEUROPED_JWT_SECRET/, "finalização strict não pode depender do JWT como chave operacional");

console.log("✓ release P0: backup cifrado, restore testado, strict gate e remoção de legados travados");
