/**
 * TIPOS DAS RECOMENDAÇÕES OURO / PRATA / BRONZE (cards parent-friendly).
 *
 * A FONTE de verdade do que é ouro/prata/bronze por queixa × faixa etária vive
 * em `clinicalRanking.ts` (só referencia escalas que ABREM). Os cards do Filtro
 * são montados em runtime a partir dessa tabela + dos dados da própria escala
 * (ver `buildOPB` em pages/filtro.tsx), por isso aqui ficam apenas os tipos.
 *
 * A antiga matriz estática `recommendationsOPB` foi removida: ela coroava como
 * OURO instrumentos que não abrem no app (ADOS-2, Bayley-III, Denver via padrão,
 * CAT/CLAMS…), contradizendo o catálogo filtrável.
 */

export interface RecommendationOPB {
  seal: "ouro" | "prata" | "bronze";
  scaleId: string;
  scaleName: string;
  mainQuestion: string; // O que esta escala quer saber (pergunta principal)
  parentExample: string; // Exemplo do que os pais responderão
  whyUseful: string; // Por que ajuda neste caso
  time: string;
}

export interface QueixaAgeRecommendations {
  queixa: string;
  ageRange: string; // Ex: "2-4 anos", "6-12 anos"
  ageMin: number; // em meses
  ageMax: number; // em meses
  ouro: RecommendationOPB;
  prata: RecommendationOPB;
  bronze: RecommendationOPB;
}
