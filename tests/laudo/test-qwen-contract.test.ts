import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  parseQwenJsonText,
  parseQwenLaudoDraft,
  qwenDraftToSuperEntrada,
} from "../../client/src/lib/laudo/qwenContract";

let passed = 0;
let failed = 0;
function assert(condition: boolean, description: string) {
  if (condition) {
    passed += 1;
    console.log(`  ✓ ${description}`);
  } else {
    failed += 1;
    console.error(`  ✗ FALHOU: ${description}`);
  }
}
function throws(fn: () => unknown, description: string) {
  try {
    fn();
    failed += 1;
    console.error(`  ✗ FALHOU: ${description}`);
  } catch {
    passed += 1;
    console.log(`  ✓ ${description}`);
  }
}

const examplePath = resolve(
  process.cwd(),
  "docs/qwen-pant/EXEMPLO_SINTETICO.json",
);
const exampleText = readFileSync(examplePath, "utf8");
const parsed = parseQwenJsonText(exampleText);

console.log("\n=== Contrato Qwen/PANT ===\n");
assert(
  parsed.entrada.nome === "CASO-SINTETICO-001",
  "preserva o identificador sintético",
);
assert(
  parsed.entrada.historiaSubsecoes.length === 1,
  "mapeia subseções da história",
);
assert(parsed.entrada.hipoteses.length === 1, "mapeia hipóteses em avaliação");
assert(
  parsed.entrada.cids[0]?.status === "pending_code_validation",
  "preserva status de CID pendente",
);
assert(parsed.canPreview, "permite prévia para rascunho válido");
assert(!parsed.canExport, "bloqueia exportação quando CIDs estão ausentes");
assert(
  parsed.warnings.some((warning) => warning.includes("CIDs ausentes")),
  "expõe aviso de CIDs ausentes",
);
assert(
  parsed.warnings.some((warning) =>
    warning.includes("sections.section_08.diagnoses"),
  ),
  "expõe pendência clínica do JSON",
);

const draft = parseQwenLaudoDraft(JSON.parse(exampleText));
const converted = qwenDraftToSuperEntrada(draft);
assert(
  converted.entrada.nome === draft.case_metadata.patient_label,
  "converte metadata para SuperEntrada",
);
assert(
  converted.entrada.cidade === "Petrolina/PE",
  "converte local sem alterar texto",
);
assert(
  converted.entrada.condutaFarmaco === "Não informado.",
  "não inventa conduta farmacológica",
);

const wrongVersion = JSON.parse(exampleText);
wrongVersion.schema_version = "outro-schema";
throws(
  () => parseQwenLaudoDraft(wrongVersion),
  "rejeita schema_version incompatível",
);

const wrongStatus = JSON.parse(exampleText);
wrongStatus.document_status = "issued";
throws(
  () => parseQwenLaudoDraft(wrongStatus),
  "rejeita documento emitido pelo Qwen",
);

console.log(`\nResultado: ${passed} aprovadas, ${failed} falhas\n`);
process.exit(failed > 0 ? 1 : 0);
