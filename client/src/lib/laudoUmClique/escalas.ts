// ============================================================================
// laudoUmClique/escalas.ts — normaliza resultados salvos em escalas pontuadas
// ----------------------------------------------------------------------------
// Nunca inventa escore. Usa o que está salvo (totalScore/classification). Só
// deriva classificação quando existe um classificador oficial no app para a
// escala (hoje: M-CHAT-R/F, pontos de corte já testados em
// tests/unit/clinical-scoring-cutoffs.test.ts). Sem escore → "sem-escore".
// ============================================================================
import { classifyMchat } from "../../data/mchat";
import type { EscalaPontuada } from "./tipos";

function isRecord(v: unknown): v is Record<string, unknown> {
  return Boolean(v) && typeof v === "object" && !Array.isArray(v);
}

function texto(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

function nomeDe(r: Record<string, unknown>): string {
  const payload = isRecord(r.payload) ? r.payload : null;
  return (
    texto(payload?.title) || texto(r.scaleName) || texto(r.scale_name) || texto(r.instrumentName) || texto(r.instrumentId) || "Instrumento"
  );
}

function dataDe(r: Record<string, unknown>): string {
  return texto(r.appliedAt) || texto(r.applicationDate) || texto(r.createdAt) || texto(r.applied_at);
}

function escoreDe(r: Record<string, unknown>): number | null {
  const v = r.totalScore ?? r.total_score ?? r.score;
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

const CLASSIFICACAO_GENERICA = /^resultado registrado$/i;

/** Converte linhas de resultado (formato local ou LIVE) em escalas pontuadas. */
export function escalasDeResultados(resultados: unknown[]): EscalaPontuada[] {
  const lista = Array.isArray(resultados) ? resultados : [];
  const saida = lista.filter(isRecord).map((r, i): EscalaPontuada => {
    const nome = nomeDe(r);
    const escore = escoreDe(r);
    let classificacao = texto(r.classification);
    let origem: EscalaPontuada["origem"] = escore === null ? "sem-escore" : "salvo";
    if (CLASSIFICACAO_GENERICA.test(classificacao)) classificacao = "";
    if (!classificacao && escore !== null && /m-?chat/i.test(`${nome} ${texto(r.instrumentId)}`)) {
      classificacao = classifyMchat(escore).risk;
      origem = "derivado";
    }
    return {
      id: texto(r.id) || `escala-${i + 1}`,
      nome,
      data: dataDe(r),
      respondente: texto(r.respondent) || texto(r.respondente),
      escore,
      classificacao,
      origem,
      leitura: "",
      incluir: escore !== null || classificacao !== "",
    };
  });
  // Mais recente primeiro; evita repetir a mesma escala duas vezes por padrão.
  saida.sort((a, b) => (b.data || "").localeCompare(a.data || ""));
  const vistas = new Set<string>();
  for (const e of saida) {
    const chave = e.nome.toLowerCase();
    if (vistas.has(chave)) e.incluir = false;
    else vistas.add(chave);
  }
  return saida;
}

export function mesAno(iso: string): string {
  const d = new Date(iso);
  if (!iso || Number.isNaN(d.getTime())) return "data não registrada";
  const meses = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
  return `${meses[d.getUTCMonth()]} de ${d.getUTCFullYear()}`;
}

/** Escalas com resultado incompleto, para lacunas fora do laudo. */
export function escalasSemEscore(escalas: EscalaPontuada[]): EscalaPontuada[] {
  return escalas.filter((e) => e.incluir && e.escore === null);
}
