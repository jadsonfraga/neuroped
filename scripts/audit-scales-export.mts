// ============================================================
// Exportador de AUDITORIA das escalas com itens interativos.
// Junta metadados (escalasAutorais.ts + catálogo de scaleFilter.ts) + itens
// interativos (interactiveScaleItems.ts) por id e emite:
//   1) docs/audit/escalas-autorais-auditoria.md  (leitura/revisão)
//   2) docs/audit/escalas-autorais-itens.csv      (edição item a item)
//   3) docs/audit/escalas-autorais-faixas.csv     (revisão dos cortes)
// Os nomes dos arquivos são históricos: o conteúdo cobre todas as escalas com
// itens interativos (autorais NEXUS, instrumentos publicados e demais catálogos).
// Uso:  npm run audit:scales:export   (ou: npx tsx scripts/audit-scales-export.mts)
// NEUROPED_GENERATION_DATE (AAAA-MM-DD, opcional) fixa a data do cabeçalho.
// NÃO altera nenhum dado de produção — só lê e exporta. Exporta apenas o que
// está declarado no código: nada é inferido ou completado.
// ============================================================
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { escalasAutoraisDrJadson } from "../client/src/data/escalasAutorais.ts";
import { allScalesComFichas as escalasCatalogoMestre, scales as instrumentosPublicados, type ScaleEntry } from "../client/src/data/scaleFilter.ts";
import { interactiveScaleItems, type InteractiveScaleDef } from "../client/src/data/interactiveScaleItems.ts";
import { itemExample, itemReversed, itemResponseType, itemSentinel, itemText, type ScaleItem } from "../client/src/components/GenericScale.tsx";

const OUT = resolve(process.cwd(), "docs/audit");
mkdirSync(OUT, { recursive: true });

// Autorais prevalecem; as demais (publicadas, importadas, complementares) vêm do
// catálogo agregado de scaleFilter.ts (allScalesComFichas, antes do filtro de aplicabilidade).
const byId = new Map<string, ScaleEntry>([
  ...escalasCatalogoMestre.map((s) => [s.id, s] as const),
  ...escalasAutoraisDrJadson.map((s) => [s.id, s] as const),
]);
const autorais = new Set(escalasAutoraisDrJadson.map((s) => s.id));
const publicados = new Set(instrumentosPublicados.map((s) => s.id));

// CSV helper (escapa aspas/; e quebras de linha)
const cell = (v: unknown) => {
  const s = String(v ?? "");
  return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const row = (cols: unknown[]) => cols.map(cell).join(";");

/** Direção declarada na definição; ausente fica explícito, sem supor. */
const DIRECAO: Record<string, string> = { higher_worse: "maior=pior", higher_better: "maior=melhor" };
const direcao = (def: InteractiveScaleDef) => (def.scoreDirection ? DIRECAO[def.scoreDirection] : "não declarada");
/** Como o resultado é interpretado no app: faixas por %, corte oficial por domínio ou só descritivo. */
const interpretacao = (def: InteractiveScaleDef) =>
  def.descriptiveDomainSummary
    ? "descritiva (sem ponto de corte; soma e média por domínio)"
    : def.domainCutoff
      ? `corte oficial por domínio (escore ≥ ${def.domainCutoff.minScore}: ${def.domainCutoff.positive.classification}; abaixo: ${def.domainCutoff.negative.classification})`
      : "faixas por % do escore máximo";
/** Opções com a pontuação efetivamente usada (optionPoints; padrão = índice). */
const opcoes = (labels: string[], points?: number[]) => labels.map((l, i) => `${points?.[i] ?? i}=${l}`);
/** Opções próprias do item (substituem as da escala), quando houver. */
const opcoesProprias = (item: ScaleItem): string[] =>
  typeof item !== "string" && item.responseType !== "text" && item.options?.length ? opcoes(item.options, item.optionPoints) : [];
const sentinela = (item: ScaleItem, labels: string[]) => {
  const s = itemSentinel(item);
  if (!s) return "";
  const own = typeof item !== "string" && item.responseType !== "text" && item.options?.length ? item.options : labels;
  return `${s.label} (se resposta: ${s.positiveOptionIndexes.map((i) => own[i] ?? `opção ${i}`).join(" / ")})`;
};

const ids = Object.keys(interactiveScaleItems).sort((a, b) => a.localeCompare(b));
const nAutorais = ids.filter((id) => autorais.has(id)).length;
const nPublicados = ids.filter((id) => !autorais.has(id) && publicados.has(id)).length;

const md: string[] = [];
const itemRows: string[] = [
  row(["id", "escala", "faixa_idade", "dominio", "n_item", "texto_item", "tipo_resposta", "invertido", "opcoes_proprias", "sentinela", "exemplo", "APROVAR? (s/n)", "TEXTO_CORRIGIDO"]),
];
const bandRows: string[] = [
  row(["id", "escala", "direcao_escore", "interpretacao", "minPct", "classificacao", "cor", "descricao", "APROVAR? (s/n)"]),
];

const geradoEm = process.env.NEUROPED_GENERATION_DATE || new Date().toISOString().slice(0, 10);
md.push("# Auditoria — Escalas com itens interativos (NeuroPed)\n");
md.push(`> Gerado em ${geradoEm} a partir do código-fonte.`);
md.push("> **Conteúdo gerado por IA — requer validação clínica antes de qualquer uso.**");
md.push(`> Total: **${ids.length} escalas** com itens interativos: ${nAutorais} autorais NEXUS, ${nPublicados} instrumentos publicados e ${ids.length - nAutorais - nPublicados} de outros catálogos.\n`);
md.push("Para cada escala: confira os **itens**, as **opções de resposta** (com a pontuação usada), a **direção do escore** e as **faixas de corte**.");
md.push("Marcadores nos itens: _invertido_ (pontuação espelhada), _resposta livre_ (texto, não pontua), _opções próprias_ (substituem as da escala), _sentinela_ (alerta de segurança). O exemplo é o texto mostrado à família.");
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

  md.push(`## ${id} — ${nome}`);
  if (meta) {
    md.push(`- **Nome completo:** ${meta.fullName}`);
    md.push(`- **Faixa etária:** ${faixa}  |  **Respondente:** ${(meta.respondente ?? []).join(", ")}  |  **Tempo:** ${meta.tempo ?? "?"}`);
    md.push(`- **Descrição:** ${meta.description ?? "—"}`);
  }
  md.push(`- **Opções de resposta (pontos=rótulo):** ${opcoes(def.labels, def.optionPoints).map((o) => `\`${o}\``).join("  ")}`);
  md.push(`- **Direção do escore:** ${direcao(def)}  |  **Interpretação:** ${interpretacao(def)}`);
  md.push(`- **Itens:** ${nItems}  |  **Domínios:** ${def.domains.length}\n`);

  def.domains.forEach((d) => {
    if (def.domains.length > 1) md.push(`### Domínio: ${d.name}`);
    d.items.forEach((item, ii) => {
      const texto = itemText(item);
      if (!texto?.trim()) itemSemTexto++;
      const livre = itemResponseType(item) === "text";
      const invertido = itemReversed(item);
      const proprias = opcoesProprias(item);
      const alerta = sentinela(item, def.labels);
      const exemplo = itemExample(item) ?? "";
      const marcas = [invertido && "_invertido_", livre && "_resposta livre_", proprias.length && `_opções próprias: ${proprias.join("; ")}_`, alerta && `_sentinela: ${alerta}_`].filter(Boolean);
      md.push(`${ii + 1}. ${texto}${marcas.length ? ` — ${marcas.join(" · ")}` : ""}`);
      if (exemplo) md.push(`   - Exemplo: ${exemplo}`);
      itemRows.push(row([id, nome, faixa, d.name, ii + 1, texto, livre ? "texto" : "escolha", invertido ? "s" : "n", proprias.join(" | "), alerta, exemplo, "", ""]));
    });
    md.push("");
  });

  md.push(`**Faixas de interpretação** (${def.totalLabel ?? "escore total"}; direção: ${direcao(def)}):\n`);
  md.push("| ≥ % do máx. | Classificação | Cor | Descrição |");
  md.push("| ---: | --- | --- | --- |");
  for (const b of def.bands) {
    md.push(`| ${b.minPct}% | ${b.classification} | ${b.color} | ${b.description} |`);
    bandRows.push(row([id, nome, direcao(def), interpretacao(def), b.minPct, b.classification, b.color, b.description, ""]));
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
if (semMeta) {
  console.error(`  ⚠ ${semMeta} escala(s) com itens mas SEM metadados (escalasAutorais.ts nem scaleFilter.ts).`);
  process.exitCode = 1; // metadado ausente passa a falhar o export
}
if (itemSemTexto) {
  console.error(`  ⚠ ${itemSemTexto} item(ns) sem texto exportável.`);
  process.exitCode = 1;
}
