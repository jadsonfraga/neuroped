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
import { classifyCrafft, classifyCshq, classifyPhqa } from "../../data/expandedScales";
import { classifyMchat } from "../../data/mchat";

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
    id: "mchat", nome: "M-CHAT-R/F", reconhece: (t) => /m-?chat/i.test(t), minimo: 0, maximo: 20, maiorEhPior: true,
    faixa: (n) => classifyMchat(n).risk, varredura: [0, 20],
    nota: "Rastreio de TEA: não é instrumento de seguimento de resposta a tratamento.",
    fonte: "client/src/data/mchat.ts (classifyMchat)",
  },
  {
    id: "phqa", nome: "PHQ-A", reconhece: (t) => /phq-?a/i.test(t), minimo: 0, maximo: 27, maiorEhPior: true,
    faixa: (n) => classifyPhqa(n).classification, varredura: [0, 27],
    nota: "A resposta ao item de ideação suicida exige conduta própria, independente do escore total.",
    fonte: "client/src/data/expandedScales.ts (classifyPhqa)",
  },
  {
    id: "cshq", nome: "CSHQ", reconhece: (t) => /cshq/i.test(t), minimo: 33, maximo: 99, maiorEhPior: true,
    faixa: (n) => classifyCshq(n).classification, varredura: [33, 99],
    fonte: "client/src/data/expandedScales.ts (classifyCshq)",
  },
  {
    id: "crafft", nome: "CRAFFT", reconhece: (t) => /crafft/i.test(t), minimo: 0, maximo: 6, maiorEhPior: true,
    faixa: (n) => classifyCrafft(n).classification, varredura: [0, 6],
    fonte: "client/src/data/expandedScales.ts (classifyCrafft)",
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
