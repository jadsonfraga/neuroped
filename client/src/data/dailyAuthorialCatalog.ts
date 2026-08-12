export type DailyInventoryStatus =
  | "rascunho_revisao"
  | "revisado_clinicamente"
  | "arquivado";

export type DailyInventoryRespondent =
  | "pais_cuidadores"
  | "professor"
  | "clinico"
  | "crianca_adolescente"
  | "multiplo";

export interface DailyInventoryDomain {
  id: string;
  label: string;
  description: string;
}

export interface DailyInventoryItem {
  id: string;
  domainId: string;
  text: string;
  responseMode: "frequencia_0_3" | "sim_nao" | "presente_ausente" | "descritivo";
  redFlag: boolean;
  clinicalNote: string;
}

export interface DailyAuthorialInventory {
  schemaVersion: "1.0.0";
  id: string;
  slug: string;
  version: string;
  generatedOn: string;
  generatedAt: string;
  author: "NeuroPed SDG — Dr. Jadson Fraga";
  sourceType: "autoral_diario";
  validationStatus: "nao_validado_psicometricamente";
  status: DailyInventoryStatus;
  title: string;
  shortTitle: string;
  topicId: string;
  topic: string;
  category: string;
  subcategory: string;
  rationale: string;
  purpose: string;
  ageMinMonths: number;
  ageMaxMonths: number;
  respondent: DailyInventoryRespondent;
  contexts: Array<"casa" | "escola" | "clinica" | "multicontexto">;
  assessmentUse:
    | "triagem_estruturada"
    | "monitoramento"
    | "registro_clinico"
    | "observacao_clinica";
  riskClass: "baixo" | "moderado" | "alto";
  timeframe: string;
  durationMinutes: number;
  instructions: string;
  responseOptions: Array<{ code: string; label: string; value: number | null }>;
  domains: DailyInventoryDomain[];
  items: DailyInventoryItem[];
  scoring: {
    mode: "perfil_qualitativo_sem_total";
    totalScoreEnabled: false;
    instructions: string;
    domainInterpretation: string;
    redFlagRule: string;
  };
  redFlags: Array<{ itemId: string; action: string }>;
  differentialConsiderations: string[];
  clinicalIntegration: string[];
  limitations: string[];
  safetyNote: string;
  tags: string[];
  duplicateCooldownDays: 30;
  generation: {
    model: string;
    reasoningMode: "pro";
    reasoningEffort: "high" | "max";
    pipelineVersion: string;
  };
}

function isDailyInventory(value: unknown): value is DailyAuthorialInventory {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<DailyAuthorialInventory>;
  return (
    item.schemaVersion === "1.0.0" &&
    item.sourceType === "autoral_diario" &&
    item.validationStatus === "nao_validado_psicometricamente" &&
    typeof item.id === "string" &&
    typeof item.title === "string" &&
    typeof item.generatedOn === "string" &&
    typeof item.ageMinMonths === "number" &&
    typeof item.ageMaxMonths === "number" &&
    Array.isArray(item.domains) &&
    Array.isArray(item.items) &&
    item.scoring?.mode === "perfil_qualitativo_sem_total" &&
    item.scoring?.totalScoreEnabled === false &&
    Array.isArray(item.redFlags)
  );
}

const modules = import.meta.glob("./daily-authorial/*.json", {
  eager: true,
  import: "default",
});

const loaded = Object.entries(modules).map(([path, value]) => ({ path, value }));

export const dailyAuthorialCatalogErrors = loaded
  .filter(({ value }) => !isDailyInventory(value))
  .map(({ path }) => `Registro autoral inválido: ${path}`);

/**
 * Inventário completo para auditoria/revisão interna. Rascunhos e arquivados
 * permanecem rastreáveis no repositório, mas não viram conteúdo clínico
 * operacional só por terem sido gerados automaticamente.
 */
export const dailyAuthorialReviewCatalog = loaded
  .filter(
    (entry): entry is { path: string; value: DailyAuthorialInventory } =>
      isDailyInventory(entry.value),
  )
  .map(({ value }) => value)
  .sort((a, b) => b.generatedOn.localeCompare(a.generatedOn));

/**
 * Catálogo operacional exibido no app. Publicação clínica exige promoção
 * humana explícita para `revisado_clinicamente`; rascunhos de automação e itens
 * arquivados nunca atravessam esta fronteira.
 */
export const dailyAuthorialCatalog = dailyAuthorialReviewCatalog.filter(
  (record) => record.status === "revisado_clinicamente",
);
