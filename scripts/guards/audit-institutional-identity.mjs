import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

const criticalFiles = [
  "client/src/components/ClinicalReport.tsx",
  "client/src/pages/sobre.tsx",
  "client/src/pages/qualidade.tsx",
  "client/src/pages/portal-familia.tsx",
];

const forbidden = [
  "CRM-BA",
  "23384",
  "14499",
  "13119",
  "jadsonfraga@hotmail.com",
  "32013648",
  "Cardoso de Sá",
  "Av. Cardoso",
];

// Anti-regressão: os emissores de documentos migraram para a fonte única
// client/src/lib/issuer.ts — identidade pessoal hardcoded não pode voltar.
const tenantIssuerFiles = [
  "client/src/components/ClinicalReport.tsx",
  "client/src/lib/laudo/modeloSuper.ts",
];

const forbiddenInTenantIssuerFiles = [
  "drjadsonfraga@proton.me",
  "CRM-PE 25227",
];

function fail(message) {
  console.error(`❌ ${message}`);
  process.exitCode = 1;
}

function read(relPath) {
  return readFileSync(join(root, relPath), "utf8");
}

console.log("🧾 Auditando identidade institucional pública/central...");

for (const relPath of criticalFiles) {
  const text = read(relPath);
  for (const needle of forbidden) {
    if (text.includes(needle)) {
      fail(`Termo institucional antigo encontrado em ${relPath}: ${needle}`);
    }
  }
}

for (const relPath of tenantIssuerFiles) {
  const text = read(relPath);
  for (const needle of forbiddenInTenantIssuerFiles) {
    if (text.includes(needle)) {
      fail(`Identidade pessoal hardcoded regrediu em ${relPath}: ${needle} (use client/src/lib/issuer.ts)`);
    }
  }
}

const sobre = read("client/src/pages/sobre.tsx");
if (!sobre.includes("Rua Raimundo Lacerda")) {
  fail("sobre.tsx deve usar endereço institucional atual: Rua Raimundo Lacerda.");
}
if (!sobre.includes("+5587991097371")) {
  fail("sobre.tsx deve usar telefone institucional atual no link tel.");
}

if (process.exitCode) {
  console.error("\nResultado: identidade institucional reprovada.");
  process.exit(process.exitCode);
}

console.log("✅ Identidade institucional central aprovada.");
