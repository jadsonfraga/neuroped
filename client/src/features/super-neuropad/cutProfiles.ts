/**
 * Perfis de corte do Super NeuroPad por faixa etária.
 *
 * Infraestrutura: os valores abaixo são AUTORAIS (referência interna do jogo), os mesmos desde a primeira
 * versão, iguais para todas as idades. NÃO são norma, percentil nem ponto de corte validado. Cada perfil
 * declara `fonte` e `status`; enquanto `fonte` for null o texto exibido ao usuário diz "referência interna,
 * sem fonte". Para usar cortes diferentes por idade basta acrescentar um perfil com `anos` próprios e a
 * fonte (literatura ou estudo de validação) — o congelamento (golden) obriga a registrar a mudança.
 * Decisão clínica pendente do Dr. Jadson: ver docs/VALIDACAO_NEUROPAD.md.
 */
export interface CutRatios { esperado: number; observar: number }

export interface CutProfile {
  id: string;
  /** Anos de idade inclusivos a que o perfil se aplica. */
  anos: readonly [number, number];
  fase: CutRatios;
  total: CutRatios;
  /** Citação/estudo que sustenta os valores. null = nenhuma fonte verificável. */
  fonte: string | null;
  status: "referencia_interna_sem_fonte" | "com_fonte";
  versao: string;
}

export const CUT_PROFILES: readonly CutProfile[] = [
  {
    id: "interno-padrao",
    anos: [0, 120],
    fase: { esperado: 0.75, observar: 0.5 },
    total: { esperado: 0.8, observar: 0.6 },
    fonte: null,
    status: "referencia_interna_sem_fonte",
    versao: "2026-10-16.1",
  },
];

/** Perfil da idade; sem idade, ou se nenhum perfil cobrir, usa o primeiro (padrão interno). */
export function cutProfileFor(years?: number): CutProfile {
  if (years === undefined) return CUT_PROFILES[0];
  return CUT_PROFILES.find((profile) => years >= profile.anos[0] && years <= profile.anos[1]) ?? CUT_PROFILES[0];
}

/**
 * Menor número de itens num domínio para ele receber nível (esperado/observar/alerta).
 * Abaixo disso o domínio é só descritivo (acertos/itens), pois 1 ou 2 itens não sustentam rótulo.
 * Vale hoje só para a bateria de 2–3 anos, que é onde há domínios com poucos itens.
 */
export const MIN_DOMAIN_ITEMS_FOR_LEVEL = 3;

/** Texto curto sobre a origem dos cortes, para tela, PDF e prontuário. */
export function cutProvenanceText(years?: number): string {
  const profile = cutProfileFor(years);
  return profile.fonte
    ? `Cortes: ${profile.fonte} (perfil ${profile.id}, versão ${profile.versao}).`
    : `Cortes: referência interna do jogo, sem fonte publicada nem validação (perfil ${profile.id}, versão ${profile.versao}). Não é norma.`;
}
