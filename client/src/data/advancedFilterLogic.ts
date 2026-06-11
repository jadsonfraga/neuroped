// Motor clínico de filtragem de escalas — fonte ÚNICA de verdade do /filtro.
//
// Princípios (segurança > clicabilidade):
//  - Filtros obrigatórios (idade, queixa, respondente) + bloqueios clínicos duros.
//  - SEM fallback para o catálogo inteiro: quando nada é seguro, retorna [].
//  - appRoute é apenas desempate leve, nunca transforma escala inadequada em Ouro.
//  - Honestidade: distingue aplicação completa de ficha/metadado/externo.

import {
  type ScaleEntry,
  type Respondente,
  type ApplicationMode,
  type AssessmentUse,
  type ImplementationStatus,
} from "./scaleFilter";

export const SAFE_EMPTY_MESSAGE =
  "Nenhuma escala segura encontrada para este perfil. Revise idade, queixa ou respondente.";

export interface FilterContext {
  queixas: string[];
  ageMonths: number | null; // representativo (midpoint da faixa) — usado em score e limiares de bloqueio
  ageBand?: { min: number; max: number } | null; // faixa selecionada em meses — usada para SOBREPOSIÇÃO de idade
  respondente?: Respondente | null;
  isVerbal?: boolean | null; // a criança é verbal?
  isLiterate?: boolean | null; // a criança é alfabetizada?
  assessmentUse?: AssessmentUse | null; // finalidade clínica desejada
  selectedSignals?: string[];
}

export interface RefinedScaleMatch {
  scale: ScaleEntry;
  relevanceScore: number; // 0-100
  clinicalReason: string;
  warningFlags: string[];
  tier: "gold" | "silver" | "bronze" | "conditional";
  confidenceLevel: number; // 0-100
  implementationStatus: ImplementationStatus;
  implementationLabel: string;
  applicationMode: ApplicationMode;
  licenseRestricted: boolean;
}

const POST_CONSULT_QUEIXAS = new Set(["efeitos", "evolucao"]);

// ============ DERIVAÇÕES (campos opcionais => valor seguro padrão) ============

export function isLicenseRestricted(scale: ScaleEntry): boolean {
  return (
    scale.licencaUso === "restrita" ||
    scale.licencaUso === "comercial" ||
    scale.licencaUso === "contato_autor"
  );
}

/**
 * Status real de implementação no app. Regra honesta:
 *  - escala com licença restrita/comercial => external_only (nunca embutir itens/escore);
 *  - rota /generic-scale/* => apenas ficha técnica (metadata_only);
 *  - rota dedicada e livre/autoral => aplicação completa;
 *  - sem rota => não implementada.
 */
export function getImplementationStatus(scale: ScaleEntry): ImplementationStatus {
  if (scale.implementationStatus) return scale.implementationStatus;
  const route = scale.appRoute;
  if (!route) return isLicenseRestricted(scale) ? "external_only" : "not_implemented";
  if (isLicenseRestricted(scale)) return "external_only";
  if (route.startsWith("/generic-scale/")) return "metadata_only";
  return "complete";
}

export function getImplementationLabel(status: ImplementationStatus): string {
  switch (status) {
    case "complete":
      return "Aplicação completa disponível no app.";
    case "metadata_only":
      return "Ficha técnica disponível; aplicação ainda não implementada.";
    case "external_only":
      return "Instrumento externo/licenciado; não embutir itens ou escore sem permissão.";
    case "not_implemented":
      return "Recomendação clínica; aplicação não disponível no app.";
  }
}

/** Modo concreto de aplicação. Deriva do respondente quando não declarado. */
export function getApplicationMode(scale: ScaleEntry): ApplicationMode {
  if (scale.applicationMode) return scale.applicationMode;
  const r = scale.respondente;
  if (r.includes("teste_direto_crianca")) return "teste_direto_crianca";
  if (r.includes("professor")) return "questionario_professor";
  if (r.includes("pais")) return "questionario_pais";
  if (r.includes("autoaplicavel")) return "autoquestionario_crianca_adolescente";
  if (r.includes("clinico")) {
    return scale.prioridade === "monitorizacao" ? "registro_clinico" : "observacional_clinico";
  }
  // "crianca" legado, isolado e ambíguo: trata como autoquestionário (mais restritivo por idade),
  // evitando que vire "teste direto" sem evidência explícita.
  if (r.includes("crianca")) return "autoquestionario_crianca_adolescente";
  return "registro_clinico";
}

/** Finalidade clínica. Deriva da prioridade quando não declarada. */
export function getAssessmentUse(scale: ScaleEntry): AssessmentUse {
  if (scale.assessmentUse) return scale.assessmentUse;
  if (scale.prioridade === "diagnostica") return "diagnostico";
  if (scale.prioridade === "monitorizacao") return "monitorizacao";
  return "triagem";
}

// ============ CLASSIFICAÇÃO CLÍNICA AUXILIAR ============

function isSuicideInstrument(scale: ScaleEntry): boolean {
  const id = scale.id.toLowerCase();
  const text = `${scale.name} ${scale.fullName}`.toLowerCase();
  return (
    scale.queixas.includes("suicidio") ||
    /suicide|suic[ií]d|self-harm|autoles|ask suicide|c-?ssrs|ecar-si/.test(`${id} ${text}`)
  );
}

function isPsychosisInstrument(scale: ScaleEntry): boolean {
  const id = scale.id.toLowerCase();
  const text = `${scale.name} ${scale.fullName}`.toLowerCase();
  return (
    scale.queixas.includes("psicose") ||
    /psicos|psychosis|mania|bipolar|sips|panss|prodrom|prime/.test(`${id} ${text}`)
  );
}

// ============ BLOQUEIOS CLÍNICOS DUROS (req. de segurança) ============
// Retorna a razão do bloqueio, ou null se a escala é segura para o contexto.

export function clinicalHardBlock(scale: ScaleEntry, ctx: FilterContext): string | null {
  const age = ctx.ageMonths;

  // Idade fora do range do instrumento. Com faixa (ageBand) usa SOBREPOSIÇÃO
  // (a escala cobre algum ponto da faixa selecionada) — restaura a semântica
  // correta e evita excluir escalas estreitas/neonatais que tangenciam a faixa.
  if (ctx.ageBand) {
    const overlaps = scale.ageMax >= ctx.ageBand.min && scale.ageMin <= ctx.ageBand.max;
    if (!overlaps) return "Fora da faixa etária do instrumento";
  } else if (age !== null && (age < scale.ageMin || age > scale.ageMax)) {
    return "Fora da faixa etária do instrumento";
  }

  // Suicídio/autolesão: requer ≥ 8 anos (96 meses).
  if (isSuicideInstrument(scale) && age !== null && age < 96) {
    return "Risco de suicídio requer ≥ 8 anos";
  }

  // Psicose/mania: requer ≥ 12 anos (144 meses).
  if (isPsychosisInstrument(scale) && age !== null && age < 144) {
    return "Psicose/mania requer ≥ 12 anos";
  }

  const mode = getApplicationMode(scale);

  // Autoquestionário: requer ≥ 8 anos.
  if (mode === "autoquestionario_crianca_adolescente" && age !== null && age < 96) {
    return "Autoaplicável requer ≥ 8 anos";
  }

  // Alfabetização obrigatória.
  const litReq = scale.literacyRequirement ?? "indiferente";
  if (litReq === "alfabetizado") {
    if (ctx.isLiterate === false) return "Requer criança alfabetizada";
    if (ctx.isLiterate == null && age !== null && age < 72) return "Requer alfabetização";
  }

  // Linguagem verbal obrigatória.
  if ((scale.verbalRequirement ?? "indiferente") === "verbal" && ctx.isVerbal === false) {
    return "Requer linguagem verbal";
  }

  // TDAH clássico como queixa principal: não recomendado abaixo de 4 anos (48 meses).
  // Bloqueia escalas que entram pelo TDAH, salvo se o usuário também pediu outra
  // queixa (comportamento/atraso/etc.) que a própria escala cobre — aí ela entra por essa via.
  if (age !== null && age < 48 && scale.queixas.includes("tdah")) {
    const matchesOtherSelectedQueixa = ctx.queixas.some((q) => q !== "tdah" && scale.queixas.includes(q));
    if (!matchesOtherSelectedQueixa) {
      return "TDAH não recomendado como principal abaixo de 4 anos";
    }
  }

  return null;
}

// ============ FILTROS OBRIGATÓRIOS ============

function passesMandatoryFilters(scale: ScaleEntry, ctx: FilterContext): boolean {
  // Queixa: ao menos uma das selecionadas.
  if (ctx.queixas.length > 0 && !scale.queixas.some((q) => ctx.queixas.includes(q))) {
    return false;
  }

  // Respondente.
  if (ctx.respondente && !scale.respondente.includes(ctx.respondente)) {
    return false;
  }

  // Contexto de monitorização/seguimento (req. 7):
  //  - se o usuário pediu monitorização/seguimento OU selecionou queixa pós-consulta
  //    (efeitos/evolução), o contexto é de monitorização e escalas de monitorização entram;
  //  - caso contrário (pré-consulta/diagnóstico), escalas de monitorização ficam de fora,
  //    para não poluir a triagem com satisfação medicamentosa, adesão etc.
  const monitoringContext =
    ctx.assessmentUse === "monitorizacao" ||
    ctx.assessmentUse === "seguimento" ||
    ctx.queixas.some((q) => POST_CONSULT_QUEIXAS.has(q));
  const scaleUse = getAssessmentUse(scale);
  const scaleIsPostConsult =
    scale.prioridade === "monitorizacao" ||
    scaleUse === "monitorizacao" ||
    scaleUse === "seguimento" ||
    scaleUse === "psicoeducacao" ||
    scale.queixas.some((q) => POST_CONSULT_QUEIXAS.has(q));
  if (!monitoringContext && scaleIsPostConsult) return false;

  return true;
}

// ============ SCORING REFINADO (nova hierarquia clínica) ============

export function calculateRefinedScore(scale: ScaleEntry, ctx: FilterContext): RefinedScaleMatch {
  const reasons: string[] = [];
  const warnings: string[] = [];
  let score = 0;

  // 1. Compatibilidade etária (0–30).
  const age = ctx.ageMonths;
  if (age === null) {
    score += 18;
  } else {
    const rangeSize = Math.max(1, scale.ageMax - scale.ageMin);
    const midpoint = scale.ageMin + rangeSize / 2;
    const percentFromMid = (Math.abs(age - midpoint) / (rangeSize / 2)) * 100;
    if (percentFromMid < 25) {
      score += 30;
      reasons.push("Idade ideal para o instrumento");
    } else if (percentFromMid < 60) {
      score += 24;
      reasons.push("Idade adequada");
    } else {
      score += 16;
      reasons.push("Idade na margem da faixa");
    }
  }

  // 2. Correspondência da queixa (0–28).
  if (ctx.queixas.length === 0) {
    score += 14;
  } else {
    const matchCount = scale.queixas.filter((q) => ctx.queixas.includes(q)).length;
    if (matchCount === ctx.queixas.length) {
      score += 28;
      reasons.push(`Cobre todas as ${ctx.queixas.length} queixa(s)`);
    } else if (matchCount > 0) {
      score += 16 + matchCount * 4;
      reasons.push(`Cobre ${matchCount} de ${ctx.queixas.length} queixas`);
    }
  }

  // 3. Finalidade clínica (0–15).
  const use = getAssessmentUse(scale);
  if (!ctx.assessmentUse) {
    score += 8;
  } else if (use === ctx.assessmentUse) {
    score += 15;
    reasons.push(`Finalidade: ${use}`);
  } else if (
    (ctx.assessmentUse === "monitorizacao" && use === "seguimento") ||
    (ctx.assessmentUse === "seguimento" && use === "monitorizacao") ||
    (ctx.assessmentUse === "diagnostico" && use === "triagem")
  ) {
    score += 9;
  } else {
    score += 4;
  }

  // 4. Respondente (0–10).
  if (!ctx.respondente) {
    score += 6;
  } else if (scale.respondente.includes(ctx.respondente)) {
    score += 10;
    reasons.push(`Respondente: ${ctx.respondente}`);
  }

  // 5. Modo de aplicação coerente com o respondente pedido (0–8).
  const mode = getApplicationMode(scale);
  if (!ctx.respondente) {
    score += 5;
  } else {
    const respondentMode: Partial<Record<Respondente, ApplicationMode>> = {
      pais: "questionario_pais",
      professor: "questionario_professor",
      autoaplicavel: "autoquestionario_crianca_adolescente",
      teste_direto_crianca: "teste_direto_crianca",
    };
    score += respondentMode[ctx.respondente] === mode ? 8 : 4;
  }

  // 6. Licença de uso (0–5).
  const licenseRestricted = isLicenseRestricted(scale);
  if (scale.licencaUso === "livre") score += 5;
  else if (scale.licencaUso === "autoral") score += 4;
  else if (scale.licencaUso === "comercial") score += 2;
  else if (scale.licencaUso === "restrita" || scale.licencaUso === "contato_autor") score += 1;
  else score += 3;

  // 7. Status real de implementação (0–4).
  const implementationStatus = getImplementationStatus(scale);
  const implScore: Record<ImplementationStatus, number> = {
    complete: 4,
    metadata_only: 2,
    external_only: 1,
    not_implemented: 0,
  };
  score += implScore[implementationStatus];

  // 8. appRoute: apenas desempate leve (+2). Nunca decide sozinho um tier.
  if (scale.appRoute) score += 2;

  // ---- Avisos (não alteram a pertinência, mas a honestidade clínica) ----
  if (licenseRestricted) {
    warnings.push(`Licença ${scale.licencaUso} — não embutir itens/escore sem permissão.`);
  }
  if (isSuicideInstrument(scale)) {
    warnings.push("⚠️ Risco suicida — requer avaliação clínica imediata.");
  }
  if (isPsychosisInstrument(scale)) {
    warnings.push("⚠️ Suspeita de psicose/mania — encaminhamento especializado.");
  }

  const relevanceScore = Math.min(100, Math.round(score));

  let tier: RefinedScaleMatch["tier"] = "conditional";
  if (relevanceScore >= 80) tier = "gold";
  else if (relevanceScore >= 62) tier = "silver";
  else if (relevanceScore >= 45) tier = "bronze";

  return {
    scale,
    relevanceScore,
    clinicalReason: reasons.join(" • "),
    warningFlags: warnings,
    tier,
    confidenceLevel: calculateConfidenceLevel(ctx, relevanceScore),
    implementationStatus,
    implementationLabel: getImplementationLabel(implementationStatus),
    applicationMode: mode,
    licenseRestricted,
  };
}

function calculateConfidenceLevel(ctx: FilterContext, score: number): number {
  const completeness =
    (ctx.queixas.length > 0 ? 1 : 0) +
    (ctx.ageMonths !== null ? 1 : 0) +
    (ctx.respondente ? 1 : 0) +
    (ctx.assessmentUse ? 1 : 0);
  return Math.min(100, Math.round(score * 0.8 + completeness * 5));
}

// ============ FILTRAGEM INTELIGENTE (sem fallback) ============

export function filterScalesIntelligently(
  scales: ScaleEntry[],
  ctx: FilterContext
): RefinedScaleMatch[] {
  const candidates = scales.filter(
    (scale) => passesMandatoryFilters(scale, ctx) && clinicalHardBlock(scale, ctx) === null
  );

  const tierOrder = { gold: 0, silver: 1, bronze: 2, conditional: 3 };
  return candidates
    .map((scale) => calculateRefinedScore(scale, ctx))
    .sort((a, b) => {
      if (b.relevanceScore !== a.relevanceScore) return b.relevanceScore - a.relevanceScore;
      if (tierOrder[a.tier] !== tierOrder[b.tier]) return tierOrder[a.tier] - tierOrder[b.tier];
      // desempate final por usabilidade (rota disponível), depois nome.
      const ar = a.scale.appRoute ? 1 : 0;
      const br = b.scale.appRoute ? 1 : 0;
      if (ar !== br) return br - ar;
      return a.scale.name.localeCompare(b.scale.name);
    });
  // IMPORTANTE: sem fallback para o catálogo inteiro — pode retornar [].
}

// ============ DETECÇÃO DE PADRÃO CLÍNICO ============

export function detectClinicalPattern(context: FilterContext): string {
  const { queixas, selectedSignals = [] } = context;

  if (queixas.includes("tdah")) {
    if (selectedSignals.some((s) => s.includes("hiperatividade"))) return "TDAH com hiperatividade predominante";
    if (selectedSignals.some((s) => s.includes("desatenção"))) return "TDAH com desatenção predominante";
    return "TDAH misto";
  }

  if (queixas.includes("tea")) {
    const hasLanguage = selectedSignals.some((s) => s.includes("linguagem"));
    const hasSocial = selectedSignals.some((s) => s.includes("social"));
    if (hasLanguage && hasSocial) return "TEA com déficit social-comunicativo";
    if (hasLanguage) return "TEA com atraso de linguagem";
    return "Suspeita TEA";
  }

  if (queixas.includes("atraso")) {
    const hasMotor = selectedSignals.some((s) => s.includes("motor"));
    const hasLanguage = selectedSignals.some((s) => s.includes("linguagem"));
    if (hasMotor && hasLanguage) return "Atraso desenvolvimento global";
    if (hasMotor) return "Atraso motor";
    if (hasLanguage) return "Atraso de linguagem";
    return "Suspeita atraso desenvolvimento";
  }

  return "Avaliação geral";
}

// ============ SÍNTESE CLÍNICA ============

export function generateContextualRecommendation(matches: RefinedScaleMatch[]): string {
  if (matches.length === 0) return SAFE_EMPTY_MESSAGE;

  const gold = matches.find((m) => m.tier === "gold");
  if (gold) return `Recomendado: ${gold.scale.name} — ${gold.clinicalReason}`;

  const silver = matches.find((m) => m.tier === "silver");
  if (silver) return `Segunda opção: ${silver.scale.name} — ${silver.clinicalReason}`;

  return `Disponível com ressalvas: ${matches[0].scale.name}`;
}
