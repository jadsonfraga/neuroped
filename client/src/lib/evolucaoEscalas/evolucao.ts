// ============================================================================
// evolucaoEscalas/evolucao.ts — séries de evolução e alertas (APOIO AO MÉDICO)
// ----------------------------------------------------------------------------
// Entrada: resultados salvos (formato local ou LIVE). Saída: por instrumento,
// pontos ordenados no tempo, faixa do classificador do app e alertas.
// Regras (todas rotuladas como apoio, nunca decisão):
//  • mudança de faixa entre aplicações consecutivas (piora/melhora);
//  • variação expressiva ≥ limiar da amplitude do instrumento (padrão 20%,
//    LIMIAR DE TRIAGEM DO APP, NÃO validado psicometricamente; ajustável);
//  • versões diferentes do instrumento → sem comparação;
//  • escore fora do intervalo documentado → excluído e sinalizado;
//  • intervalo < 14 dias entre aplicações → aviso de comparabilidade.
// Instrumentos fora do registro ficam "pendentes": só listagem, sem alerta.
// ============================================================================
import { formatIsoDateBr } from "../clinicalDate";
import { faixasDe, instrumentoDe, rankDaFaixa, type InstrumentoEvolucao } from "./registro";

export type NivelAlerta = "atencao" | "informativo";

export interface AlertaEvolucao {
  codigo: "piora-de-faixa" | "melhora-de-faixa" | "variacao-expressiva" | "versao-diferente" | "escore-fora-do-intervalo" | "intervalo-curto";
  nivel: NivelAlerta;
  mensagem: string;
  /** Data (ISO) da aplicação a que o alerta se refere. */
  data: string;
}

export interface PontoEvolucao {
  id: string;
  data: string; // ISO
  escore: number;
  faixa: string;
  versao: string;
  /** Diferença para o ponto comparável anterior (null no primeiro). */
  delta: number | null;
}

export interface SerieEvolucao {
  instrumento: InstrumentoEvolucao;
  pontos: PontoEvolucao[];
  alertas: AlertaEvolucao[];
  /** Pontos de corte (primeiro escore de cada faixa, exceto a primeira) para linhas de referência. */
  cortes: { nome: string; deEscore: number }[];
}

export interface PendenteEvolucao {
  nome: string;
  aplicacoes: { data: string; escore: number | null }[];
  motivo: string;
}

export interface OpcoesEvolucao {
  /** Fração da amplitude (0–1) para "variação expressiva". Padrão 0,2. */
  limiarAmplitude?: number;
}

export const AVISO_APOIO =
  "Alertas são apoio à leitura clínica: comparam escores salvos com as faixas já adotadas no app. Não substituem o julgamento do médico, não indicam causa nem conduta.";

export const LIMIAR_PADRAO = 0.2;

function isRecord(v: unknown): v is Record<string, unknown> {
  return Boolean(v) && typeof v === "object" && !Array.isArray(v);
}
const s = (v: unknown) => (typeof v === "string" ? v.trim() : "");

function nomeDe(r: Record<string, unknown>): string {
  const payload = isRecord(r.payload) ? r.payload : null;
  return s(payload?.title) || s(r.scaleName) || s(r.scale_name) || s(r.instrumentName) || s(r.instrumentId) || "Instrumento";
}
function dataDe(r: Record<string, unknown>): string {
  return s(r.appliedAt) || s(r.applicationDate) || s(r.createdAt) || s(r.applied_at);
}
function escoreDe(r: Record<string, unknown>): number | null {
  const v = r.totalScore ?? r.total_score ?? r.score;
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

function fmt(iso: string): string {
  return formatIsoDateBr(iso) ?? "data não registrada";
}
const DIA = 86_400_000;

export function calcularEvolucao(resultados: unknown[], opcoes: OpcoesEvolucao = {}): { series: SerieEvolucao[]; pendentes: PendenteEvolucao[] } {
  const limiar = opcoes.limiarAmplitude ?? LIMIAR_PADRAO;
  const linhas = (Array.isArray(resultados) ? resultados : []).filter(isRecord);
  const grupos = new Map<string, { inst: InstrumentoEvolucao | null; nome: string; linhas: Record<string, unknown>[] }>();
  for (const r of linhas) {
    const nome = nomeDe(r);
    const inst = instrumentoDe(`${nome} ${s(r.instrumentId)}`);
    const chave = inst ? inst.id : `pendente:${nome.toLowerCase()}`;
    const g = grupos.get(chave) ?? { inst, nome, linhas: [] };
    g.linhas.push(r);
    grupos.set(chave, g);
  }

  const series: SerieEvolucao[] = [];
  const pendentes: PendenteEvolucao[] = [];

  for (const g of grupos.values()) {
    const ordenadas = [...g.linhas].sort((a, b) => dataDe(a).localeCompare(dataDe(b)));
    if (!g.inst) {
      pendentes.push({
        nome: g.nome,
        aplicacoes: ordenadas.map((r) => ({ data: dataDe(r), escore: escoreDe(r) })),
        motivo: "Sem regra de evolução validada no app (faixas e pontos de corte não registrados). Escores listados sem gráfico nem alerta.",
      });
      continue;
    }
    const inst = g.inst;
    const alertas: AlertaEvolucao[] = [];
    const pontos: PontoEvolucao[] = [];
    let anterior: PontoEvolucao | null = null;

    for (const r of ordenadas) {
      const data = dataDe(r);
      const escore = escoreDe(r);
      if (escore === null) continue; // sem escore salvo: nunca inventar
      const foraMin = inst.minimo !== undefined && escore < inst.minimo;
      const foraMax = inst.maximo !== undefined && escore > inst.maximo;
      if (foraMin || foraMax) {
        alertas.push({ codigo: "escore-fora-do-intervalo", nivel: "atencao", data, mensagem: `Escore ${escore} fora do intervalo documentado (${inst.minimo ?? "…"}–${inst.maximo ?? "…"}) em ${fmt(data)}; aplicação excluída do gráfico. Conferir o registro.` });
        continue;
      }
      const versao = s(r.scaleVersion) || s(r.instrumentVersion);
      const ponto: PontoEvolucao = { id: s(r.id) || `${inst.id}-${pontos.length + 1}`, data, escore, faixa: inst.faixa(escore), versao, delta: null };

      if (anterior) {
        if (anterior.versao && versao && anterior.versao !== versao) {
          alertas.push({ codigo: "versao-diferente", nivel: "informativo", data, mensagem: `Versões diferentes do instrumento (${anterior.versao} → ${versao}) em ${fmt(data)}: comparação direta não é confiável.` });
        } else {
          ponto.delta = escore - anterior.escore;
          const dias = (new Date(data).getTime() - new Date(anterior.data).getTime()) / DIA;
          if (Number.isFinite(dias) && dias < 14) {
            alertas.push({ codigo: "intervalo-curto", nivel: "informativo", data, mensagem: `Apenas ${Math.max(0, Math.round(dias))} dia(s) entre as aplicações de ${fmt(anterior.data)} e ${fmt(data)}: efeito de repetição e recorte do respondente podem pesar.` });
          }
          const ra = rankDaFaixa(inst, anterior.faixa);
          const rb = rankDaFaixa(inst, ponto.faixa);
          if (rb !== ra) {
            const piorou = inst.maiorEhPior ? rb > ra : rb < ra;
            alertas.push({
              codigo: piorou ? "piora-de-faixa" : "melhora-de-faixa",
              nivel: piorou ? "atencao" : "informativo",
              data,
              mensagem: `${inst.nome}: faixa mudou de "${anterior.faixa}" (${anterior.escore}) para "${ponto.faixa}" (${escore}) entre ${fmt(anterior.data)} e ${fmt(data)}.`,
            });
          }
          if (inst.minimo !== undefined && inst.maximo !== undefined) {
            const amp = inst.maximo - inst.minimo;
            if (amp > 0 && Math.abs(escore - anterior.escore) / amp >= limiar) {
              alertas.push({
                codigo: "variacao-expressiva",
                nivel: "atencao",
                data,
                mensagem: `${inst.nome}: variação de ${escore - anterior.escore > 0 ? "+" : ""}${escore - anterior.escore} pontos (≥ ${Math.round(limiar * 100)}% da amplitude ${inst.minimo}–${inst.maximo}) entre ${fmt(anterior.data)} e ${fmt(data)}. Limiar de triagem do app, não validado psicometricamente.`,
              });
            }
          }
        }
      }
      pontos.push(ponto);
      anterior = ponto;
    }

    if (pontos.length || alertas.length) {
      series.push({ instrumento: inst, pontos, alertas, cortes: faixasDe(inst).slice(1) });
    } else {
      pendentes.push({ nome: g.nome, aplicacoes: ordenadas.map((r) => ({ data: dataDe(r), escore: null })), motivo: "Nenhuma aplicação com escore salvo; nada a comparar." });
    }
  }

  series.sort((a, b) => a.instrumento.nome.localeCompare(b.instrumento.nome));
  return { series, pendentes };
}
