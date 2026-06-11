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

// Primeira linha por queixa isolada (rotas existentes no app, em ordem de prioridade).
export const firstLineByQueixa: Record<string, string[]> = {
  tea: ["/mchat", "/ips", "/cars", "/tea", "/vineland", "/testes-diretos"],
  tdah: ["/snap", "/vanderbilt", "/conners", "/brief2", "/sdq", "/testes-diretos", "/testes-reconhecimento"],
  ansiedade: ["/scared", "/sdq", "/cbcl", "/testes-diretos"],
  depressao: ["/cdi2", "/phqa", "/cssrs", "/sdq"],
  suicidio: ["/cssrs", "/phqa"],
  aprendizagem: ["/tde2", "/testes-academicos", "/testes-diretos", "/testes-reconhecimento"],
  linguagem: ["/asq3", "/denver", "/testes-diretos", "/testes-reconhecimento"],
  atraso: ["/denver", "/asq3", "/vineland", "/pant"],
  comportamento: ["/sdq", "/cbcl", "/conners", "/vanderbilt", "/eaah"],
  sono: ["/cshq"],
  tiques: ["/ygtss", "/conners"],
  cognicao: ["/testes-diretos", "/testes-reconhecimento", "/testes-academicos", "/pant"],
  funcionalidade: ["/vineland", "/gmfcs"],
};

// Baterias para QUEIXAS CRUZADAS (comorbidade). Chave = queixas ordenadas
// alfabeticamente e unidas por "+". Combina broadband (SDQ/CBCL) com alvos.
export const firstLineByCrossed: Record<string, string[]> = {
  "tdah+tea": ["/mchat", "/snap", "/conners", "/vineland", "/sdq"],
  "ansiedade+tdah": ["/snap", "/scared", "/sdq", "/cbcl"],
  "aprendizagem+tdah": ["/snap", "/testes-academicos", "/testes-diretos", "/tde2"],
  "ansiedade+depressao": ["/scared", "/cdi2", "/phqa", "/cssrs"],
  "depressao+suicidio": ["/cssrs", "/phqa", "/cdi2"],
  "linguagem+tea": ["/mchat", "/asq3", "/testes-reconhecimento"],
  "atraso+tea": ["/mchat", "/denver", "/asq3", "/vineland"],
  "comportamento+tdah": ["/snap", "/conners", "/sdq", "/eaah"],
  "aprendizagem+tea": ["/testes-academicos", "/vineland"],
  "ansiedade+tea": ["/scared", "/sdq", "/cars"],
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
  let boost = 0;

  if (selectedQueixas.length >= 2) {
    const combo = firstLineByCrossed[crossedKey(selectedQueixas)];
    if (combo) {
      const i = combo.indexOf(route);
      if (i >= 0) boost = Math.max(boost, 30 - i * 3);
    }
  }

  for (const q of selectedQueixas) {
    const list = firstLineByQueixa[q];
    if (!list) continue;
    const i = list.indexOf(route);
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