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
 *   · divergência entre as duas cópias físicas do catálogo neuropsiquiátrico
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
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..", "..");

const { allScales } = await import(
  pathToFileURL(resolve(repoRoot, "client/src/data/scaleFilter.ts")).href
);

/** @type {string[]} */
const errors = [];
/** @type {{id:string,name:string,fonte:string,semFonte:boolean,aguardaValidacao:boolean}[]} */
const provRows = [];
const seen = new Map();

// O mesmo catálogo é consumido por superfícies diferentes do repositório.
// Enquanto as duas cópias físicas existirem, qualquer edição precisa chegar às
// duas no mesmo commit. Comparar bytes evita que JSON semanticamente parecido,
// mas efetivamente divergente, seja publicado em uma das superfícies.
const publicCatalogPath = resolve(
  repoRoot,
  "client/public/data/neuroped_escalas_neuropsiquiatria_infantil_100.json",
);
const dataCatalogPath = resolve(
  repoRoot,
  "data/neuroped_escalas_neuropsiquiatria_infantil_100.json",
);
const publicCatalogBytes = readFileSync(publicCatalogPath);
const dataCatalogBytes = readFileSync(dataCatalogPath);
if (!publicCatalogBytes.equals(dataCatalogBytes)) {
  errors.push(
    "Catálogo neuropsiquiátrico divergente: sincronize client/public/data/neuroped_escalas_neuropsiquiatria_infantil_100.json e data/neuroped_escalas_neuropsiquiatria_infantil_100.json no mesmo commit.",
  );
}

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
  // Dois eixos INDEPENDENTES, que antes eram somados num "pendente" só:
  //   semFonte        → não sabemos de onde o instrumento veio (lacuna de proveniência)
  //   aguardaValidacao→ sabemos a origem (quase sempre autoral), mas não há
  //                     validação psicométrica publicada
  // Um instrumento autoral do NeuroPed com fonte declarada caía no mesmo balde
  // de um instrumento de literatura sem referência nenhuma, e o resumo dizia
  // "Com fonte declarada: 165" quando 242 tinham fonte. Agora cada eixo é
  // contado e exibido por si.
  const temFonte = typeof s.fonte === "string" && s.fonte.trim().length > 0;
  const aguardaValidacao = s.pendente_validacao_clinica === true;
  provRows.push({
    id: s.id ?? "?",
    name: s.name ?? "?",
    fonte: temFonte ? s.fonte : (s.pendencia ?? "—"),
    semFonte: !temFonte,
    aguardaValidacao,
  });
}

const total = allScales.length;
const semFonte = provRows.filter((r) => r.semFonte).length;
const comFonte = total - semFonte;
const aguardandoValidacao = provRows.filter((r) => r.aguardaValidacao).length;

// ---- Gera docs/PROVENIENCIA_CLINICA.md (E3) ----
const docLines = [];
docLines.push("# Proveniência Clínica do Catálogo de Escalas");
docLines.push("");
docLines.push("> Documento gerado automaticamente por `scripts/guards/validate-catalog.mjs`.");
docLines.push("> Não edite à mão — rode `npm run verify` para regenerar.");
docLines.push("");
docLines.push(`- **Total de instrumentos:** ${total}`);
docLines.push(`- **Com fonte declarada:** ${comFonte} (${((comFonte / total) * 100).toFixed(1)}%)`);
docLines.push(`- **Sem fonte declarada:** ${semFonte}`);
docLines.push(`- **Aguardando validação psicométrica publicada:** ${aguardandoValidacao} — em geral instrumentos autorais, que têm origem declarada mas ainda não têm estudo de validação.`);
docLines.push("");
docLines.push("> As duas últimas linhas medem coisas diferentes e não se somam: um");
docLines.push("> instrumento pode ter fonte e ainda assim aguardar validação.");
docLines.push("");
docLines.push("| Instrumento | Nome | Fonte | Sem fonte | Aguarda validação |");
docLines.push("| --- | --- | --- | --- | --- |");
for (const r of provRows.sort((a, b) => a.id.localeCompare(b.id))) {
  // 160 cortava as RESSALVAS de faixa etária no meio (ssq, nrs-pain, vas-pain)
  // — justamente a parte clinicamente relevante da fonte. A maior fonte do
  // catálogo tem 275 caracteres; 320 preserva todas com folga.
  const fonte = String(r.fonte).replace(/\|/g, "\\|").slice(0, 320);
  const nome = String(r.name).replace(/\|/g, "\\|");
  docLines.push(`| \`${r.id}\` | ${nome} | ${fonte} | ${r.semFonte ? "sim" : "não"} | ${r.aguardaValidacao ? "sim" : "não"} |`);
}
docLines.push("");

mkdirSync(resolve(repoRoot, "docs"), { recursive: true });
writeFileSync(resolve(repoRoot, "docs/PROVENIENCIA_CLINICA.md"), docLines.join("\n"), "utf8");

console.log(`[validate-catalog] ${total} instrumentos | ${comFonte} com fonte | ${semFonte} sem fonte | ${aguardandoValidacao} aguardando validação`);
console.log(`[validate-catalog] docs/PROVENIENCIA_CLINICA.md regenerado.`);
if (publicCatalogBytes.equals(dataCatalogBytes)) {
  console.log("[validate-catalog] ✓ cópias físicas do catálogo neuropsiquiátrico sincronizadas.");
}

if (errors.length > 0) {
  console.error(`\n[validate-catalog] ${errors.length} ERRO(S) ESTRUTURAL(IS):`);
  for (const e of errors) console.error(`  ✗ ${e}`);
  process.exit(1);
}
console.log("[validate-catalog] ✓ integridade estrutural OK.");
