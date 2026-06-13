import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

const expectedAssets = [
  "attached_assets/dr-jadson-logo.jpeg",
  "attached_assets/neuroped-logo.png",
  "attached_assets/images/dr-jadson-logo-super.jpeg",
  "attached_assets/images/dr-jadson-consultorio-superman.jpeg",
  "attached_assets/images/dr-jadson-arte.jpeg",
  "attached_assets/images/dr-jadson-selfie.jpeg",
  "attached_assets/images/dr-jadson-consultorio-batman.jpeg",
  "attached_assets/images/dr-jadson-consultorio-full.jpeg",
  "attached_assets/images/hero-brain.webp",
  "attached_assets/images/child-assessment.webp",
  "attached_assets/images/child-development.webp",
  "attached_assets/images/mental-health-child.webp",
  "attached_assets/images/neural-abstract.webp",
  "attached_assets/images/team-multiprofessional.webp",
];

const brandAssetsPath = join(root, "client/src/components/BrandAssets.tsx");
const qualidadePath = join(root, "client/src/pages/qualidade.tsx");
const inventoryPath = join(root, "ASSET_INVENTORY.md");
const docsPath = join(root, "docs/AUDITORIA_ASSETS_VISUAIS_PREMIUM.md");

function fail(message) {
  console.error(`❌ ${message}`);
  process.exitCode = 1;
}

function readText(path) {
  try {
    return readFileSync(path, "utf8");
  } catch {
    return "";
  }
}

const brandAssets = readText(brandAssetsPath);
const qualidade = readText(qualidadePath);
const inventory = readText(inventoryPath);
const docs = readText(docsPath);

console.log("🔎 Auditando assets visuais oficiais do NeuroPed...");

for (const relPath of expectedAssets) {
  const absPath = join(root, relPath);
  if (!existsSync(absPath)) {
    fail(`Asset ausente: ${relPath}`);
    continue;
  }

  const stat = statSync(absPath);
  if (!stat.isFile()) {
    fail(`Asset não é arquivo: ${relPath}`);
  }
  if (stat.size <= 0) {
    fail(`Asset vazio: ${relPath}`);
  }

  const fileName = relPath.split("/").at(-1);
  if (!brandAssets.includes(fileName)) {
    fail(`Asset não registrado/importado em BrandAssets.tsx: ${relPath}`);
  }
  if (!brandAssets.includes(relPath)) {
    fail(`Caminho do asset não aparece em visualAssetRegistry: ${relPath}`);
  }
  if (!inventory.includes(relPath)) {
    fail(`Asset não aparece em ASSET_INVENTORY.md: ${relPath}`);
  }
}

if (!qualidade.includes("visualAssetRegistry")) {
  fail("/qualidade não renderiza visualAssetRegistry.");
}
if (!qualidade.includes("SafeAssetImage")) {
  fail("/qualidade não usa SafeAssetImage para detectar falhas de imagem.");
}
if (!brandAssets.includes("export const visualAssetRegistry")) {
  fail("BrandAssets.tsx não exporta visualAssetRegistry.");
}
if (!brandAssets.includes("export function SafeAssetImage")) {
  fail("BrandAssets.tsx não exporta SafeAssetImage.");
}
if (!docs.includes("Auditoria visual") && !inventory.includes("Regra de ouro")) {
  fail("Documentação visual insuficiente: falta auditoria/inventário.");
}

if (process.exitCode) {
  console.error("\nResultado: auditoria visual reprovada.");
  process.exit(process.exitCode);
}

console.log(`✅ ${expectedAssets.length} assets oficiais existem, não estão vazios, estão registrados e são renderizados em /qualidade.`);
