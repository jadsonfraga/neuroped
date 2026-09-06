/**
 * Gera client/src/data/interactiveScaleIds.generated.ts a partir dos catálogos
 * de escalas interativas.
 *
 * Com `--check`, não escreve: compara o arquivo versionado com o que a geração
 * produziria agora e falha se divergirem. O modo existe porque `prebuild` e
 * `prebuild:client` regeneram o arquivo antes de cada build, mas os testes
 * importam a versão VERSIONADA. Sem essa conferência, o CI pode passar contra
 * um conjunto de escalas diferente do que a produção realmente serve — verde
 * provando outra coisa que não o que foi publicado.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { interactiveScaleItems } from "../client/src/data/interactiveScaleItems";
import { interactiveScales } from "../client/src/data/interactiveScales";

const ids = [...new Set([...Object.keys(interactiveScaleItems), ...Object.keys(interactiveScales)])].sort();
const counts = Object.fromEntries(ids.map((id) => {
  const domainRunner = interactiveScaleItems[id];
  const count = domainRunner
    ? domainRunner.domains.reduce((total, domain) => total + domain.items.length, 0)
    : interactiveScales[id]?.items.length ?? 0;
  return [id, count];
}));
const target = resolve(fileURLToPath(new URL("..", import.meta.url)), "client/src/data/interactiveScaleIds.generated.ts");
const source = `// GERADO por scripts/gen-interactive-scale-ids.mts - não editar manualmente.\n` +
  `export const INTERACTIVE_SCALE_IDS = new Set(${JSON.stringify(ids, null, 2)});\n` +
  `export const INTERACTIVE_SCALE_ITEM_COUNTS: Readonly<Record<string, number>> = ${JSON.stringify(counts, null, 2)};\n`;

if (process.argv.includes("--check")) {
  let committed = "";
  try {
    committed = readFileSync(target, "utf8");
  } catch {
    console.error(`[gen-interactive-scale-ids] arquivo gerado ausente: ${target}`);
    process.exit(1);
  }
  if (committed === source) {
    console.log(`✅ escalas interativas: ${ids.length} ids versionados batem com a geração.`);
    process.exit(0);
  }
  const idsOf = (text: string) => new Set([...text.matchAll(/^ {2}"([^"]+)",?$/gm)].map((m) => m[1]));
  const atual = idsOf(committed.split("INTERACTIVE_SCALE_ITEM_COUNTS")[0] ?? "");
  const esperado = idsOf(source.split("INTERACTIVE_SCALE_ITEM_COUNTS")[0] ?? "");
  const faltando = [...esperado].filter((id) => !atual.has(id));
  const sobrando = [...atual].filter((id) => !esperado.has(id));
  console.error("❌ escalas interativas: o arquivo versionado não corresponde à geração.");
  if (faltando.length) console.error(`   ausentes no arquivo versionado (${faltando.length}): ${faltando.join(", ")}`);
  if (sobrando.length) console.error(`   presentes só no arquivo versionado (${sobrando.length}): ${sobrando.join(", ")}`);
  if (!faltando.length && !sobrando.length) console.error("   os ids batem; divergem as contagens de itens ou a formatação.");
  console.error("   Corrija com: npm run gen:interactive-scale-ids");
  process.exit(1);
}

writeFileSync(target, source, "utf8");
console.log(`[gen-interactive-scale-ids] ${ids.length} ids -> ${target}`);
