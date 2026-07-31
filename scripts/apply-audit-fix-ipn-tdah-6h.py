from pathlib import Path


def replace_exact(path: str, old: str, new: str, expected: int = 1) -> None:
    file = Path(path)
    text = file.read_text(encoding="utf-8")
    actual = text.count(old)
    if actual != expected:
        raise SystemExit(
            f"{path}: esperado {expected} ocorrência(s), encontrado {actual}"
        )
    file.write_text(text.replace(old, new), encoding="utf-8")


generic = "client/src/components/GenericScale.tsx"

replace_exact(
    generic,
    '''interface ScaleTextItem extends ScaleItemBase {
  responseType: "text";
  placeholder?: string;
  maxLength?: number;
}''',
    '''interface ScaleTextItem extends ScaleItemBase {
  responseType: "text";
  placeholder?: string;
  maxLength?: number;
  /** Campos qualitativos podem ser opcionais sem exigir texto fictício. */
  required?: boolean;
}''',
)

replace_exact(
    generic,
    '''export function itemMaxLength(item: ScaleItem): number {
  return typeof item === "string" || item.responseType !== "text"
    ? 0
    : (item.maxLength ?? 600);
}
''',
    '''export function itemMaxLength(item: ScaleItem): number {
  return typeof item === "string" || item.responseType !== "text"
    ? 0
    : (item.maxLength ?? 600);
}
export function itemRequired(item: ScaleItem): boolean {
  return typeof item === "string" || item.responseType !== "text"
    ? true
    : (item.required ?? true);
}
''',
)

replace_exact(
    generic,
    '''          maxLength: itemMaxLength(item),
          domain: d.name,''',
    '''          maxLength: itemMaxLength(item),
          required: itemRequired(item),
          domain: d.name,''',
)

replace_exact(
    generic,
    '''  const isAnswered = (item: (typeof allItems)[number]) =>
    item.responseType === "text"
      ? Boolean(textAnswers[item.key]?.trim())
      : answers[item.key] !== undefined;
  const answered = allItems.filter(isAnswered).length;
  const progress = total > 0 ? (answered / total) * 100 : 0;
  const allAnswered = total > 0 && answered === total;
  const missingCount = Math.max(total - answered, 0);
  const firstMissing = allItems.find((item) => !isAnswered(item));''',
    '''  const hasResponse = (item: (typeof allItems)[number]) =>
    item.responseType === "text"
      ? Boolean(textAnswers[item.key]?.trim())
      : answers[item.key] !== undefined;
  const isCompleteForSubmit = (item: (typeof allItems)[number]) =>
    !item.required || hasResponse(item);
  const answered = allItems.filter(hasResponse).length;
  const requiredItems = allItems.filter((item) => item.required);
  const requiredAnswered = requiredItems.filter(hasResponse).length;
  const progress =
    total === 0
      ? 0
      : requiredItems.length === 0
        ? 100
        : (requiredAnswered / requiredItems.length) * 100;
  const allAnswered =
    total > 0 && requiredAnswered === requiredItems.length;
  const missingCount = Math.max(
    requiredItems.length - requiredAnswered,
    0,
  );
  const firstMissing = requiredItems.find((item) => !hasResponse(item));''',
)

replace_exact(
    generic,
    '''                  A avaliação de segurança é imediata e independente de qualquer
                  leitura do IPN‑TEA.''',
    '''                  A avaliação de segurança é imediata e independe da
                  interpretação global deste instrumento.''',
)

replace_exact(
    generic,
    '''              const itemAnswered =
                itemResponseType(item) === "text"
                  ? Boolean(textAnswers[key]?.trim())
                  : answers[key] !== undefined;''',
    '''              const itemHasResponse =
                itemResponseType(item) === "text"
                  ? Boolean(textAnswers[key]?.trim())
                  : answers[key] !== undefined;
              const itemComplete =
                !itemRequired(item) || itemHasResponse;''',
)

replace_exact(
    generic,
    "aria-invalid={submitAttempted && !itemAnswered}",
    "aria-invalid={submitAttempted && !itemComplete}",
)
replace_exact(
    generic,
    "submitAttempted && !itemAnswered\n",
    "submitAttempted && !itemComplete\n",
    expected=2,
)
replace_exact(generic, ": itemAnswered\n", ": itemHasResponse\n")

replace_exact(
    generic,
    '''                        aria-label={`Resposta aberta: ${itemText(item)}`}
                        onChange={(event) => {''',
    '''                        aria-label={`Resposta aberta: ${itemText(item)}`}
                        aria-required={itemRequired(item)}
                        onChange={(event) => {''',
)

replace_exact(
    generic,
    '''                        onValueChange={(val) => {
                          softTick();
                          haptic.select();
                          setAnswers((current) => ({
                            ...current,
                            [key]: Number.parseInt(val, 10),
                          }));
                        }}''',
    '''                        onValueChange={(val) => {
                          const selectedIndex = Number.parseInt(val, 10);
                          softTick();
                          haptic.select();
                          setAnswers((current) => ({
                            ...current,
                            [key]: selectedIndex,
                          }));
                          if (
                            itemSentinel(item)?.positiveOptionIndexes.includes(
                              selectedIndex,
                            )
                          ) {
                            softTap();
                            haptic.notify();
                            setShowSafetyGate(true);
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }
                        }}''',
)

qualitative = {
    "client/src/data/interactiveScaleItemsIpnTdahFeAnamnesis.ts": 18,
    "client/src/data/interactiveScaleItemsIpnTdahFeDifferentials.ts": 20,
    "client/src/data/interactiveScaleItemsIpnTdahFeSynthesis.ts": 15,
}
for path, expected in qualitative.items():
    file = Path(path)
    text = file.read_text(encoding="utf-8")
    marker = '"responseType": "text",'
    count = text.count(marker)
    if count != expected:
        raise SystemExit(
            f"{path}: esperado {expected} campos textuais, encontrado {count}"
        )
    if '"required": false' in text:
        raise SystemExit(
            f"{path}: required=false já presente; abortando para evitar duplicação"
        )
    text = text.replace(marker, marker + '\n        "required": false,')
    file.write_text(text, encoding="utf-8")

workflow = Path(".github/workflows/scale-pdf-contract.yml")
workflow_text = workflow.read_text(encoding="utf-8")
registry_line = '      - "client/src/data/generatedScalePdfRegistry.ts"\n'
if workflow_text.count(registry_line) != 2:
    raise SystemExit("scale-pdf-contract: pontos de inserção inesperados")
baseline_line = '      - "scripts/guards/safety-classification-baseline.json"\n'
if baseline_line not in workflow_text:
    workflow_text = workflow_text.replace(
        registry_line,
        registry_line + baseline_line,
    )
workflow.write_text(workflow_text, encoding="utf-8")

test = Path("tests/clinical/test-ipn-tdah-fe-safety-filter.mjs")
test.write_text(
    r'''// @ts-check
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
  /onValueChange=\{\(val\) => \{[\s\S]*?itemSentinel\(item\)\?\.positiveOptionIndexes\.includes\([\s\S]*?setShowSafetyGate\(true\)/.test(
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
''',
    encoding="utf-8",
)
