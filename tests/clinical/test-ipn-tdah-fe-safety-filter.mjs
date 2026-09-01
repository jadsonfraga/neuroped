// @ts-check
/** Regressões de segurança e usabilidade fechadas na auditoria de 31/07/2026. */
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..", "..");
const imp = (rel) => import(pathToFileURL(resolve(repoRoot, rel)).href);
const { interactiveScaleItems } = await imp("client/src/data/interactiveScaleItems.ts");

let checks = 0;
let failures = 0;
function ok(condition, message) {
  checks++;
  if (!condition) {
    failures++;
    console.error(`  ❌ ${message}`);
  }
}

const qualitative = {
  "ipn-tdah-fe-anamnese-18": 18,
  "ipn-tdah-fe-diferenciais-20": 20,
  "ipn-tdah-fe-sintese-15": 15,
};
for (const [id, expected] of Object.entries(qualitative)) {
  const items = interactiveScaleItems[id].domains.flatMap((domain) => domain.items);
  ok(items.length === expected, `${id}: preserva ${expected} campos`);
  ok(
    items.every(
      (item) =>
        typeof item !== "string" &&
        item.responseType === "text" &&
        item.required === false,
    ),
    `${id}: campos qualitativos são explicitamente opcionais`,
  );
}

const adolescent = interactiveScaleItems["ipn-tdah-fe-adolescente-20"].domains.flatMap(
  (domain) => domain.items,
);
const sentinels = adolescent.filter(
  (item) => typeof item !== "string" && item.sentinel,
);
ok(sentinels.length === 2, "autorrelato preserva duas sentinelas independentes");
ok(
  sentinels.every(
    (item) =>
      typeof item !== "string" &&
      item.sentinel?.positiveOptionIndexes.join(",") === "1,2,3",
  ),
  "qualquer resposta positiva das sentinelas exige avaliação imediata",
);

const genericSource = readFileSync(
  resolve(repoRoot, "client/src/components/GenericScale.tsx"),
  "utf8",
);
ok(
  /onValueChange=\{\(val\) => \{[\s\S]*?itemSentinel\(\s*item\s*,?\s*\)\?\.positiveOptionIndexes\.includes\([\s\S]*?setShowSafetyGate\(true\)/.test(
    genericSource,
  ),
  "seleção positiva abre o gate de segurança sem esperar submissão",
);
ok(
  genericSource.includes("required?: boolean") &&
    genericSource.includes("!item.required || hasResponse(item)"),
  "runner diferencia resposta opcional de pendência obrigatória",
);
ok(
  !genericSource.includes("leitura do IPN‑TEA") &&
    genericSource.includes("interpretação global deste instrumento"),
  "alerta compartilhado não atribui o resultado ao instrumento errado",
);

const workflowSource = readFileSync(
  resolve(repoRoot, ".github/workflows/scale-pdf-contract.yml"),
  "utf8",
);
ok(
  workflowSource.match(/safety-classification-baseline\.json/g)?.length === 2,
  "baseline de segurança participa dos gatilhos de PR e push",
);

const baseline = JSON.parse(
  readFileSync(
    resolve(repoRoot, "scripts/guards/safety-classification-baseline.json"),
    "utf8",
  ),
);
for (const id of [
  "ipn-tdah-fe-familia-48",
  "ipn-tdah-fe-escola-32",
  "ipn-tdah-fe-adolescente-20",
  "ipn-tdah-fe-observacao-10",
  "ipn-tdah-fe-executivo-10",
  "ipn-tdah-fe-anamnese-18",
  "ipn-tdah-fe-diferenciais-20",
  "ipn-tdah-fe-sintese-15",
]) {
  ok(typeof baseline[id] === "string", `${id}: congelado no baseline de segurança`);
}

if (failures > 0) {
  console.error(`❌ AUDITORIA IPN-TDAH/FE FALHOU — ${failures}/${checks}`);
  process.exit(1);
}
console.log(`✅ AUDITORIA IPN-TDAH/FE OK — ${checks} verificações passaram.`);
