/*
 * ingest-authorial-scale.mts — portão de conferência de instrumento autoral.
 *
 * Uso:
 *   node --import tsx scripts/ingest-authorial-scale.mts <candidato.json> [--source-file <arquivo-fonte>]
 *
 * O candidato é o JSON que o autor produz A PARTIR da fonte integral. Este
 * script não extrai, não completa e não adivinha item nenhum: ele confere a
 * contagem, os domínios, a fonte e o formato, e recusa o que não bater.
 *
 * Passar aqui não promove o instrumento ao catálogo. A promoção continua sendo
 * edição revisada, e é isso que mantém a distinção entre "o autor conferiu com
 * a fonte" e "alguém preencheu de memória".
 */
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { pendingAuthorialScaleIntakes } from "../client/src/data/pendingAuthorialScaleIntake";
import {
  validateAuthorialIntake,
  type AuthorialIntakeCandidate,
} from "../shared/authorialIntake";

function fail(message: string): never {
  console.error(`✖ ${message}`);
  process.exit(1);
}

const args = process.argv.slice(2);
const candidatePath = args.find((arg) => !arg.startsWith("--"));
if (!candidatePath) {
  fail("informe o caminho do JSON candidato: node --import tsx scripts/ingest-authorial-scale.mts <candidato.json>");
}

const sourceFileIndex = args.indexOf("--source-file");
const sourceFile = sourceFileIndex >= 0 ? args[sourceFileIndex + 1] : null;

let candidate: AuthorialIntakeCandidate;
try {
  candidate = JSON.parse(readFileSync(candidatePath, "utf8")) as AuthorialIntakeCandidate;
} catch (error) {
  fail(`não foi possível ler o candidato: ${(error as Error).message}`);
}

const expectation = pendingAuthorialScaleIntakes.find((item) => item.id === candidate.id);
if (!expectation) {
  fail(
    `id ${JSON.stringify(candidate.id)} não está entre os instrumentos aguardando fonte: ` +
      pendingAuthorialScaleIntakes.map((item) => item.id).join(", "),
  );
}

// Quando o arquivo-fonte é informado, o hash é recalculado aqui. Um digest
// declarado à mão prova apenas que alguém digitou 64 caracteres.
if (sourceFile) {
  const digest = createHash("sha256").update(readFileSync(sourceFile)).digest("hex");
  if (digest !== candidate.sourceSha256) {
    fail(
      `o SHA-256 do arquivo informado não confere com o declarado.\n` +
        `  arquivo:   ${digest}\n  candidato: ${candidate.sourceSha256}`,
    );
  }
  console.log(`✓ fonte conferida: ${sourceFile} (sha256 ${digest})`);
} else {
  console.log("• arquivo-fonte não informado: o SHA-256 declarado não foi recalculado (use --source-file)");
}

const result = validateAuthorialIntake(candidate, expectation);
if (!result.ok) {
  console.error(`\n✖ ${expectation.title}`);
  console.error(`  candidato recusado — ${result.errors.length} problema(s):\n`);
  for (const error of result.errors) console.error(`  · ${error}`);
  console.error("\n  Nenhum item foi aceito. Corrija a extração contra a fonte integral e repita.");
  process.exit(1);
}

console.log(`\n✓ ${expectation.title}`);
console.log(`  ${result.itemCount} itens em ${candidate.domains.length} domínios, conforme o esperado.`);
console.log(`  fonte: ${candidate.source} · versão ${candidate.version}`);
console.log("\nPróximo passo, feito por pessoa e revisado:");
console.log("  1. acrescentar o instrumento a client/src/data/recoveredAuthorialMonitors.ts");
console.log(`  2. remover ${candidate.id} de client/src/data/pendingAuthorialScaleIntake.ts`);
console.log("  3. registrar contagem e hash dos itens em tests/unit/recovered-authorials.test.ts");
console.log("  4. rodar: npm run test:clinical && npm run validate:catalog");
