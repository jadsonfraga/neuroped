import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { interactiveScaleItems } from "../client/src/data/interactiveScaleItems";
import { interactiveScales } from "../client/src/data/interactiveScales";
import { buildSdgPublicManifest } from "../client/src/data/authorialSdgRegistry";

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
writeFileSync(target, source, "utf8");
console.log(`[gen-interactive-scale-ids] ${ids.length} ids -> ${target}`);

// O prebuild existente executa este gerador em TODOS os caminhos de publicação.
// Assim não há um manifesto manual diferente para Cloudflare e Vercel.
const publicDirectory = resolve(fileURLToPath(new URL("..", import.meta.url)), "client/public");
mkdirSync(publicDirectory, { recursive: true });
writeFileSync(resolve(publicDirectory, "authorial-sdg-manifest.json"), JSON.stringify(buildSdgPublicManifest(), null, 2) + "\n", "utf8");
