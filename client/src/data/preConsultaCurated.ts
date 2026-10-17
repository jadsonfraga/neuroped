/**
 * Curadoria clínica de PRÉ-CONSULTA (visão neuropediátrica).
 *
 * Mapeia queixa — e combinações COMÓRBIDAS frequentes — para os instrumentos de
 * PRIMEIRA LINHA que fazem sentido aplicar ANTES da consulta (uso da secretaria):
 * questionários para pais/escola + testes diretos com a criança que JÁ têm
 * aplicação dentro do app (rota). A ordem em cada lista é a prioridade clínica.
 *
 * Não substitui julgamento clínico; é um guia de triagem inicial. A janela etária
 * de cada instrumento é respeitada pelo próprio catálogo (ageMin/ageMax), então
 * aqui basta listar as ROTAS recomendadas por queixa.
 */

/**
 * Os formulários SWYC Marcos (um por janela de idade) contam como uma única rota
 * curada: o catálogo já mostra só o formulário da idade da criança.
 */
const SWYC_MARCOS = "/generic-scale/swyc-marcos";
export function curatedRouteKey(route: string): string {
  return /^\/generic-scale\/swyc-marcos-\d+m$/.test(route) ? SWYC_MARCOS : route;
}

// Primeira linha por queixa isolada (rotas existentes no app, em ordem de prioridade).
export const firstLineByQueixa: Record<string, string[]> = {
  tea: ["/generic-scale/na-sinais-precoces-tea-pais", "/ips", "/generic-scale/na-comportamentos-repetitivos-pais", "/tea", "/generic-scale/na-comportamento-adaptativo-pais", "/testes-diretos"],
  tdah: ["/snap", "/generic-scale/na-atencao-atividade-pais", "/generic-scale/na-atencao-atividade-professor", "/generic-scale/na-funcoes-executivas-ampliado-pais", "/generic-scale/swyc-ppsc", "/testes-diretos"],
  ansiedade: ["/generic-scale/na-ansiedade-autorrelato", "/generic-scale/na-ansiedade-seguimento-pais", "/generic-scale/na-perfil-emocional-comportamental-pais", "/testes-diretos"],
  depressao: ["/generic-scale/na-humor-crianca-autorrelato", "/phqa", "/cssrs", "/generic-scale/na-perfil-emocional-comportamental-pais"],
  suicidio: ["/cssrs", "/phqa"],
  aprendizagem: ["/tde2", "/testes-diretos"],
  linguagem: [SWYC_MARCOS, "/testes-diretos"],
  atraso: [SWYC_MARCOS, "/generic-scale/na-comportamento-adaptativo-pais", "/pant"],
  comportamento: ["/generic-scale/na-perfil-emocional-comportamental-pais", "/generic-scale/swyc-ppsc", "/generic-scale/na-atencao-atividade-pais", "/generic-scale/na-perfil-emocional-comportamental-professor", "/eaah"],
  sono: ["/generic-scale/na-sono-crianca-pais"],
  tiques: ["/ygtss", "/generic-scale/na-atencao-atividade-pais"],
  cognicao: ["/testes-diretos", "/pant"],
  funcionalidade: ["/generic-scale/na-comportamento-adaptativo-pais", "/gmfcs", "/generic-scale/na-qualidade-vida-pais"],
};

// Baterias para QUEIXAS CRUZADAS (comorbidade). Chave = queixas ordenadas
// alfabeticamente e unidas por "+". Combina o rastreio amplo (perfil emocional e
// comportamental, SWYC) com alvos.
export const firstLineByCrossed: Record<string, string[]> = {
  "tdah+tea": ["/generic-scale/na-sinais-precoces-tea-pais", "/snap", "/generic-scale/na-atencao-atividade-pais", "/generic-scale/na-comportamento-adaptativo-pais", "/generic-scale/na-perfil-emocional-comportamental-pais"],
  "ansiedade+tdah": ["/snap", "/generic-scale/na-ansiedade-autorrelato", "/generic-scale/na-ansiedade-seguimento-pais", "/generic-scale/na-perfil-emocional-comportamental-pais"],
  "aprendizagem+tdah": ["/snap", "/testes-diretos", "/tde2"],
  "ansiedade+depressao": ["/generic-scale/na-ansiedade-autorrelato", "/generic-scale/na-humor-crianca-autorrelato", "/phqa", "/cssrs"],
  "depressao+suicidio": ["/cssrs", "/phqa", "/generic-scale/na-humor-crianca-autorrelato"],
  "linguagem+tea": ["/generic-scale/na-sinais-precoces-tea-pais", SWYC_MARCOS, "/testes-diretos"],
  "atraso+tea": ["/generic-scale/na-sinais-precoces-tea-pais", SWYC_MARCOS, "/generic-scale/na-comportamento-adaptativo-pais"],
  "comportamento+tdah": ["/snap", "/generic-scale/na-atencao-atividade-pais", "/generic-scale/na-perfil-emocional-comportamental-pais", "/eaah"],
  "aprendizagem+tea": ["/testes-diretos", "/generic-scale/na-comportamento-adaptativo-pais"],
  "ansiedade+tea": ["/generic-scale/na-ansiedade-autorrelato", "/generic-scale/na-ansiedade-seguimento-pais", "/generic-scale/na-comportamentos-repetitivos-pais"],
};

export function crossedKey(queixas: string[]): string {
  return [...queixas].sort().join("+");
}

/**
 * Peso de curadoria para uma rota dada as queixas selecionadas.
 * Combinação comórbida tem prioridade sobre queixa isolada. Posição na lista
 * vira peso decrescente (primeiro = mais forte).
 */
export function curatedBoost(route: string | undefined, selectedQueixas: string[]): number {
  if (!route || selectedQueixas.length === 0) return 0;
  const key = curatedRouteKey(route);
  let boost = 0;

  if (selectedQueixas.length >= 2) {
    const combo = firstLineByCrossed[crossedKey(selectedQueixas)];
    if (combo) {
      const i = combo.indexOf(key);
      if (i >= 0) boost = Math.max(boost, 30 - i * 3);
    }
  }

  for (const q of selectedQueixas) {
    const list = firstLineByQueixa[q];
    if (!list) continue;
    const i = list.indexOf(key);
    if (i >= 0) boost = Math.max(boost, 20 - i * 2);
  }
  return boost;
}

/**
 * Penalidade para AVALIAÇÕES FORMAIS do médico (sem rota no app, respondente só
 * clínico, finalidade diagnóstica): ADOS-2, ADI-R, WISC-V, Bayley, NEPSY etc.
 * Elas são referência, não tarefa de pré-consulta da secretaria — devem afundar
 * abaixo dos instrumentos administráveis, sem sumir.
 */
export function clinicianOnlyPenalty(
  appRoute: string | undefined,
  respondente: string[],
  _prioridade: string | undefined,
): number {
  if (appRoute) return 0;
  const onlyClinico = respondente.length > 0 && respondente.every((r) => r === "clinico");
  return onlyClinico ? -25 : 0;
}
