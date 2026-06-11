/**
 * GERADOR AUTOMÁTICO DE METADATA CLÍNICA
 *
 * Estratégia pragmática: em vez de editar manualmente 414 escalas,
 * gerar metadata inteligentemente baseado em padrões + mappings.
 */

import type {
  ClinicalScaleMetadata,
  InstrumentCategory,
  AdministrationMode,
  MisuseRisk,
} from "@/types/ClinicalScaleMetadata";
import type { ScaleEntry } from "@/data/scaleFilter";

/**
 * Inferir categoria de instrumento baseado em respondente
 */
function inferInstrumentType(
  respondente: string[],
  appRoute?: string
): InstrumentCategory {
  // Se tem appRoute e respondente inclui clinico, provavelmente teste direto
  if (appRoute && respondente.includes("clinico")) {
    return "teste_direto_desempenho";
  }

  // Se só responde pais
  if (respondente.includes("pais") && !respondente.includes("autoaplicavel")) {
    return "questionario_parental";
  }

  // Se só respondealc uloaplicável
  if (respondente.includes("autoaplicavel") && !respondente.includes("pais")) {
    return "autorrelato_crianca";
  }

  // Se respondente inclui professor
  if (respondente.includes("professor")) {
    return "questionario_escolar";
  }

  // Default: questionário profissional (clínico preenche)
  return "questionario_profissional";
}

/**
 * Inferir modo de administração baseado em tipo de escala
 */
function inferAdministrationMode(
  instrumentType: InstrumentCategory,
  tempo: string
): AdministrationMode {
  if (instrumentType === "teste_direto_desempenho") {
    return "teste_direto_tarefa";
  }

  if (instrumentType === "autorrelato_crianca") {
    return "questionario";
  }

  if (tempo.toLowerCase().includes("registro") ||
      tempo.toLowerCase().includes("diario")) {
    return "registro_continuo";
  }

  if (tempo.toLowerCase().includes("entrevista")) {
    return "entrevista";
  }

  if (tempo.includes("5 min") || tempo.includes("3 min")) {
    return "checklist_comportamental";
  }

  return "questionario";
}

/**
 * Detectar risco de mau uso baseado em nome e descrição
 */
function inferMisuseRisk(id: string, name: string, _description: string): MisuseRisk {
  const veryHighRiskIds = ["ados2", "adir", "wisc5", "wppsi", "sips", "sops"];
  const highRiskIds = ["nnns", "nbas", "napi", "leiter", "kabc2"];

  if (veryHighRiskIds.some((rid) => id.toLowerCase().includes(rid))) {
    return "muito_alto";
  }

  if (highRiskIds.some((rid) => id.toLowerCase().includes(rid))) {
    return "alto";
  }

  if (
    name.toLowerCase().includes("cognitive") ||
    name.toLowerCase().includes("neuropsych")
  ) {
    return "moderado";
  }

  return "baixo";
}

/**
 * Detectar se exige leitura baseado em descrição
 */
function inferRequiresReading(description: string): boolean {
  const readingKeywords = [
    "leitura",
    "read",
    "palavra",
    "texto",
    "escrita",
    "write",
    "frase",
    "vocabulário",
    "fonologia",
    "dislexia",
    "compreensao",
    "comprehension",
  ];

  return readingKeywords.some((kw) =>
    description.toLowerCase().includes(kw)
  );
}

/**
 * Detectar se exige escrita baseado em descrição
 */
function inferRequiresWriting(description: string): boolean {
  const writingKeywords = [
    "escrita",
    "write",
    "soletração",
    "spelling",
    "composição",
    "redação",
  ];

  return writingKeywords.some((kw) =>
    description.toLowerCase().includes(kw)
  );
}

/**
 * Detectar habilidades motoras requeridas
 */
function inferMotorRequirement(description: string, _id: string): "nenhum" | "motor_grosso" | "motor_fino" | "ambos" {
  const fineMotorKeywords = [
    "apontar",
    "ponto",
    "pega",
    "grafia",
    "desenho",
    "cópia",
    "motora fina",
    "fine motor",
    "pointing",
    "pointing",
  ];

  const grossMotorKeywords = [
    "marcha",
    "marchar",
    "motor grosso",
    "gross motor",
    "equilíbrio",
    "balance",
    "movimento",
    "jump",
    "throw",
    "catch",
  ];

  const hasFineMotor = fineMotorKeywords.some((kw) =>
    description.toLowerCase().includes(kw)
  );
  const hasGrossMotor = grossMotorKeywords.some((kw) =>
    description.toLowerCase().includes(kw)
  );

  if (hasFineMotor && hasGrossMotor) return "ambos";
  if (hasFineMotor) return "motor_fino";
  if (hasGrossMotor) return "motor_grosso";
  return "nenhum";
}

/**
 * GERADOR PRINCIPAL: Criar metadata completa para escala
 */
export function generateClinicalMetadata(scale: ScaleEntry): ClinicalScaleMetadata {
  const instrumentType = inferInstrumentType(scale.respondente, scale.appRoute);
  const administrationMode = inferAdministrationMode(
    instrumentType,
    scale.tempo
  );
  const misuseRisk = inferMisuseRisk(scale.id, scale.name, scale.description);
  const requiresReading = inferRequiresReading(scale.description);
  const requiresWriting = inferRequiresWriting(scale.description);
  const motorRequirement = inferMotorRequirement(scale.description, scale.id);

  return {
    // Classificação
    instrumentType,
    administrationMode,
    clinicalDescription: scale.description,

    // Respondentes
    requiresParent: scale.respondente.includes("pais"),
    requiresSchool: scale.respondente.includes("professor"),
    requiresProfessional:
      scale.respondente.includes("clinico") &&
      instrumentType === "questionario_profissional",
    requiresChildPresence:
      scale.respondente.includes("clinico") ||
      scale.respondente.includes("autoaplicavel"),
    requiresMinimumCollaboration:
      scale.respondente.includes("autoaplicavel") ||
      scale.respondente.includes("clinico"),

    // Habilidades da criança
    requiresVerbalLanguage: scale.queixas.includes("linguagem"),
    requiresLanguageComprehension: scale.queixas.includes("linguagem"),
    requiresReading,
    minReadingLevel: requiresReading ? "nivel2" : undefined,
    requiresWriting,
    minWritingLevel: requiresWriting ? "copia" : undefined,
    motorRequirement,
    requiresSustainedAttention: scale.queixas.includes("tdah") ||
      scale.queixas.includes("cognicao"),
    requiresAbstractThinking: scale.queixas.includes("cognicao"),

    // Testes diretos (por enquanto vazio, mas pode ser preenchido manualmente)
    directTestComponents: undefined,

    // Múltiplas formas
    hasFormVariants: false,

    // Contextos
    isScreeningTool: scale.prioridade === "triagem",
    isMonitoringTool: scale.prioridade === "monitorizacao",
    isDiagnosticSupport: scale.prioridade === "diagnostica",
    isFunctionalAssessment: scale.queixas.includes("funcionalidade"),

    // Segurança
    contraindications: [],
    restrictions: scale.licencaUso === "comercial"
      ? ["Material propriedade do editor — não fotocopiar"]
      : [],
    misuseRisk,
    misuseRiskExplanation:
      misuseRisk === "muito_alto"
        ? "Requer profissional altamente treinado e licenciado"
        : misuseRisk === "alto"
        ? "Requer aplicação por profissional especializado"
        : undefined,

    // Bloqueios
    blockingRules: generateBlockingRules(scale, instrumentType),

    // Recomendações
    recommendedWhen: [
      `Avaliação de ${scale.queixas.join("/")} em ${scale.ageMin}-${scale.ageMax} meses`,
    ],
    avoidWhen: [],
  };
}

/**
 * Gerar bloqueios automáticos baseado em propriedades da escala
 */
function generateBlockingRules(
  scale: ScaleEntry,
  _instrumentType: InstrumentCategory
) {
  const rules = [];

  // Bloqueio por idade
  rules.push({
    id: "age_check",
    condition: `age < ${scale.ageMin} || age > ${scale.ageMax}`,
    userExplanation: `Fora da faixa etária (${scale.ageMin}-${scale.ageMax} meses)`,
    blockType: "hard" as const,
    severity: "hard" as const,
  });

  // Bloqueio por pais
  if (scale.respondente.includes("pais")) {
    rules.push({
      id: "requires_parent",
      condition: "parent_not_available",
      userExplanation: "Exige resposta de pais/responsáveis",
      blockType: "soft" as const,
      severity: "soft" as const,
    });
  }

  // Bloqueio por escola
  if (scale.respondente.includes("professor")) {
    rules.push({
      id: "requires_school",
      condition: "school_not_available",
      userExplanation: "Exige resposta de professor/escola",
      blockType: "soft" as const,
      severity: "soft" as const,
    });
  }

  // Bloqueio por risco muito alto
  if (["muito_alto", "alto"].includes(
    inferMisuseRisk(scale.id, scale.name, scale.description)
  )) {
    rules.push({
      id: "high_misuse_risk",
      condition: "not_in_clinic_with_professional",
      userExplanation: "Exige aplicação por profissional",
      blockType: "hard" as const,
      severity: "hard" as const,
    });
  }

  return rules;
}
