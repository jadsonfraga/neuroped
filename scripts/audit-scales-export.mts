// ============================================================
// Exportador de AUDITORIA das escalas com itens interativos (autorais e publicadas).
// Junta metadados (escalasAutorais.ts + scaleFilter.ts) + itens interativos
// (interactiveScaleItems.ts) e as escalas do motor runner (interactiveScales.ts,
// itens com opções próprias e faixas por pontos) e emite:
//   1) docs/audit/escalas-autorais-auditoria.md  (leitura/revisão)
//   2) docs/audit/escalas-autorais-itens.csv      (edição item a item)
//   3) docs/audit/escalas-autorais-faixas.csv     (revisão dos cortes)
// Uso:  npm run audit:scales:export   (ou: npx tsx scripts/audit-scales-export.mts)
// NÃO altera nenhum dado de produção — só lê e exporta.
// ============================================================
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { escalasAutoraisDrJadson } from "../client/src/data/escalasAutorais.ts";
import { allScalesComFichas as escalasCatalogoMestre } from "../client/src/data/scaleFilter.ts";
import { interactiveScaleItems } from "../client/src/data/interactiveScaleItems.ts";
import { interactiveScales } from "../client/src/data/interactiveScales.ts";

const OUT = resolve(process.cwd(), "docs/audit");
mkdirSync(OUT, { recursive: true });

// Autorais prevalecem; as demais (publicadas, importadas, complementares) vêm do
// catálogo agregado de scaleFilter.ts (allScalesComFichas, antes do filtro de aplicabilidade).
const byId = new Map<string, any>([
  ...escalasCatalogoMestre.map((s) => [s.id, s] as const),
  ...escalasAutoraisDrJadson.map((s) => [s.id, s] as const),
]);

// CSV helper (escapa aspas/; e quebras de linha)
const cell = (v: unknown) => {
  const s = String(v ?? "");
  return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const row = (cols: unknown[]) => cols.map(cell).join(";");

const ids = Object.keys(interactiveScaleItems).sort((a, b) => a.localeCompare(b));
// Escalas do motor runner que não têm definição em interactiveScaleItems.
const runnerIds = Object.keys(interactiveScales)
  .filter((id) => !(id in interactiveScaleItems))
  .sort((a, b) => a.localeCompare(b));

const DIRECAO: Record<string, string> = { higher_worse: "maior = pior", higher_better: "maior = melhor" };

const md: string[] = [];
const itemRows: string[] = [
  row(["id", "escala", "faixa_idade", "dominio", "n_item", "texto_item", "APROVAR? (s/n)", "TEXTO_CORRIGIDO"]),
];
const bandRows: string[] = [
  row(["id", "escala", "direcao_escore", "minPct", "classificacao", "cor", "descricao", "APROVAR? (s/n)", "faixa_pontos"]),
];

md.push("# Auditoria — Escalas com itens interativos (autorais e publicadas)\n");
md.push(`> Gerado em ${new Date().toISOString().slice(0, 10)} a partir do código-fonte.`);
md.push("> **Conteúdo gerado por IA — requer validação clínica antes de qualquer uso.**");
md.push(
  `> Total: **${ids.length + runnerIds.length} escalas** com itens interativos (${ids.length} com faixas em % do máximo e ${runnerIds.length} do motor runner, com faixas por pontos).\n`,
);
md.push("Para cada escala: confira os **itens**, as **opções de resposta** e as **faixas de corte**.");
md.push("Marque na planilha `escalas-autorais-itens.csv` o que aprova/corrige.\n");
md.push("---\n");

let semMeta = 0;
let itemSemTexto = 0;
for (const id of ids) {
  const def = interactiveScaleItems[id];
  const meta = byId.get(id);
  if (!meta) semMeta++;
  const nome = meta?.name ?? `(sem metadados) ${id}`;
  const faixa = meta ? `${meta.ageMin}–${meta.ageMax} meses` : "?";
  const nItems = def.domains.reduce((s, d) => s + d.items.length, 0);
  const direcao = DIRECAO[def.scoreDirection ?? ""] ?? "não declarada";

  md.push(`## ${id} — ${nome}`);
  if (meta) {
    md.push(`- **Nome completo:** ${meta.fullName}`);
    md.push(`- **Faixa etária:** ${faixa}  |  **Respondente:** ${(meta.respondente ?? []).join(", ")}  |  **Tempo:** ${meta.tempo ?? "?"}`);
    md.push(`- **Descrição:** ${meta.description ?? "—"}`);
  }
  md.push(`- **Opções de resposta:** ${def.labels.map((l, i) => `\`${i}=${l}\``).join("  ")}`);
  md.push(`- **Itens:** ${nItems}  |  **Domínios:** ${def.domains.length}  |  **Direção do escore:** ${direcao}\n`);

  def.domains.forEach((d, di) => {
    if (def.domains.length > 1) md.push(`### Domínio: ${d.name}`);
    d.items.forEach((it, ii) => {
      // Itens podem ser texto simples ou objeto { text, emoji?, example?, ... }.
      const texto = typeof it === "string" ? it : it.text;
      if (!texto?.trim()) itemSemTexto++;
      md.push(`${ii + 1}. ${texto}`);
      itemRows.push(row([id, nome, faixa, d.name, ii + 1, texto, "", ""]));
    });
    md.push("");
  });

  md.push(`**Faixas de interpretação** (${def.totalLabel ?? "escore total"}):\n`);
  md.push("| ≥ % do máx. | Classificação | Cor | Descrição |");
  md.push("| ---: | --- | --- | --- |");
  for (const b of def.bands) {
    md.push(`| ${b.minPct}% | ${b.classification} | ${b.color} | ${b.description} |`);
    bandRows.push(row([id, nome, direcao, b.minPct, b.classification, b.color, b.description, "", ""]));
  }
  md.push("\n---\n");
}

// Motor runner: cada item tem as próprias opções; faixas são por pontos (min–max).
for (const id of runnerIds) {
  const def = interactiveScales[id];
  const nome = def.name;
  const faixa = def.ageLabel;
  md.push(`## ${id} — ${nome}`);
  md.push(`- **Nome completo:** ${def.fullName}`);
  md.push(`- **Faixa etária:** ${faixa}  |  **Respondente:** ${def.respondent}`);
  md.push(`- **Itens:** ${def.items.length}  |  **Motor:** runner (opções por item, faixas por pontos)\n`);
  def.items.forEach((it, ii) => {
    if (!it.text?.trim()) itemSemTexto++;
    md.push(`${ii + 1}. ${it.text}`);
    md.push(`   - Opções: ${it.options.map((o) => `\`${o.value}=${o.label}\``).join("  ")}`);
    itemRows.push(row([id, nome, faixa, "", ii + 1, it.text, "", ""]));
  });
  md.push("");
  md.push("**Faixas de interpretação** (pontos):\n");
  md.push("| Pontos | Classificação | Tom | Descrição |");
  md.push("| ---: | --- | --- | --- |");
  for (const b of def.bands) {
    md.push(`| ${b.min}–${b.max} | ${b.risk} | ${b.tone} | ${b.description} |`);
    bandRows.push(row([id, nome, "faixa por pontos", "", b.risk, b.tone, b.description, "", `${b.min}–${b.max}`]));
  }
  md.push("\n---\n");
}

writeFileSync(resolve(OUT, "escalas-autorais-auditoria.md"), md.join("\n"), "utf8");
writeFileSync(resolve(OUT, "escalas-autorais-itens.csv"), "﻿" + itemRows.join("\n"), "utf8");
writeFileSync(resolve(OUT, "escalas-autorais-faixas.csv"), "﻿" + bandRows.join("\n"), "utf8");

console.log(`OK — ${ids.length + runnerIds.length} escalas exportadas para ${OUT} (${runnerIds.length} do motor runner)`);
console.log(`  • escalas-autorais-auditoria.md  (${md.length} linhas)`);
console.log(`  • escalas-autorais-itens.csv     (${itemRows.length - 1} itens)`);
console.log(`  • escalas-autorais-faixas.csv    (${bandRows.length - 1} faixas)`);
if (semMeta) {
  console.error(`  ⚠ ${semMeta} escala(s) com itens mas SEM metadados (escalasAutorais.ts nem scaleFilter.ts).`);
  process.exitCode = 1; // metadado ausente passa a falhar o export
}
if (itemSemTexto) {
  console.error(`  ⚠ ${itemSemTexto} item(ns) sem texto exportável.`);
  process.exitCode = 1;
}
