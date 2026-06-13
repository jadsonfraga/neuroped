// Classifica as 257 escalas autorais para triagem de curadoria.
// Não altera nada — só lê e imprime um quadro de decisão.
import { escalasAutoraisDrJadson } from "../client/src/data/escalasAutorais.ts";
import { interactiveScaleItems } from "../client/src/data/interactiveScaleItems.ts";

const byId = new Map(escalasAutoraisDrJadson.map((s) => [s.id, s]));
const ids = Object.keys(interactiveScaleItems);

// Domínios de ALTO risco clínico: cutoff autoral pode induzir conduta errada
// ou sugerir validação que não existe.
const HIGH_RISK = new Set([
  "suicidio", "psicose", "epilepsia", "depressao", "dor",
]);
// Domínios de risco MÉDIO: escalas de sintoma/severidade (triagem qualitativa).
const MED_RISK = new Set([
  "tdah", "ansiedade", "comportamento", "sono", "tiques", "alimentacao", "tea",
]);

// Identidade da faixa: marcos do desenvolvimento (maior=melhor, qualitativo)
// é o tipo mais defensável como checklist autoral.
function bandKind(id: string): string {
  const def = interactiveScaleItems[id];
  const first = def.bands[0]?.classification ?? "";
  if (/adequado para a idade|marcos|desenvolvimento adequado/i.test(first)) return "MARCOS";
  if (/intensidade/i.test(first)) return "SEVERIDADE";
  return "CUSTOM";
}

type Risk = "ALTO" | "MEDIO" | "BAIXO";
function riskOf(id: string): Risk {
  const meta = byId.get(id);
  const qs = meta?.queixas ?? [];
  if (qs.some((q) => HIGH_RISK.has(q))) return "ALTO";
  if (qs.some((q) => MED_RISK.has(q))) return "MEDIO";
  return "BAIXO";
}

const rows = ids.map((id) => {
  const m = byId.get(id);
  const def = interactiveScaleItems[id];
  const nItems = def.domains.reduce((s, d) => s + d.items.length, 0);
  return {
    id,
    risco: riskOf(id),
    faixa: bandKind(id),
    queixas: (m?.queixas ?? []).join("|"),
    idade: m ? `${m.ageMin}-${m.ageMax}m` : "?",
    nItems,
    nome: (m?.name ?? id).replace(/^Protocolo Dr\. Jadson — /, "").replace(/\s*\(J26-\d+\)$/, ""),
  };
});

// Resumo agregado
const tally = (key: (r: typeof rows[number]) => string) => {
  const m = new Map<string, number>();
  for (const r of rows) m.set(key(r), (m.get(key(r)) ?? 0) + 1);
  return [...m.entries()].sort((a, b) => b[1] - a[1]);
};

console.log("=== POR RISCO ===");
for (const [k, n] of tally((r) => r.risco)) console.log(`  ${k.padEnd(7)} ${n}`);
console.log("=== POR TIPO DE FAIXA ===");
for (const [k, n] of tally((r) => r.faixa)) console.log(`  ${k.padEnd(10)} ${n}`);
console.log("=== CRUZAMENTO risco × faixa ===");
for (const [k, n] of tally((r) => `${r.risco} / ${r.faixa}`)) console.log(`  ${k.padEnd(20)} ${n}`);
console.log("=== POR QUEIXA PRIMÁRIA ===");
for (const [k, n] of tally((r) => (byId.get(r.id)?.queixas?.[0] ?? "?"))) console.log(`  ${k.padEnd(16)} ${n}`);

// Candidatas BAIXO+MARCOS (mais defensáveis) e ALTO (mais perigosas)
const seguras = rows.filter((r) => r.risco === "BAIXO" && r.faixa === "MARCOS");
const perigosas = rows.filter((r) => r.risco === "ALTO");
console.log(`\n=== "Mais seguras" (BAIXO risco + MARCOS): ${seguras.length} ===`);
console.log(`=== "Mais sensíveis" (ALTO risco): ${perigosas.length} ===`);
for (const r of perigosas) console.log(`  ${r.id}  [${r.queixas}]  ${r.nome}`);
