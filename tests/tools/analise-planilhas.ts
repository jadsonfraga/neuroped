// Cálculo DESCRITIVO sobre as planilhas de docs/instrumentos (concordância, tempo, formas A/B).
// Devolve números; não rotula nem compara com limites. Uso: node --import tsx tests/tools/analise-planilhas.ts <arquivo.csv>
import { readFileSync } from "node:fs";

export function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let cur: string[] = []; let cell = ""; let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) { if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; } else if (c === '"') quoted = false; else cell += c; }
    else if (c === '"') quoted = true;
    else if (c === ",") { cur.push(cell); cell = ""; }
    else if (c === "\n" || c === "\r") { if (c === "\r" && text[i + 1] === "\n") i++; cur.push(cell); cell = ""; if (cur.some((x) => x !== "")) rows.push(cur); cur = []; }
    else cell += c;
  }
  if (cell !== "" || cur.length) { cur.push(cell); if (cur.some((x) => x !== "")) rows.push(cur); }
  const [header = [], ...body] = rows;
  return body.map((r) => Object.fromEntries(header.map((h, i) => [h.trim(), (r[i] ?? "").trim()])));
}

const round = (n: number, d = 3) => Math.round(n * 10 ** d) / 10 ** d;
export const median = (xs: number[]) => { if (!xs.length) return null; const s = [...xs].sort((a, b) => a - b); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };

export function agreement(rows: Record<string, string>[]) {
  const pairs = rows.filter((r) => r.resultado_aplicadora_A && r.resultado_aplicadora_B);
  const n = pairs.length;
  if (!n) return { comparados: 0, iguais: 0, percentualCoincidencia: null, kappa: null, divergentes: [] as string[] };
  const iguais = pairs.filter((r) => r.resultado_aplicadora_A === r.resultado_aplicadora_B).length;
  const cats = [...new Set(pairs.flatMap((r) => [r.resultado_aplicadora_A, r.resultado_aplicadora_B]))];
  const po = iguais / n;
  const pe = cats.reduce((s, c) => s + (pairs.filter((r) => r.resultado_aplicadora_A === c).length / n) * (pairs.filter((r) => r.resultado_aplicadora_B === c).length / n), 0);
  return {
    comparados: n, iguais, percentualCoincidencia: round(po * 100, 1),
    kappa: pe === 1 ? null : round((po - pe) / (1 - pe)),
    divergentes: pairs.filter((r) => r.resultado_aplicadora_A !== r.resultado_aplicadora_B).map((r) => `${r.sessao}:${r.id_item}`),
  };
}

export function timing(rows: Record<string, string>[]) {
  const by = new Map<string, Record<string, string>[]>();
  for (const r of rows) { const k = `${r.instrumento}|${r.faixa}`; by.set(k, [...(by.get(k) ?? []), r]); }
  return [...by.entries()].map(([k, list]) => {
    const meas = list.map((r) => Number(r.tempo_ativo_s)).filter(Number.isFinite);
    const prev = list.map((r) => Number(r.tempo_previsto_s)).filter(Number.isFinite);
    const diffs = list.map((r) => Number(r.tempo_ativo_s) - Number(r.tempo_previsto_s)).filter(Number.isFinite);
    return { grupo: k, aplicacoes: list.length, minimo: meas.length ? Math.min(...meas) : null, mediana: median(meas), maximo: meas.length ? Math.max(...meas) : null, previstoMediana: median(prev), diferencaMediana: median(diffs) };
  });
}

export function formsAB(rows: Record<string, string>[]) {
  const by = new Map<string, Record<string, string>[]>();
  for (const r of rows) by.set(r.codigo, [...(by.get(r.codigo) ?? []), r]);
  const kids = [...by.entries()].map(([codigo, list]) => {
    const a = list.find((r) => r.forma === "A"); const b = list.find((r) => r.forma === "B");
    if (!a || !b) return null;
    const dComp = Number(b.compreensao_acertos) - Number(a.compreensao_acertos);
    const dLidas = Number(b.fluencia_lidas) - Number(a.fluencia_lidas);
    return { codigo, diferencaCompreensao: Number.isFinite(dComp) ? dComp : null, diferencaFluenciaLidas: Number.isFinite(dLidas) ? dLidas : null };
  }).filter((x): x is NonNullable<typeof x> => x !== null);
  const abs = (xs: (number | null)[]) => xs.filter((x): x is number => x !== null).map(Math.abs);
  return { criancasComAmbasFormas: kids.length, porCrianca: kids, medianaDiferencaAbsolutaCompreensao: median(abs(kids.map((k) => k.diferencaCompreensao))), medianaDiferencaAbsolutaFluencia: median(abs(kids.map((k) => k.diferencaFluenciaLidas))) };
}

export function analyze(text: string) {
  const rows = parseCsv(text);
  const head = text.split(/\r?\n/)[0].split(",").map((h) => h.trim());
  if (head.includes("resultado_aplicadora_A")) return { tipo: "concordancia", ...agreement(rows) };
  if (head.includes("tempo_ativo_s")) return { tipo: "tempo", grupos: timing(rows) };
  if (head.includes("forma")) return { tipo: "formas_ab", ...formsAB(rows) };
  return { tipo: "desconhecido" };
}

if (process.argv[1]?.endsWith("analise-planilhas.ts")) {
  const file = process.argv[2];
  if (!file) { console.error("Uso: analise-planilhas.ts <arquivo.csv>"); process.exit(1); }
  console.log(JSON.stringify(analyze(readFileSync(file, "utf8")), null, 2));
}
