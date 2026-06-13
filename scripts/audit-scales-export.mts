// ============================================================
// Exportador de AUDITORIA das escalas autorais (J26-xxx).
// Junta metadados (escalasAutorais.ts) + itens interativos
// (interactiveScaleItems.ts) por id e emite:
//   1) docs/audit/escalas-autorais-auditoria.md  (leitura/revisão)
//   2) docs/audit/escalas-autorais-itens.csv      (edição item a item)
//   3) docs/audit/escalas-autorais-faixas.csv     (revisão dos cortes)
// Uso:  npx tsx scripts/audit-scales-export.mts
// NÃO altera nenhum dado de produção — só lê e exporta.
// ============================================================
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { escalasAutoraisDrJadson } from "../client/src/data/escalasAutorais.ts";
import { interactiveScaleItems } from "../client/src/data/interactiveScaleItems.ts";

const OUT = resolve(process.cwd(), "docs/audit");
mkdirSync(OUT, { recursive: true });

const byId = new Map(escalasAutoraisDrJadson.map((s) => [s.id, s]));

// CSV helper (escapa aspas/; e quebras de linha)
const cell = (v: unknown) => {
  const s = String(v ?? "");
  return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const row = (cols: unknown[]) => cols.map(cell).join(";");

const ids = Object.keys(interactiveScaleItems).sort((a, b) => a.localeCompare(b));

const md: string[] = [];
const itemRows: string[] = [
  row(["id", "escala", "faixa_idade", "dominio", "n_item", "texto_item", "APROVAR? (s/n)", "TEXTO_CORRIGIDO"]),
];
const bandRows: string[] = [
  row(["id", "escala", "direcao_escore", "minPct", "classificacao", "cor", "descricao", "APROVAR? (s/n)"]),
];

md.push("# Auditoria — Escalas Autorais Dr. Jadson (J26-xxx)\n");
md.push(`> Gerado em ${new Date().toISOString().slice(0, 10)} a partir do código-fonte.`);
md.push("> **Conteúdo gerado por IA — requer validação clínica antes de qualquer uso.**");
md.push(`> Total: **${ids.length} escalas** com itens interativos.\n`);
md.push("Para cada escala: confira os **itens**, as **opções de resposta** e as **faixas de corte**.");
md.push("Marque na planilha `escalas-autorais-itens.csv` o que aprova/corrige.\n");
md.push("---\n");

let semMeta = 0;
for (const id of ids) {
  const def = interactiveScaleItems[id];
  const meta = byId.get(id);
  if (!meta) semMeta++;
  const nome = meta?.name ?? `(sem metadados) ${id}`;
  const faixa = meta ? `${meta.ageMin}–${meta.ageMax} meses` : "?";
  const nItems = def.domains.reduce((s, d) => s + d.items.length, 0);

  md.push(`## ${id} — ${nome}`);
  if (meta) {
    md.push(`- **Nome completo:** ${meta.fullName}`);
    md.push(`- **Faixa etária:** ${faixa}  |  **Respondente:** ${(meta.respondente ?? []).join(", ")}  |  **Tempo:** ${meta.tempo ?? "?"}`);
    md.push(`- **Descrição:** ${meta.description ?? "—"}`);
  }
  md.push(`- **Opções de resposta:** ${def.labels.map((l, i) => `\`${i}=${l}\``).join("  ")}`);
  md.push(`- **Itens:** ${nItems}  |  **Domínios:** ${def.domains.length}\n`);

  def.domains.forEach((d, di) => {
    if (def.domains.length > 1) md.push(`### Domínio: ${d.name}`);
    d.items.forEach((it, ii) => {
      md.push(`${ii + 1}. ${it}`);
      itemRows.push(row([id, nome, faixa, d.name, ii + 1, it, "", ""]));
    });
    md.push("");
  });

  md.push(`**Faixas de interpretação** (${def.totalLabel ?? "escore total"}):\n`);
  md.push("| ≥ % do máx. | Classificação | Cor | Descrição |");
  md.push("| ---: | --- | --- | --- |");
  for (const b of def.bands) {
    md.push(`| ${b.minPct}% | ${b.classification} | ${b.color} | ${b.description} |`);
    bandRows.push(row([id, nome, "maior=melhor/intenso", b.minPct, b.classification, b.color, b.description, ""]));
  }
  md.push("\n---\n");
}

writeFileSync(resolve(OUT, "escalas-autorais-auditoria.md"), md.join("\n"), "utf8");
writeFileSync(resolve(OUT, "escalas-autorais-itens.csv"), "﻿" + itemRows.join("\n"), "utf8");
writeFileSync(resolve(OUT, "escalas-autorais-faixas.csv"), "﻿" + bandRows.join("\n"), "utf8");

console.log(`OK — ${ids.length} escalas exportadas para ${OUT}`);
console.log(`  • escalas-autorais-auditoria.md  (${md.length} linhas)`);
console.log(`  • escalas-autorais-itens.csv     (${itemRows.length - 1} itens)`);
console.log(`  • escalas-autorais-faixas.csv    (${bandRows.length - 1} faixas)`);
if (semMeta) console.log(`  ⚠ ${semMeta} escala(s) com itens mas SEM metadados no catálogo autoral.`);
