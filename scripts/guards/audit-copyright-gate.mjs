// @ts-check
// Invariante do GATE DE COPYRIGHT. Falha se uma escala PROPRIETÁRIA/RESTRITA
// (licencaUso comercial/restrita/contato_autor) voltar a reproduzir itens:
//  - via página DEDICADA não-gateada (deve estar em PROPRIETARY_GATED_ROUTES), ou
//  - via /generic-scale (a página gateia por licença; aqui validamos a lista).
// Domínio público e autorais do Dr. seguem funcionais (não são checados).
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..", "..");

if (process.env.NEUROPED_COPYGATE_TSX !== "1") {
  const tsxCli = resolve(repoRoot, "node_modules/tsx/dist/cli.mjs");
  const child = spawnSync(process.execPath, [tsxCli, fileURLToPath(import.meta.url)], {
    cwd: repoRoot,
    stdio: "inherit",
    env: { ...process.env, NEUROPED_COPYGATE_TSX: "1" },
  });
  process.exit(child.status ?? 1);
}

const { allScales } = await import(
  pathToFileURL(resolve(repoRoot, "client/src/data/scaleFilter.ts")).href
);
const { PROPRIETARY_GATED_ROUTES } = await import(
  pathToFileURL(resolve(repoRoot, "client/src/data/proprietaryGatedRoutes.ts")).href
);

const RESTRITAS = new Set(["comercial", "restrita", "contato_autor"]);
const gated = new Set(PROPRIETARY_GATED_ROUTES.map((r) => r.path));
const gatedIds = new Set(PROPRIETARY_GATED_ROUTES.map((r) => r.id));

const errors = [];
let gatedDedic = 0;
let genericProp = 0;

for (const s of allScales) {
  if (!s.appRoute || !RESTRITAS.has(s.licencaUso)) continue;
  if (s.appRoute.startsWith("/generic-scale/")) {
    genericProp++; // gateada pela página generic-scale (isProprietaria)
    continue;
  }
  if (s.appRoute.startsWith("/escala/")) continue; // já é ficha
  // Página DEDICADA proprietária → DEVE estar gateada (redirect → ficha).
  if (!gated.has(s.appRoute))
    errors.push(`${s.id}: proprietária (${s.licencaUso}) com página dedicada ${s.appRoute} NÃO gateada → reproduz itens. Adicione a PROPRIETARY_GATED_ROUTES.`);
  else gatedDedic++;
}

// Toda entrada da lista deve corresponder a uma proprietária real (sem lixo).
for (const r of PROPRIETARY_GATED_ROUTES) {
  const s = allScales.find((x) => x.id === r.id);
  if (!s) errors.push(`PROPRIETARY_GATED_ROUTES inclui id inexistente: ${r.id}`);
  else if (!RESTRITAS.has(s.licencaUso))
    errors.push(`PROPRIETARY_GATED_ROUTES inclui ${r.id} que NÃO é proprietária (licenca=${s.licencaUso})`);
}

console.log(
  `[audit:copyright-gate] proprietárias gateadas: ${gatedDedic} dedicadas + ${genericProp} via generic-scale | lista=${gatedIds.size}`,
);
if (errors.length > 0) {
  console.error(`\n[audit:copyright-gate] ✗ ${errors.length} EXPOSIÇÃO(ÕES) de copyright:`);
  for (const e of errors) console.error("  - " + e);
  process.exit(1);
}
console.log("[audit:copyright-gate] ✓ nenhuma proprietária reproduz itens (todas → ficha).");
