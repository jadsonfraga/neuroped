// Índice de Escalas Complementares 230
// Integra todos os 3 blocos em uma única exportação
// Uso: import { todasAsEscalasComplementares } from "./indiceEscalasComplementares230"

import { complementares230 } from "./scalasComplementares230";
import { complementares230Bloco2 } from "./scalasComplementares230Bloco2";
import { complementares230Bloco3 } from "./scalasComplementares230Bloco3";
import type { Respondente } from "./scaleFilter";

// ============ CONSOLIDAÇÃO ============

// Array unificado de todas as 230 escalas complementares
export const todasAsEscalasComplementares = [
  ...complementares230,        // Blocos 1-5: PROMIS + NIH + Paralisia Cerebral + Desenvolvimento + Linguagem
  ...complementares230Bloco2,  // Blocos 6-10: TEA + TDAH + Epilepsia + Dor + Sono
  ...complementares230Bloco3,  // Blocos 11-16: Alimentação + Trauma + Humor + Comportamento + Aprendizagem + Cognição
];

// ============ ESTATÍSTICAS ============

export const estatisticasEscalasComplementares = {
  totalEscalas: todasAsEscalasComplementares.length,
  porBloco: {
    "PROMIS/HealthMeasures": 36,
    "NIH Toolbox": 13,
    "Paralisia Cerebral": 18,
    "Desenvolvimento": 14,
    "Linguagem": 17,
    "TEA/Cognição Social": 15,
    "TDAH/Executivas": 12,
    "Epilepsia": 12,
    "Dor": 10,
    "Sono": 8,
    "Alimentação": 11,
    "Trauma": 9,
    "Humor/Ansiedade/TOC": 13,
    "Comportamento": 10,
    "Aprendizagem": 15,
    "Cognição": 15,
  },
  porModoApp: {
    aplicar: todasAsEscalasComplementares.filter(e => e.modoApp === "aplicar").length,
    metadado: todasAsEscalasComplementares.filter(e => e.modoApp === "metadado").length,
    encaminhar: todasAsEscalasComplementares.filter(e => e.modoApp === "encaminhar").length,
    monitorar: todasAsEscalasComplementares.filter(e => e.modoApp === "monitorar").length,
  },
  porLicenca: {
    livre: todasAsEscalasComplementares.filter(e => e.licencaUso === "livre").length,
    comercial: todasAsEscalasComplementares.filter(e => e.licencaUso === "comercial").length,
    restrita: todasAsEscalasComplementares.filter(e => e.licencaUso === "restrita").length,
    contato_autor: todasAsEscalasComplementares.filter(e => e.licencaUso === "contato_autor").length,
  },
  respondentes: {
    pais: todasAsEscalasComplementares.filter(e => e.respondente.includes("pais")).length,
    professor: todasAsEscalasComplementares.filter(e => e.respondente.includes("professor")).length,
    clinico: todasAsEscalasComplementares.filter(e => e.respondente.includes("clinico")).length,
    autoaplicavel: todasAsEscalasComplementares.filter(e => e.respondente.includes("autoaplicavel")).length,
  },
};

// ============ MAPEAMENTO POR QUEIXA ============

export const escalasComplementaresPorQueixa = {
  evolucao: todasAsEscalasComplementares.filter(e => e.queixas.includes("evolucao")),
  funcionalidade: todasAsEscalasComplementares.filter(e => e.queixas.includes("funcionalidade")),
  motor: todasAsEscalasComplementares.filter(e => e.queixas.includes("motor")),
  linguagem: todasAsEscalasComplementares.filter(e => e.queixas.includes("linguagem")),
  tea: todasAsEscalasComplementares.filter(e => e.queixas.includes("tea")),
  sensorial: todasAsEscalasComplementares.filter(e => e.queixas.includes("sensorial")),
  social: todasAsEscalasComplementares.filter(e => e.queixas.includes("social")),
  tdah: todasAsEscalasComplementares.filter(e => e.queixas.includes("tdah")),
  cognicao: todasAsEscalasComplementares.filter(e => e.queixas.includes("cognicao")),
  ansiedade: todasAsEscalasComplementares.filter(e => e.queixas.includes("ansiedade")),
  dor: todasAsEscalasComplementares.filter(e => e.queixas.includes("dor")),
  sono: todasAsEscalasComplementares.filter(e => e.queixas.includes("sono")),
  alimentacao: todasAsEscalasComplementares.filter(e => e.queixas.includes("alimentacao")),
  trauma: todasAsEscalasComplementares.filter(e => e.queixas.includes("trauma")),
  comportamento: todasAsEscalasComplementares.filter(e => e.queixas.includes("comportamento")),
  depressao: todasAsEscalasComplementares.filter(e => e.queixas.includes("depressao")),
  toc: todasAsEscalasComplementares.filter(e => e.queixas.includes("toc")),
  epilepsia: todasAsEscalasComplementares.filter(e => e.queixas.includes("epilepsia")),
  aprendizagem: todasAsEscalasComplementares.filter(e => e.queixas.includes("aprendizagem")),
  atraso: todasAsEscalasComplementares.filter(e => e.queixas.includes("atraso")),
  efeitos: todasAsEscalasComplementares.filter(e => e.queixas.includes("efeitos")),
  pc: todasAsEscalasComplementares.filter(e => e.queixas.includes("pc")),
};

// ============ FUNÇÕES DE UTILIDADE ============

/**
 * Filtra escalas complementares por múltiplos critérios
 * @param filtros Objeto com critérios: { queixas, ageMin, ageMax, respondente, modoApp, licencaUso }
 * @returns Array de escalas que passam em todos os filtros
 */
export function filtrarEscalasComplementares(filtros: {
  queixas?: string[];
  ageMin?: number;
  ageMax?: number;
  respondente?: string;
  modoApp?: string;
  licencaUso?: string;
}): typeof todasAsEscalasComplementares {
  return todasAsEscalasComplementares.filter(escala => {
    // Filtro por queixas (AND — todas devem estar presentes)
    if (filtros.queixas && filtros.queixas.length > 0) {
      const temTodasQueixas = filtros.queixas.every(q => escala.queixas.includes(q));
      if (!temTodasQueixas) return false;
    }

    // Filtro por idade
    if (filtros.ageMin !== undefined && escala.ageMax < filtros.ageMin) return false;
    if (filtros.ageMax !== undefined && escala.ageMin > filtros.ageMax) return false;

    // Filtro por respondente
    if (filtros.respondente && !escala.respondente.includes(filtros.respondente as Respondente)) return false;

    // Filtro por modo de app
    if (filtros.modoApp && escala.modoApp !== filtros.modoApp) return false;

    // Filtro por licença
    if (filtros.licencaUso && escala.licencaUso !== filtros.licencaUso) return false;

    return true;
  });
}

/**
 * Recomenda escalas complementares para um contexto específico
 * @param context Contexto clínico
 * @returns Array de escalas recomendadas ordenadas por relevância
 */
export function recomendarEscalasComplementares(context: {
  queixaPrimaria: string;
  ageMonths: number;
  respondente?: "pais" | "professor" | "clinico" | "autoaplicavel";
  objetivo?: "triagem" | "diagnostica" | "monitorizacao";
}): typeof todasAsEscalasComplementares {
  const filtradas = filtrarEscalasComplementares({
    queixas: [context.queixaPrimaria],
    ageMin: context.ageMonths,
    ageMax: context.ageMonths,
    respondente: context.respondente,
  });

  // Ordenar por prioridade:
  // 1. Respondente match exato
  // 2. Objetivo match (triagem, diagnostica, monitorizacao)
  // 3. Modo "aplicar" antes de "metadado"
  // 4. Score não vazio

  return filtradas.sort((a, b) => {
    // Prioridade 1: Respondente match
    const aRespondente = context.respondente && a.respondente.includes(context.respondente) ? 1 : 0;
    const bRespondente = context.respondente && b.respondente.includes(context.respondente) ? 1 : 0;
    if (aRespondente !== bRespondente) return bRespondente - aRespondente;

    // Prioridade 2: Objetivo match
    if (context.objetivo) {
      const aObjetivo = a.prioridade === context.objetivo ? 1 : 0;
      const bObjetivo = b.prioridade === context.objetivo ? 1 : 0;
      if (aObjetivo !== bObjetivo) return bObjetivo - aObjetivo;
    }

    // Prioridade 3: Modo "aplicar" antes de "metadado"
    const modoOrder = { aplicar: 3, encaminhar: 2, monitorar: 1, metadado: 0 };
    const aModo = modoOrder[a.modoApp as keyof typeof modoOrder] ?? 0;
    const bModo = modoOrder[b.modoApp as keyof typeof modoOrder] ?? 0;
    if (aModo !== bModo) return bModo - aModo;

    return 0;
  });
}

// ============ VALIDAÇÃO ============

/**
 * Valida integridade dos dados das 230 escalas
 * @returns Object com status de validação
 */
export function validarEscalasComplementares() {
  const issues: string[] = [];

  todasAsEscalasComplementares.forEach(escala => {
    // Validação de id
    if (!escala.id) issues.push(`Escala sem ID`);
    if (!/^[a-z0-9-]+$/.test(escala.id)) issues.push(`ID inválido: ${escala.id}`);

    // Validação de idade
    if (escala.ageMin > escala.ageMax) issues.push(`${escala.id}: ageMin > ageMax`);
    if (escala.ageMax > 216) issues.push(`${escala.id}: ageMax > 216 (18 anos)`);

    // Validação de respondentes
    if (!escala.respondente || escala.respondente.length === 0) {
      issues.push(`${escala.id}: sem respondentes`);
    }

    // Validação de queixas
    if (!escala.queixas || escala.queixas.length === 0) {
      issues.push(`${escala.id}: sem queixas`);
    }

    // Validação de metadados
    if (!escala.licencaUso) issues.push(`${escala.id}: sem licencaUso`);
    if (!escala.modoApp) issues.push(`${escala.id}: sem modoApp`);
    if (!escala.duplicataStatus) issues.push(`${escala.id}: sem duplicataStatus`);
  });

  return {
    valido: issues.length === 0,
    totalEscalas: todasAsEscalasComplementares.length,
    issues: issues,
    sumario: `${todasAsEscalasComplementares.length} escalas, ${issues.length} problemas`,
  };
}

// Executar validação na importação
if (typeof window === "undefined") {
  // Executar apenas no servidor (não no navegador)
  const validacao = validarEscalasComplementares();
  if (!validacao.valido) {
    console.warn("⚠️ Problemas na validação de escalas complementares:", validacao.issues);
  }
}
