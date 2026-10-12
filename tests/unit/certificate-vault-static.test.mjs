// Cofre do certificado A1: persistência só do .pfx cifrado, só para admin, senha nunca salva.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const vault = readFileSync("client/src/lib/certificateVault.ts", "utf8");
const express = readFileSync("client/src/pages/receita-c1-express.tsx", "utf8");
const panel = readFileSync("client/src/components/AssinaturaIcpPanel.tsx", "utf8");
const legacy = readFileSync("client/src/lib/certificateSession.ts", "utf8");

assert.match(vault, /user\.role === "admin"/, "somente admin usa o cofre");
assert.match(vault, /generateKey\(\{ name: "AES-GCM", length: 256 \}, false,/, "chave de envelope não-extraível");
assert.match(vault, /additionalData: aad/, "AAD amarra o registro ao usuário");
const vaultCode = vault.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
assert.doesNotMatch(vaultCode, /senha|password|passphrase/i, "o cofre jamais recebe/guarda a senha");
assert.doesNotMatch(vault, /fetch\(|XMLHttpRequest|localStorage|sessionStorage/, "o .pfx não sai do dispositivo");
const legacyName = legacy.match(/LEGACY_DB_NAME = "([^"]+)"/)[1];
const vaultName = vault.match(/VAULT_DB_NAME = "([^"]+)"/)[1];
assert.notEqual(vaultName, legacyName, "purga do cache legado não apaga o cofre");

for (const [name, src] of [["express", express], ["panel", panel]]) {
  assert.match(src, /saveCertificate\(user, [a-z]+, f\.name\)/, `${name}: salva somente bytes e nome do arquivo`);
  assert.doesNotMatch(src, /saveCertificate\([^)]*senha/, `${name}: senha nunca vai ao cofre`);
  assert.match(src, /e\.key === "Enter"[\s\S]{0,120}gerarEAssinar\(\)/, `${name}: Enter na senha gera e assina`);
  assert.match(src, /setSenha\(""\)/, `${name}: senha é limpa após assinar`);
}
console.log("✓ cofre do certificado A1: admin-only, cifrado, sem senha persistida");
