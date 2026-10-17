// ============================================================================
// evolucaoEscalas/registro.ts — instrumentos com regra de evolução VALIDADA
// ----------------------------------------------------------------------------
// Só entram instrumentos cujo escore total e faixas JÁ existem no app
// (data/*.ts, cobertos por tests/unit/clinical-scoring-cutoffs.test.ts).
// Nada é recalculado a partir das respostas: usa-se o escore salvo na aplicação
// e as faixas do classificador oficial do app. As faixas e seus pontos de
// corte são DERIVADOS do próprio classificador, sem tabela paralela que possa
// divergir. Instrumento fora do registro fica "pendente" (sem gráfico/alerta).
// ============================================================================
// M-CHAT-R/F, CSHQ e CRAFFT saíram em 17/10/2026 (licenciados, sem classificador no app):
// registros antigos desses instrumentos aparecem como pendentes, sem faixa inventada.
import { classifyPhqa } from "../../data/expandedScales";

export interface InstrumentoEvolucao {
  id: string;
  nome: string;
  /** Reconhece o instrumento pelo nome/id salvo. */
  reconhece: (texto: string) => boolean;
  /** Intervalo teórico do escore total, quando documentado. */
  minimo?: number;
  maximo?: number;
  /** Maior escore = pior? (todos os instrumentos atuais: sim). */
  maiorEhPior: boolean;
  /** Faixa do classificador do app para um escore total. */
  faixa: (total: number) => string;
  /** Faixa de varredura para descobrir pontos de corte. */
  varredura: [number, number];
  /** Observação clínica exibida junto ao gráfico. */
  nota?: string;
  /** Fonte da regra, para auditoria. */
  fonte: string;
}

export const INSTRUMENTOS_EVOLUCAO: InstrumentoEvolucao[] = [
  {
    id: "phqa", nome: "PHQ-A", reconhece: (t) => /phq-?a/i.test(t), minimo: 0, maximo: 27, maiorEhPior: true,
    faixa: (n) => classifyPhqa(n).classification, varredura: [0, 27],
    nota: "A resposta ao item de ideação suicida exige conduta própria, independente do escore total.",
    fonte: "client/src/data/expandedScales.ts (classifyPhqa)",
  },
];

export function instrumentoDe(texto: string): InstrumentoEvolucao | null {
  return INSTRUMENTOS_EVOLUCAO.find((i) => i.reconhece(texto)) ?? null;
}

/** Faixas em ordem crescente de escore e seus pontos de corte (primeiro escore de cada faixa). */
export function faixasDe(i: InstrumentoEvolucao): { nome: string; deEscore: number }[] {
  const [a, b] = i.varredura;
  const faixas: { nome: string; deEscore: number }[] = [];
  for (let n = a; n <= b; n++) {
    const nome = i.faixa(n);
    if (!faixas.length || faixas[faixas.length - 1].nome !== nome) faixas.push({ nome, deEscore: n });
  }
  return faixas;
}

/** Posição da faixa (0 = menor escore). */
export function rankDaFaixa(i: InstrumentoEvolucao, nome: string): number {
  return faixasDe(i).findIndex((f) => f.nome === nome);
}
