// @ts-check
/** Contrato genérico dos PDFs autorais transformados em ferramentas do app. */
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..", "..");
const imp = (rel) => import(pathToFileURL(resolve(repoRoot, rel)).href);

const { allScales } = await imp("client/src/data/scaleFilter.ts");
const { interactiveScaleItems } = await imp("client/src/data/interactiveScaleItems.ts");
const { generatedScalePdfRegistry } = await imp("client/src/data/generatedScalePdfRegistry.ts");
const { getImplementationStatus } = await imp("client/src/data/advancedFilterLogic.ts");

let failures = 0;
let checks = 0;
function ok(condition, message) {
  checks++;
  if (!condition) {
    failures++;
    console.error(`  ❌ ${message}`);
  }
}

const seen = new Set();
for (const manifest of generatedScalePdfRegistry) {
  console.log(`\n=== ${manifest.title} · ${manifest.sourcePdf} ===`);
  let deliveredTotal = 0;
  for (const module of manifest.modules) {
    ok(!seen.has(module.id), `${module.id}: id não duplicado entre PDFs`);
    seen.add(module.id);
    const scale = allScales.find((entry) => entry.id === module.id);
    const definition = interactiveScaleItems[module.id];
    const delivered = (definition?.domains ?? []).reduce(
      (sum, domain) => sum + (domain.items?.length ?? 0),
      0,
    );
    deliveredTotal += delivered;
    ok(Boolean(scale), `${module.id}: metadado no catálogo`);
    ok(Boolean(definition), `${module.id}: aplicação interativa`);
    ok(delivered === module.expectedItems, `${module.id}: ${delivered}/${module.expectedItems} itens`);
    ok(scale?.ageMin === module.ageMin && scale?.ageMax === module.ageMax, `${module.id}: faixa etária corresponde ao manifesto`);
    ok(Boolean(scale) && scale.respondente.includes(module.respondent), `${module.id}: informante corresponde ao manifesto`);
    ok(Boolean(scale) && getImplementationStatus(scale) === "complete", `${module.id}: implementação completa`);
    ok(scale?.licencaUso === "autoral", `${module.id}: licença autoral explícita`);
    ok(scale?.pendente_validacao_clinica === true, `${module.id}: validação pendente explícita`);
    ok(/sem ponto de corte|sem soma|sem escore|qualitativo|descritivo/i.test(`${scale?.scoringCutoff ?? ""} ${scale?.validacaoBrasil ?? ""}`), `${module.id}: limite interpretativo explícito`);
  }
  ok(deliveredTotal === manifest.totalOperationalItems, `${manifest.slug}: total ${deliveredTotal}/${manifest.totalOperationalItems}`);
}

console.log(`\n${"=".repeat(52)}`);
if (failures === 0) {
  console.log(`✅ REGISTRO DE PDFs DE ESCALAS OK — ${checks} verificações passaram.`);
  process.exit(0);
}
console.error(`❌ REGISTRO DE PDFs DE ESCALAS FALHOU — ${failures}/${checks} verificações falharam.`);
process.exit(1);
