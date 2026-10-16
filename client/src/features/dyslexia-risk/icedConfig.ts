/**
 * Referências do ICED-8 em tabelas configuráveis (infraestrutura).
 *
 * Todos os valores abaixo são os que já estavam no código desde a primeira versão do ICED-8. Eles são
 * REFERÊNCIA INTERNA, sem fonte publicada verificável no repositório: não são norma, percentil nem ponto de
 * corte validado. Mudar qualquer número exige (1) fonte citada no campo `fonte`, (2) regerar o fixture
 * golden e (3) aprovação clínica do Dr. Jadson — ver docs/VALIDACAO_NEUROPAD.md.
 */
export const ICED_REFERENCE_VERSION = "2026-10-16.1";

export interface IcedReferenceMeta {
  fonte: string | null;
  status: "referencia_interna_sem_fonte" | "com_fonte";
  versao: string;
}

const INTERNAL: IcedReferenceMeta = { fonte: null, status: "referencia_interna_sem_fonte", versao: ICED_REFERENCE_VERSION };

/** Âncoras de fluência (PCPM) por ano escolar. Só 2º e 3º ano existem; para os demais anos não há âncora. */
export interface FluencyAnchorRow extends IcedReferenceMeta {
  rotulo: string;
  /** Pontua (3 pts) com PCPM ≤ este valor. */
  pontuaAte: number;
  /** Entre `pontuaAte` e este valor: descreve, não pontua. */
  descreveAte: number;
}
export const FLUENCY_ANCHORS: Readonly<Record<"2" | "3", FluencyAnchorRow>> = {
  "2": { rotulo: "2º ano", pontuaAte: 42, descreveAte: 55, ...INTERNAL },
  "3": { rotulo: "3º ano", pontuaAte: 70, descreveAte: 80, ...INTERNAL },
};

/** Nomeação rápida (RAN, 40 estímulos): pontua com tempo > `segundosAcima` ou erros ≥ `errosMinimo`. Hoje um corte só, igual para todos os anos. */
export interface RanReferenceRow extends IcedReferenceMeta { segundosAcima: number; errosMinimo: number }
export type RanAno = "2" | "3" | "outro";
export const RAN_REFERENCE: Readonly<Record<RanAno, RanReferenceRow>> = {
  "2": { segundosAcima: 45, errosMinimo: 4, ...INTERNAL },
  "3": { segundosAcima: 45, errosMinimo: 4, ...INTERNAL },
  outro: { segundosAcima: 45, errosMinimo: 4, ...INTERNAL },
};
export function ranReferenceFor(ano: string): RanReferenceRow {
  return ano === "2" || ano === "3" ? RAN_REFERENCE[ano] : RAN_REFERENCE.outro;
}

/** Ditado: pontua com ≥ `errosFonologicosMinimo` erros fonológicos ou com pseudopalavras certas ≤ `pseudoFracaoMaxima` do total (2/5 = 0,4, como era com 5 pseudopalavras). */
export const DITADO_REFERENCE = { errosFonologicosMinimo: 4, pseudoFracaoMaxima: { num: 2, den: 5 }, ...INTERNAL } as const;
/** Quantidade de pseudopalavras que existia antes da ampliação; rascunhos antigos continuam avaliados sobre ela. */
export const DITADO_PSEUDO_LEGACY_TOTAL = 5;

/** Limiares do escore total (de 15): intermediário e elevado. */
export const SCORE_REFERENCE = { intermediaria: 5, elevada: 9, maximo: 15, ...INTERNAL } as const;

/** Texto único sobre a procedência das referências, para tela, PDF e registro. */
export const ICED_PROVENANCE =
  `Procedência das referências do ICED-8 (versão ${ICED_REFERENCE_VERSION}): âncoras de fluência (PCPM 2º ano ≤ 42 e 3º ano ≤ 70), RAN (> 45 s ou ≥ 4 erros), ditado (≥ 4 erros fonológicos ou pseudopalavras certas ≤ 2/5), pseudopalavras (≤ 10/16), consciência fonológica (≤ 6/12), precisão (≤ 15/20) e limiares do escore (5 e 9 de 15) são referência interna do instrumento, sem fonte publicada nem validação em crianças brasileiras. Valores com norma formal do examinador (≤ −1 DP) prevalecem.`;

/** Proporção do limiar elevado (9/15), usada só para leitura descritiva quando há pontos fora do alcance. */
export const SCORE_ELEVATED_FRACTION = { num: SCORE_REFERENCE.elevada, den: SCORE_REFERENCE.maximo } as const;
