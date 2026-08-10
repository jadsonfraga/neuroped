import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "../..");
const read = (path) => readFileSync(resolve(root, path), "utf8");

const home = read("client/src/pages/home.tsx");
const filtro = read("client/src/pages/filtro.tsx");
const publicRoutes = read("client/src/lib/publicRoutes.ts");
const portalFamilia = read("client/src/pages/portal-familia.tsx");
const buildInfo = read("scripts/gen-build-info.mjs");
const pkg = JSON.parse(read("package.json"));
const clinicalFiles = [
  "functions/api/patients/index.ts",
  "functions/api/consultations/index.ts",
  "functions/api/documents/index.ts",
  "functions/api/scales/results.ts",
  "functions/api/results.ts",
];

// Triagem sem cadastro: deve continuar pública, efêmera e sem contaminar o estado persistente.
assert.match(home, /filtro-escalas\?mode=flash/);
assert.match(filtro, /Modo efêmero — saia da tela e os dados somem/);
assert.match(filtro, /sessionStorage\.setItem\(FLASH_STORAGE_KEY/);
assert.match(filtro, /sessionStorage\.removeItem\(FLASH_STORAGE_KEY/);
assert.match(filtro, /if \(flashMode\) return;/);
assert.match(publicRoutes, /"\/filtro-escalas"/);

// Portal familiar não pode reintroduzir CPF-como-senha nem liberar documentos remotos anonimamente.
assert.doesNotMatch(portalFamilia, /CPF\s+como\s+senha|senha\s*=\s*CPF/i);
assert.match(portalFamilia, /const canPreviewDocuments/);
assert.match(portalFamilia, /accessMode === "remote" && isAuthenticated/);
assert.match(portalFamilia, /O ID do paciente nunca funciona como senha/);

// Build/versionamento continua derivado do package.json, sem versão duplicada manual no gerador.
assert.equal(typeof pkg.version, "string");
assert.match(buildInfo, /JSON\.parse\(readFileSync\(new URL/);
assert.match(buildInfo, /pkg\.version/);

// Nenhum endpoint clínico pode mentir que persistiu quando DB não existe.
for (const path of clinicalFiles) {
  const source = read(path);
  assert.match(source, /DB_REQUIRED/);
  assert.doesNotMatch(source, /Registro simulado|registro simulado/);
}

console.log("✓ Pontas soltas críticas protegidas por regressão estática");
