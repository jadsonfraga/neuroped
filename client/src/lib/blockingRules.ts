/**
 * REGRAS DE BLOQUEIO CONTRA-RESTRITIVAS
 *
 * O filtro deve BLOQUEAR escalas inadequadas e explicar por quê.
 */

import type { ScaleEntryWithClinicalMetadata } from "@/types/ClinicalScaleMetadata";

export interface FilterContext {
  // Dados da criança
  ageMonths?: number;
  canRead?: boolean;
  readingLevel?: "basico" | "nivel2" | "nivel3" | "fluente";
  canWrite?: boolean;
  writingLevel?: "copia" | "escreve_nome" | "escreve_palavras" | "escreve_espontaneo";
  isVerbal?: boolean;
  understands_simple_commands?: boolean;
  canPointOrSelect?: boolean;
  canNamingFigures?: boolean;
  hasMinimalCollaboration?: boolean;

  // Contexto clínico
  isFirstEvaluation?: boolean;
  mainComplaint?: string;
  primaryDomain?: string;
  suspectedConditions?: string[];

  // Informantes disponíveis
  parentAvailable?: boolean;
  schoolAvailable?: boolean;
  teacherAvailable?: boolean;
  professionalAvailable?: boolean;
  professionalType?: "psicólogo" | "fonoaudiólogo" | "neuropediatra" | "TO" | "psicopedagogo" | "terapeuta" | "generalista";

  // Contexto operacional
  timeAvailable?: "rapido" | "normal" | "extenso"; // <5min, 5-30min, >30min
  isClinicOrHome?: "clinic" | "home";
  followUpOnly?: boolean; // É reavaliação?
}

export interface BlockingDecision {
  isBlocked: boolean;
  blockType?: "hard" | "soft"; // hard = não mostrar; soft = pendente
  reasons: string[];
  recommendation?: string;
}

/**
 * REGRA 1: Bloqueio por Idade
 */
export function checkAgeCompatibility(
  scale: ScaleEntryWithClinicalMetadata,
  ageMonths: number
): BlockingDecision {
  const { ageMin, ageMax } = scale;

  if (ageMonths < ageMin || ageMonths > ageMax) {
    return {
      isBlocked: true,
      blockType: "hard",
      reasons: [
        `Bloqueada: idade ${ageMonths} meses fora da faixa (${ageMin}-${ageMax} meses)`,
      ],
      recommendation: `Use de ${ageMin}-${ageMax} meses (${(ageMin / 12).toFixed(1)}-${(ageMax / 12).toFixed(1)} anos)`,
    };
  }

  return { isBlocked: false, reasons: [] };
}

/**
 * REGRA 2: Bloqueio por Falta de Pais
 */
export function checkParentAvailability(
  scale: ScaleEntryWithClinicalMetadata,
  context: FilterContext
): BlockingDecision {
  const { clinicalMetadata } = scale;

  if (clinicalMetadata.requiresParent && !context.parentAvailable) {
    return {
      isBlocked: true,
      blockType: clinicalMetadata.blockingRules.find(r => r.id === "requires_parent")?.severity || "soft",
      reasons: [
        `Bloqueada: exige resposta de pais/responsáveis, mas não foi marcado como disponível`,
      ],
      recommendation: `Disponibilizar responsável ou selecionar outra escala`,
    };
  }

  return { isBlocked: false, reasons: [] };
}

/**
 * REGRA 3: Bloqueio por Falta de Escola
 */
export function checkSchoolAvailability(
  scale: ScaleEntryWithClinicalMetadata,
  context: FilterContext
): BlockingDecision {
  const { clinicalMetadata } = scale;

  if (clinicalMetadata.requiresSchool && !context.schoolAvailable && !context.teacherAvailable) {
    return {
      isBlocked: true,
      blockType: "soft", // soft porque pode ser preenchida depois
      reasons: [
        `Pendente: exige resposta de professor/escola, ainda não selecionado`,
      ],
      recommendation: `Contactar escola ou selecionar escala com informação parental`,
    };
  }

  return { isBlocked: false, reasons: [] };
}

/**
 * REGRA 4: Bloqueio por Requisito de Profissional
 */
export function checkProfessionalRequirement(
  scale: ScaleEntryWithClinicalMetadata,
  context: FilterContext
): BlockingDecision {
  const { clinicalMetadata } = scale;

  if (clinicalMetadata.requiresProfessional) {
    // Se está em clínica e há profissional disponível, OK
    if (context.isClinicOrHome === "clinic" && context.professionalAvailable) {
      // Verificar se é o tipo certo
      if (clinicalMetadata.professionalType && context.professionalType !== clinicalMetadata.professionalType) {
        return {
          isBlocked: true,
          blockType: "soft",
          reasons: [
            `Aviso: exige aplicação por ${clinicalMetadata.professionalType}, você selecionou ${context.professionalType}`,
          ],
          recommendation: `Requer ${clinicalMetadata.professionalType} ou selecionar outra escala`,
        };
      }
      return { isBlocked: false, reasons: [] };
    }

    // Se está em casa, não pode usar
    if (context.isClinicOrHome === "home") {
      return {
        isBlocked: true,
        blockType: "hard",
        reasons: [
          `Bloqueada: exige aplicação por profissional treinado (${clinicalMetadata.professionalType || "especializado"})`,
          `Contexto: home (sem profissional disponível)`,
        ],
        recommendation: `Use esta escala apenas em clínica ou selecionar instrumento mais simples`,
      };
    }

    // Se não há profissional
    return {
      isBlocked: true,
      blockType: "soft",
      reasons: [
        `Pendente: exige aplicação por ${clinicalMetadata.professionalType || "profissional"}`,
      ],
      recommendation: `Disponibilizar profissional ou selecionar outra escala`,
    };
  }

  return { isBlocked: false, reasons: [] };
}

/**
 * REGRA 5: Bloqueio por Leitura
 */
export function checkReadingRequirement(
  scale: ScaleEntryWithClinicalMetadata,
  context: FilterContext
): BlockingDecision {
  const { clinicalMetadata } = scale;

  if (clinicalMetadata.requiresReading && !context.canRead) {
    return {
      isBlocked: true,
      blockType: "hard",
      reasons: [
        `Bloqueada: exige leitura, mas criança não foi marcada como alfabetizada`,
      ],
      recommendation: `Use teste pré-leitura ou aguarde alfabetização`,
    };
  }

  if (clinicalMetadata.minReadingLevel && context.canRead) {
    const readingLevels = ["nao_exige", "basico", "nivel2", "nivel3", "fluente"];
    const requiredIndex = readingLevels.indexOf(clinicalMetadata.minReadingLevel);
    const actualIndex = readingLevels.indexOf(context.readingLevel || "basico");

    if (actualIndex < requiredIndex) {
      return {
        isBlocked: true,
        blockType: "soft",
        reasons: [
          `Aviso: exige nível de leitura "${clinicalMetadata.minReadingLevel}", criança está em "${context.readingLevel || "básico"}"`,
        ],
        recommendation: `Aguardar progresso em leitura ou usar versão mais simples`,
      };
    }
  }

  return { isBlocked: false, reasons: [] };
}

/**
 * REGRA 6: Bloqueio por Escrita
 */
export function checkWritingRequirement(
  scale: ScaleEntryWithClinicalMetadata,
  context: FilterContext
): BlockingDecision {
  const { clinicalMetadata } = scale;

  if (clinicalMetadata.requiresWriting && !context.canWrite) {
    return {
      isBlocked: true,
      blockType: "soft",
      reasons: [
        `Aviso: exige escrita, mas criança ainda não escreve`,
      ],
      recommendation: `Use versão com resposta apontada ou teste pré-escrita`,
    };
  }

  return { isBlocked: false, reasons: [] };
}

/**
 * REGRA 7: Bloqueio por Linguagem Verbal
 */
export function checkVerbalLanguageRequirement(
  scale: ScaleEntryWithClinicalMetadata,
  context: FilterContext
): BlockingDecision {
  const { clinicalMetadata } = scale;

  if (clinicalMetadata.requiresVerbalLanguage && !context.isVerbal) {
    return {
      isBlocked: true,
      blockType: "hard",
      reasons: [
        `Bloqueada: exige fala/linguagem verbal, criança não-verbal`,
      ],
      recommendation: `Use escalas visuomotoras, observacionais ou com gestos`,
    };
  }

  return { isBlocked: false, reasons: [] };
}

/**
 * REGRA 8: Bloqueio por Incompatibilidade de Domínio
 */
export function checkDomainCompatibility(
  scale: ScaleEntryWithClinicalMetadata,
  context: FilterContext
): BlockingDecision {
  if (context.primaryDomain && !scale.queixas.includes(context.primaryDomain) && context.isFirstEvaluation) {
    // Na primeira avaliação, permite screening geral
    if (scale.clinicalMetadata.isScreeningTool) {
      return { isBlocked: false, reasons: [] };
    }

    // Senão, bloqueia
    return {
      isBlocked: true,
      blockType: "soft",
      reasons: [
        `Aviso: domínio clínico "${scale.queixas.join(", ")}" não corresponde à queixa principal "${context.primaryDomain}"`,
      ],
      recommendation: `Esta escala pode não ser ideal para a queixa informada`,
    };
  }

  return { isBlocked: false, reasons: [] };
}

/**
 * REGRA 9: Bloqueio por Risco de Mau Uso
 */
export function checkMisuseRisk(
  scale: ScaleEntryWithClinicalMetadata,
  context: FilterContext
): BlockingDecision {
  const { clinicalMetadata } = scale;

  if (clinicalMetadata.misuseRisk === "muito_alto") {
    return {
      isBlocked: true,
      blockType: "hard",
      reasons: [
        `🚨 Bloqueada: Risco MUITO ALTO de mau uso`,
        `${clinicalMetadata.misuseRiskExplanation || "Requer treinamento especializado extenso"}`,
      ],
      recommendation: `Apenas para uso por especialista treinado. Contactar ${clinicalMetadata.professionalType || "profissional especializado"}`,
    };
  }

  if (clinicalMetadata.misuseRisk === "alto" && context.isClinicOrHome === "home") {
    return {
      isBlocked: true,
      blockType: "hard",
      reasons: [
        `⚠️ Bloqueada: Risco alto de mau uso em contexto não-clínico`,
        `${clinicalMetadata.misuseRiskExplanation || "Requer supervisão profissional"}`,
      ],
      recommendation: `Use apenas em clínica com orientação de ${clinicalMetadata.professionalType || "profissional"}`,
    };
  }

  return { isBlocked: false, reasons: [] };
}

/**
 * REGRA 10: Bloqueio por Colaboração Mínima
 */
export function checkCollaborationRequirement(
  scale: ScaleEntryWithClinicalMetadata,
  context: FilterContext
): BlockingDecision {
  const { clinicalMetadata } = scale;

  if (clinicalMetadata.requiresMinimumCollaboration && !context.hasMinimalCollaboration) {
    return {
      isBlocked: true,
      blockType: "soft",
      reasons: [
        `Aviso: exige colaboração mínima da criança, pode não ser viável neste momento`,
      ],
      recommendation: `Avaliar disposição da criança ou adiar aplicação`,
    };
  }

  return { isBlocked: false, reasons: [] };
}

/**
 * REGRA 11: Bloqueio por Tempo Disponível
 */
export function checkTimeRequirement(
  scale: ScaleEntryWithClinicalMetadata,
  context: FilterContext
): BlockingDecision {
  const timeMap: Record<string, number> = {
    "1 min": 1,
    "2–5 min": 5,
    "3 min": 3,
    "5 min": 5,
    "5–10 min": 10,
    "10 min": 10,
    "10–15 min": 15,
    "10–20 min": 20,
    "15–20 min": 20,
    "15–25 min": 25,
    "20–30 min": 30,
    "30–40 min": 40,
    "40–60 min": 60,
    "45–60 min": 60,
    "45–90 min": 90,
    "60–90 min": 90,
    "90–150 min": 150,
  };

  const scaleMinutes = timeMap[scale.tempo] || 30;
  const availableMinutes = context.timeAvailable === "rapido" ? 5 : context.timeAvailable === "normal" ? 30 : 120;

  if (scaleMinutes > availableMinutes) {
    return {
      isBlocked: true,
      blockType: "soft",
      reasons: [
        `Aviso: exige ${scaleMinutes} minutos, mas apenas ${availableMinutes} disponíveis`,
      ],
      recommendation: `Agendar mais tempo ou selecionar escala mais rápida (${scale.tempo})`,
    };
  }

  return { isBlocked: false, reasons: [] };
}

/**
 * REGRA 12: Bloqueio por Triagem vs Diagnóstico
 */
export function checkScreeningVsDiagnostic(
  scale: ScaleEntryWithClinicalMetadata,
  context: FilterContext
): BlockingDecision {
  if (context.isFirstEvaluation && scale.prioridade === "monitorizacao") {
    return {
      isBlocked: true,
      blockType: "soft",
      reasons: [
        `Aviso: esta é escala de ACOMPANHAMENTO, não de triagem inicial`,
      ],
      recommendation: `Primeiro use triagem, depois use esta para seguimento`,
    };
  }

  return { isBlocked: false, reasons: [] };
}

/**
 * REGRA 13: Bloqueio por Questão Subjetiva Disfarçada de Teste Direto
 */
export function checkNoSubjectiveQuestionsAsDirectTests(
  scale: ScaleEntryWithClinicalMetadata
): BlockingDecision {
  const { clinicalMetadata, description } = scale;

  // Se diz ser teste direto mas a descrição é sobre observação parental
  const subjectivePatterns = [
    "consegue",
    "conseguem",
    "conseguir",
    "conseguem reconhecer",
    "conseguem ler",
    "conseguem escrever",
    "conseguem falar",
    "conseguem prestar atenção",
    "conseguem se comportar",
    "tem dificuldade",
    "tem problema",
    "mostra sinais de",
  ];

  const hasSubjectiveLanguage = subjectivePatterns.some(
    (pattern) => description.toLowerCase().includes(pattern)
  );

  if (
    clinicalMetadata.instrumentType === "teste_direto_desempenho" &&
    hasSubjectiveLanguage &&
    !clinicalMetadata.directTestComponents?.length
  ) {
    return {
      isBlocked: true,
      blockType: "hard",
      reasons: [
        `🚨 ERRO CONCEITUAL: Classificada como "teste direto" mas descrição é pergunta subjetiva`,
        `Descrição: "${description}"`,
      ],
      recommendation: `Reclassificar como questionário (parental/observacional) ou descrever tarefas objetivas exatas`,
    };
  }

  return { isBlocked: false, reasons: [] };
}

/**
 * APLICAR TODAS AS REGRAS
 */
export function applyAllBlockingRules(
  scale: ScaleEntryWithClinicalMetadata,
  context: FilterContext
): BlockingDecision {
  const allChecks = [
    ...(context.ageMonths !== undefined ? [checkAgeCompatibility(scale, context.ageMonths)] : []),
    checkParentAvailability(scale, context),
    checkSchoolAvailability(scale, context),
    checkProfessionalRequirement(scale, context),
    checkReadingRequirement(scale, context),
    checkWritingRequirement(scale, context),
    checkVerbalLanguageRequirement(scale, context),
    checkDomainCompatibility(scale, context),
    checkMisuseRisk(scale, context),
    checkCollaborationRequirement(scale, context),
    checkTimeRequirement(scale, context),
    checkScreeningVsDiagnostic(scale, context),
    checkNoSubjectiveQuestionsAsDirectTests(scale),
  ].filter(Boolean);

  // Coletar todos os bloqueios
  const allReasons: string[] = [];
  let hardBlock = false;

  for (const check of allChecks) {
    if (check.isBlocked) {
      allReasons.push(...check.reasons);
      if (check.blockType === "hard") {
        hardBlock = true;
      }
    }
  }

  // Se houver qualquer hard block, bloqueia completamente
  if (hardBlock) {
    return {
      isBlocked: true,
      blockType: "hard",
      reasons: allReasons,
    };
  }

  // Se houver soft blocks (avisos), marca como pendente
  if (allReasons.length > 0) {
    return {
      isBlocked: true,
      blockType: "soft",
      reasons: allReasons,
      recommendation: `Escala marcada como PENDENTE por razões acima. Resolva para usar.`,
    };
  }

  return { isBlocked: false, reasons: [] };
}
