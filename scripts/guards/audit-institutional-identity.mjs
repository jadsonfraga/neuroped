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

const requiredInClinicalReport = [
  "drjadsonfraga@proton.me",
  "CRM-PE 25227 · RQE 17756",
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

const clinicalReport = read("client/src/components/ClinicalReport.tsx");
for (const needle of requiredInClinicalReport) {
  if (!clinicalReport.includes(needle)) {
    fail(`ClinicalReport.tsx não contém identidade institucional obrigatória: ${needle}`);
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
