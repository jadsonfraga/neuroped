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
import { INTERACTIVE_SCALE_IDS } from "./interactiveScaleIds.generated";
import { getAllSignalsForQueixa } from "./signalsAndSymptoms";
import { popularSymptomById } from "./popularSymptoms";

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
  signalSpecificityScore?: number;
  /** true quando veio do fallback de triagem ampla (sem instrumento específico). */
  isBroadbandFallback?: boolean;
}

const POST_CONSULT_QUEIXAS = new Set(["efeitos", "evolucao"]);
const ACUTE_RISK_QUEIXAS = new Set(["suicidio", "psicose"]);

/**
 * Contextos de risco agudo nunca recebem um rastreador de outro domínio só
 * para completar três posições. Ausência de instrumento específico seguro é
 * uma saída clínica válida e deve direcionar para avaliação de segurança.
 */
export function isAcuteRiskContext(
  ctx: Pick<FilterContext, "queixas">,
): boolean {
  return ctx.queixas.some((queixa) => ACUTE_RISK_QUEIXAS.has(queixa));
}

const SIGNAL_TAGS_BY_SCALE_ID: Record<string, string[]> = {
  mchat: [
    "tea",
    "social",
    "comunicacao",
    "linguagem",
    "gestos",
    "atencao compartilhada",
    "resposta nome",
    "triagem precoce",
  ],
  cars: [
    "tea",
    "social",
    "comunicacao",
    "sensorial",
    "rrb",
    "rigidez",
    "funcionalidade",
    "diagnostico",
  ],
  srs2: [
    "tea",
    "social",
    "reciprocidade",
    "pragmatica",
    "camuflagem",
    "amizade",
    "professor",
    "pais",
  ],
  scq: ["tea", "social", "comunicacao", "rrb", "pais"],
  assq: ["tea", "social", "pragmatica", "escolar", "amizade", "adolescente"],
  cast: ["tea", "social", "comunicacao", "escolar", "amizade"],
  gars3: ["tea", "social", "comunicacao", "sensorial", "rrb", "funcionalidade"],
  atec: [
    "tea",
    "linguagem",
    "social",
    "sensorial",
    "funcionalidade",
    "monitorizacao",
  ],
  "podj-tea-prime-familiar": [
    "tea",
    "social",
    "linguagem",
    "comunicacao",
    "sensorial",
    "funcionalidade",
    "rigidez",
    "camuflagem",
    "familia",
    "regressao",
  ],
  "podj-tea-prime-escola-terapia": [
    "tea",
    "social",
    "pragmatica",
    "sensorial",
    "funcionalidade",
    "aprendizagem",
    "escola",
    "terapia",
    "pervasividade",
  ],
  "podj-tea-prime-1-6a": [
    "tea",
    "atraso",
    "linguagem",
    "gestos",
    "atencao compartilhada",
    "brincadeira",
    "sensorial",
    "seletividade",
    "funcionalidade",
    "nao verbal",
  ],
  "podj-tea-prime-6-12a": [
    "tea",
    "social",
    "pragmatica",
    "amizade",
    "bullying",
    "rigidez",
    "hiperfoco",
    "sensorial",
    "funcionalidade",
    "aprendizagem",
  ],
  "podj-tea-prime-12-19a": [
    "tea",
    "social",
    "camuflagem",
    "exaustao social",
    "vulnerabilidade",
    "autonomia",
    "funcionalidade",
    "ansiedade",
    "rigidez",
    "sensorial",
  ],
  snap: [
    "tdah",
    "desatencao",
    "hiperatividade",
    "impulsividade",
    "pais",
    "professor",
    "dsm",
  ],
  vanderbilt: [
    "tdah",
    "desatencao",
    "hiperatividade",
    "impulsividade",
    "comportamento",
    "oposicao",
    "escola",
    "pais",
    "professor",
  ],
  conners: [
    "tdah",
    "desatencao",
    "hiperatividade",
    "impulsividade",
    "comportamento",
    "aprendizagem",
    "executivo",
  ],
  brief2: [
    "tdah",
    "funcao executiva",
    "inibicao",
    "memoria trabalho",
    "planejamento",
    "flexibilidade",
    "organizacao",
  ],
  cbcl: [
    "comportamento",
    "ansiedade",
    "depressao",
    "social",
    "agressao",
    "externalizante",
    "internalizante",
  ],
  sdq: [
    "comportamento",
    "emocional",
    "hiperatividade",
    "pares",
    "prosocial",
    "triagem",
  ],
  basc3: [
    "comportamento",
    "ansiedade",
    "depressao",
    "social",
    "adaptativo",
    "aprendizagem",
    "banda larga",
  ],
  psc17: [
    "comportamento",
    "tdah",
    "ansiedade",
    "depressao",
    "internalizante",
    "externalizante",
    "atencao",
  ],
  asq3: [
    "atraso",
    "desenvolvimento",
    "motor",
    "linguagem",
    "comunicacao",
    "cognicao",
    "precoce",
  ],
  "asq-se-2": [
    "social",
    "emocional",
    "comportamento",
    "autonomia",
    "funcionalidade",
    "precoce",
  ],
  denver: [
    "atraso",
    "desenvolvimento",
    "motor",
    "linguagem",
    "social",
    "adaptativo",
  ],
  vineland: [
    "funcionalidade",
    "autonomia",
    "comunicacao",
    "social",
    "vida diaria",
    "adaptativo",
  ],
  ablls: ["linguagem", "aprendizagem", "funcionalidade", "tea", "habilidades"],
};

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
 *  - rota DEDICADA (página própria construída no app, ex.: /denver, /asq3) =>
 *    aplicação completa — a ferramenta já existe no app (itens + escore), então
 *    o instrumento entra no filtro e é recomendável, mesmo sendo licenciado;
 *  - rota /generic-scale/* => ficha técnica; licenciada vira external_only;
 *  - interativa por itens (interactiveScaleItems) e livre => aplicação completa;
 *  - sem rota => external_only (licenciada) ou não implementada.
 *
 * O gate de licença NÃO deve esconder instrumentos padrão-ouro que já têm página
 * dedicada implementada (Denver, ASQ-3, CARS, Conners, BRIEF-2, CBCL, ABC, CDI-2,
 * CSHQ, Vineland, PedsQL): o filtro precisa nomeá-los como 1ª linha clínica.
 */
export function getImplementationStatus(
  scale: ScaleEntry,
): ImplementationStatus {
  if (scale.implementationStatus) return scale.implementationStatus;
  const route = scale.appRoute;
  const hasDedicatedPage =
    !!route &&
    !route.startsWith("/generic-scale/") &&
    route !== "/escalas-neuropsiquiatria" &&
    route !== "/filtro";
  if (hasDedicatedPage) return "complete";
  // Aplicação interativa em qualquer dos dois acervos: itens (GenericScale)
  // ou runner (InteractiveScaleRunner) — ambos abrem em /generic-scale/:id.
  if (INTERACTIVE_SCALE_IDS.has(scale.id) && !isLicenseRestricted(scale))
    return "complete";
  if (!route)
    return isLicenseRestricted(scale) ? "external_only" : "not_implemented";
  if (isLicenseRestricted(scale)) return "external_only";
  if (route.startsWith("/generic-scale/")) return "metadata_only";
  return "complete";
}

export function getImplementationLabel(status: ImplementationStatus): string {
  switch (status) {
    case "complete":
      return "Aplicação completa disponível no app.";
    case "metadata_only":
      return "Ficha técnica disponível; itens oficiais podem depender de autorização ou acesso à fonte licenciada.";
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
  if (r.includes("autoaplicavel"))
    return "autoquestionario_crianca_adolescente";
  if (r.includes("clinico")) {
    return scale.prioridade === "monitorizacao"
      ? "registro_clinico"
      : "observacional_clinico";
  }
  // "crianca" legado, isolado e ambíguo: trata como autoquestionário (mais restritivo por idade),
  // evitando que vire "teste direto" sem evidência explícita.
  if (r.includes("crianca")) return "autoquestionario_crianca_adolescente";
  return "registro_clinico";
}

/** Finalidade clínica. Deriva da prioridade/queixa quando não declarada. */
export function getAssessmentUse(scale: ScaleEntry): AssessmentUse {
  if (scale.assessmentUse) return scale.assessmentUse;
  if (scale.prioridade === "diagnostica") return "diagnostico";
  // Seguimento (reavaliação/evolução) é distinto de monitorização contínua.
  const text = `${scale.id} ${scale.name} ${scale.fullName}`.toLowerCase();
  // NÃO usar "follow" aqui: aparece em nomes (ex.: M-CHAT-R/F "Follow-Up") e
  // classificaria errado um instrumento de triagem como seguimento.
  if (
    scale.queixas.includes("evolucao") ||
    /reavalia[çc]|seguimento|evolu[çc][ãa]o/.test(text)
  ) {
    return "seguimento";
  }
  if (scale.prioridade === "monitorizacao") return "monitorizacao";
  return "triagem";
}

/**
 * Exigência de alfabetização. Regra conservadora:
 *  - autoquestionário (a criança lê e responde sozinha) => requer alfabetização,
 *    EXCETO instrumentos pictóricos/de faces (a criança aponta figura);
 *  - demais modos (pais/professor/clínico/teste direto observacional) => indiferente.
 * Override explícito (scale.literacyRequirement) sempre tem prioridade.
 */
export function getLiteracyRequirement(
  scale: ScaleEntry,
): "indiferente" | "alfabetizado" | "pre_alfabetizado" {
  if (scale.literacyRequirement) return scale.literacyRequirement;
  const text = `${scale.id} ${scale.name} ${scale.fullName}`.toLowerCase();
  const pictorial =
    /faces|wong|baker|visual.?anal|pict[óo]ric|figura|emoji|smiley|flacc/.test(
      text,
    );
  if (
    getApplicationMode(scale) === "autoquestionario_crianca_adolescente" &&
    !pictorial
  ) {
    return "alfabetizado";
  }
  return "indiferente";
}

/**
 * Exigência de linguagem verbal. Regra conservadora:
 *  - testes cognitivos NÃO-verbais (Leiter/Raven/TONI/matrizes) => nao_verbal_compativel
 *    (devem aparecer justamente para crianças não-verbais);
 *  - avaliação DIRETA de linguagem expressiva/fala/nomeação => verbal
 *    (a criança precisa falar);
 *  - demais => indiferente.
 * Override explícito (scale.verbalRequirement) sempre tem prioridade.
 */
export function getVerbalRequirement(
  scale: ScaleEntry,
): "indiferente" | "verbal" | "nao_verbal_compativel" {
  if (scale.verbalRequirement) return scale.verbalRequirement;
  const text = `${scale.id} ${scale.name} ${scale.fullName}`.toLowerCase();
  if (
    /leiter|raven|toni|matriz|n[aã]o-?verbal|nonverbal|naglieri|\bwnv\b|pictorial/.test(
      text,
    )
  ) {
    return "nao_verbal_compativel";
  }
  const mode = getApplicationMode(scale);
  const childPerforms =
    mode === "teste_direto_crianca" ||
    mode === "observacional_clinico" ||
    mode === "autoquestionario_crianca_adolescente";
  if (
    childPerforms &&
    /flu[êe]ncia verbal|linguagem (expressiva|oral)|express[ãa]o oral|nomea[çc][ãa]o|vocabul[áa]rio expressivo|articula[çc]|fonol[óo]gic|narrativ|fala\b/.test(
      text,
    )
  ) {
    return "verbal";
  }
  return "indiferente";
}

// ============ CLASSIFICAÇÃO CLÍNICA AUXILIAR ============

// Classificação de segurança. O campo explícito (revisado) SEMPRE tem prioridade
// sobre a inferência por regex — assim uma escala nova cujo nome contenha "mania"
// ou "matriz" não muda um gate de segurança sem revisão humana. Exportadas para o
// guard de CI (validate-safety-metadata), que congela essa classificação.
export function isSuicideInstrument(scale: ScaleEntry): boolean {
  if (typeof scale.suicideRiskInstrument === "boolean")
    return scale.suicideRiskInstrument;
  const id = scale.id.toLowerCase();
  const text = `${scale.name} ${scale.fullName}`.toLowerCase();
  return (
    scale.queixas.includes("suicidio") ||
    /suicide|suic[ií]d|self-harm|autoles|ask suicide|c-?ssrs|ecar-si/.test(
      `${id} ${text}`,
    )
  );
}

export function isPsychosisInstrument(scale: ScaleEntry): boolean {
  if (typeof scale.psychosisRiskInstrument === "boolean")
    return scale.psychosisRiskInstrument;
  const id = scale.id.toLowerCase();
  const text = `${scale.name} ${scale.fullName}`.toLowerCase();
  return (
    scale.queixas.includes("psicose") ||
    /psicos|psychosis|mania|bipolar|sips|panss|prodrom|prime-?screen/.test(
      `${id} ${text}`,
    )
  );
}

// ============ BLOQUEIOS CLÍNICOS DUROS (req. de segurança) ============
// Retorna a razão do bloqueio, ou null se a escala é segura para o contexto.

export function clinicalHardBlock(
  scale: ScaleEntry,
  ctx: FilterContext,
): string | null {
  const age = ctx.ageMonths;

  // Valida que a escala tem campos obrigatórios de idade
  if (!Number.isFinite(scale.ageMin) || !Number.isFinite(scale.ageMax)) {
    return "Escala sem faixa etária definida";
  }

  // Para bloqueios de segurança do tipo "requer idade >= X", uma faixa selecionada
  // (ageBand) precisa ser avaliada pelo seu extremo MAIS NOVO — senão a criança
  // mais nova escaparia do bloqueio (ex.: autoquestionário abaixo de 8 anos ou
  // instrumento de psicose/mania abaixo de 12 anos).
  const youngestAge =
    ctx.ageBand && typeof ctx.ageBand.min === "number" ? ctx.ageBand.min : age;

  // Idade fora do range do instrumento. Com faixa (ageBand) usa SOBREPOSIÇÃO
  // (a escala cobre algum ponto da faixa selecionada) — restaura a semântica
  // correta e evita excluir escalas estreitas/neonatais que tangenciam a faixa.
  if (
    ctx.ageBand &&
    typeof ctx.ageBand.min === "number" &&
    typeof ctx.ageBand.max === "number"
  ) {
    const overlaps =
      scale.ageMax >= ctx.ageBand.min && scale.ageMin <= ctx.ageBand.max;
    if (!overlaps) return "Fora da faixa etária do instrumento";
  } else if (age !== null && (age < scale.ageMin || age > scale.ageMax)) {
    return "Fora da faixa etária do instrumento";
  }

  // Psicose/mania: requer ≥ 12 anos (144 meses).
  if (
    isPsychosisInstrument(scale) &&
    youngestAge !== null &&
    youngestAge < 144
  ) {
    return "Psicose/mania requer ≥ 12 anos";
  }

  const mode = getApplicationMode(scale);

  // Autoquestionário: requer ≥ 8 anos.
  if (
    mode === "autoquestionario_crianca_adolescente" &&
    youngestAge !== null &&
    youngestAge < 96
  ) {
    return "Autoaplicável requer ≥ 8 anos";
  }

  // Alfabetização obrigatória (metadado derivado quando não declarado).
  if (getLiteracyRequirement(scale) === "alfabetizado") {
    if (ctx.isLiterate === false) return "Requer criança alfabetizada";
    if (ctx.isLiterate === null && youngestAge !== null && youngestAge < 72)
      return "Requer alfabetização";
  }

  // Linguagem verbal obrigatória (metadado derivado quando não declarado).
  if (getVerbalRequirement(scale) === "verbal" && ctx.isVerbal === false) {
    return "Requer linguagem verbal";
  }

  // TDAH clássico como queixa principal: não recomendado abaixo de 4 anos (48 meses).
  // Bloqueia escalas que entram pelo TDAH, salvo se o usuário também pediu outra
  // queixa (comportamento/atraso/etc.) que a própria escala cobre — aí ela entra por essa via.
  if (age !== null && age < 48 && scale.queixas.includes("tdah")) {
    const matchesOtherSelectedQueixa = ctx.queixas.some(
      (q) => q !== "tdah" && scale.queixas.includes(q),
    );
    if (!matchesOtherSelectedQueixa) {
      return "TDAH não recomendado como principal abaixo de 4 anos";
    }
  }

  return null;
}

// ============ FILTROS OBRIGATÓRIOS ============

function passesMandatoryFilters(
  scale: ScaleEntry,
  ctx: FilterContext,
): boolean {
  // Queixa: ao menos uma das selecionadas.
  if (
    ctx.queixas.length > 0 &&
    !scale.queixas.some((q) => ctx.queixas.includes(q))
  ) {
    return false;
  }

  // Respondente. Caso especial "Direto": o filtro casa pelo MODO de aplicação
  // (teste direto interativo com a criança), não pelo array de respondente —
  // assim "Direto" traz só os testes diretos interativos.
  if (ctx.respondente) {
    if (ctx.respondente === "teste_direto_crianca") {
      if (getApplicationMode(scale) !== "teste_direto_crianca") return false;
    } else if (!scale.respondente.includes(ctx.respondente)) {
      return false;
    }
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

function normalizeClinicalText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function tokensFromText(value: string): Set<string> {
  const shortValidTokens = new Set([
    "tea",
    "toc",
    "tic",
    "tdah",
    "tda",
    "pc",
    "oab",
    "gad",
    "phq",
    "dbt",
    "tcc",
    "imao",
    "isrs",
    "irsn",
    "atcc",
  ]);
  return new Set(
    normalizeClinicalText(value)
      .split(/\s+/)
      .filter((token) => token.length >= 4 || shortValidTokens.has(token)),
  );
}

function selectedSignalText(ctx: FilterContext): string {
  const ids = new Set(ctx.selectedSignals || []);
  const labels: string[] = [];
  for (const queixa of ctx.queixas) {
    for (const signal of getAllSignalsForQueixa(queixa)) {
      if (ids.has(signal.id)) labels.push(signal.label, signal.description);
    }
  }
  // Sintomas populares (linguagem de pai/mãe) — resolve o rótulo pelo id para
  // que a marcação também case por token com a descrição/tags da escala.
  for (const id of ids) {
    const popular = popularSymptomById[id];
    if (popular) labels.push(popular.label);
  }
  return [...ids, ...labels].join(" ");
}

// Fonte ÚNICA de signalTags: une as tags inline da escala (scale.signalTags)
// com o mapa central curado (SIGNAL_TAGS_BY_SCALE_ID), sem duplicatas. Assim os
// dois acervos de tags são tratados igualmente em TODO o motor (texto clínico
// e bônus de correspondência exata), sem tag "de segunda classe".
function allSignalTags(scale: ScaleEntry): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const t of [
    ...(scale.signalTags || []),
    ...(SIGNAL_TAGS_BY_SCALE_ID[scale.id] || []),
  ]) {
    const key = t.trim().toLowerCase();
    if (key && !seen.has(key)) {
      seen.add(key);
      out.push(t);
    }
  }
  return out;
}

function scaleClinicalText(scale: ScaleEntry): string {
  return [
    scale.id,
    scale.name,
    scale.fullName,
    scale.description,
    scale.queixas.join(" "),
    ...allSignalTags(scale),
  ].join(" ");
}

function calculateSignalSpecificity(
  scale: ScaleEntry,
  ctx: FilterContext,
): { score: number; rawScore: number; reason?: string } {
  if (!ctx.selectedSignals?.length) return { score: 0, rawScore: 0 };

  const signalText = selectedSignalText(ctx);
  const selectedTokens = tokensFromText(signalText);
  const scaleTokens = tokensFromText(scaleClinicalText(scale));
  let matched = 0;
  for (const token of selectedTokens) {
    if (scaleTokens.has(token)) matched += 1;
  }

  const normalizedSignalText = normalizeClinicalText(signalText);
  const idPrefixHits = ctx.selectedSignals.filter((id) =>
    scale.queixas.some((queixa) => id.startsWith(`${queixa}-`)),
  ).length;
  const exactTagHits = allSignalTags(scale).filter((tag) =>
    normalizedSignalText.includes(normalizeClinicalText(tag)),
  ).length;

  const rawScore = Math.round(
    matched * 1.6 +
      idPrefixHits * 2 +
      exactTagHits * 3 +
      Math.min(4, ctx.selectedSignals.length),
  );
  const score = Math.min(18, rawScore);

  if (score >= 12)
    return {
      score,
      rawScore,
      reason: "Alta correspondência com os sinais marcados",
    };
  if (score >= 6)
    return {
      score,
      rawScore,
      reason: "Boa correspondência com os sinais marcados",
    };
  if (score > 0)
    return {
      score,
      rawScore,
      reason: "Alguma correspondência com os sinais marcados",
    };
  return { score: 0, rawScore };
}

// ============ SCORING REFINADO (nova hierarquia clínica) ============

export function calculateRefinedScore(
  scale: ScaleEntry,
  ctx: FilterContext,
): RefinedScaleMatch {
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
    // Instrumento REALMENTE cobre a idade da criança? Faixa validada que contém
    // a idade nunca deve cair para "margem" só por ser ampla — ex.: CARS/ADOS/
    // CBCL (2–18a) avaliando um pré-escolar é uso pleno, não marginal.
    const containsAge = age >= scale.ageMin && age <= scale.ageMax;
    let ageScore: number;
    if (percentFromMid < 25) {
      ageScore = 30;
      reasons.push("Idade ideal para o instrumento");
    } else if (percentFromMid < 60) {
      ageScore = 24;
      reasons.push("Idade adequada");
    } else {
      // Piso de contenção: cobre a idade de fato ⇒ 22; senão margem real ⇒ 16.
      ageScore = containsAge ? 22 : 16;
      reasons.push(
        containsAge
          ? "Faixa validada cobre esta idade"
          : "Idade na margem da faixa",
      );
    }
    score += ageScore;
  }

  // 2. Correspondência da queixa (0–38).
  // Cobertura total recebe bônus de sinergia proporcional ao número de queixas
  // selecionadas (instrumento que cobre 3 queixas simultâneas > que cobre 1).
  // Cobertura parcial é penalizada proporcionalmente: diferença máx ≈ 30 pts.
  if (ctx.queixas.length === 0) {
    score += 14;
  } else {
    const matchCount = scale.queixas.filter((q) =>
      ctx.queixas.includes(q),
    ).length;
    if (matchCount === ctx.queixas.length) {
      const synergy = Math.min(10, (ctx.queixas.length - 1) * 5);
      score += 28 + synergy;
      reasons.push(`Cobre todas as ${ctx.queixas.length} queixa(s)`);
    } else if (matchCount > 0) {
      const ratio = matchCount / ctx.queixas.length;
      score += Math.round(28 * ratio * 0.55);
      reasons.push(`Cobre ${matchCount} de ${ctx.queixas.length} queixas`);
    }
    // FOCO/PRECISÃO (0–8): instrumento dedicado à queixa (poucas queixas, quase
    // todas relevantes) vale mais que um catch-all tagueado com tudo. Assim a
    // escolha por sintoma privilegia a ferramenta CERTA, não a mais abrangente.
    if (matchCount > 0) {
      const precision = matchCount / Math.max(1, scale.queixas.length);
      const focusBonus = Math.round(8 * precision);
      if (focusBonus > 0) {
        score += focusBonus;
        if (precision >= 0.75) reasons.push("Instrumento focado nesta queixa");
      }
      // PRIMÁRIA (+5): a queixa selecionada é o foco principal (1ª listada) do
      // instrumento — ex.: SNAP-IV para TDAH, M-CHAT para TEA.
      if (scale.queixas.length > 0 && ctx.queixas.includes(scale.queixas[0])) {
        score += 5;
      }
    }
  }

  const signalSpecificity = calculateSignalSpecificity(scale, ctx);
  if (signalSpecificity.score > 0) {
    score += signalSpecificity.score;
    if (signalSpecificity.reason) reasons.push(signalSpecificity.reason);
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
  else if (
    scale.licencaUso === "restrita" ||
    scale.licencaUso === "contato_autor"
  )
    score += 1;
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
    warnings.push(
      `Licença ${scale.licencaUso} — não embutir itens/escore sem permissão.`,
    );
  }
  if (isSuicideInstrument(scale)) {
    warnings.push("⚠️ Risco suicida — requer avaliação clínica imediata.");
  }
  if (isPsychosisInstrument(scale)) {
    warnings.push(
      "⚠️ Suspeita de psicose/mania — encaminhamento especializado.",
    );
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
    signalSpecificityScore: signalSpecificity.rawScore,
  };
}

function calculateConfidenceLevel(ctx: FilterContext, score: number): number {
  const completeness =
    (ctx.queixas.length > 0 ? 1 : 0) +
    (ctx.ageMonths !== null ? 1 : 0) +
    (ctx.respondente ? 1 : 0) +
    (ctx.assessmentUse ? 1 : 0) +
    (ctx.selectedSignals?.length ? 1 : 0);
  return Math.min(100, Math.round(score * 0.78 + completeness * 5));
}

// ============ FILTRAGEM INTELIGENTE (sem fallback) ============

export function filterScalesIntelligently(
  scales: ScaleEntry[],
  ctx: FilterContext,
): RefinedScaleMatch[] {
  const candidates = scales.filter(
    (scale) =>
      passesMandatoryFilters(scale, ctx) &&
      clinicalHardBlock(scale, ctx) === null,
  );

  const tierOrder = { gold: 0, silver: 1, bronze: 2, conditional: 3 };
  return candidates
    .map((scale) => calculateRefinedScore(scale, ctx))
    .sort((a, b) => {
      if (b.relevanceScore !== a.relevanceScore)
        return b.relevanceScore - a.relevanceScore;
      if (tierOrder[a.tier] !== tierOrder[b.tier])
        return tierOrder[a.tier] - tierOrder[b.tier];
      if ((b.signalSpecificityScore ?? 0) !== (a.signalSpecificityScore ?? 0)) {
        return (
          (b.signalSpecificityScore ?? 0) - (a.signalSpecificityScore ?? 0)
        );
      }
      // desempate final por usabilidade (rota disponível), depois nome.
      const ar = a.scale.appRoute ? 1 : 0;
      const br = b.scale.appRoute ? 1 : 0;
      if (ar !== br) return br - ar;
      return a.scale.name.localeCompare(b.scale.name);
    });
  // IMPORTANTE: sem fallback para o catálogo inteiro — pode retornar [].
}

export function filterScalesWithClinicalRescue(
  scales: ScaleEntry[],
  ctx: FilterContext,
): RefinedScaleMatch[] {
  const primary = filterScalesIntelligently(scales, ctx);
  const hasClinicalContext =
    ctx.queixas.length > 0 || ctx.ageBand != null || ctx.ageMonths != null;
  if (!hasClinicalContext) return primary;

  // Nunca relaxa queixa/respondente nem preenche um pódio de suicídio/psicose
  // com escalas desenvolvimentais ou de banda larga não responsivas ao risco.
  if (isAcuteRiskContext(ctx)) {
    const acuteQueixas = ctx.queixas.filter((queixa) =>
      ACUTE_RISK_QUEIXAS.has(queixa),
    );
    return primary.filter((match) =>
      acuteQueixas.every((queixa) => match.scale.queixas.includes(queixa)),
    );
  }

  // Respondente é um vínculo clínico obrigatório, não uma preferência de
  // ranking. Se não houver opção compatível, falha fechado: nunca repete a
  // busca sem o respondente nem completa o pódio com fallback de outro perfil.
  if (ctx.respondente) return primary;

  // Sem respondente explícito, contextos não agudos podem ser completados com
  // rastreadores amplos apropriados à idade e aos demais bloqueios duros.
  return fillPodiumWithBroadband(primary, scales, ctx);
}

// ============ FALLBACK DE TRIAGEM AMPLA ============
//
// Quando NÃO há instrumento específico seguro para a queixa+idade, oferecemos um
// rastreador AMPLO real e apropriado à idade (em vez de vazio). Nunca força um
// instrumento clinicamente inadequado: cada candidato precisa cobrir a idade e
// passar o mesmo clinicalHardBlock. Risco agudo (suicídio/psicose) é exceção
// fail-closed e não recebe escala de outro domínio para preencher o pódio.
//
// Lista curada e ORDENADA por idade (do menor ao maior). Todos são instrumentos
// reais, de banda larga, presentes no catálogo e que abrem.
// Regra de ouro TOTAL (2026-07-12): a lista contém apenas rastreadores amplos
// APLICÁVEIS no app — Portage/BASC-3/ASQ:SE-2 (licenciados, sem aplicação)
// saíram do banco; PANT e EFDI (autorais, 0-216m, aplicação completa) garantem
// fallback triplo também em lactentes.
export const BROADBAND_SCREENER_IDS = [
  "denver", // 0-72m - desenvolvimento
  "asq3", // 1-66m - desenvolvimento
  "pant", // 0-216m - índice PANT (autoral, banda larga do desenvolvimento)
  "efdi", // 0-216m - funcionalidade/desenvolvimento (autoral)
  "cbcl", // 18-216m - banda larga emocional/comportamental
  "sdq", // 24-204m - banda larga
  "psc17", // 48-192m - banda larga
  "ndi-360", // 36-215m - banda larga neurodesenvolvimental (autoral)
  "who5", // 108-216m - bem-estar/humor em adolescentes
];

function ageCovers(scale: ScaleEntry, ctx: FilterContext): boolean {
  if (ctx.ageBand)
    return scale.ageMax >= ctx.ageBand.min && scale.ageMin <= ctx.ageBand.max;
  if (ctx.ageMonths != null)
    return scale.ageMin <= ctx.ageMonths && ctx.ageMonths <= scale.ageMax;
  return true;
}

/**
 * Rastreadores amplos seguros para o contexto (idade), marcados como fallback.
 * Retorna [] apenas se nem um rastreador amplo for apropriado/seguro à idade.
 */
export function getBroadbandFallback(
  scales: ScaleEntry[],
  ctx: FilterContext,
): RefinedScaleMatch[] {
  if (isAcuteRiskContext(ctx)) return [];
  const byId = new Map(scales.map((s) => [s.id, s]));
  const baseCtx: FilterContext = { ...ctx, queixas: [], assessmentUse: null };
  const out: RefinedScaleMatch[] = [];
  for (const id of BROADBAND_SCREENER_IDS) {
    const scale = byId.get(id);
    if (!scale) continue;
    // O fallback pode ampliar o domínio da queixa, mas nunca o respondente.
    // Isso também protege consumidores que chamam getBroadbandFallback após
    // um resultado vazio do rescue.
    if (!passesMandatoryFilters(scale, baseCtx)) continue;
    if (!ageCovers(scale, ctx)) continue;
    if (clinicalHardBlock(scale, baseCtx) !== null) continue; // nunca oferece algo inadequado à idade
    const refined = calculateRefinedScore(scale, baseCtx);
    const reason = tidyReason(refined.clinicalReason);
    out.push({
      ...refined,
      clinicalReason: [
        reason,
        "Complemento de triagem ampla apropriado à idade quando a queixa específica não fecha três escalas seguras",
      ]
        .filter(Boolean)
        .join(" • "),
      isBroadbandFallback: true,
    });
  }
  return out;
}

function tidyReason(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function fillPodiumWithBroadband(
  matches: RefinedScaleMatch[],
  scales: ScaleEntry[],
  ctx: FilterContext,
): RefinedScaleMatch[] {
  if (matches.length >= 3) return matches;
  const seen = new Set(matches.map((m) => m.scale.id));
  const out = [...matches];
  for (const fallback of getBroadbandFallback(scales, ctx)) {
    if (!seen.has(fallback.scale.id)) {
      out.push(fallback);
      seen.add(fallback.scale.id);
    }
    if (out.length >= 3) break;
  }
  return out;
}

// ============ DETECÇÃO DE PADRÃO CLÍNICO ============

export function detectClinicalPattern(context: FilterContext): string {
  const { queixas } = context;
  const selectedText = normalizeClinicalText(selectedSignalText(context));

  // ── Padrões multi-queixa (mais específicos — verificar antes dos mono) ──────
  if (queixas.includes("depressao") && queixas.includes("suicidio")) {
    return "Depressão com risco de suicídio — avaliação urgente";
  }
  if (queixas.includes("tea") && queixas.includes("tdah")) {
    return "TEA com perfil TDAH associado";
  }
  if (queixas.includes("tea") && queixas.includes("ansiedade")) {
    return "TEA com comorbidade ansiosa";
  }
  if (queixas.includes("tdah") && queixas.includes("ansiedade")) {
    return "TDAH com comorbidade ansiosa";
  }
  if (queixas.includes("tdah") && queixas.includes("comportamento")) {
    return "TDAH com comportamento disruptivo";
  }
  if (queixas.includes("linguagem") && queixas.includes("aprendizagem")) {
    return "Dificuldade de linguagem e aprendizagem";
  }
  if (queixas.includes("motor") && queixas.includes("atraso")) {
    return "Atraso do desenvolvimento global com componente motor";
  }
  if (queixas.includes("toc") && queixas.includes("ansiedade")) {
    return "TOC com quadro ansioso";
  }
  if (queixas.includes("trauma") && queixas.includes("depressao")) {
    return "Trauma com sintomas depressivos";
  }
  if (queixas.includes("cognicao") && queixas.includes("aprendizagem")) {
    return "Dificuldade cognitiva e de aprendizagem";
  }

  // ── Padrões mono-queixa com refinamento por sinal ───────────────────────────
  if (queixas.includes("tdah")) {
    if (
      /hiperatividade|movimento|sentado|impulsiv|fala excessiva|aguardar|intromet/.test(
        selectedText,
      )
    )
      return "TDAH com hiperatividade/impulsividade predominante";
    if (
      /desatenc|focar|instruc|organiza|distrai|tarefa|memoria trabalho|procrast/.test(
        selectedText,
      )
    )
      return "TDAH com desatenção predominante";
    return "TDAH misto";
  }

  if (queixas.includes("tea")) {
    const hasLanguage =
      /linguagem|comunicacao|fala|gestos|pragmatica|ecolalia|balbucio/.test(
        selectedText,
      );
    const hasSocial =
      /social|amizade|reciproc|pares|camuflagem|exaustao|bullying|vulnerabilidade/.test(
        selectedText,
      );
    const hasSensory =
      /sensorial|auditiv|tatil|textura|seletividade|sobrecarga/.test(
        selectedText,
      );
    if (hasSocial && hasSensory)
      return "TEA com déficit social e perfil sensorial";
    if (hasLanguage && hasSocial) return "TEA com déficit social-comunicativo";
    if (hasLanguage) return "TEA com atraso de linguagem";
    return "Suspeita TEA";
  }

  if (queixas.includes("atraso")) {
    const hasMotor = /motor|sentar|engatinh|biped|rolar|cabeca|pinca/.test(
      selectedText,
    );
    const hasLanguage = /linguagem|comunicacao|balbucio|palavras|gestos/.test(
      selectedText,
    );
    if (hasMotor && hasLanguage) return "Atraso desenvolvimento global";
    if (hasMotor) return "Atraso motor";
    if (hasLanguage) return "Atraso de linguagem";
    return "Suspeita atraso desenvolvimento";
  }

  if (queixas.includes("depressao")) {
    if (context.ageMonths !== null && context.ageMonths >= 144)
      return "Depressão no adolescente";
    return "Humor deprimido";
  }
  if (queixas.includes("suicidio"))
    return "Risco de suicídio — avaliação urgente";
  if (queixas.includes("ansiedade")) {
    if (/fobia|social|vergonha|apresentacao|estranhos/.test(selectedText))
      return "Ansiedade social/fóbica";
    if (/panico|crise|tremor|aguda/.test(selectedText))
      return "Pânico/ansiedade aguda";
    if (/separacao|cuidador|dormir sozinho/.test(selectedText))
      return "Ansiedade de separação";
    return "Quadro ansioso";
  }
  if (queixas.includes("comportamento")) {
    if (/agress|bate|morde|bullying|ameaca|vandalismo/.test(selectedText))
      return "Comportamento agressivo";
    if (/oposi|desafio|recusa|birra|regras|autoridade/.test(selectedText))
      return "Comportamento opositivo";
    return "Transtorno comportamental";
  }
  if (queixas.includes("linguagem")) return "Atraso/transtorno de linguagem";
  if (queixas.includes("aprendizagem")) return "Dificuldade de aprendizagem";
  if (queixas.includes("cognicao"))
    return "Avaliação cognitiva/neuropsicológica";
  if (queixas.includes("motor")) return "Atraso/disfunção motora";
  if (queixas.includes("sono")) return "Transtorno de sono";
  if (queixas.includes("funcionalidade"))
    return "Avaliação de funcionalidade adaptativa";
  if (queixas.includes("social")) return "Dificuldade de habilidades sociais";
  if (queixas.includes("tiques")) return "Tiques / Síndrome de Tourette";
  if (queixas.includes("toc")) return "Transtorno Obsessivo-Compulsivo";
  if (queixas.includes("trauma")) return "Trauma / TEPT";
  if (queixas.includes("psicose")) return "Suspeita de psicose/mania";
  if (queixas.includes("alimentacao"))
    return "Transtorno alimentar/seletividade";
  if (queixas.includes("epilepsia"))
    return "Epilepsia — monitorização de crises";
  if (queixas.includes("dor")) return "Dor crônica / cefaleia";
  if (queixas.includes("sensorial")) return "Disfunção de integração sensorial";
  if (queixas.includes("neonatal")) return "Avaliação neonatal/prematuridade";
  if (queixas.includes("autonomia")) return "Avaliação de autonomia/AVDs";
  if (queixas.includes("enurese")) return "Enurese/encoprese";
  if (queixas.includes("substancias")) return "Uso de substâncias";

  return "Avaliação geral";
}

// ============ SÍNTESE CLÍNICA ============

export function generateContextualRecommendation(
  matches: RefinedScaleMatch[],
  podiumOuro?: RefinedScaleMatch,
): string {
  if (matches.length === 0) return SAFE_EMPTY_MESSAGE;

  // Use the podium Ouro directly so the text always references the same scale
  // shown in the medal card (eliminates score-tier vs podium-slot divergence).
  const primary = podiumOuro ?? matches.find((m) => m.tier === "gold");
  if (primary) {
    const reason =
      primary.clinicalReason ||
      primary.scale.description ||
      "instrumento de primeira linha para este perfil";
    return `Recomendado: ${primary.scale.name} — ${reason}`;
  }

  const silver = matches.find((m) => m.tier === "silver");
  if (silver)
    return `Segunda opção: ${silver.scale.name} — ${silver.clinicalReason}`;

  return `Disponível com ressalvas: ${matches[0].scale.name}`;
}
