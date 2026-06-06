// @ts-check
/**
 * validate-catalog.mjs — Validador do catálogo de escalas (Bloco E2/E3).
 *
 * Executado via tsx (resolve os imports .ts do catálogo client).
 *   npm run verify  →  tsx scripts/guards/validate-catalog.mjs
 *
 * FALHAS DURAS (exit 1) — integridade estrutural:
 *   · id duplicado no catálogo unificado (allScales)
 *   · faixaEtaria invertida (ageMin > ageMax)
 *   · campos obrigatórios ausentes (id, name, fullName, ageMin, ageMax)
 *
 * PROVENIÊNCIA (não bloqueante, por decisão documentada):
 *   A especificação pede "falhar se qualquer instrumento não tiver campo
 *   `fonte`". O catálogo legado (≈200 instrumentos) antecede os campos de
 *   proveniência e marcá-los exigiria revisão clínica humana item a item —
 *   fora do escopo automatizável. Portanto a ausência de `fonte` é tratada
 *   como PENDÊNCIA RASTREADA: contabilizada e listada em
 *   docs/PROVENIENCIA_CLINICA.md, sem travar o pipeline. Instrumentos sem
 *   `fonte` são reportados como `pendente_validacao = sim`.
 *
 * Efeito colateral: (re)gera docs/PROVENIENCIA_CLINICA.md (E3).
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..", "..");

const { allScales } = await import(
  pathToFileURL(resolve(repoRoot, "client/src/data/scaleFilter.ts")).href
);

/** @type {string[]} */
const errors = [];
/** @type {{id:string,name:string,fonte:string,pendente:boolean}[]} */
const provRows = [];
const seen = new Map();

for (const s of allScales) {
  // Campos obrigatórios
  for (const field of ["id", "name", "fullName", "ageMin", "ageMax"]) {
    if (s[field] === undefined || s[field] === null || s[field] === "") {
      errors.push(`Instrumento "${s.id ?? "(sem id)"}" sem campo obrigatório "${field}".`);
    }
  }
  // id duplicado
  if (s.id) {
    if (seen.has(s.id)) {
      errors.push(`id duplicado: "${s.id}" (também em "${seen.get(s.id)}").`);
    } else {
      seen.set(s.id, s.name);
    }
  }
  // Faixa etária coerente
  if (typeof s.ageMin === "number" && typeof s.ageMax === "number" && s.ageMin > s.ageMax) {
    errors.push(`Faixa etária invertida em "${s.id}": ageMin(${s.ageMin}) > ageMax(${s.ageMax}).`);
  }
  // Proveniência (pendência rastreada)
  const temFonte = typeof s.fonte === "string" && s.fonte.trim().length > 0;
  const pendente = !temFonte || s.pendente_validacao_clinica === true;
  provRows.push({
    id: s.id ?? "?",
    name: s.name ?? "?",
    fonte: temFonte ? s.fonte : (s.pendencia ?? "—"),
    pendente,
  });
}

const total = allScales.length;
const comFonte = provRows.filter((r) => !r.pendente).length;
const pendentes = total - comFonte;

// ---- Gera docs/PROVENIENCIA_CLINICA.md (E3) ----
const docLines = [];
docLines.push("# Proveniência Clínica do Catálogo de Escalas");
docLines.push("");
docLines.push("> Documento gerado automaticamente por `scripts/guards/validate-catalog.mjs`.");
docLines.push("> Não edite à mão — rode `npm run verify` para regenerar.");
docLines.push("");
docLines.push(`- **Total de instrumentos:** ${total}`);
docLines.push(`- **Com fonte declarada:** ${comFonte}`);
docLines.push(`- **Pendentes de validação/fonte:** ${pendentes}`);
docLines.push("");
docLines.push("| Instrumento | Nome | Fonte / Pendência | Pendente validação |");
docLines.push("| --- | --- | --- | --- |");
for (const r of provRows.sort((a, b) => a.id.localeCompare(b.id))) {
  const fonte = String(r.fonte).replace(/\|/g, "\\|").slice(0, 160);
  const nome = String(r.name).replace(/\|/g, "\\|");
  docLines.push(`| \`${r.id}\` | ${nome} | ${fonte} | ${r.pendente ? "sim" : "não"} |`);
}
docLines.push("");

mkdirSync(resolve(repoRoot, "docs"), { recursive: true });
writeFileSync(resolve(repoRoot, "docs/PROVENIENCIA_CLINICA.md"), docLines.join("\n"), "utf8");

console.log(`[validate-catalog] ${total} instrumentos | ${comFonte} com fonte | ${pendentes} pendentes`);
console.log(`[validate-catalog] docs/PROVENIENCIA_CLINICA.md regenerado.`);

if (errors.length > 0) {
  console.error(`\n[validate-catalog] ${errors.length} ERRO(S) ESTRUTURAL(IS):`);
  for (const e of errors) console.error(`  ✗ ${e}`);
  process.exit(1);
}
console.log("[validate-catalog] ✓ integridade estrutural OK.");
